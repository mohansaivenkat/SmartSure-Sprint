# Authentication & Authorization Framework

## Secure Authentication Flows
SmartSure implements industry-standard authentication patterns for login, registration, and password recovery. The flows are designed to be intuitive and secure:
- Form Validation: Client-side validation ensures that only well-formatted data is sent to the Auth service.
- Error Feedback: Meaningful error messages are displayed for incorrect credentials, account locking, or server-side failures.

## JWT Management
Tokens are stored securely in localStorage to persist the session. The `authSlice` in Redux manages the currently authenticated user's profile and roles. By keeping the user data in a global store, the application can react instantly to changes in auth status across any feature.

## Route Protection & Access Control
Authorization is enforced using a `ProtectedRoute` wrapper component. This component acts as a gatekeeper for private routes:
- Level 1: Checks if a valid token/user session exists.
- Level 2: Validates the user's role against the required permissions for the route (e.g., ADMIN vs CUSTOMER).

If authorization fails, the user is automatically redirected to the login page or the home page, respectively, ensuring that sensitive areas like the Admin Dashboard remain inaccessible to unauthorized users.

## Session Lifecycle
The frontend handles token expiry through the Axios interceptor logic. When a token expires, the system attempts a silent refresh. If the session cannot be restored, a complete authentication wipe is performed to ensure that no stale data remains in the browser's memory or storage. This proactive approach minimizes the risk of session hijacking and enhances overall application security.
