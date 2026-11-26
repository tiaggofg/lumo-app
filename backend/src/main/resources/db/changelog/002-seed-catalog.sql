--liquibase formatted sql

--changeset lumo:002-seed-catalog
INSERT INTO categories (id, name, type, color, icon, active) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Moradia', 'EXPENSE', '#6366F1', 'pi pi-home', TRUE),
    ('10000000-0000-0000-0000-000000000002', 'Contas Básicas', 'EXPENSE', '#0EA5E9', 'pi pi-bolt', TRUE),
    ('10000000-0000-0000-0000-000000000003', 'Cartão de Crédito', 'EXPENSE', '#8B5CF6', 'pi pi-credit-card', TRUE),
    ('10000000-0000-0000-0000-000000000004', 'Saúde', 'EXPENSE', '#EF4444', 'pi pi-heart', TRUE),
    ('10000000-0000-0000-0000-000000000005', 'Educação', 'EXPENSE', '#F59E0B', 'pi pi-book', TRUE),
    ('10000000-0000-0000-0000-000000000006', 'Alimentação', 'EXPENSE', '#10B981', 'pi pi-shopping-cart', TRUE),
    ('10000000-0000-0000-0000-000000000007', 'Transporte', 'EXPENSE', '#3B82F6', 'pi pi-car', TRUE),
    ('10000000-0000-0000-0000-000000000008', 'Lazer', 'EXPENSE', '#EC4899', 'pi pi-star', TRUE),
    ('10000000-0000-0000-0000-000000000009', 'Outros', 'EXPENSE', '#64748B', 'pi pi-tag', TRUE),
    ('10000000-0000-0000-0000-000000000010', 'Salário', 'INCOME', '#22C55E', 'pi pi-wallet', TRUE),
    ('10000000-0000-0000-0000-000000000011', 'Renda Extra', 'INCOME', '#14B8A6', 'pi pi-plus-circle', TRUE),
    ('10000000-0000-0000-0000-000000000012', 'Outros', 'INCOME', '#64748B', 'pi pi-tag', TRUE);

INSERT INTO beneficiaries (id, name, active) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Família', TRUE);
