# Config Server (Centralized Configuration Management)

The Config Server provides centralized configuration management across all environments for our microservices in the SmartSure Insurance Management System.

## 🚀 Purpose

- Management of configuration properties (application.properties/yml) for all services.
- Version control of configurations using a centralized repository (Git, Local, etc.).

## 🛠️ Technologies

- Spring Cloud Config Server

## 📡 Accessing Configurations

Microservices can fetch their configuration by specifying their application name and active profile.

## ⚙️ How to Run

1.  Run the application using Maven:
    ```bash
    mvn spring-boot:run
    ```
- Default Port: `8888`

---
© 2026 SmartSure Insurance Management System.
