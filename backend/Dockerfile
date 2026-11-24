FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
ENV SPRING_PROFILES_ACTIVE=neon
ENV PORT=7860
EXPOSE 7860
COPY --from=build /workspace/target/backend-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["sh", "-c", "java -XX:MaxRAMPercentage=75 -Dserver.port=${PORT} -jar /app/app.jar"]
