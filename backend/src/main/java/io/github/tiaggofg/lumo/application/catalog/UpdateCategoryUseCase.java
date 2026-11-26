package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import jakarta.inject.Inject;

import java.time.Clock;
import java.util.UUID;

@Command
public class UpdateCategoryUseCase {

    private final CategoryRepository categoryRepository;
    private final Clock clock;

    @Inject
    public UpdateCategoryUseCase(CategoryRepository categoryRepository, Clock clock) {
        this.categoryRepository = categoryRepository;
        this.clock = clock;
    }

    public record Input(UUID id, String name, String color, String icon) {
    }

    public CategoryOutput execute(Input input) {
        Category category = categoryRepository.findById(input.id())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + input.id()));

        category.update(input.name(), input.color(), input.icon(), clock.instant());
        if (categoryRepository.existsByNameIgnoreCaseAndType(category.getName(), category.getType(), category.getId())) {
            throw new ResourceConflictException(
                    "Category '" + category.getName() + "' already exists for type " + category.getType() + ".");
        }
        return CategoryOutput.from(categoryRepository.save(category));
    }
}
