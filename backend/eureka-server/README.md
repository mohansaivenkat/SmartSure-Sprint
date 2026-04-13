# Eureka Server (Service Registry)

The Eureka Server is the central service registry for the SmartSure Insurance Management System. All other microservices register themselves here, allowing them to discover and communicate with each other dynamically.

## 🚀 Purpose

- Maintaining a registry of all active microservices.
- Providing service discovery and load balancing for microservices using Netflix Eureka.

## 🛠️ Technologies

- Spring Cloud Netflix Eureka Server

## 📡 Registry Management

The server provides a web dashboard at `http://localhost:8761` to view registered services and their statuses.

## ⚙️ How to Run

1.  Run the application using Maven:
    ```bash
    mvn spring-boot:run
    ```
- Default Port: `8761`

---
© 2026 SmartSure Insurance Management System.
