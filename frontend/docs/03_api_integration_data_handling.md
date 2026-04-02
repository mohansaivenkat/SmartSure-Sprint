# API Integration & Data Handling

## Centralized Service Layer
SmartSure utilizes a centralized API service located in src/core/services/api.ts. This approach abstracts the underlying HTTP implementation (Axios) from the feature components. By exposing a set of clean, typed methods (e.g., policyAPI.getUserPolicies), we ensure that any changes to endpoint structures or headers only need to be updated in a single file.

## Axios Configuration & Interceptors
The application configures a primary Axios instance with the following settings:
- Base URL: Dynamically derived from environment variables, ensuring flexibility between development and production.
- Timeout Settings: Configured to handle potential microservice delays gracefully.

### Authentication Interceptors
A request interceptor is implemented to automatically attach JWT bearer tokens to all outgoing requests aimed at protected resources. This removes the need for individual components to manage token headers manually.

### Response Interceptors & Token Refresh
A sophisticated response interceptor manages the lifecycle of authentication tokens. It intercepts 401 Unauthorized errors and attempts to silently refresh the access token using a refresh token strategy. If a refresh fails, the interceptor triggers a global logout flow, redirecting the user to the login page to maintain security.

## State Management for Async Operations
Fetching data involves managing three distinct states:
1. Loading: Indicated by a loading spinner component during the request lifecycle.
2. Success: The application updates local or global state with the received payload.
3. Error: Catch blocks capture and propagate error messages to the UI for user feedback.

## Data Normalization
Received data is often processed or mapped to match the frontend models. Using TypeScript interfaces for API responses ensures that the data being used in components is predictable and type-safe, preventing runtime undefined errors.
