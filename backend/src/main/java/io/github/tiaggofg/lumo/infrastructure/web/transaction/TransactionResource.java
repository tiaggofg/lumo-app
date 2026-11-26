package io.github.tiaggofg.lumo.infrastructure.web.transaction;

import io.github.tiaggofg.lumo.application.transaction.ChangeTransactionStatusUseCase;
import io.github.tiaggofg.lumo.application.transaction.ConfirmEstimateUseCase;
import io.github.tiaggofg.lumo.application.transaction.DeleteTransactionUseCase;
import io.github.tiaggofg.lumo.application.transaction.TransactionQueryPort;
import io.github.tiaggofg.lumo.application.transaction.UpdateTransactionUseCase;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Path("/api/v1/transactions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TransactionResource {

    private final UpdateTransactionUseCase updateTransactionUseCase;
    private final ChangeTransactionStatusUseCase changeTransactionStatusUseCase;
    private final ConfirmEstimateUseCase confirmEstimateUseCase;
    private final DeleteTransactionUseCase deleteTransactionUseCase;

    @Inject
    public TransactionResource(
            UpdateTransactionUseCase updateTransactionUseCase,
            ChangeTransactionStatusUseCase changeTransactionStatusUseCase,
            ConfirmEstimateUseCase confirmEstimateUseCase,
            DeleteTransactionUseCase deleteTransactionUseCase
    ) {
        this.updateTransactionUseCase = updateTransactionUseCase;
        this.changeTransactionStatusUseCase = changeTransactionStatusUseCase;
        this.confirmEstimateUseCase = confirmEstimateUseCase;
        this.deleteTransactionUseCase = deleteTransactionUseCase;
    }

    public record UpdateTransactionRequest(
            UUID monthlyBudgetId,
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

    public record ChangeStatusRequest(
            @NotNull TransactionStatus status,
            LocalDate paymentDate
    ) {
    }

    public record ConfirmEstimateRequest(
            @NotNull BigDecimal amount,
            @NotNull TransactionStatus targetStatus,
            LocalDate paymentDate,
            Boolean updateRecurringTemplate
    ) {
    }

    @PUT
    @Path("/{id}")
    public TransactionQueryPort.TransactionOutput update(
            @PathParam("id") UUID id,
            @Valid UpdateTransactionRequest request
    ) {
        return updateTransactionUseCase.execute(
                new UpdateTransactionUseCase.Input(
                        id,
                        request.monthlyBudgetId(),
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
    }

    @PATCH
    @Path("/{id}/status")
    public TransactionQueryPort.TransactionOutput changeStatus(
            @PathParam("id") UUID id,
            @Valid ChangeStatusRequest request
    ) {
        return changeTransactionStatusUseCase.execute(id, request.status(), request.paymentDate());
    }

    @PATCH
    @Path("/{id}/confirm-estimate")
    public TransactionQueryPort.TransactionOutput confirmEstimate(
            @PathParam("id") UUID id,
            @Valid ConfirmEstimateRequest request
    ) {
        return confirmEstimateUseCase.execute(
                new ConfirmEstimateUseCase.Input(
                        id,
                        request.amount(),
                        request.targetStatus(),
                        request.paymentDate(),
                        Boolean.TRUE.equals(request.updateRecurringTemplate())
                )
        );
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") UUID id) {
        deleteTransactionUseCase.execute(id);
        return Response.noContent().build();
    }
}
