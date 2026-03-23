# SmartSure - Insurance Management System

SmartSure is a modern, microservices-based Insurance Management System designed to handle insurance policies, claims, and administrative tasks efficiently. Built using Spring Boot and Spring Cloud, it leverages a robust architecture to ensure scalability, reliability, and security.

## Architecture Overview

The system is composed of several microservices, each responsible for a specific domain:

- **Auth Service**: Handles user registration, authentication, and JWT-based authorization.
- **Policy Service**: Manages insurance policies, including creation, updates, and retrieval.
- **Claims Service**: Processes and manages insurance claims.
- **Admin Service**: Provides administrative tools for user and system management.
- **API Gateway**: The entry point for all client requests, providing routing and security.
- **Eureka Server**: Service discovery registry for all microservices.
- **Config Server**: Centralized configuration management across all environments.

## Inter-Service Communication

The SmartSure ecosystem relies on **Spring Cloud OpenFeign** for declarative REST client communication between microservices. This ensures that services can easily call each other without manual HTTP client configuration.

- **Admin Service** uses Feign Clients to interact with the **Policy Service** and **Claims Service** to fetch statistics and manage records.
- Service discovery is handled automatically through **Eureka integration**.

##  Resilience & Fault Tolerance

To ensure high availability and stability, especially during network fluctuations or service downtime, the system implements a robust **Retry Mechanism** using **Spring Retry**.

### **Retry Strategy**
Applied specifically in the `AdminService` for all cross-service operations:
- **Max Attempts**: 3 attempts (1 initial + 2 retries).
- **Backoff Policy**: Exponential backoff with a **2000ms (2 seconds)** delay between attempts.
- **Fallback (Recover)**: Each retryable method is paired with a `@Recover` method that provides a graceful fallback (e.g., returning default values or a meaningful error message) if all retry attempts fail.

##  Tech Stack

- **Framework**: Spring Boot 3.5.x
- **Microservices**: Spring Cloud (Eureka, Config, Gateway, OpenFeign)
- **Database**: PostgreSQL
- **Security**: Spring Security & JWT (JSON Web Token)
- **Resilience**: Spring Retry & AOP
- **API Documentation**: SpringDoc OpenAPI / Swagger UI
- **Build Tool**: Maven
- **Language**: Java 17

##  Getting Started

### Prerequisites

- Java 17 or higher
- PostgreSQL
- Maven 3.x

### Running the System

To run the entire system locally, follow these steps in order:

1.  **Start Config Server**: Ensure all microservices can fetch their configuration.
2.  **Start Eureka Server**: Allow microservices to register themselves.
3.  **Start Auth Service**: Required for authentication.
4.  **Start other Services**: `policy-service`, `claims-service`, `admin-service`.
5.  **Start API Gateway**: Access the services through the gateway.

Each service can be started by running:
```bash
mvn spring-boot:run
```

## Project Structure

```text
├── admin-service/    # Administration logic (Feign + Retry implementation)
├── api-gateway/      # Routing and security entry point
├── auth-service/     # Authentication and JWT logic
├── claims-service/   # Claims management
├── config-server/    # Centralized configuration
├── eureka-server/    # Service registry
├── policy-service/   # Policy management
└── docs/             # Documentation and API specs
```

## Security

All requests to the backend services (except for registration and login) must be authenticated via a JWT token. The token is obtained from the `auth-service` and should be included in the `Authorization` header as a `Bearer` token.

---
© 2026 SmartSure Insurance Management System.
