package io.github.tiaggofg.lumo.infrastructure.config;

import io.github.tiaggofg.lumo.application.stereotype.ReadOnlyTransaction;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ContextNotActiveException;
import jakarta.inject.Inject;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;
import jakarta.persistence.EntityManager;
import org.hibernate.FlushMode;
import org.hibernate.Session;

@ReadOnlyTransaction
@Interceptor
@Priority(Interceptor.Priority.APPLICATION)
public class ReadOnlyTransactionInterceptor {

    @Inject
    EntityManager entityManager;

    @AroundInvoke
    public Object aroundInvoke(InvocationContext context) throws Exception {
        if (entityManager == null) {
            return context.proceed();
        }

        final Session session;
        final FlushMode previousFlushMode;
        final boolean previousReadOnly;
        try {
            if (!entityManager.isOpen()) {
                return context.proceed();
            }
            session = entityManager.unwrap(Session.class);
            previousFlushMode = session.getHibernateFlushMode();
            previousReadOnly = session.isDefaultReadOnly();
        } catch (ContextNotActiveException ignored) {
            return context.proceed();
        }

        try {
            session.setHibernateFlushMode(FlushMode.MANUAL);
            session.setDefaultReadOnly(true);
            return context.proceed();
        } finally {
            session.setDefaultReadOnly(previousReadOnly);
            session.setHibernateFlushMode(previousFlushMode);
        }
    }
}
