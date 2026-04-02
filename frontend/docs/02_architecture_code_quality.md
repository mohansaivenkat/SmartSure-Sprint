# Architecture & Code Quality Standards

## Feature-Based Folder Structure
The application follows a strictly modular, feature-based directory structure. This approach encapsulates all logic related to a specific domain (e.g., authentication, policies, claims) within its own subdirectory. By doing so, the project ensures that files related by function stay close together, reducing the mental overhead for developers and simplifying the scaling process.

### Directory Mapping
- src/features: Contains the core business domains. Each sub-folder (e.g., /claims) includes its own components, store logic (slices), and specific hooks.
- src/core: Houses cross-cutting concerns like API configurations, global error handling, and route guards.
- src/shared: Stores truly reusable UI components, utility functions, and custom hooks that are consumed by multiple features.
- src/layouts: Manages the structural shell of the application, such as navigation bars and footers.

## Clean Code & Modular Design
Code quality is maintained through strict adherence to SOLID principles and the DRY (Don't Repeat Yourself) methodology. Components are kept small and focused, with complex logic extracted into custom hooks or utility functions. This modularity makes unit testing more straightforward and enhances the legibility of the UI layer.

## Meaningful Naming Conventions
Variable, component, and file naming follow standard React community guidelines:
- Components use PascalCase (e.g., PolicyCard.tsx).
- Hooks start with the prefix 'use' and use camelCase (e.g., usePolicyData.ts).
- Constant values use UPPER_SNAKE_CASE (e.g., API_TIMEOUT).
- Slices and services use descriptive suffixes to indicate their role (e.g., authSlice.ts, api.ts).

## Separation of Concerns
The implementation ensures a clear distinction between:
- Data fetching logic (handled in the API service layer).
- State management (handled in Redux slices).
- UI representation (handled in React components).
- Business logic (delegated to custom hooks or helpers).

This separation prevents the creation of "God components" and makes the codebase highly maintainable throughout its lifecycle.
