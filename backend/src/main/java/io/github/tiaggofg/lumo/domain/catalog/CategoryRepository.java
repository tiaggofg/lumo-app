package io.github.tiaggofg.lumo.domain.catalog;

import io.github.tiaggofg.lumo.domain.transaction.TransactionType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository {

    Category save(Category category);

    Optional<Category> findById(UUID id);

    List<Category> findAll(TransactionType type, Boolean active);

    boolean existsByNameIgnoreCaseAndType(String name, TransactionType type, UUID excludeId);

    boolean isReferencedInAnyRecord(UUID categoryId);

    void deleteById(UUID id);
}
