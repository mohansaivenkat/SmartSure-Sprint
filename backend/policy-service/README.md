# Policy Service (Insurance Policy Management)

The Policy Service is a core requirement for managing insurance policies in the SmartSure system. It handles all operations related to insurance policy records.

## 🚀 Purpose

- Creating, updating, and deleting insurance policies.
- Retrieving policy details by ID or user.
- Integration with other services for claim processing.

## 🛠️ Technologies

- Spring Boot (Web, JPA, Data, Security)
- PostgreSQL
- Spring Cloud OpenFeign & Eureka Client

## 📡 Key Endpoints

- `POST /policies` - Create a new insurance policy.
- `GET /policies/{id}` - Retrieve details for a specific policy.
- `PUT /policies/{id}` - Update an existing policy's details.
- `DELETE /policies/{id}` - Remove a policy from the system.

## ⚙️ How to Run

1.  Ensure that the **Config Server** and **Eureka Server** are running.
2.  Run the application using Maven:
    ```bash
    mvn spring-boot:run
    ```
- Default Port: `8082` (can be configured in `application.properties/yml`)

---
© 2026 SmartSure Insurance Management System.
