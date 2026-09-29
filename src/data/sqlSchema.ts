export const MYSQL_SCHEMA = `-- ==============================================================
-- ACCOUNTING & PHONE TRADING MANAGEMENT SYSTEM
-- PARTNERSHIP: ZAKARIYE & SHARIIF
-- DATABASE SCHEMA: SQLite / PostgreSQL / MySQL Compatible
-- ==============================================================

-- 1. Jadwalka Shuraakada (Partners)
CREATE TABLE IF NOT EXISTS partners (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,       -- 'Zakariye', 'Shariif'
    avatar_color VARCHAR(20) NOT NULL,
    phone VARCHAR(30) NULL,
    email VARCHAR(100) NULL,
    role VARCHAR(50) NULL,
    pin VARCHAR(10) NOT NULL DEFAULT '1234',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Labada Shuraako
INSERT INTO partners (id, name, avatar_color, phone, email, role, pin) VALUES 
(1, 'Zakariye', '#2563EB', '+252 61 500 0001', 'zakariye@phonehub.so', 'Partner & Capital Owner', '1234'),
(2, 'Shariif', '#059669', '+252 61 500 0002', 'shariif@phonehub.so', 'Partner & Capital Owner', '5678')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;

-- 2. Jadwalka Teleefannada (Phone Inventory & Ownership Model)
-- XEERKA:
-- 1. acquired_by_partner_id = Qofka teleefanka keenay/helay
-- 2. paid_by_partner_id = Qofka dhab ahaan lacagta bixiyay
-- 3. capital_owner_partner_id = Qofka leh lafaha maalgashiga (wuxuu raacaa paid_by)
CREATE TABLE IF NOT EXISTS phones (
    id VARCHAR(30) PRIMARY KEY,               -- e.g. 'PH-001'
    imei VARCHAR(30) NOT NULL UNIQUE,         -- Lambarka IMEI
    brand VARCHAR(60) NOT NULL,               -- Apple, Samsung, Xiaomi, Google
    model VARCHAR(150) NOT NULL,              -- iPhone 13, Galaxy S21
    storage VARCHAR(30) NOT NULL DEFAULT '128GB',
    color VARCHAR(50) NULL,
    condition VARCHAR(50) NOT NULL DEFAULT 'Grade A (Nadiif)',
    purchase_price DECIMAL(10,2) NOT NULL,    -- Qiimaha Lafaha (Capital invested)
    acquired_by_partner_id INT NOT NULL REFERENCES partners(id),
    paid_by_partner_id INT NOT NULL REFERENCES partners(id),
    capital_owner_partner_id INT NOT NULL REFERENCES partners(id),
    purchase_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK(status IN ('In Stock', 'Sold', 'Returned')) DEFAULT 'In Stock',
    sale_price DECIMAL(10,2) NULL,            -- Qiimaha lagu iibiyay
    sale_date DATE NULL,
    customer_name VARCHAR(120) NULL,
    customer_phone VARCHAR(30) NULL,
    payment_method VARCHAR(50) DEFAULT 'EVC Plus',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- 3. Jadwalka Iibka (Sales Record)
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(30) PRIMARY KEY,               -- e.g. 'SALE-PH-001'
    phone_id VARCHAR(30) NOT NULL UNIQUE REFERENCES phones(id),
    phone_model VARCHAR(150) NOT NULL,
    imei VARCHAR(30) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    profit DECIMAL(10,2) NOT NULL,
    partner_id INT NOT NULL REFERENCES partners(id), -- Capital Owner
    acquired_by_partner_id INT NOT NULL REFERENCES partners(id),
    paid_by_partner_id INT NOT NULL REFERENCES partners(id),
    sale_date DATE NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30) NULL,
    payment_method VARCHAR(50) DEFAULT 'EVC Plus',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Jadwalka Kharashaadka Guud ee Dukaanka (Business Expenses)
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(30) PRIMARY KEY,               -- e.g. 'EXP-001'
    category VARCHAR(60) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    recorded_by VARCHAR(50) DEFAULT 'Wadaag',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Jadwalka Kala Bixidda Lacagta ee Shuraakada (Partner Withdrawals)
CREATE TABLE IF NOT EXISTS withdrawals (
    id VARCHAR(30) PRIMARY KEY,               -- e.g. 'WDR-001'
    partner_id INT NOT NULL REFERENCES partners(id),
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Diiwaanka Xisaabeedka ee Guud (Transactions Ledger)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(30) PRIMARY KEY,               -- e.g. 'TXN-001'
    type VARCHAR(50) NOT NULL,
    partner_id INT NULL REFERENCES partners(id),
    acquired_by_partner_id INT NULL REFERENCES partners(id),
    paid_by_partner_id INT NULL REFERENCES partners(id),
    phone_id VARCHAR(30) NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    reference VARCHAR(50) NOT NULL,
    impact VARCHAR(20) NOT NULL,              -- 'CAPITAL_IN', 'INFLOW', 'OUTFLOW', 'CAPITAL_OUT'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phones_status ON phones(status);
CREATE INDEX IF NOT EXISTS idx_phones_paid_by ON phones(paid_by_partner_id);
CREATE INDEX IF NOT EXISTS idx_phones_acquired_by ON phones(acquired_by_partner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
`;

export const SQL_QUERIES = `-- ==============================================================
-- FINANCIAL CALCULATION QUERIES (RUN DIRECTLY IN SQLITE / POSTGRES)
-- ==============================================================

-- 1. Xisaabinta Lafaha Guud (Total Capital Funded by Partner)
-- FIIRO GAAR AH: Waxaa lagu xisaabiyaa paid_by_partner_id oo keliya!
SELECT 
    p.id AS partner_id,
    p.name AS partner_name,
    COUNT(CASE WHEN ph.acquired_by_partner_id = p.id THEN 1 END) AS phones_acquired,
    COUNT(CASE WHEN ph.paid_by_partner_id = p.id THEN 1 END) AS phones_funded,
    COALESCE(SUM(CASE WHEN ph.paid_by_partner_id = p.id AND ph.status = 'In Stock' THEN ph.purchase_price END), 0) AS capital_in_stock,
    COALESCE(SUM(CASE WHEN ph.paid_by_partner_id = p.id AND ph.status = 'Sold' THEN ph.purchase_price END), 0) AS capital_sold,
    COALESCE(SUM(CASE WHEN ph.paid_by_partner_id = p.id THEN ph.purchase_price END), 0) AS total_capital_funded
FROM partners p
LEFT JOIN phones ph ON p.id = ph.paid_by_partner_id OR p.id = ph.acquired_by_partner_id
GROUP BY p.id, p.name;

-- 2. Xisaabinta Iibka iyo Faa'iidada Wadaagga ah ee Ganacsiga
SELECT 
    COUNT(*) AS total_phones_sold,
    SUM(sale_price) AS total_sales_revenue,
    SUM(purchase_price) AS total_cost_of_goods_sold,
    SUM(sale_price - purchase_price) AS gross_profit
FROM phones
WHERE status = 'Sold';

-- 3. Xisaabinta Kharashaadka Guud
SELECT 
    COALESCE(SUM(amount), 0) AS total_expenses
FROM expenses;

-- 4. Xisaabinta Faa'iidada Saafiga ah (Net Profit)
SELECT 
    COALESCE(SUM(ph.sale_price - ph.purchase_price), 0) - 
    (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS net_profit
FROM phones ph
WHERE ph.status = 'Sold';
`;
