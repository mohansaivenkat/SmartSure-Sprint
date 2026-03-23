# Admin Service (System & User Administration)

The Admin Service is a management module for oversight and administration of the SmartSure system. It acts as an aggregator service that frequently communicates with other microservices.

## 🚀 Key Responsibilities

- **User Oversight**: Listing and managing user roles.
- **Microservice Aggregation**: Fetching stats and managing entities in other services.
- **Reporting**: Generating reports by combining data from the **Claims Service** and **Policy Service**.

## 🔗 Inter-Service Communication (Feign)

This service is a primary user of **Spring Cloud OpenFeign** to interact with other microservices:
- `ClaimsFeignClient`: Manages claim statuses and retrieves user-specific claims.
- `PolicyFeignClient`: Handles CRUD operations for insurance policies.

## 🛡️ Resilience & Fault Tolerance (Spring Retry)

To ensure smooth operations even when dependencies are under load, the `AdminService` implements a **Retry & Recovery** pattern:

- **@Retryable**: Each remote call is naturally retried up to **3 times**.
- **@Backoff**: A **2000ms delay** is applied between retries to give services time to recover.
- **@Recover**: Graceful fallback methods are implemented to return default data or handle errors safely when all retries are exhausted.

## 🛠️ Technologies

- Spring Boot (Web, Security, JPA, Actuator)
- Spring Cloud OpenFeign & Eureka Client
- **Spring Retry** & Spring AOP
- PostgreSQL

---
© 2026 SmartSure Insurance Management System.
