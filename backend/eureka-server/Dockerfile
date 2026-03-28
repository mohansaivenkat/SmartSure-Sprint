# ============================================
# Stage 1: Build the Spring Boot JAR
# ============================================
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy POM first (Docker layer caching for dependencies)
COPY pom.xml ./

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src/ src/

# Build the executable JAR (skip tests for faster builds)
RUN mvn clean package -DskipTests -B

# ============================================
# Stage 2: Runtime (JRE, non-root user)
# ============================================
FROM eclipse-temurin:17-jre

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# Create logs directory and set correct permissions
RUN mkdir -p logs && chown -R appuser:appgroup /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Logback and other file operations need write access to /app
RUN chown appuser:appgroup app.jar

# Switch to non-root user
USER appuser

# JVM tuning via environment variables
ENV JAVA_OPTS="-Xms256m -Xmx512m"

# Eureka default port
EXPOSE 8761

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
