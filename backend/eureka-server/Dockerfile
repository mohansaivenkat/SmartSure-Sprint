# Stage 1: Build the JAR using Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
# Copy the pom and source code
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
# Build the application, skipping tests for faster build
RUN mvn clean package -DskipTests

# Stage 2: Create the runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copy the JAR from the build stage
COPY --from=build /app/target/*.jar app.jar
# Expose the service port
EXPOSE 8761
# Set the entry point to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
