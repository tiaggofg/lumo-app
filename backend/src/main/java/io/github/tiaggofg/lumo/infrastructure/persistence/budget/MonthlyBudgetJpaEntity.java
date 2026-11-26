package io.github.tiaggofg.lumo.infrastructure.persistence.budget;

import io.github.tiaggofg.lumo.domain.budget.MonthlyBudget;
import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "monthly_budgets")
public class MonthlyBudgetJpaEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "competence_month", nullable = false, length = 7, unique = true)
    private String competenceMonth;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected MonthlyBudgetJpaEntity() {
    }

    public static MonthlyBudgetJpaEntity fromDomain(MonthlyBudget budget) {
        MonthlyBudgetJpaEntity entity = new MonthlyBudgetJpaEntity();
        entity.id = budget.getId();
        entity.competenceMonth = budget.getCompetenceMonth().toIsoString();
        entity.createdAt = budget.getCreatedAt();
        entity.updatedAt = budget.getUpdatedAt();
        return entity;
    }

    public MonthlyBudget toDomain() {
        return MonthlyBudget.reconstitute(id, CompetenceMonth.parse(competenceMonth), createdAt, updatedAt);
    }

    public UUID getId() {
        return id;
    }
}
