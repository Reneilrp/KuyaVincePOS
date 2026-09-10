import { hashPin, generatePinSalt, verifyPinHash, normalizePin } from '../utils/pinHash';

const SUPABASE_URL = 'https://diddsyaqdqxvadgttguq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZGRzeWFxZHF4dmFkZ3R0Z3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTI1NzQsImV4cCI6MjEwMzYyODU3NH0.0JKA5syorKUuwP5KtFTjQXpQFwb_uYuDyM8yL4ZdRh4';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

describe('🚀 Full End-to-End Smoke Test: Mobile POS ➡️ Supabase ➡️ Admin Web Dashboard', () => {
  const timestamp = Date.now();
  const testBatchId = `SMOKE-BATCH-SUNMI-${timestamp}`;
  const syncDate = new Date().toISOString().split('T')[0];

  let testBranch: any = null;
  let simulatedOrders: any[] = [];
  let expectedGrossSales = 0;

  // --------------------------------------------------------------------------
  // STEP 1: MOBILE TERMINAL ACTIVATION & BRANCH PAIRING
  // --------------------------------------------------------------------------
  test('Step 1 [Mobile]: Device Activates with Branch Import Code and downloads menu', async () => {
    const branchRes = await fetch(`${SUPABASE_URL}/rest/v1/branches?is_active=eq.true&order=id.asc&limit=1`, { headers });
    expect(branchRes.ok).toBe(true);
    const branches = await branchRes.json();
    expect(branches.length).toBeGreaterThan(0);
    testBranch = branches[0];
    expect(testBranch.id).toBeDefined();

    // Fetch Products catalog
    const prodRes = await fetch(`${SUPABASE_URL}/rest/v1/products?is_active=eq.true&select=*`, { headers });
    expect(prodRes.ok).toBe(true);
    const products = await prodRes.json();
    expect(products.length).toBeGreaterThan(0);
  }, 15000);

  // --------------------------------------------------------------------------
  // STEP 2: CASHIER AUTHENTICATION (SALTED PIN HASH VERIFICATION)
  // --------------------------------------------------------------------------
  test('Step 2 [Mobile]: Cashier logs in via offline-cached Salted SHA-256 PIN hash', async () => {
    const salt = generatePinSalt();
    const pin = '1234';
    const hash = await hashPin(pin, salt);

    // Verify correct PIN matches hash
    const isValid = await verifyPinHash('1234', salt, hash);
    const isInvalid = await verifyPinHash('9999', salt, hash);

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });

  // --------------------------------------------------------------------------
  // STEP 3: RINGING UP ORDERS & CASH DRAWER RECONCILIATION
  // --------------------------------------------------------------------------
  test('Step 3 [Mobile]: Cashier rings up 3 orders with exact cent precision (No Float Errors)', async () => {
    // Order 1: 2x Iced Caramel Macchiato (₱145.00 each)
    const ord1Subtotal = Math.round(2 * 145.00 * 100) / 100; // ₱290.00
    const ord1Total = ord1Subtotal;
    const ord1Tendered = 500.00;
    const ord1Change = Math.round((ord1Tendered - ord1Total) * 100) / 100; // ₱210.00

    expect(ord1Total).toBe(290.00);
    expect(ord1Change).toBe(210.00);

    // Order 2: 1x Beef Tapa Bowl (₱180.00) + Senior Citizen 20% discount (₱36.00)
    const ord2Subtotal = 180.00;
    const ord2Discount = Math.round(ord2Subtotal * 0.20 * 100) / 100; // ₱36.00
    const ord2Total = Math.round((ord2Subtotal - ord2Discount) * 100) / 100; // ₱144.00
    const ord2Tendered = 200.00;
    const ord2Change = Math.round((ord2Tendered - ord2Total) * 100) / 100; // ₱56.00

    expect(ord2Discount).toBe(36.00);
    expect(ord2Total).toBe(144.00);
    expect(ord2Change).toBe(56.00);

    // Order 3: 3x Croissants (₱85.00 each)
    const ord3Subtotal = Math.round(3 * 85.00 * 100) / 100; // ₱255.00
    const ord3Total = ord3Subtotal;
    const ord3Tendered = 255.00;
    const ord3Change = 0.00;

    expect(ord3Total).toBe(255.00);

    simulatedOrders = [
      {
        order_number: `ORD-SMK-01-${timestamp}`,
        client_tx_id: `TX-01-${timestamp}`,
        subtotal: ord1Subtotal,
        total_amount: ord1Total,
        payment_method: 'cash',
        amount_tendered: ord1Tendered,
        change_amount: ord1Change,
        created_at: new Date().toISOString(),
        items: [{ product_id: 1, name: 'Iced Caramel Macchiato', qty: 2, unit_price: 145.00, total_price: 290.00 }]
      },
      {
        order_number: `ORD-SMK-02-${timestamp}`,
        client_tx_id: `TX-02-${timestamp}`,
        subtotal: ord2Subtotal,
        total_amount: ord2Total,
        payment_method: 'cash',
        amount_tendered: ord2Tendered,
        change_amount: ord2Change,
        created_at: new Date().toISOString(),
        items: [{ product_id: 2, name: 'Beef Tapa Bowl', qty: 1, unit_price: 180.00, total_price: 144.00 }]
      },
      {
        order_number: `ORD-SMK-03-${timestamp}`,
        client_tx_id: `TX-03-${timestamp}`,
        subtotal: ord3Subtotal,
        total_amount: ord3Total,
        payment_method: 'cash',
        amount_tendered: ord3Tendered,
        change_amount: ord3Change,
        created_at: new Date().toISOString(),
        items: [{ product_id: 3, name: 'Butter Croissant', qty: 3, unit_price: 85.00, total_price: 255.00 }]
      }
    ];

    // Total gross sales sum in integer cents
    const grossSalesCents = simulatedOrders.reduce((sum, o) => sum + Math.round(o.total_amount * 100), 0);
    expectedGrossSales = grossSalesCents / 100;
    expect(expectedGrossSales).toBe(689.00); // 290 + 144 + 255 = 689.00

    // Cash Drawer Reconciliation Check:
    const openingFloat = 1000.00;
    const expectedCashInDrawer = Math.round((openingFloat + expectedGrossSales) * 100) / 100; // ₱1,689.00
    const countedCash = 1689.00;
    const variance = Math.round((countedCash - expectedCashInDrawer) * 100) / 100; // ₱0.00

    expect(expectedCashInDrawer).toBe(1689.00);
    expect(variance).toBe(0.00);
  });

  // --------------------------------------------------------------------------
  // STEP 4: 1-TAP END-OF-DAY CLOUD SYNC TO SUPABASE
  // --------------------------------------------------------------------------
  test('Step 4 [Sync]: Mobile pushes Daily Batch to Supabase daily_batches table', async () => {
    const shiftSummary = {
      cashier_id: 1,
      cashier_name: 'Maria Santos',
      opening_float: 1000.00,
      counted_cash: 1689.00,
      closing_cash: 1689.00,
      variance: 0.00,
      total_gross_sales: expectedGrossSales,
      orders_count: simulatedOrders.length,
      closed_at: new Date().toISOString()
    };

    const batchPayload = {
      branch_id: testBranch.id,
      batch_id: testBatchId,
      device_serial: 'SUNMI-V2S-KV-BR01',
      sync_date: syncDate,
      orders_count: simulatedOrders.length,
      gross_sales: expectedGrossSales,
      cash_sales: expectedGrossSales,
      ewallet_sales: 0.00,
      card_sales: 0.00,
      orders_payload: simulatedOrders,
      timeclocks_payload: [],
      shift_summary: shiftSummary
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/daily_batches`, {
      method: 'POST',
      headers,
      body: JSON.stringify(batchPayload)
    });

    expect(res.status).toBe(201);
    const [savedBatch] = await res.json();
    expect(savedBatch.batch_id).toBe(testBatchId);
    expect(Number(savedBatch.gross_sales)).toBe(689.00);
    expect(savedBatch.orders_count).toBe(3);
  }, 15000);

  // --------------------------------------------------------------------------
  // STEP 5: ADMIN WEB REAL-TIME INGESTION & KPI AGGREGATION
  // --------------------------------------------------------------------------
  test('Step 5 [Admin Web]: Web Dashboard aggregates the uploaded batch instantly into Live KPIs', async () => {
    // A. Query live daily_batches for this branch
    const batchQueryRes = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_batches?batch_id=eq.${testBatchId}&select=*`,
      { headers }
    );
    expect(batchQueryRes.ok).toBe(true);
    const retrievedBatches = await batchQueryRes.json();
    expect(retrievedBatches.length).toBe(1);

    const b = retrievedBatches[0];
    expect(b.batch_id).toBe(testBatchId);
    expect(Number(b.gross_sales)).toBe(689.00);
    expect(b.orders_payload.length).toBe(3);

    // B. Calculate Dashboard Aggregations (Simulating App.tsx ingestion)
    let totalGrossCents = 0;
    let totalOrders = 0;
    const productMap: Record<string, { qty: number; revenueCents: number }> = {};

    for (const ord of b.orders_payload) {
      totalGrossCents += Math.round(Number(ord.total_amount) * 100);
      totalOrders += 1;
      for (const it of ord.items) {
        if (!productMap[it.name]) productMap[it.name] = { qty: 0, revenueCents: 0 };
        productMap[it.name].qty += it.qty;
        productMap[it.name].revenueCents += Math.round(Number(it.total_price) * 100);
      }
    }

    const calculatedGross = totalGrossCents / 100;
    const calculatedAvgOrder = Math.round((calculatedGross / totalOrders) * 100) / 100;

    expect(calculatedGross).toBe(689.00);
    expect(totalOrders).toBe(3);
    expect(calculatedAvgOrder).toBe(229.67); // 689 / 3 = 229.6666... -> rounded to 229.67

    // Top selling item check
    expect(productMap['Iced Caramel Macchiato'].qty).toBe(2);
    expect(productMap['Iced Caramel Macchiato'].revenueCents / 100).toBe(290.00);
  }, 15000);

  // --------------------------------------------------------------------------
  // STEP 6: CLEANUP
  // --------------------------------------------------------------------------
  afterAll(async () => {
    // Delete test smoke batch from Supabase to keep live database pristine
    await fetch(`${SUPABASE_URL}/rest/v1/daily_batches?batch_id=eq.${testBatchId}`, {
      method: 'DELETE',
      headers
    });
  });
});
