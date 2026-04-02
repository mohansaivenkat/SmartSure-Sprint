# Environment & Configuration Management

## Environment Variable Architecture
SmartSure utilizes a strict configuration management strategy by separating application logic from environment-specific data. This is achieved through the use of `.env` files and Vite's built-in environment variable support.

### Key Variables
- VITE_API_BASE_URL: The primary endpoint for all microservices communication. This allows dev and prod to point to different gateway services seamlessly.
- VITE_RAZORPAY_KEY: Configurable payment keys, ensuring that sensitive integration credentials are never hardcoded in the source.

## Management Across Environments
The project is designed to handle multiple environment configurations:
- Development (.env.development): Points to local or staging services for rapid testing.
- Production (.env.production): Configured with optimized, secure, and production-ready endpoints.

## Avoiding Sensitive Hardcoding
A core security principle adhered to is the absolute avoidance of hardcoding sensitive information like API keys, secrets, or internal server paths. This not only improves security but also makes the application incredibly portable across different infrastructure providers and deployment pipelines.

## Type Safety for Config
By using Vite's `import.meta.env`, we provide a central point of access for all configuration. This information is typed via `vite-env.d.ts` to ensure that developers receive IDE autocompletion and that the build process will fail if a critical environment variable is missing or incorrectly named.
