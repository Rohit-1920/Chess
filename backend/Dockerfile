# ─────────────────────────────────────────────────────────────────
# Stage 1 — Build with Maven
# ─────────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Cache the dependency layer first (only re-runs if pom.xml changes)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# ─────────────────────────────────────────────────────────────────
# Stage 2 — Runtime
# ─────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system chessapp && adduser --system --ingroup chessapp chessapp

# Copy the fat jar from the build stage
COPY --from=builder /app/target/chess-backend-1.0.0.jar app.jar

# Logs directory
RUN mkdir -p /app/logs && chown -R chessapp:chessapp /app
USER chessapp

EXPOSE 8080

# JVM tuning for a 4-vCPU / 8GB instance (m7i-flex.large)
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=70.0", \
  "-XX:+UseG1GC", \
  "-XX:+HeapDumpOnOutOfMemoryError", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
