# Claims Service (Insurance Claim Management)

The Claims Service manages insurance claim lifecycle in the SmartSure system. It oversees the submission and processing of insurance claims by policies and users.

## 🚀 Purpose

- Submitting insurance claims.
- Updating claim status (Pending, Approved, Rejected).
- Tracking claim history for each insurance policy.

## 🛠️ Technologies

- Spring Boot (Web, JPA, Data, Security)
- PostgreSQL
- Spring Cloud OpenFeign & Eureka Client

## 📡 Key Endpoints

- `POST /claims` - Submit a new claim for an insurance policy.
- `GET /claims/{id}` - Retrieve details for a specific claim.
- `PUT /claims/{id}/status` - Update the status of a claim.
- `GET /claims/policy/{policyId}` - List all claims for a given policy.

## ⚙️ How to Run

1.  Ensure that the **Config Server** and **Eureka Server** are running.
2.  Run the application using Maven:
    ```bash
    mvn spring-boot:run
    ```
- Default Port: `8083` (can be configured in `application.properties/yml`)

---
© 2026 SmartSure Insurance Management System.
