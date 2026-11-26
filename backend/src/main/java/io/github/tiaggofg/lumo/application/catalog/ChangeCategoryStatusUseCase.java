package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import jakarta.inject.Inject;

import java.time.Clock;
import java.util.UUID;

@Command
public class ChangeCategoryStatusUseCase {

    private final CategoryRepository categoryRepository;
    private final Clock clock;

    @Inject
    public ChangeCategoryStatusUseCase(CategoryRepository categoryRepository, Clock clock) {
        this.categoryRepository = categoryRepository;
        this.clock = clock;
    }

    public CategoryOutput execute(UUID id, boolean active) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        if (active) {
            category.activate(clock.instant());
        } else {
            category.deactivate(clock.instant());
        }
        return CategoryOutput.from(categoryRepository.save(category));
    }
}
