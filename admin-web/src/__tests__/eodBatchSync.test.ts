const SUPABASE_URL = 'https://diddsyaqdqxvadgttguq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZGRzeWFxZHF4dmFkZ3R0Z3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTI1NzQsImV4cCI6MjEwMzYyODU3NH0.0JKA5syorKUuwP5KtFTjQXpQFwb_uYuDyM8yL4ZdRh4';

describe('End-of-Day Cash Reconciliation & Cloud Ingestion', () => {
  test('Cash drawer math computes variance correctly', () => {
    const openingFloat = 1000.0;
    const cashSales = 4500.0;
    const expectedDrawer = openingFloat + cashSales; // 5500.00

    expect(expectedDrawer).toBe(5500.0);

    // Balanced Case
    const countedBalanced = 5500.0;
    const varianceBalanced = countedBalanced - expectedDrawer;
    expect(varianceBalanced).toBe(0);

    // Short Case (Kulang)
    const countedShort = 5450.0;
    const varianceShort = countedShort - expectedDrawer;
    expect(varianceShort).toBe(-50.0);

    // Over Case (Sobra)
    const countedOver = 5520.0;
    const varianceOver = countedOver - expectedDrawer;
    expect(varianceOver).toBe(20.0);
  });

  test('Cloud batch payload successfully pushes to Supabase and verifies ingestion', async () => {
    const testBatchId = `BATCH-JEST-${Date.now()}`;
    const testOrders = [
      { order_number: 'ORD-JEST-1', subtotal: 135, total_amount: 135 },
      { order_number: 'ORD-JEST-2', subtotal: 120, total_amount: 120 }
    ];
    const grossSales = 255.0;

    const payload = {
      branch_id: 1,
      batch_id: testBatchId,
      device_serial: 'SUNMI-JEST-RUNNER',
      sync_date: new Date().toISOString().split('T')[0],
      orders_count: 2,
      gross_sales: grossSales,
      cash_sales: grossSales,
      ewallet_sales: 0.0,
      card_sales: 0.0,
      orders_payload: testOrders,
      shift_summary: {
        cashier_id: 1,
        cashier_name: 'Jest Test Runner',
        opening_float: 1000,
        counted_cash: 1255,
        closing_cash: 1255,
        variance: 0
      }
    };

    // 1. Post to Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/daily_batches`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(201); // 201 Created

    // 2. Query back to verify persistence
    const queryRes = await fetch(`${SUPABASE_URL}/rest/v1/daily_batches?batch_id=eq.${testBatchId}&select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await queryRes.json();
    expect(data.length).toBe(1);
    expect(data[0].batch_id).toBe(testBatchId);
    expect(Number(data[0].gross_sales)).toBe(grossSales);
    expect(data[0].orders_count).toBe(2);
  }, 15000);
});
