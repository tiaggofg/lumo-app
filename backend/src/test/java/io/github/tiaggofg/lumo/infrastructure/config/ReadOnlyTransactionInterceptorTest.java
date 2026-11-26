package io.github.tiaggofg.lumo.infrastructure.config;

import jakarta.enterprise.context.ContextNotActiveException;
import jakarta.interceptor.InvocationContext;
import jakarta.persistence.EntityManager;
import org.hibernate.FlushMode;
import org.hibernate.Session;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReadOnlyTransactionInterceptorTest {

    @Test
    void shouldProceedDirectlyWhenEntityManagerIsNull() throws Exception {
        ReadOnlyTransactionInterceptor interceptor = new ReadOnlyTransactionInterceptor();
        InvocationContext ctx = mock(InvocationContext.class);
        when(ctx.proceed()).thenReturn("ok");

        assertThat(interceptor.aroundInvoke(ctx)).isEqualTo("ok");
    }

    @Test
    void shouldProceedDirectlyWhenEntityManagerIsClosed() throws Exception {
        ReadOnlyTransactionInterceptor interceptor = new ReadOnlyTransactionInterceptor();
        interceptor.entityManager = mock(EntityManager.class);
        when(interceptor.entityManager.isOpen()).thenReturn(false);
        InvocationContext ctx = mock(InvocationContext.class);
        when(ctx.proceed()).thenReturn("closed");

        assertThat(interceptor.aroundInvoke(ctx)).isEqualTo("closed");
    }

    @Test
    void shouldProceedDirectlyWhenContextIsNotActive() throws Exception {
        ReadOnlyTransactionInterceptor interceptor = new ReadOnlyTransactionInterceptor();
        interceptor.entityManager = mock(EntityManager.class);
        when(interceptor.entityManager.isOpen()).thenThrow(new ContextNotActiveException());
        InvocationContext ctx = mock(InvocationContext.class);
        when(ctx.proceed()).thenReturn("no-ctx");

        assertThat(interceptor.aroundInvoke(ctx)).isEqualTo("no-ctx");
    }

    @Test
    void shouldSetManualFlushAndReadOnlyThenRestore() throws Exception {
        ReadOnlyTransactionInterceptor interceptor = new ReadOnlyTransactionInterceptor();
        EntityManager em = mock(EntityManager.class);
        Session session = mock(Session.class);
        InvocationContext ctx = mock(InvocationContext.class);

        when(em.isOpen()).thenReturn(true);
        when(em.unwrap(Session.class)).thenReturn(session);
        when(session.getHibernateFlushMode()).thenReturn(FlushMode.AUTO);
        when(session.isDefaultReadOnly()).thenReturn(false);
        when(ctx.proceed()).thenReturn("result");

        interceptor.entityManager = em;
        assertThat(interceptor.aroundInvoke(ctx)).isEqualTo("result");

        verify(session).setHibernateFlushMode(FlushMode.MANUAL);
        verify(session).setDefaultReadOnly(true);
        verify(session).setDefaultReadOnly(false);
        verify(session).setHibernateFlushMode(FlushMode.AUTO);
    }
}
