# SmartSure Insurance Management System — Architecture (HLD)

## 1. System Overview

SmartSure is a **microservices-based insurance management platform** built with Spring Boot and Spring Cloud. It supports customer registration, policy management, claims processing, and admin reporting — all secured via JWT authentication and routed through a centralized API Gateway.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TB
    subgraph CLIENT["Client Layer"]
        PM["Postman / Frontend"]
    end

    subgraph GATEWAY["API Gateway :8080"]
        GW["Spring Cloud Gateway"]
        JF["JwtAuthenticationFilter"]
        RV["RouteValidator"]
    end

    subgraph INFRA["Infrastructure Layer"]
        EUR["Eureka Server :8761"]
        CFG["Config Server :8888"]
    end

    subgraph SERVICES["Microservices Layer"]
        AUTH["Auth Service :8001"]
        ADMIN["Admin Service :8002"]
        POLICY["Policy Service :8003"]
        CLAIMS["Claims Service :8004"]
    end

    subgraph DB["Database Layer"]
        PG1["PostgreSQL: SmartSure"]
    end

    PM -->|"HTTP Request + JWT"| GW
    GW --> JF
    JF --> RV
    RV -->|"/auth-service/**"| AUTH
    RV -->|"/admin-service/**"| ADMIN
    RV -->|"/policy-service/**"| POLICY
    RV -->|"/claims-service/**"| CLAIMS

    AUTH --> PG1
    POLICY --> PG1
    CLAIMS --> PG1

    ADMIN -->|"Feign Client"| POLICY
    ADMIN -->|"Feign Client"| CLAIMS

    AUTH -.->|"Register/Discover"| EUR
    ADMIN -.->|"Register/Discover"| EUR
    POLICY -.->|"Register/Discover"| EUR
    CLAIMS -.->|"Register/Discover"| EUR
    GW -.->|"Route Discovery"| EUR

    CFG -.->|"Provide Config"| AUTH
    CFG -.->|"Provide Config"| ADMIN
    CFG -.->|"Provide Config"| POLICY
    CFG -.->|"Provide Config"| CLAIMS
    CFG -.->|"Provide Config"| GW

    style GATEWAY fill:#1a1a2e,stroke:#e94560,color:#fff
    style INFRA fill:#16213e,stroke:#0f3460,color:#fff
    style SERVICES fill:#0f3460,stroke:#53a8b6,color:#fff
    style DB fill:#1b262c,stroke:#bbe1fa,color:#fff
    style CLIENT fill:#222,stroke:#e94560,color:#fff
```

---

## 3. Component Summary

| Component | Port | Technology | Purpose |
|---|---|---|---|
| **API Gateway** | 8080 | Spring Cloud Gateway | Single entry point, JWT validation, header injection, routing |
| **Eureka Server** | 8761 | Spring Cloud Netflix Eureka | Service discovery and registration |
| **Config Server** | 8888 | Spring Cloud Config | Centralized configuration management |
| **Auth Service** | 8001 | Spring Boot + Spring Security | User registration, login, JWT generation |
| **Admin Service** | 8002 | Spring Boot + OpenFeign | Policy CRUD, claim review, reports (orchestrator) |
| **Policy Service** | 8003 | Spring Boot + JPA | Policy catalog, policy purchasing, policy stats |
| **Claims Service** | 8004 | Spring Boot + JPA | Claim initiation, document upload, claim lifecycle |

---

## 4. Request Flow

```mermaid
sequenceDiagram
    participant C as Client (Postman)
    participant GW as API Gateway
    participant JWT as JwtAuthFilter
    participant MS as Microservice
    participant GSF as GatewaySecurityFilter
    participant SC as SecurityContext

    C->>GW: HTTP Request + Authorization: Bearer <token>
    GW->>JWT: Validate JWT signature
    JWT->>JWT: Extract userId, role from token
    JWT->>GW: Inject X-User-Id, X-User-Role, X-Gateway-Secret headers
    GW->>MS: Route to target microservice
    MS->>GSF: Check X-Gateway-Secret header
    GSF-->>MS: ❌ 401 if secret missing (direct access blocked)
    GSF->>SC: Populate SecurityContext with role
    SC->>MS: @PreAuthorize checks pass
    MS-->>GW: Response
    GW-->>C: JSON Response
```

---

## 5. Security Architecture

### Multi-Layer Security Model

| Layer | Mechanism | Purpose |
|---|---|---|
| **Layer 1: Gateway** | `JwtAuthenticationFilter` | Validates JWT, extracts role/userId, injects custom headers |
| **Layer 2: Network** | `GatewaySecurityFilter` (in each service) | Blocks direct access via microservice ports using `X-Gateway-Secret` |
| **Layer 3: Application** | `HeaderAuthenticationFilter` / `JwtFilter` | Populates Spring `SecurityContext` with user role |
| **Layer 4: Method** | `@PreAuthorize` annotations | Fine-grained access control (e.g., ADMIN-only, owner-only) |

### Inter-Service Communication Security

```mermaid
sequenceDiagram
    participant Admin as Admin Service
    participant FC as FeignConfig Interceptor
    participant Policy as Policy Service

    Admin->>FC: Outgoing Feign call
    FC->>FC: Attach Authorization header (Bearer token)
    FC->>FC: Attach X-Gateway-Secret header
    FC->>Policy: Secured Feign request
    Policy->>Policy: GatewaySecurityFilter validates secret
    Policy-->>Admin: Response
```

---

## 6. Technology Stack

| Category | Technology |
|---|---|
| **Language** | Java 17 |
| **Framework** | Spring Boot 3.x |
| **API Gateway** | Spring Cloud Gateway |
| **Service Discovery** | Spring Cloud Netflix Eureka |
| **Configuration** | Spring Cloud Config Server |
| **Inter-Service Comm** | Spring Cloud OpenFeign |
| **Authentication** | JWT (jjwt library) |
| **Authorization** | Spring Security + @PreAuthorize |
| **Database** | PostgreSQL |
| **ORM** | Spring Data JPA / Hibernate |
| **Resilience** | Spring Retry (@Retryable) |
| **Logging** | Spring AOP (LoggingAspect) |
| **API Docs** | Springdoc OpenAPI (Swagger UI) |
| **Build Tool** | Maven |
