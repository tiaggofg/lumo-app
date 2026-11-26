package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.inject.Inject;

import java.time.Clock;

@Command
public class CreateCategoryUseCase {

    private final CategoryRepository categoryRepository;
    private final Clock clock;

    @Inject
    public CreateCategoryUseCase(CategoryRepository categoryRepository, Clock clock) {
        this.categoryRepository = categoryRepository;
        this.clock = clock;
    }

    public record Input(String name, TransactionType type, String color, String icon) {
    }

    public CategoryOutput execute(Input input) {
        Category category = Category.create(input.name(), input.type(), input.color(), input.icon(), clock.instant());
        if (categoryRepository.existsByNameIgnoreCaseAndType(category.getName(), category.getType(), null)) {
            throw new ResourceConflictException(
                    "Category '" + category.getName() + "' already exists for type " + category.getType() + ".");
        }
        return CategoryOutput.from(categoryRepository.save(category));
    }
}
