package io.github.tiaggofg.lumo.infrastructure.config;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Clock;
import java.time.ZoneId;

@ApplicationScoped
public class ClockProducer {

    private final String timezone;

    public ClockProducer(
            @ConfigProperty(name = "lumo.timezone", defaultValue = "America/Sao_Paulo") String timezone) {
        this.timezone = timezone;
    }

    @Produces
    @ApplicationScoped
    public Clock clock() {
        return Clock.system(ZoneId.of(timezone));
    }
}
