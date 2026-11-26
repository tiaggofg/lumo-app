package io.github.tiaggofg.lumo.infrastructure.config;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.application.stereotype.Query;
import io.github.tiaggofg.lumo.application.stereotype.ReadOnlyTransaction;
import io.github.tiaggofg.lumo.domain.stereotype.AggregateRoot;
import io.github.tiaggofg.lumo.domain.stereotype.Entity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Stereotype;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

class StereotypeAndClockTest {

    @Test
    void commandStereotypeShouldComposeApplicationScopedAndTransactional() {
        assertThat(Command.class.isAnnotationPresent(Stereotype.class)).isTrue();
        assertThat(Command.class.isAnnotationPresent(ApplicationScoped.class)).isTrue();
        Transactional transactional = Command.class.getAnnotation(Transactional.class);
        assertThat(transactional).isNotNull();
        assertThat(transactional.value()).isEqualTo(Transactional.TxType.REQUIRED);
    }

    @Test
    void queryStereotypeShouldComposeSupportsAndReadOnlyTransaction() {
        assertThat(Query.class.isAnnotationPresent(Stereotype.class)).isTrue();
        assertThat(Query.class.isAnnotationPresent(ApplicationScoped.class)).isTrue();
        assertThat(Query.class.isAnnotationPresent(ReadOnlyTransaction.class)).isTrue();
        Transactional transactional = Query.class.getAnnotation(Transactional.class);
        assertThat(transactional).isNotNull();
        assertThat(transactional.value()).isEqualTo(Transactional.TxType.SUPPORTS);
    }

    @Test
    void clockProducerShouldUseConfiguredTimezone() {
        ClockProducer producer = new ClockProducer("America/Sao_Paulo");
        Clock clock = producer.clock();
        assertThat(clock.getZone()).isEqualTo(ZoneId.of("America/Sao_Paulo"));
    }

    @Test
    void clockProducerShouldSupportAlternativeTimezone() {
        ClockProducer producer = new ClockProducer("UTC");
        Clock clock = producer.clock();
        assertThat(clock.getZone()).isEqualTo(ZoneId.of("UTC"));
    }

    @Test
    void aggregateRootShouldExtendEntity() {
        assertThat(Entity.class.isAssignableFrom(AggregateRoot.class)).isTrue();
    }
}
