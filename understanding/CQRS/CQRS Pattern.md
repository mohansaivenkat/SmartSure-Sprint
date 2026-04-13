# CQRS Pattern (with Redis Caching) in SmartSure

In the **SmartSure** project, we use **CQRS (Command Query Responsibility Segregation)** to separate the "Writing" of data from the "Reading" of data. This improves performance and scalability.

---

## 1. What is CQRS?

Traditionally, we use one service for everything. In **CQRS**, we split the responsibility:
1.  **Command Side (WRITE)**: Handles actions that change data (Create, Update, Delete).
2.  **Query Side (READ)**: Handles fetching data (GET requests, Search, Statistics).

### Where is it in your project?
Look at the `policy-service` implementation folder:
*   **Command**: `PolicyCommandServiceImpl.java` (Handles purchases, cancellations, payments).
*   **Query**: `PolicyQueryServiceImpl.java` (Handles fetching policy lists, user policies, and stats).

---

## 2. Redis Caching in CQRS
To make the **Query Side** lightning fast, we use **Redis Caching**. Instead of hitting the database every time a user views their policies, we store the result in Redis.

### How it works:
1.  **User reads data**: The system checks Redis. if found, it returns immediately (Fast! ⚡).
2.  **User changes data**: The system updates the Database AND **Evicts** (removes) the old data from Redis.
3.  **Next read**: The system sees Redis is empty, fetches fresh data from DB, and puts it back in Redis.

---

## 3. Explanation of Annotations (The "Magic")

Spring Cache makes this easy with three main annotations used in your code:

### 🚀 `@Cacheable`
*   **Used in**: `PolicyQueryServiceImpl.java`
*   **What it does**: Tells Spring to check Redis before running the method. If data is in Redis, it returns it and **skips** the method. If not, it runs the method and **saves** the result in Redis.
*   **Example from your code**:
    ```java
    @Cacheable(value = "user_policies", key = "#userId")
    public List<UserPolicyResponseDTO> getPoliciesByUserId(Long userId) { ... }
    ```
    *   `value`: The name of the collection in Redis.
    *   `key`: The specific ID (e.g., User 101) to find the data.

### 🧹 `@CacheEvict`
*   **Used in**: `PolicyCommandServiceImpl.java`
*   **What it does**: "Cleans" or deletes the cache. This is vital when data changes. If you buy a new policy, the old "Policy List" in Redis is now wrong. `@CacheEvict` deletes the old list so the next search gets the new data.
*   **Example from your code**:
    ```java
    @CacheEvict(value = {"user_policies", "policy_stats"}, allEntries = true)
    public UserPolicyResponseDTO purchasePolicy(Long policyId) { ... }
    ```
    *   `allEntries = true`: Deletes *everything* in that cache category to ensure 100% fresh data.

### ⚙️ `@Transactional`
*   **Used in**: Both services.
*   **What it does**: Ensures that either **all** steps succeed or **none** do. If the database update fails, the cache won't be cleared, ensuring the system doesn't get into a "confused" state.

---

## 4. Why Use This?

| Feature | Why it's better |
| :--- | :--- |
| **Speed** | Redis is in-memory. Reading from Redis is 100x faster than reading from a hard-drive database (Postgres). |
| **Scale** | Your database does less work. It only handles "Writes". The heavy "Reading" load is handled by Redis. |
| **Separation** | If your Query side needs complex logic (like searching), it won't slow down the Command side (like buying a policy). |

---

## 5. Visual Flow of CQRS + Redis

```mermaid
graph TD
    User-->|PUT /purchase| Command[Command Service]
    Command-->|1. Update DB| DB[(PostgreSQL)]
    Command-->|2. Cache Evict| Redis((Redis Cache))
    
    User-->|GET /policies| Query[Query Service]
    Query-->|1. Check Cache| Redis
    Redis--|If Miss| Query
    Query-->|2. Fetch| DB
    Query-->|3. Save to| Redis
    Redis--|If Hit| User
```
