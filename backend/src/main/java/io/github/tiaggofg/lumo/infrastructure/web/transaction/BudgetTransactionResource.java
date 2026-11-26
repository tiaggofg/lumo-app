package io.github.tiaggofg.lumo.infrastructure.web.transaction;

import io.github.tiaggofg.lumo.application.transaction.CreateTransactionUseCase;
import io.github.tiaggofg.lumo.application.transaction.ListBudgetTransactionsUseCase;
import io.github.tiaggofg.lumo.application.transaction.TransactionQueryPort;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Path("/api/v1/budgets/{budgetId}/transactions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BudgetTransactionResource {

    private final ListBudgetTransactionsUseCase listBudgetTransactionsUseCase;
    private final CreateTransactionUseCase createTransactionUseCase;

    @Inject
    public BudgetTransactionResource(
            ListBudgetTransactionsUseCase listBudgetTransactionsUseCase,
            CreateTransactionUseCase createTransactionUseCase
    ) {
        this.listBudgetTransactionsUseCase = listBudgetTransactionsUseCase;
        this.createTransactionUseCase = createTransactionUseCase;
    }

    public record CreateTransactionRequest(
            @NotNull TransactionType type,
            @NotBlank String description,
            @NotNull BigDecimal amount,
            @NotNull TransactionStatus status,
            LocalDate dueDate,
            LocalDate paymentDate,
            String notes,
            UUID categoryId,
            UUID beneficiaryId
    ) {
    }

    @GET
    public List<TransactionQueryPort.TransactionOutput> listByBudget(
            @PathParam("budgetId") UUID budgetId,
            @QueryParam("type") TransactionType type,
            @QueryParam("status") TransactionStatus status,
            @QueryParam("categoryId") UUID categoryId,
            @QueryParam("beneficiaryId") UUID beneficiaryId,
            @QueryParam("search") String search
    ) {
        return listBudgetTransactionsUseCase.execute(budgetId, type, status, categoryId, beneficiaryId, search);
    }

    @POST
    public Response create(
            @PathParam("budgetId") UUID budgetId,
            @Valid CreateTransactionRequest request
    ) {
        TransactionQueryPort.TransactionOutput created = createTransactionUseCase.execute(
                new CreateTransactionUseCase.Input(
                        budgetId,
                        request.type(),
                        request.description(),
                        request.amount(),
                        request.status(),
                        request.dueDate(),
                        request.paymentDate(),
                        request.notes(),
                        request.categoryId(),
                        request.beneficiaryId()
                )
        );
        return Response.status(Response.Status.CREATED).entity(created).build();
    }
}
