# =====================================================================
# Student Freelance Marketplace – Sprint 5: triển khai
# Build 1 image gồm giao diện React + Spring Boot, chạy trên một cổng.
#   Bước 1: build React (Vite)  → frontend/dist
#   Bước 2: chép dist vào static của Spring Boot rồi build file .jar
#   Bước 3: chạy .jar bằng Java 21
# Biến môi trường cần khi chạy: DB_URL, DB_USER, DB_PASSWORD, JWT_SECRET
# (PORT do nền tảng triển khai tự cấp, mặc định 8080)
# =====================================================================

# ---------- Bước 1: giao diện ----------
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- Bước 2: backend + giao diện ----------
FROM eclipse-temurin:21-jdk AS backend
WORKDIR /app/backend
COPY backend/ ./
COPY --from=frontend /app/frontend/dist/ ./src/main/resources/static/
# Bỏ qua test khi build image: contextLoads cần MySQL.
# Unit test (13 ca) đã chạy trên máy bằng: mvnw test -Dtest="*ServiceTest"
RUN chmod +x mvnw && ./mvnw -B -q clean package -DskipTests

# ---------- Bước 3: chạy ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/backend/target/*.jar app.jar
# Giới hạn RAM để tiết kiệm tài nguyên gói miễn phí
ENV JAVA_OPTS="-Xmx320m -XX:+UseSerialGC"
EXPOSE 8080
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
