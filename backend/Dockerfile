FROM --platform=$BUILDPLATFORM eclipse-temurin:25-jdk AS build
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

COPY src/ src/
RUN ./mvnw -B package -DskipTests

FROM eclipse-temurin:25-jre
WORKDIR /work

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system appgroup \
    && useradd --system --gid appgroup --home-dir /work --shell /sbin/nologin appuser

COPY --from=build --chown=appuser:appgroup /app/target/quarkus-app/lib/ /work/lib/
COPY --from=build --chown=appuser:appgroup /app/target/quarkus-app/*.jar /work/
COPY --from=build --chown=appuser:appgroup /app/target/quarkus-app/app/ /work/app/
COPY --from=build --chown=appuser:appgroup /app/target/quarkus-app/quarkus/ /work/quarkus/

USER appuser

EXPOSE 8080
ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0"

ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS_APPEND:-} -jar /work/quarkus-run.jar"]
