# SmartSure Insurance Management System — API Documentation

> **Base URL:** `http://localhost:8080`
>
> **Swagger UI:** Each service exposes interactive API docs at:
> - Auth: `http://localhost:8080/auth-service/swagger-ui.html`
> - Admin: `http://localhost:8080/admin-service/swagger-ui.html`
> - Policy: `http://localhost:8080/policy-service/swagger-ui.html`
> - Claims: `http://localhost:8080/claims-service/swagger-ui.html`

---

## 1. Auth Service APIs

### 1.1 Register User
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth-service/api/auth/register` |
| **Auth** | None |

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@gmail.com",
  "password": "password123",
  "phone": "9876543210",
  "address": "Mumbai"
}
```

**Response (200 OK):**
```json
{
  "id": 2,
  "name": "Jane Doe",
  "email": "jane@gmail.com",
  "phone": "9876543210",
  "address": "Mumbai",
  "role": "CUSTOMER"
}
```

---

### 1.2 Login
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth-service/api/auth/login` |
| **Auth** | None |

**Request Body:**
```json
{
  "email": "jane@gmail.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "role": "CUSTOMER",
  "id": 2
}
```

---

## 2. Policy Service APIs

### 2.1 Get All Policy Types
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/policy-service/api/policy-types` |
| **Auth** | Bearer Token (any role) |

**Response (200 OK):**
```json
[
  { "id": 1, "category": "VEHICLE", "description": "Auto/Vehicle Insurance" },
  { "id": 2, "category": "HEALTH", "description": "Medical and Health Insurance" },
  { "id": 3, "category": "LIFE", "description": "Life Insurance Policies" }
]
```

---

### 2.2 Get All Policies
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/policy-service/api/policies` |
| **Auth** | Bearer Token (any role) |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "policyName": "Comprehensive Auto Protect",
    "description": "Premium vehicle damage protection",
    "policyType": "VEHICLE",
    "premiumAmount": 15000.0,
    "coverageAmount": 500000.0,
    "durationInMonths": 12,
    "active": true
  }
]
```

---

### 2.3 Get Policy by ID
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/policy-service/api/policies/{policyId}` |
| **Auth** | Bearer Token (any role) |

---

### 2.4 Purchase Policy
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/policy-service/api/policies/purchase?policyId={id}` |
| **Auth** | Bearer Token (CUSTOMER) |

**Response (200 OK):**
```json
{
  "id": 1,
  "userId": 2,
  "policyName": "Comprehensive Auto Protect",
  "status": "ACTIVE",
  "premiumAmount": 15000.0,
  "startDate": "2026-03-19",
  "endDate": "2027-03-19"
}
```

---

### 2.5 Get Policy Statistics
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/policy-service/api/admin/policies/stats` |
| **Auth** | Bearer Token (ADMIN) |

**Response (200 OK):**
```json
{
  "totalPolicies": 5,
  "totalRevenue": 75000.0
}
```

---

### 2.6 Cancel User Policy
| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/policy-service/api/admin/policies/{userPolicyId}/cancel` |
| **Auth** | Bearer Token (ADMIN) |

---

## 3. Admin Service APIs

> [!IMPORTANT]
> All Admin Service endpoints require `ADMIN` role in the Bearer Token.

### 3.1 Create Policy Product
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/admin-service/api/admin/policies` |
| **Auth** | Bearer Token (ADMIN) |

**Request Body:**
```json
{
  "policyName": "Comprehensive Auto Protect",
  "description": "Full coverage for all vehicle damages",
  "policyTypeId": 1,
  "premiumAmount": 15000.0,
  "coverageAmount": 500000.0,
  "durationInMonths": 12
}
```

---

### 3.2 Update Policy Product
| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/admin-service/api/admin/policies/{policyId}` |
| **Auth** | Bearer Token (ADMIN) |

**Request Body:** Same structure as Create Policy.

---

### 3.3 Delete Policy Product
| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `/admin-service/api/admin/policies/{policyId}` |
| **Auth** | Bearer Token (ADMIN) |

**Response (200 OK):** `"Policy deleted successfully"`

---

### 3.4 Review Claim (Change Status)
| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/admin-service/api/admin/claims/{claimId}/review` |
| **Auth** | Bearer Token (ADMIN) |

**Request Body:**
```json
{
  "status": "UNDER_REVIEW"
}
```
> Valid transitions: `SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED → CLOSED`

**Response (200 OK):** `"Claim reviewed successfully"`

---

### 3.5 Get Claim Status
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/admin-service/api/admin/claims/status/{claimId}` |
| **Auth** | Bearer Token (ADMIN) |

---

### 3.6 Get Claims by User
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/admin-service/api/admin/claims/user/{userId}` |
| **Auth** | Bearer Token (ADMIN) |

---

### 3.7 Get Unified Report
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/admin-service/api/admin/reports` |
| **Auth** | Bearer Token (ADMIN) |

**Response (200 OK):**
```json
{
  "totalPolicies": 5,
  "totalClaims": 3,
  "approvedClaims": 1,
  "rejectedClaims": 0,
  "totalRevenue": 75000.0
}
```

---

## 4. Claims Service APIs

### 4.1 Initiate Claim
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/claims-service/api/claims/initiate` |
| **Auth** | Bearer Token (CUSTOMER) |

**Request Body:**
```json
{
  "policyId": 1,
  "userId": 2,
  "claimAmount": 45000.0,
  "description": "Fender bender accident"
}
```

**Response (200 OK):**
```json
{
  "claimId": 1,
  "policyId": 1,
  "userId": 2,
  "status": "SUBMITTED",
  "message": "Claim submitted Successfully",
  "claimAmount": 45000.0,
  "description": "Fender bender accident"
}
```

---

### 4.2 Upload Claim Document
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/claims-service/api/claims/upload?claimId={id}` |
| **Auth** | Bearer Token (CUSTOMER) |
| **Body Type** | `form-data` |

| Key | Type | Value |
|---|---|---|
| `file` | File | Select a file (image/PDF) |

**Response (200 OK):** `"Document uploaded Successfully"`

---

### 4.3 Get Claim Status
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/claims-service/api/claims/status/{claimId}` |
| **Auth** | Bearer Token (CUSTOMER or ADMIN) |

---

### 4.4 Get Claim by ID
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/claims-service/api/claims/{claimId}` |
| **Auth** | Bearer Token (CUSTOMER or ADMIN) |

---

### 4.5 Get My Claims (by User ID)
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/claims-service/api/claims/user/{userId}` |
| **Auth** | Bearer Token (CUSTOMER — own ID only, or ADMIN — any ID) |

> Customers can only view their own claims. Attempting to view another user's claims returns `403 Forbidden`.

---

### 4.6 Update Claim Status (Internal — Feign Only)
| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/claims-service/api/claims/{claimId}/status` |
| **Auth** | Bearer Token (ADMIN) |

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

---

### 4.7 Get Claim Statistics (Internal — Feign Only)
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/claims-service/api/claims/stats` |
| **Auth** | Bearer Token (ADMIN) |

**Response (200 OK):**
```json
{
  "totalClaims": 3,
  "submittedClaims": 1,
  "approvedClaims": 1,
  "rejectedClaims": 1
}
```

---

## 5. Error Responses

| Status Code | Meaning | Example Scenario |
|---|---|---|
| `400 Bad Request` | Invalid input or business rule violation | Invalid claim status transition |
| `401 Unauthorized` | Missing/invalid JWT or direct access to microservice port | Expired token, bypassing Gateway |
| `403 Forbidden` | Insufficient role permissions | Customer trying to access Admin endpoint |
| `404 Not Found` | Resource does not exist | Claim ID not found |
| `500 Internal Server Error` | Unexpected server error | Database connection failure |

---

## 6. Authentication Header Format

All authenticated requests require the following header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqYW5l...
```

This is automatically set in Postman via the **Authorization** tab → **Bearer Token**.
