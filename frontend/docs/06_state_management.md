# Global & Local State Management Strategy

## Redux Toolkit for Global State
SmartSure leverages Redux Toolkit as its primary global state management solution. This choice provides a robust, predictable, and traceable mechanism for managing data that must be shared across disparate parts of the application.

### Key Global Slices
- Auth Slice: Manages the authentication state, the currently logged-in user profile, and user role. This is the source of truth for the entire application's authentication status.
- Theme Slice: Responsibly handles the light/dark mode preference, enabling a consistent visual experience as users browse different features.

## Local State Management
For logic confined to a single component—such as form inputs, local toggle switches, or modal visibility—the application utilizes standard React hooks like `useState` and `useReducer`. This clear separation between local and global state prevents the global store from becoming bloated with ephemeral data, thus optimizing performance and readability.

## Asynchronous Operations & Thunks
Redux Thunks are used for handling complex asynchronous operations that need to interact with the global store. This pattern allows for a clear, three-stage lifecycle for every API request:
1. Pending: Trigger loading states in the UI.
2. Fulfilled: Update the global state with successful response data.
3. Rejected: Capture errors and update the state to show appropriate failure messages.

## Performance Considerations
To avoid unnecessary re-renders, the application makes use of memoized selectors (where needed) and ensures that components only subscribe to the specific parts of the state they require. This granular subscription strategy is critical for maintaining high performance as the application grows in complexity.
