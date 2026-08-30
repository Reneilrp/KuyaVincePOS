import { hashPin, generatePinSalt, verifyPinHash } from '../utils/pinHash';

const SUPABASE_URL = 'https://diddsyaqdqxvadgttguq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZGRzeWFxZHF4dmFkZ3R0Z3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTI1NzQsImV4cCI6MjEwMzYyODU3NH0.0JKA5syorKUuwP5KtFTjQXpQFwb_uYuDyM8yL4ZdRh4';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

describe('Live Supabase Full-Stack Database Verification', () => {
  const timestamp = Date.now();

  // 1. Test Branches CRUD
  test('1. Branches: Create, Read, and Update Branch with Import Code', async () => {
    const curBranches = await (await fetch(`${SUPABASE_URL}/rest/v1/branches?select=*`, { headers })).json();
    const nextBranchId = Math.max(...curBranches.map((b: any) => Number(b.id)), 0) + 1;
    const testBranchCode = `BR-TEST-${timestamp.toString().slice(-4)}`;
    const testImportCode = `KV-T${timestamp.toString().slice(-3)}`;

    // A. Insert Branch
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/branches`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: nextBranchId,
        name: 'Test Branch Zamboanga',
        code: testBranchCode,
        import_code: testImportCode,
        address: 'Mayor Jaldon St, Zamboanga City',
        phone: '+63 917 111 2222',
        is_active: true
      })
    });
    expect(createRes.status).toBe(201);
    const [createdBranch] = await createRes.json();
    expect(createdBranch.code).toBe(testBranchCode);
    expect(createdBranch.import_code).toBe(testImportCode);

    // B. Read Branch by Import Code (Simulating Mobile Handheld Pairing)
    const readRes = await fetch(`${SUPABASE_URL}/rest/v1/branches?import_code=eq.${testImportCode}&select=*`, {
      headers
    });
    const readBranches = await readRes.json();
    expect(readBranches.length).toBe(1);
    expect(readBranches[0].id).toBe(createdBranch.id);

    // Cleanup test branch
    await fetch(`${SUPABASE_URL}/rest/v1/branches?id=eq.${createdBranch.id}`, {
      method: 'DELETE',
      headers
    });
  }, 15000);

  // 2. Test Products & Global Pricing
  test('2. Products: Master Product Catalog CRUD with Global Pricing', async () => {
    const curProds = await (await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, { headers })).json();
    const nextProdId = Math.max(...curProds.map((p: any) => Number(p.id)), 0) + 1;
    const testProdName = `Crispy Lechon Rice Bowl (${timestamp.toString().slice(-4)})`;

    // A. Insert Product
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: nextProdId,
        category: 'Hot Meals',
        name: testProdName,
        base_price: 195.00,
        cost_price: 85.00,
        is_active: true
      })
    });
    expect(createRes.status).toBe(201);
    const [createdProd] = await createRes.json();
    expect(createdProd.name).toBe(testProdName);
    expect(Number(createdProd.base_price)).toBe(195.00);

    // B. Update Product Price
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${createdProd.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        base_price: 210.00
      })
    });
    expect(updateRes.status).toBe(200);
    const [updatedProd] = await updateRes.json();
    expect(Number(updatedProd.base_price)).toBe(210.00);

    // Cleanup
    await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${createdProd.id}`, {
      method: 'DELETE',
      headers
    });
  }, 15000);

  // 3. Test Staff Records with Salted PIN Hashing & Soft Deletes
  test('3. Staff: Salted PIN Security, Soft-Delete & Restore Cycle', async () => {
    const curStaff = await (await fetch(`${SUPABASE_URL}/rest/v1/staff_records?select=*`, { headers })).json();
    const nextStaffId = Math.max(...curStaff.map((s: any) => Number(s.id)), 0) + 1;
    const salt = generatePinSalt();
    const hash = await hashPin('4321', salt);
    const staffName = `Cashier Test (${timestamp.toString().slice(-4)})`;

    // A. Insert Staff with Salted PIN Hash
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/staff_records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: nextStaffId,
        branch_id: 1,
        name: staffName,
        role: 'cashier',
        pin_code: '4321',
        pin_salt: salt,
        pin_hash: hash,
        hourly_rate: 90.00,
        is_active: true,
        is_deleted: false
      })
    });
    expect(createRes.status).toBe(201);
    const [createdStaff] = await createRes.json();
    expect(createdStaff.name).toBe(staffName);
    expect(createdStaff.pin_salt).toBe(salt);
    expect(createdStaff.pin_hash).toBe(hash);

    // B. Verify PIN Hash validation
    const isValid = await verifyPinHash('4321', createdStaff.pin_salt, createdStaff.pin_hash);
    const isInvalid = await verifyPinHash('0000', createdStaff.pin_salt, createdStaff.pin_hash);
    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);

    // C. Soft Delete (Archive Staff)
    const softDelRes = await fetch(`${SUPABASE_URL}/rest/v1/staff_records?id=eq.${createdStaff.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_deleted: true, is_active: false })
    });
    expect(softDelRes.status).toBe(200);
    const [archivedStaff] = await softDelRes.json();
    expect(archivedStaff.is_deleted).toBe(true);
    expect(archivedStaff.is_active).toBe(false);

    // D. Restore Staff
    const restoreRes = await fetch(`${SUPABASE_URL}/rest/v1/staff_records?id=eq.${createdStaff.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_deleted: false, is_active: true })
    });
    expect(restoreRes.status).toBe(200);
    const [restoredStaff] = await restoreRes.json();
    expect(restoredStaff.is_deleted).toBe(false);
    expect(restoredStaff.is_active).toBe(true);

    // Cleanup
    await fetch(`${SUPABASE_URL}/rest/v1/staff_records?id=eq.${createdStaff.id}`, {
      method: 'DELETE',
      headers
    });
  }, 15000);

  // 4. Test Branch Inventory Matrix & Soft Exclusion
  test('4. Branch Inventory: Stock Allocation & Soft Toggle Exclusion', async () => {
    // Create a temporary product
    const curProds = await (await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, { headers })).json();
    const nextProdId = Math.max(...curProds.map((p: any) => Number(p.id)), 0) + 1;

    const prodRes = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: nextProdId,
        category: 'Sides',
        name: `Mashed Potato (${timestamp.toString().slice(-4)})`,
        base_price: 65.00
      })
    });
    const [prod] = await prodRes.json();

    // A. Allocate Stock to Branch 1
    const invRes = await fetch(`${SUPABASE_URL}/rest/v1/branch_inventory`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        branch_id: 1,
        product_id: prod.id,
        stock_quantity: 75.00,
        alert_threshold: 15.00,
        is_active: true
      })
    });
    expect(invRes.status).toBe(201);
    const [inv] = await invRes.json();
    expect(Number(inv.stock_quantity)).toBe(75.00);
    expect(inv.is_active).toBe(true);

    // B. Soft-Toggle (Exclude product from Branch 1)
    const excludeRes = await fetch(`${SUPABASE_URL}/rest/v1/branch_inventory?id=eq.${inv.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_active: false })
    });
    expect(excludeRes.status).toBe(200);
    const [excludedInv] = await excludeRes.json();
    expect(excludedInv.is_active).toBe(false);

    // Cleanup
    await fetch(`${SUPABASE_URL}/rest/v1/branch_inventory?id=eq.${inv.id}`, { method: 'DELETE', headers });
    await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${prod.id}`, { method: 'DELETE', headers });
  }, 15000);

  // 5. Test End-of-Day Batch Ingestion & Cash Reconciliation
  test('5. Daily Batch: End-of-Day Sales & Cash Drawer Audit Ingestion', async () => {
    const testBatchId = `BATCH-E2E-${timestamp}`;
    const syncDate = new Date().toISOString().split('T')[0];

    const payload = {
      branch_id: 1,
      batch_id: testBatchId,
      device_serial: 'SUNMI-V2S-E2E',
      sync_date: syncDate,
      orders_count: 5,
      gross_sales: 875.00,
      cash_sales: 875.00,
      ewallet_sales: 0.00,
      card_sales: 0.00,
      orders_payload: [
        { order_number: 'ORD-E2E-1', total_amount: 175, payment_method: 'cash' },
        { order_number: 'ORD-E2E-2', total_amount: 175, payment_method: 'cash' },
        { order_number: 'ORD-E2E-3', total_amount: 175, payment_method: 'cash' },
        { order_number: 'ORD-E2E-4', total_amount: 175, payment_method: 'cash' },
        { order_number: 'ORD-E2E-5', total_amount: 175, payment_method: 'cash' }
      ],
      shift_summary: {
        cashier_id: 1,
        cashier_name: 'Maria Santos (KCC)',
        opening_float: 1000.00,
        closing_cash: 1875.00,
        counted_cash: 1875.00,
        variance: 0.00
      }
    };

    // A. Post Batch (Simulating Handheld 1-Tap Upload)
    const batchRes = await fetch(`${SUPABASE_URL}/rest/v1/daily_batches`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    expect(batchRes.status).toBe(201);
    const [insertedBatch] = await batchRes.json();
    expect(insertedBatch.batch_id).toBe(testBatchId);
    expect(Number(insertedBatch.gross_sales)).toBe(875.00);
    expect(insertedBatch.shift_summary.variance).toBe(0.00);

    // B. Verify Admin Web can fetch this batch
    const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/daily_batches?batch_id=eq.${testBatchId}&select=*`, {
      headers
    });
    const fetchedBatches = await verifyRes.json();
    expect(fetchedBatches.length).toBe(1);
    expect(fetchedBatches[0].device_serial).toBe('SUNMI-V2S-E2E');

    // Cleanup
    await fetch(`${SUPABASE_URL}/rest/v1/daily_batches?batch_id=eq.${testBatchId}`, { method: 'DELETE', headers });
  }, 15000);
});
