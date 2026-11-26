FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

COPY src/ src/
RUN ./mvnw -B package -DskipTests

FROM eclipse-temurin:25-jre
WORKDIR /work

COPY --from=build /app/target/quarkus-app/lib/ /work/lib/
COPY --from=build /app/target/quarkus-app/*.jar /work/
COPY --from=build /app/target/quarkus-app/app/ /work/app/
COPY --from=build /app/target/quarkus-app/quarkus/ /work/quarkus/

EXPOSE 8080
ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0"

ENTRYPOINT ["java", "-jar", "/work/quarkus-run.jar"]
