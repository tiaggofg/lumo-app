package io.github.tiaggofg.lumo.domain.catalog;

import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CategoryTest {

    private static final Instant NOW = Instant.parse("2026-11-26T12:00:00Z");

    @Test
    void shouldCreateActiveCategoryWithDomainGeneratedUuid() {
        Category category = Category.create("  Pets  ", TransactionType.EXPENSE, "#a1b2c3", "pi pi-heart", NOW);

        assertThat(category.getId()).isNotNull();
        assertThat(category.getName()).isEqualTo("Pets");
        assertThat(category.getType()).isEqualTo(TransactionType.EXPENSE);
        assertThat(category.getColor()).isEqualTo("#A1B2C3");
        assertThat(category.getIcon()).isEqualTo("pi pi-heart");
        assertThat(category.isActive()).isTrue();
    }

    @Test
    void shouldAllowNullOrBlankOptionalColorAndIcon() {
        Category category = Category.create("Freelance", TransactionType.INCOME, "  ", "", NOW);

        assertThat(category.getColor()).isNull();
        assertThat(category.getIcon()).isNull();
    }

    @Test
    void shouldRejectBlankName() {
        assertThatThrownBy(() -> Category.create("   ", TransactionType.EXPENSE, null, null, NOW))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("name");
    }

    @Test
    void shouldRejectNameLongerThan80Characters() {
        String longName = "a".repeat(81);
        assertThatThrownBy(() -> Category.create(longName, TransactionType.EXPENSE, null, null, NOW))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("80");
    }

    @Test
    void shouldRejectNullType() {
        assertThatThrownBy(() -> Category.create("Pets", null, null, null, NOW))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("type");
    }

    @Test
    void shouldRejectInvalidHexColor() {
        assertThatThrownBy(() -> Category.create("Pets", TransactionType.EXPENSE, "red", null, NOW))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("color");
    }

    @Test
    void shouldRejectIconLongerThan50Characters() {
        String longIcon = "p".repeat(51);
        assertThatThrownBy(() -> Category.create("Pets", TransactionType.EXPENSE, "#FFFFFF", longIcon, NOW))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("50");
    }

    @Test
    void shouldUpdateDeactivateAndActivateCategory() {
        Category category = Category.create("Pets", TransactionType.EXPENSE, "#112233", "pi pi-tag", NOW);
        Instant later = NOW.plusSeconds(60);

        category.update("Animais", "#445566", "pi pi-star", later);
        assertThat(category.getName()).isEqualTo("Animais");
        assertThat(category.getColor()).isEqualTo("#445566");
        assertThat(category.getIcon()).isEqualTo("pi pi-star");
        assertThat(category.getUpdatedAt()).isEqualTo(later);

        category.deactivate(later.plusSeconds(10));
        assertThat(category.isActive()).isFalse();

        category.activate(later.plusSeconds(20));
        assertThat(category.isActive()).isTrue();
    }
}
