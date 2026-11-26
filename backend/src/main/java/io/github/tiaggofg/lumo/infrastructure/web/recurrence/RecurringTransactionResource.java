package io.github.tiaggofg.lumo.infrastructure.web.recurrence;

import io.github.tiaggofg.lumo.application.recurrence.ActivateRecurringTransactionUseCase;
import io.github.tiaggofg.lumo.application.recurrence.CreateRecurringTransactionUseCase;
import io.github.tiaggofg.lumo.application.recurrence.DeactivateRecurringTransactionUseCase;
import io.github.tiaggofg.lumo.application.recurrence.DeleteRecurringTransactionUseCase;
import io.github.tiaggofg.lumo.application.recurrence.ListRecurringTransactionsUseCase;
import io.github.tiaggofg.lumo.application.recurrence.RecurringTransactionOutput;
import io.github.tiaggofg.lumo.application.recurrence.UpdateRecurringTransactionUseCase;
import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceAmountType;
import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceType;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Path("/api/v1/recurring-transactions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RecurringTransactionResource {

    private final ListRecurringTransactionsUseCase listUseCase;
    private final CreateRecurringTransactionUseCase createUseCase;
    private final UpdateRecurringTransactionUseCase updateUseCase;
    private final DeactivateRecurringTransactionUseCase deactivateUseCase;
    private final ActivateRecurringTransactionUseCase activateUseCase;
    private final DeleteRecurringTransactionUseCase deleteUseCase;

    @Inject
    public RecurringTransactionResource(
            ListRecurringTransactionsUseCase listUseCase,
            CreateRecurringTransactionUseCase createUseCase,
            UpdateRecurringTransactionUseCase updateUseCase,
            DeactivateRecurringTransactionUseCase deactivateUseCase,
            ActivateRecurringTransactionUseCase activateUseCase,
            DeleteRecurringTransactionUseCase deleteUseCase
    ) {
        this.listUseCase = listUseCase;
        this.createUseCase = createUseCase;
        this.updateUseCase = updateUseCase;
        this.deactivateUseCase = deactivateUseCase;
        this.activateUseCase = activateUseCase;
        this.deleteUseCase = deleteUseCase;
    }

    public record CreateRecurrenceRequest(
            @NotNull TransactionType type,
            @NotBlank String description,
            @NotNull BigDecimal amount,
            @NotNull RecurrenceAmountType amountType,
            @NotNull RecurrenceType recurrenceType,
            @NotBlank String startMonth,
            String endMonth,
            Integer totalInstallments,
            Integer startingInstallment,
            Integer dueDay,
            UUID categoryId,
            UUID beneficiaryId,
            String notes
    ) {
    }

    public record UpdateRecurrenceRequest(
            @NotNull TransactionType type,
            @NotBlank String description,
            @NotNull BigDecimal amount,
            @NotNull RecurrenceAmountType amountType,
            @NotNull RecurrenceType recurrenceType,
            @NotBlank String startMonth,
            String endMonth,
            Integer totalInstallments,
            Integer startingInstallment,
            Integer dueDay,
            UUID categoryId,
            UUID beneficiaryId,
            String notes,
            Boolean propagateToOpenTransactions
    ) {
    }

    public record DeactivateRequest(Boolean removeFutureOpenTransactions) {
    }

    @GET
    public List<RecurringTransactionOutput> list(
            @QueryParam("active") Boolean active,
            @QueryParam("type") TransactionType type,
            @QueryParam("recurrenceType") RecurrenceType recurrenceType
    ) {
        return listUseCase.execute(active, type, recurrenceType);
    }

    @POST
    public Response create(@Valid CreateRecurrenceRequest request) {
        RecurringTransactionOutput.CreateOutput created = createUseCase.execute(
                new CreateRecurringTransactionUseCase.Input(
                        request.type(),
                        request.description(),
                        request.amount(),
                        request.amountType(),
                        request.recurrenceType(),
                        request.startMonth(),
                        request.endMonth(),
                        request.totalInstallments(),
                        request.startingInstallment(),
                        request.dueDay(),
                        request.categoryId(),
                        request.beneficiaryId(),
                        request.notes()
                )
        );
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public RecurringTransactionOutput.UpdateOutput update(
            @PathParam("id") UUID id,
            @Valid UpdateRecurrenceRequest request
    ) {
        return updateUseCase.execute(
                new UpdateRecurringTransactionUseCase.Input(
                        id,
                        request.type(),
                        request.description(),
                        request.amount(),
                        request.amountType(),
                        request.recurrenceType(),
                        request.startMonth(),
                        request.endMonth(),
                        request.totalInstallments(),
                        request.startingInstallment(),
                        request.dueDay(),
                        request.categoryId(),
                        request.beneficiaryId(),
                        request.notes(),
                        Boolean.TRUE.equals(request.propagateToOpenTransactions())
                )
        );
    }

    @PATCH
    @Path("/{id}/deactivate")
    public RecurringTransactionOutput.DeactivateOutput deactivate(
            @PathParam("id") UUID id,
            DeactivateRequest request
    ) {
        boolean removeFuture = request != null && Boolean.TRUE.equals(request.removeFutureOpenTransactions());
        return deactivateUseCase.execute(id, removeFuture);
    }

    @PATCH
    @Path("/{id}/activate")
    public RecurringTransactionOutput activate(@PathParam("id") UUID id) {
        return activateUseCase.execute(id);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") UUID id) {
        deleteUseCase.execute(id);
        return Response.noContent().build();
    }
}
