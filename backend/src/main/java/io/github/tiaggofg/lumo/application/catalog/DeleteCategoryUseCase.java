package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import jakarta.inject.Inject;

import java.util.UUID;

@Command
public class DeleteCategoryUseCase {

    private final CategoryRepository categoryRepository;

    @Inject
    public DeleteCategoryUseCase(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public void execute(UUID id) {
        if (categoryRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Category not found: " + id);
        }
        if (categoryRepository.isReferencedInAnyRecord(id)) {
            throw new ResourceConflictException(
                    "Category cannot be deleted because it is referenced by existing transactions or recurrences.");
        }
        categoryRepository.deleteById(id);
    }
}
