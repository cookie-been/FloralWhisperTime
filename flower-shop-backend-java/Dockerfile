FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app
COPY flower-shop-backend-java/pom.xml ./
RUN mvn -q -DskipTests dependency:go-offline

COPY flower-shop-backend-java/src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/flower-shop-backend-java-1.0.0.jar ./app.jar

ENV JAVA_OPTS=""
EXPOSE 3001

CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
