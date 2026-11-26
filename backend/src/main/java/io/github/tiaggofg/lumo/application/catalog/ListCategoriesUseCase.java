package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.application.stereotype.Query;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.inject.Inject;

import java.util.List;

@Query
public class ListCategoriesUseCase {

    private final CategoryRepository categoryRepository;

    @Inject
    public ListCategoriesUseCase(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryOutput> execute(TransactionType type, Boolean active) {
        return categoryRepository.findAll(type, active).stream()
                .map(CategoryOutput::from)
                .toList();
    }
}
