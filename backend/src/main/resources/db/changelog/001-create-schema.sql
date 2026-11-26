--liquibase formatted sql

--changeset lumo:001-create-schema
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    type VARCHAR(16) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    color VARCHAR(7),
    icon VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_categories_name_type ON categories (LOWER(name), type);

CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_beneficiaries_name ON beneficiaries (LOWER(name));

CREATE TABLE monthly_budgets (
    id UUID PRIMARY KEY,
    competence_month VARCHAR(7) NOT NULL CHECK (competence_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_monthly_budgets_competence_month UNIQUE (competence_month)
);

CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY,
    type VARCHAR(16) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    description VARCHAR(140) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    amount_type VARCHAR(16) NOT NULL CHECK (amount_type IN ('FIXED', 'ESTIMATED')),
    recurrence_type VARCHAR(16) NOT NULL CHECK (recurrence_type IN ('INDEFINITE', 'FIXED_TERM', 'INSTALLMENT')),
    start_month VARCHAR(7) NOT NULL CHECK (start_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    end_month VARCHAR(7) CHECK (end_month IS NULL OR end_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    total_installments INTEGER CHECK (total_installments IS NULL OR total_installments >= 2),
    starting_installment INTEGER CHECK (starting_installment IS NULL OR starting_installment >= 1),
    due_day INTEGER CHECK (due_day IS NULL OR due_day BETWEEN 1 AND 31),
    category_id UUID REFERENCES categories(id),
    beneficiary_id UUID REFERENCES beneficiaries(id),
    notes VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    has_generated_transactions BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_transactions_active ON recurring_transactions (active, description);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    monthly_budget_id UUID NOT NULL REFERENCES monthly_budgets(id),
    type VARCHAR(16) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    description VARCHAR(140) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(16) NOT NULL CHECK (status IN ('ESTIMATED', 'PENDING', 'SETTLED')),
    due_date DATE,
    payment_date DATE,
    notes VARCHAR(500),
    category_id UUID REFERENCES categories(id),
    beneficiary_id UUID REFERENCES beneficiaries(id),
    source_recurring_transaction_id UUID REFERENCES recurring_transactions(id),
    installment_current INTEGER,
    installment_total INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_transactions_budget_recurring
    ON transactions (monthly_budget_id, source_recurring_transaction_id)
    WHERE source_recurring_transaction_id IS NOT NULL;

CREATE INDEX idx_transactions_budget_type_status
    ON transactions (monthly_budget_id, type, status);

CREATE INDEX idx_transactions_budget_order
    ON transactions (monthly_budget_id, due_date ASC NULLS LAST, created_at ASC);

CREATE TABLE recurring_occurrence_exclusions (
    monthly_budget_id UUID NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
    recurring_transaction_id UUID NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (monthly_budget_id, recurring_transaction_id)
);
