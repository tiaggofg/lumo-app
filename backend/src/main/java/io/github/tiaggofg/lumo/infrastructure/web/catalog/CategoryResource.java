package io.github.tiaggofg.lumo.infrastructure.web.catalog;

import io.github.tiaggofg.lumo.application.catalog.CategoryOutput;
import io.github.tiaggofg.lumo.application.catalog.ChangeCategoryStatusUseCase;
import io.github.tiaggofg.lumo.application.catalog.CreateCategoryUseCase;
import io.github.tiaggofg.lumo.application.catalog.DeleteCategoryUseCase;
import io.github.tiaggofg.lumo.application.catalog.ListCategoriesUseCase;
import io.github.tiaggofg.lumo.application.catalog.UpdateCategoryUseCase;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/api/v1/categories")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CategoryResource {

    private final ListCategoriesUseCase listCategoriesUseCase;
    private final CreateCategoryUseCase createCategoryUseCase;
    private final UpdateCategoryUseCase updateCategoryUseCase;
    private final ChangeCategoryStatusUseCase changeCategoryStatusUseCase;
    private final DeleteCategoryUseCase deleteCategoryUseCase;

    @Inject
    public CategoryResource(
            ListCategoriesUseCase listCategoriesUseCase,
            CreateCategoryUseCase createCategoryUseCase,
            UpdateCategoryUseCase updateCategoryUseCase,
            ChangeCategoryStatusUseCase changeCategoryStatusUseCase,
            DeleteCategoryUseCase deleteCategoryUseCase
    ) {
        this.listCategoriesUseCase = listCategoriesUseCase;
        this.createCategoryUseCase = createCategoryUseCase;
        this.updateCategoryUseCase = updateCategoryUseCase;
        this.changeCategoryStatusUseCase = changeCategoryStatusUseCase;
        this.deleteCategoryUseCase = deleteCategoryUseCase;
    }

    public record CreateCategoryRequest(
            @NotBlank String name,
            @NotNull TransactionType type,
            String color,
            String icon
    ) {
    }

    public record UpdateCategoryRequest(
            @NotBlank String name,
            String color,
            String icon
    ) {
    }

    public record ChangeStatusRequest(@NotNull Boolean active) {
    }

    @GET
    public List<CategoryOutput> list(
            @QueryParam("type") TransactionType type,
            @QueryParam("active") Boolean active
    ) {
        return listCategoriesUseCase.execute(type, active);
    }

    @POST
    public Response create(@Valid CreateCategoryRequest request) {
        CategoryOutput created = createCategoryUseCase.execute(
                new CreateCategoryUseCase.Input(request.name(), request.type(), request.color(), request.icon()));
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public CategoryOutput update(@PathParam("id") UUID id, @Valid UpdateCategoryRequest request) {
        return updateCategoryUseCase.execute(
                new UpdateCategoryUseCase.Input(id, request.name(), request.color(), request.icon()));
    }

    @PATCH
    @Path("/{id}/status")
    public CategoryOutput changeStatus(@PathParam("id") UUID id, @Valid ChangeStatusRequest request) {
        return changeCategoryStatusUseCase.execute(id, request.active());
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") UUID id) {
        deleteCategoryUseCase.execute(id);
        return Response.noContent().build();
    }
}
