# SmartSure Insurance Management System — Low-Level Design (LLD)

## 1. Class Diagrams

### 1.1 Auth Service

```mermaid
classDiagram
    class User {
        -Long id
        -String name
        -String email
        -String password
        -String phone
        -String address
        -Role role
    }
    class Role {
        CUSTOMER
        ADMIN
    }
    class AuthController {
        +register(RegisterRequest) User
        +login(LoginRequest) AuthResponse
    }
    class AuthService {
        +register(RegisterRequest) User
        +login(LoginRequest) AuthResponse
    }
    class AuthServiceRepository {
        +findByEmail(String) User
        +existsByEmail(String) boolean
    }
    class JwtUtil {
        +generateToken(String, String, Long) String
    }
    AuthController --> AuthService
    AuthService --> AuthServiceRepository
    AuthService --> JwtUtil
    AuthServiceRepository --> User
    User --> Role
```

### 1.2 Policy Service

```mermaid
classDiagram
    class PolicyType {
        -Long id
        -PolicyCategory category
        -String description
    }
    class PolicyCategory {
        HEALTH
        VEHICLE
        LIFE
    }
    class Policy {
        -Long id
        -String policyName
        -String description
        -PolicyType policyType
        -Double premiumAmount
        -Double coverageAmount
        -Integer durationInMonths
        -boolean active
    }
    class UserPolicy {
        -Long id
        -Long userId
        -Policy policy
        -PolicyStatus status
        -Double premiumAmount
        -LocalDate startDate
        -LocalDate endDate
    }
    class PolicyStatus {
        CREATED
        ACTIVE
        EXPIRED
        CANCELLED
    }
    class PolicyController {
        +getAllPolicies() List
        +getAllPolicyTypes() List
        +purchasePolicy(Long) UserPolicyResponseDTO
        +getPolicy(Long) PolicyResponseDTO
        +createPolicy(PolicyRequestDTO) PolicyResponseDTO
        +updatePolicy(Long, PolicyRequestDTO) PolicyResponseDTO
        +deletePolicy(Long) void
        +getPolicyStats() PolicyStatsDTO
        +cancelPolicy(Long) UserPolicyResponseDTO
    }
    class PolicyService {
        +getAllPolicies() List
        +getAllPolicyTypes() List
        +purchasePolicy(Long) UserPolicyResponseDTO
        +getPolicyById(Long) PolicyResponseDTO
        +createPolicy(PolicyRequestDTO) PolicyResponseDTO
        +updatePolicy(Long, PolicyRequestDTO) PolicyResponseDTO
        +deletePolicy(Long) void
        +getPolicyStats() PolicyStatsDTO
        +cancelPolicy(Long) UserPolicyResponseDTO
    }
    PolicyController --> PolicyService
    Policy --> PolicyType
    PolicyType --> PolicyCategory
    UserPolicy --> Policy
    UserPolicy --> PolicyStatus
```

### 1.3 Claims Service

```mermaid
classDiagram
    class Claim {
        -Long id
        -Long policyId
        -Long userId
        -double claimAmount
        -String description
        -ClaimStatus claimStatus
        -LocalDateTime createdAt
    }
    class ClaimDocument {
        -Long id
        -Long claimId
        -String fileUrl
        -String documentType
        -LocalDateTime uploadedDate
    }
    class ClaimStatus {
        DRAFT
        SUBMITTED
        UNDER_REVIEW
        APPROVED
        REJECTED
        CLOSED
    }
    class ClaimController {
        +initiateClaim(ClaimRequestDTO) ClaimResponseDTO
        +uploadDocument(Long, MultipartFile) String
        +getClaimStatus(Long) ClaimResponseDTO
        +getClaimById(Long) ClaimResponseDTO
        +updateClaimStatus(Long, ClaimStatusUpdateDTO) String
        +getClaimsByUserId(Long) List
        +getStats() ClaimStatsDTO
    }
    class ClaimService {
        +initateClaim(ClaimRequestDTO) ClaimResponseDTO
        +uploadDocument(Long, MultipartFile) String
        +getClaimStatus(Long) ClaimResponseDTO
        +getClaimById(Long) ClaimResponseDTO
        +updateClaimStatus(Long, String) void
        +getClaimsByUserId(Long) List
        +getClaimStats() ClaimStatsDTO
    }
    ClaimController --> ClaimService
    Claim --> ClaimStatus
```

### 1.4 Admin Service

```mermaid
classDiagram
    class AdminController {
        +reviewClaim(Long, ReviewRequest) String
        +getStatus(Long) ClaimStatusDTO
        +getClaimsByUser(Long) List
        +createPolicy(PolicyRequestDTO) PolicyDTO
        +updatePolicy(Long, PolicyRequestDTO) PolicyDTO
        +deletePolicy(Long) String
        +getReports() ReportResponse
    }
    class AdminService {
        +reviewClaim(Long, ReviewRequest) void
        +getClaimStatus(Long) ClaimStatusDTO
        +getClaimsByUserId(Long) List
        +createPolicy(PolicyRequestDTO) PolicyDTO
        +updatePolicy(Long, PolicyRequestDTO) PolicyDTO
        +deletePolicy(Long) void
        +getReports() ReportResponse
    }
    class PolicyFeignClient {
        +getPolicyStats() PolicyStatsDTO
        +createPolicy(PolicyRequestDTO) PolicyDTO
        +updatePolicy(Long, PolicyRequestDTO) PolicyDTO
        +deletePolicy(Long) void
    }
    class ClaimsFeignClient {
        +getClaimById(Long) ClaimDTO
        +updateClaimStatus(Long, ClaimStatusUpdateDTO) void
        +getClaimStats() ClaimStatusDTO
        +getClaimStatus(Long) ClaimStatusDTO
        +getClaimsByUserId(Long) List
    }
    AdminController --> AdminService
    AdminService --> PolicyFeignClient
    AdminService --> ClaimsFeignClient
```

### 1.5 API Gateway

```mermaid
classDiagram
    class JwtAuthenticationFilter {
        +filter(ServerWebExchange, GatewayFilterChain) Void
    }
    class RouteValidator {
        +isSecured(ServerHttpRequest) boolean
    }
    class JwtUtil {
        +validateToken(String) void
        +extractRole(String) String
        +extractUserId(String) String
    }
    JwtAuthenticationFilter --> RouteValidator
    JwtAuthenticationFilter --> JwtUtil
```

---



## 2. Sequence Diagrams

### 2.1 User Registration & Login

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant AS as Auth Service
    participant DB as PostgreSQL

    Note over C,DB: Registration Flow
    C->>GW: POST /auth-service/api/auth/register
    GW->>AS: Forward (open endpoint)
    AS->>AS: Validate input, encode password
    AS->>DB: INSERT INTO users
    DB-->>AS: User entity
    AS-->>GW: User JSON
    GW-->>C: 200 OK + User

    Note over C,DB: Login Flow
    C->>GW: POST /auth-service/api/auth/login
    GW->>AS: Forward (open endpoint)
    AS->>DB: SELECT * FROM users WHERE email = ?
    DB-->>AS: User entity
    AS->>AS: Verify password + Generate JWT
    AS-->>GW: {token, role, id}
    GW-->>C: 200 OK + AuthResponse
```

### 2.2 Admin Creates a Policy (Inter-Service via Feign)

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant AD as Admin Service
    participant FC as FeignConfig
    participant PS as Policy Service
    participant DB as PostgreSQL

    C->>GW: POST /admin-service/api/admin/policies + Bearer Token
    GW->>GW: JwtAuthFilter validates JWT
    GW->>GW: Inject X-User-Role=ADMIN, X-Gateway-Secret
    GW->>AD: Forward to Admin Service
    AD->>AD: GatewaySecurityFilter validates secret
    AD->>AD: HeaderAuthenticationFilter sets SecurityContext
    AD->>AD: @PreAuthorize("hasRole('ADMIN')") passes
    AD->>FC: Prepare Feign call to Policy Service
    FC->>FC: Attach Authorization + X-Gateway-Secret headers
    FC->>PS: POST /api/admin/policies
    PS->>PS: GatewaySecurityFilter validates secret
    PS->>PS: JwtFilter validates JWT
    PS->>DB: INSERT INTO policies
    DB-->>PS: Policy entity
    PS-->>AD: PolicyDTO
    AD-->>GW: PolicyDTO
    GW-->>C: 200 OK + Policy JSON
```

### 2.3 Customer Purchases a Policy

```mermaid
sequenceDiagram
    participant C as Customer
    participant GW as API Gateway
    participant PS as Policy Service
    participant DB as PostgreSQL

    C->>GW: POST /policy-service/api/policies/purchase?policyId=1 + Bearer Token
    GW->>GW: Validate JWT, inject headers
    GW->>PS: Forward request
    PS->>PS: GatewaySecurityFilter + JwtFilter
    PS->>DB: SELECT * FROM policies WHERE id = 1
    DB-->>PS: Policy entity
    PS->>PS: Create UserPolicy (ACTIVE, startDate, endDate)
    PS->>DB: INSERT INTO user_policies
    DB-->>PS: UserPolicy entity
    PS-->>GW: UserPolicyResponseDTO
    GW-->>C: 200 OK + Purchase Confirmation
```

### 2.4 Claim Lifecycle (Submit → Review → Approve)

```mermaid
sequenceDiagram
    participant CU as Customer
    participant GW as API Gateway
    participant CS as Claims Service
    participant AD as Admin Service
    participant DB as PostgreSQL

    Note over CU,DB: Customer Submits Claim
    CU->>GW: POST /claims-service/api/claims/initiate + Customer Token
    GW->>CS: Forward
    CS->>DB: INSERT INTO claim (status=SUBMITTED)
    CS-->>CU: ClaimResponseDTO

    Note over CU,DB: Admin Reviews Claim
    AD->>GW: PUT /admin-service/api/admin/claims/1/review {"status":"UNDER_REVIEW"}
    GW->>AD: Forward with Admin Token
    AD->>CS: Feign: PUT /api/claims/1/status
    CS->>CS: Validate transition SUBMITTED → UNDER_REVIEW ✅
    CS->>DB: UPDATE claim SET status = UNDER_REVIEW
    CS-->>AD: OK
    AD-->>GW: "Claim reviewed successfully"

    Note over CU,DB: Admin Approves Claim
    AD->>GW: PUT /admin-service/api/admin/claims/1/review {"status":"APPROVED"}
    GW->>AD: Forward with Admin Token
    AD->>CS: Feign: PUT /api/claims/1/status
    CS->>CS: Validate transition UNDER_REVIEW → APPROVED ✅
    CS->>DB: UPDATE claim SET status = APPROVED
    CS-->>AD: OK
    AD-->>GW: "Claim reviewed successfully"
```

### 2.5 Admin Report Generation (Aggregated Feign Calls)

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant AD as Admin Service
    participant CS as Claims Service
    participant PS as Policy Service

    C->>GW: GET /admin-service/api/admin/reports + Admin Token
    GW->>AD: Forward
    AD->>CS: Feign: GET /api/claims/stats
    CS-->>AD: ClaimStatsDTO (total, approved, rejected)
    AD->>PS: Feign: GET /api/admin/policies/stats
    PS-->>AD: PolicyStatsDTO (totalPolicies, totalRevenue)
    AD->>AD: Combine into ReportResponse
    AD-->>GW: ReportResponse JSON
    GW-->>C: 200 OK + Unified Report
```

---

## 3. Claim Status Lifecycle (State Machine)

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED : Customer initiates claim
    SUBMITTED --> UNDER_REVIEW : Admin starts review
    UNDER_REVIEW --> APPROVED : Admin approves
    UNDER_REVIEW --> REJECTED : Admin rejects
    APPROVED --> CLOSED : Final closure
    REJECTED --> CLOSED : Final closure
```

## 4. Policy Status Lifecycle (State Machine)

```mermaid
stateDiagram-v2
    [*] --> CREATED : Policy product created by Admin
    CREATED --> ACTIVE : Customer purchases policy
    ACTIVE --> EXPIRED : Duration ends
    ACTIVE --> CANCELLED : Admin cancels policy
```
