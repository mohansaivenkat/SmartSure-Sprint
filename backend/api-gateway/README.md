# API Gateway (Routing & Security)

The API Gateway is the central entry point for all client requests in the SmartSure system. It acts as a routing engine and provides cross-cutting concerns like security and monitoring.

## 🚀 Purpose

- Dynamic routing of requests to backend microservices.
- Enforcing global security policies through JWT verification.
- Rate limiting and request logging.
- Fallback mechanisms for service discovery failures.

## 🛠️ Technologies

- Spring Cloud Gateway
- Spring Cloud Eureka Client
- Spring Cloud Config Client
- Spring Boot Starter Security (Reactive)

## 📡 Key Routing Rules

- `/auth/**` -> Routes to `auth-service`
- `/policies/**` -> Routes to `policy-service`
- `/claims/**` -> Routes to `claims-service`
- `/admin/**` -> Routes to `admin-service`

## ⚙️ How to Run

1.  Ensure that the **Config Server** and **Eureka Server** are running.
2.  Run the application using Maven:
    ```bash
    mvn spring-boot:run
    ```
- Default Port: `8080` (can be configured in `application.properties/yml`)

---
© 2026 SmartSure Insurance Management System.
