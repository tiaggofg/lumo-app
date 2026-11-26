package io.github.tiaggofg.lumo.infrastructure.web.budget;

import io.github.tiaggofg.lumo.application.budget.BudgetReadModelPort;
import io.github.tiaggofg.lumo.application.budget.CreateMonthlyBudgetUseCase;
import io.github.tiaggofg.lumo.application.budget.DeleteMonthlyBudgetUseCase;
import io.github.tiaggofg.lumo.application.budget.GetMonthlyBudgetDetailUseCase;
import io.github.tiaggofg.lumo.application.budget.ListMonthlyBudgetsUseCase;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/api/v1/budgets")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BudgetResource {

    private final ListMonthlyBudgetsUseCase listMonthlyBudgetsUseCase;
    private final CreateMonthlyBudgetUseCase createMonthlyBudgetUseCase;
    private final GetMonthlyBudgetDetailUseCase getMonthlyBudgetDetailUseCase;
    private final DeleteMonthlyBudgetUseCase deleteMonthlyBudgetUseCase;

    @Inject
    public BudgetResource(
            ListMonthlyBudgetsUseCase listMonthlyBudgetsUseCase,
            CreateMonthlyBudgetUseCase createMonthlyBudgetUseCase,
            GetMonthlyBudgetDetailUseCase getMonthlyBudgetDetailUseCase,
            DeleteMonthlyBudgetUseCase deleteMonthlyBudgetUseCase
    ) {
        this.listMonthlyBudgetsUseCase = listMonthlyBudgetsUseCase;
        this.createMonthlyBudgetUseCase = createMonthlyBudgetUseCase;
        this.getMonthlyBudgetDetailUseCase = getMonthlyBudgetDetailUseCase;
        this.deleteMonthlyBudgetUseCase = deleteMonthlyBudgetUseCase;
    }

    public record CreateBudgetRequest(@NotBlank String competenceMonth) {
    }

    @GET
    public List<BudgetReadModelPort.MonthlyBudgetListItemOutput> list() {
        return listMonthlyBudgetsUseCase.execute();
    }

    @POST
    public Response create(@Valid CreateBudgetRequest request) {
        BudgetReadModelPort.CreateMonthlyBudgetOutput created =
                createMonthlyBudgetUseCase.execute(request.competenceMonth());
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @GET
    @Path("/{id}")
    public BudgetReadModelPort.MonthlyBudgetDetailOutput getDetail(@PathParam("id") UUID id) {
        return getMonthlyBudgetDetailUseCase.execute(id);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") UUID id) {
        deleteMonthlyBudgetUseCase.execute(id);
        return Response.noContent().build();
    }
}
