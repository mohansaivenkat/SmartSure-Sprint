# Auth Service (Authentication & Authorization)

The Auth Service manages user accounts, authentication, and token-based authorization using Spring Security and JWT.

## 🚀 Purpose

- User registration and login.
- JWT generation and verification.
- User profile management.

## 🛠️ Technologies

- Spring Boot (Web, Security, JPA, Actuator)
- Spring Cloud OpenFeign & Eureka Client
- PostgreSQL
- JWT (io.jsonwebtoken)

## 📡 Key Endpoints

- `POST /auth/register` - Create a new user account.
- `POST /auth/login` - Authenticate a user and receive a JWT.
- `GET /auth/profile` - Retrieve the current user's profile.

## ⚙️ How to Run

1.  Ensure that the **Config Server** and **Eureka Server** are running.
2.  Run the application using Maven:
    ```bash
    mvn spring-boot:run
    ```
- Default Port: `8081` (can be configured in `application.properties/yml`)

---
© 2026 SmartSure Insurance Management System.
