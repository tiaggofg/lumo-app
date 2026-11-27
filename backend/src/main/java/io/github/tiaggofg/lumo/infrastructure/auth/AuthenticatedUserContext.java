package io.github.tiaggofg.lumo.infrastructure.auth;

import jakarta.enterprise.context.RequestScoped;

import java.util.UUID;

@RequestScoped
public class AuthenticatedUserContext {

    private UUID userId;
    private String email;

    public void setUser(UUID userId, String email) {
        this.userId = userId;
        this.email = email;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public boolean isAuthenticated() {
        return userId != null;
    }
}
