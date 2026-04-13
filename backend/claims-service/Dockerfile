# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline -B
COPY src/ src/
RUN mvn clean package -DskipTests -B

# Stage 2: Run
FROM eclipse-temurin:21-jre
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN mkdir -p logs
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8003
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
