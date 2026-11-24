FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
ENV SPRING_PROFILES_ACTIVE=neon
ENV PORT=8080
EXPOSE 8080
COPY --from=build /workspace/target/backend-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["sh", "-c", "java $JAVA_TOOL_OPTIONS -XX:MaxRAMPercentage=75 -Dserver.port=${PORT:-8080} -jar app.jar"]
