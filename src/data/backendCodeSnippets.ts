export const NODEJS_EXPRESS_CODE = `/**
 * ==============================================================
 * DUKAANKA TELEEFANNADA GACAN-KU-GALKA AH (USED PHONES)
 * BACKEND CONTROLLER: Node.js & Express & MySQL / PostgreSQL
 * Shuraakada: Zakariye & Shariif
 * ==============================================================
 */

const express = require('express');
const mysql = require('mysql2/promise'); // ama pg haddii aad isticmaalayso PostgreSQL
const app = express();

app.use(express.json());

// 1. Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'used_phones_db',
  waitForConnections: true,
  connectionLimit: 10,
});

/**
 * ENDPOINT 1: Diiwaangeli Teleefan Cusub (Register Phone)
 * POST /api/phones
 * Qofka keensaday (Zakariye ama Shariif) iyo inta uu ku qabtay (Lafaha)
 */
app.post('/api/phones', async (req, res) => {
  try {
    const {
      model,
      brand,
      imei,
      storage,
      phone_condition,
      partner_id,      // 1 = Zakariye, 2 = Shariif
      purchase_price,  // Qiimaha Lafaha (Tusaale $50 ama $80)
      purchase_date,
    } = req.body;

    if (!model || !partner_id || !purchase_price) {
      return res.status(400).json({ error: 'Fadlan buuxi Model, Qofka lafaha gashaday, iyo Qiimaha!' });
    }

    const query = \`
      INSERT INTO phones 
      (model, brand, imei, storage, phone_condition, partner_id, purchase_price, purchase_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IN_STOCK')
    \`;

    const [result] = await pool.execute(query, [
      model,
      brand || '',
      imei || null,
      storage || '128GB',
      phone_condition || 'grade_a',
      partner_id,
      purchase_price,
      purchase_date || new Date().toISOString().split('T')[0],
    ]);

    res.status(201).json({
      message: 'Teleefanka si guul leh ayaa loo diiwaangeliyay!',
      phoneId: result.insertId,
    });
  } catch (error) {
    console.error('Error registering phone:', error);
    res.status(500).json({ error: 'Khalad ayaa dhacay intii lagu guda jiray diiwaangelinta' });
  }
});

/**
 * ENDPOINT 2: Iibi Teleefan (Sell Phone & Calculate Profit)
 * POST /api/phones/:id/sell
 * Xisaabi faa'iidada guud iyo lafaha qofka u soo laabanaya
 */
app.post('/api/phones/:id/sell', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const phoneId = req.params.id;
    const { selling_price, customer_name, customer_phone, payment_method, notes } = req.body;

    // Soo hel xogta teleefanka
    const [phoneRows] = await connection.execute(
      'SELECT id, partner_id, purchase_price, status FROM phones WHERE id = ? FOR UPDATE',
      [phoneId]
    );

    if (phoneRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Teleefankan lama helin!' });
    }

    const phone = phoneRows[0];
    if (phone.status === 'SOLD') {
      await connection.rollback();
      return res.status(400).json({ error: 'Teleefankan mar hore ayaa la iibiyay!' });
    }

    const purchasePrice = parseFloat(phone.purchase_price);
    const sellingPrice = parseFloat(selling_price);
    const profit = sellingPrice - purchasePrice; // Faa'iidada teleefankan

    // 1. Beddel status-ka teleefanka una dhig SOLD
    await connection.execute(
      'UPDATE phones SET status = "SOLD" WHERE id = ?',
      [phoneId]
    );

    // 2. Geli jadwalka iibka (sales)
    const saleQuery = \`
      INSERT INTO sales 
      (phone_id, selling_price, sale_date, customer_name, customer_phone, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    \`;
    await connection.execute(saleQuery, [
      phoneId,
      sellingPrice,
      new Date().toISOString().split('T')[0],
      customer_name || 'Macaamiil Guud',
      customer_phone || '',
      payment_method || 'EVC_PLUS',
      notes || '',
    ]);

    await connection.commit();

    res.json({
      message: 'Teleefanka si guul leh ayaa loo iibiyay!',
      summary: {
        partnerId: phone.partner_id,
        partnerName: phone.partner_id === 1 ? 'Zakariye' : 'Shariif',
        returnedCapital: purchasePrice, // Lafaha qofka u soo laabtay
        sellingPrice: sellingPrice,
        profitGenerated: profit,        // Faa'iidada guud ee shirkadda ku biiraysa
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error selling phone:', error);
    res.status(500).json({ error: 'Khalad ayaa dhacay iibinta teleefanka' });
  } finally {
    connection.release();
  }
});

/**
 * ENDPOINT 3: DULMARKA GUUD EE XISAABTA (MAIN ACCOUNTING SUMMARY)
 * GET /api/accounting/summary
 * Xisaabiya:
 *  - Total Lafaha Zakariye
 *  - Total Lafaha Shariif
 *  - Total Lafaha Guud ee Dukaanka
 *  - Faa'iidada Guud (Total Profit)
 */
app.get('/api/accounting/summary', async (req, res) => {
  try {
    // 1. Xisaabi Lafaha ZAKARIYE (ID = 1)
    const [zakariyeRows] = await pool.execute(\`
      SELECT 
        COALESCE(SUM(purchase_price), 0) AS total_capital,
        COALESCE(SUM(CASE WHEN status = 'IN_STOCK' THEN purchase_price ELSE 0 END), 0) AS in_stock_capital,
        COALESCE(SUM(CASE WHEN status = 'SOLD' THEN purchase_price ELSE 0 END), 0) AS sold_capital,
        COUNT(*) AS total_phones,
        SUM(CASE WHEN status = 'IN_STOCK' THEN 1 ELSE 0 END) AS in_stock_count,
        SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END) AS sold_count
      FROM phones
      WHERE partner_id = 1
    \`);

    // 2. Xisaabi Lafaha SHARIIF (ID = 2)
    const [shariifRows] = await pool.execute(\`
      SELECT 
        COALESCE(SUM(purchase_price), 0) AS total_capital,
        COALESCE(SUM(CASE WHEN status = 'IN_STOCK' THEN purchase_price ELSE 0 END), 0) AS in_stock_capital,
        COALESCE(SUM(CASE WHEN status = 'SOLD' THEN purchase_price ELSE 0 END), 0) AS sold_capital,
        COUNT(*) AS total_phones,
        SUM(CASE WHEN status = 'IN_STOCK' THEN 1 ELSE 0 END) AS in_stock_count,
        SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END) AS sold_count
      FROM phones
      WHERE partner_id = 2
    \`);

    // 3. Xisaabi FAA'IIDADA GUUD IYO WADARTA DUKAANKA
    const [profitRows] = await pool.execute(\`
      SELECT 
        COALESCE(SUM(s.selling_price), 0) AS total_revenue,
        COALESCE(SUM(p.purchase_price), 0) AS total_sold_capital,
        COALESCE(SUM(s.selling_price - p.purchase_price), 0) AS total_profit
      FROM sales s
      INNER JOIN phones p ON s.phone_id = p.id
    \`);

    // 4. Wadarta Guud ee Lafaha Dukaanka (All Inventory)
    const [totalCapitalRows] = await pool.execute(\`
      SELECT 
        COALESCE(SUM(purchase_price), 0) AS total_capital_all,
        COALESCE(SUM(CASE WHEN status = 'IN_STOCK' THEN purchase_price ELSE 0 END), 0) AS total_capital_in_stock
      FROM phones
    \`);

    const z = zakariyeRows[0];
    const s = shariifRows[0];
    const p = profitRows[0];
    const t = totalCapitalRows[0];

    const result = {
      // 1. ZAKARIYE
      zakariye: {
        partnerName: 'Zakariye',
        totalLafaha: parseFloat(z.total_capital),
        lafahaKaydkaKuJira: parseFloat(z.in_stock_capital),
        lafahaIibsamaySooLaabtay: parseFloat(z.sold_capital),
        teleefannadaKaydka: parseInt(z.in_stock_count || 0),
        teleefannadaIibsamay: parseInt(z.sold_count || 0),
      },
      // 2. SHARIIF
      shariif: {
        partnerName: 'Shariif',
        totalLafaha: parseFloat(s.total_capital),
        lafahaKaydkaKuJira: parseFloat(s.in_stock_capital),
        lafahaIibsamaySooLaabtay: parseFloat(s.sold_capital),
        teleefannadaKaydka: parseInt(s.in_stock_count || 0),
        teleefannadaIibsamay: parseInt(s.sold_count || 0),
      },
      // 3. WADARTA LAFAHA GUUD
      shopCapital: {
        totalLafahaGuud: parseFloat(t.total_capital_all),
        totalLafahaKaydkaHadda: parseFloat(t.total_capital_in_stock),
      },
      // 4. FAA'IIDADA GUUD (Total Profit)
      profit: {
        wadartaIibkaGuud: parseFloat(p.total_revenue),
        wadartaLafahaIibsamay: parseFloat(p.total_sold_capital),
        faaiidadaGuudTotal: parseFloat(p.total_profit), // Wadaagga Labadooda
      },
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Khalad ayaa ku yimid xisaabinta xogta' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Backend-ka wuxuu ku shaqaynayaa port \${PORT}\`);
});
`;

export const PHP_CODE = `<?php
/**
 * ==============================================================
 * DUKAANKA TELEEFANNADA GACAN-KU-GALKA AH (USED PHONES)
 * BACKEND SCRIPT: PHP & PDO & MySQL
 * Shuraakada: Zakariye & Shariif
 * ==============================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$dbHost = 'localhost';
$dbName = 'used_phones_db';
$dbUser = 'root';
$dbPass = '';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? 'summary';

// -------------------------------------------------------------
// 1. SUMMARY ACTION: Xisaabi Lafaha Zakariye, Shariif, & Faa'iido
// -------------------------------------------------------------
if ($action === 'summary') {
    // 1. Lafaha Zakariye (ID = 1)
    $stmtZ = $pdo->prepare("
        SELECT 
            COALESCE(SUM(purchase_price), 0) AS total_capital,
            COALESCE(SUM(CASE WHEN status = 'IN_STOCK' THEN purchase_price ELSE 0 END), 0) AS in_stock_capital,
            COALESCE(SUM(CASE WHEN status = 'SOLD' THEN purchase_price ELSE 0 END), 0) AS sold_capital
        FROM phones WHERE partner_id = 1
    ");
    $stmtZ->execute();
    $zakariye = $stmtZ->fetch();

    // 2. Lafaha Shariif (ID = 2)
    $stmtS = $pdo->prepare("
        SELECT 
            COALESCE(SUM(purchase_price), 0) AS total_capital,
            COALESCE(SUM(CASE WHEN status = 'IN_STOCK' THEN purchase_price ELSE 0 END), 0) AS in_stock_capital,
            COALESCE(SUM(CASE WHEN status = 'SOLD' THEN purchase_price ELSE 0 END), 0) AS sold_capital
        FROM phones WHERE partner_id = 2
    ");
    $stmtS->execute();
    $shariif = $stmtS->fetch();

    // 3. Faa'iidada Guud (Total Profit)
    $stmtP = $pdo->query("
        SELECT 
            COALESCE(SUM(s.selling_price), 0) AS total_revenue,
            COALESCE(SUM(s.selling_price - p.purchase_price), 0) AS total_profit
        FROM sales s
        INNER JOIN phones p ON s.phone_id = p.id
    ");
    $profit = $stmtP->fetch();

    // 4. Wadarta Lafaha Guud
    $stmtT = $pdo->query("
        SELECT 
            COALESCE(SUM(purchase_price), 0) AS total_all_capital,
            COALESCE(SUM(CASE WHEN status = 'IN_STOCK' THEN purchase_price ELSE 0 END), 0) AS stock_capital
        FROM phones
    ");
    $total = $stmtT->fetch();

    echo json_encode([
        'status' => 'success',
        'data' => [
            'zakariye' => [
                'name' => 'Zakariye',
                'total_capital' => floatval($zakariye['total_capital']),
                'in_stock_capital' => floatval($zakariye['in_stock_capital']),
                'returned_capital' => floatval($zakariye['sold_capital']),
            ],
            'shariif' => [
                'name' => 'Shariif',
                'total_capital' => floatval($shariif['total_capital']),
                'in_stock_capital' => floatval($shariif['in_stock_capital']),
                'returned_capital' => floatval($shariif['sold_capital']),
            ],
            'shop_totals' => [
                'total_capital_all' => floatval($total['total_all_capital']),
                'active_inventory_capital' => floatval($total['stock_capital']),
            ],
            'profit' => [
                'total_revenue' => floatval($profit['total_revenue']),
                'total_shared_profit' => floatval($profit['total_profit']), // Faa'iidada Guud
            ]
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

// -------------------------------------------------------------
// 2. DIIWAANGELIN TELEEFAN CUSUB (Register Phone)
// -------------------------------------------------------------
if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $stmt = $pdo->prepare("
        INSERT INTO phones (model, brand, imei, storage, phone_condition, partner_id, purchase_price, purchase_date, status)
        VALUES (:model, :brand, :imei, :storage, :condition, :partner_id, :purchase_price, :purchase_date, 'IN_STOCK')
    ");

    $stmt->execute([
        ':model' => $data['model'],
        ':brand' => $data['brand'] ?? 'Unknown',
        ':imei' => $data['imei'] ?? null,
        ':storage' => $data['storage'] ?? '128GB',
        ':condition' => $data['condition'] ?? 'grade_a',
        ':partner_id' => $data['partner_id'], // 1 ama 2
        ':purchase_price' => $data['purchase_price'], // Qiimaha Lafaha
        ':purchase_date' => $data['purchase_date'] ?? date('Y-m-d'),
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Teleefanka waa la diiwaangeliyay!',
        'id' => $pdo->lastInsertId(),
    ]);
    exit;
}
?>`;
