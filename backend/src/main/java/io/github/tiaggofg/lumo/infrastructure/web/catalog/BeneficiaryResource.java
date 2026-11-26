package io.github.tiaggofg.lumo.infrastructure.web.catalog;

import io.github.tiaggofg.lumo.application.catalog.BeneficiaryOutput;
import io.github.tiaggofg.lumo.application.catalog.ChangeBeneficiaryStatusUseCase;
import io.github.tiaggofg.lumo.application.catalog.CreateBeneficiaryUseCase;
import io.github.tiaggofg.lumo.application.catalog.DeleteBeneficiaryUseCase;
import io.github.tiaggofg.lumo.application.catalog.ListBeneficiariesUseCase;
import io.github.tiaggofg.lumo.application.catalog.UpdateBeneficiaryUseCase;
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

@Path("/api/v1/beneficiaries")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BeneficiaryResource {

    private final ListBeneficiariesUseCase listBeneficiariesUseCase;
    private final CreateBeneficiaryUseCase createBeneficiaryUseCase;
    private final UpdateBeneficiaryUseCase updateBeneficiaryUseCase;
    private final ChangeBeneficiaryStatusUseCase changeBeneficiaryStatusUseCase;
    private final DeleteBeneficiaryUseCase deleteBeneficiaryUseCase;

    @Inject
    public BeneficiaryResource(
            ListBeneficiariesUseCase listBeneficiariesUseCase,
            CreateBeneficiaryUseCase createBeneficiaryUseCase,
            UpdateBeneficiaryUseCase updateBeneficiaryUseCase,
            ChangeBeneficiaryStatusUseCase changeBeneficiaryStatusUseCase,
            DeleteBeneficiaryUseCase deleteBeneficiaryUseCase
    ) {
        this.listBeneficiariesUseCase = listBeneficiariesUseCase;
        this.createBeneficiaryUseCase = createBeneficiaryUseCase;
        this.updateBeneficiaryUseCase = updateBeneficiaryUseCase;
        this.changeBeneficiaryStatusUseCase = changeBeneficiaryStatusUseCase;
        this.deleteBeneficiaryUseCase = deleteBeneficiaryUseCase;
    }

    public record BeneficiaryRequest(@NotBlank String name) {
    }

    public record ChangeStatusRequest(@NotNull Boolean active) {
    }

    @GET
    public List<BeneficiaryOutput> list(@QueryParam("active") Boolean active) {
        return listBeneficiariesUseCase.execute(active);
    }

    @POST
    public Response create(@Valid BeneficiaryRequest request) {
        BeneficiaryOutput created = createBeneficiaryUseCase.execute(request.name());
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public BeneficiaryOutput update(@PathParam("id") UUID id, @Valid BeneficiaryRequest request) {
        return updateBeneficiaryUseCase.execute(id, request.name());
    }

    @PATCH
    @Path("/{id}/status")
    public BeneficiaryOutput changeStatus(@PathParam("id") UUID id, @Valid ChangeStatusRequest request) {
        return changeBeneficiaryStatusUseCase.execute(id, request.active());
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") UUID id) {
        deleteBeneficiaryUseCase.execute(id);
        return Response.noContent().build();
    }
}
