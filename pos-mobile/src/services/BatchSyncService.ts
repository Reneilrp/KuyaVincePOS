import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://diddsyaqdqxvadgttguq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZGRzeWFxZHF4dmFkZ3R0Z3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTI1NzQsImV4cCI6MjEwMzYyODU3NH0.0JKA5syorKUuwP5KtFTjQXpQFwb_uYuDyM8yL4ZdRh4';

export interface LocalOrderItem {
  product_id: number | null;
  name: string;
  qty: number;
  unit_price: number;
  total_price: number;
}

export interface LocalOrderRecord {
  order_number: string;
  client_tx_id: string;
  subtotal: number;
  total_amount: number;
  payment_method: string;
  amount_tendered: number;
  change_amount: number;
  created_at: string;
  items: LocalOrderItem[];
  synced: boolean;
}

export class BatchSyncService {
  private static STORAGE_KEY = 'pos_local_orders_queue';

  /**
   * Save an order locally during daytime (100% offline-first).
   */
  public static async saveOrderLocally(order: Omit<LocalOrderRecord, 'synced'>): Promise<void> {
    try {
      const existing = await this.getLocalOrders();
      existing.push({ ...order, synced: false });
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save order locally', e);
    }
  }

  /**
   * Get all local orders stored on device.
   */
  public static async getLocalOrders(): Promise<LocalOrderRecord[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * 1-Tap End-of-Day Sync: Sends all un-synced orders directly to Supabase daily_batches table.
   */
  public static async pushDailyBatchToServer(
    branchId: number,
    deviceSerial: string,
    shiftSummary?: any,
    stockAdjustments?: any[]
  ): Promise<{
    success: boolean;
    message: string;
    syncedCount: number;
    grossSales: number;
  }> {
    const allOrders = await this.getLocalOrders();
    const pendingOrders = allOrders.filter((o) => !o.synced);

    if (pendingOrders.length === 0 && (!stockAdjustments || stockAdjustments.length === 0)) {
      return {
        success: true,
        message: 'All daily sales and inventory adjustments are already backed up to the cloud.',
        syncedCount: 0,
        grossSales: 0
      };
    }

    const batchId = `BATCH-${deviceSerial}-${new Date().toISOString().split('T')[0]}-${Date.now()}`;
    const syncDate = new Date().toISOString().split('T')[0];
    const grossSales = pendingOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const payload = {
      branch_id: Number(branchId) || 1,
      batch_id: batchId,
      device_serial: deviceSerial,
      sync_date: syncDate,
      orders_count: pendingOrders.length,
      gross_sales: grossSales,
      cash_sales: grossSales,
      ewallet_sales: 0.0,
      card_sales: 0.0,
      orders_payload: pendingOrders,
      timeclocks_payload: [],
      shift_summary: shiftSummary || null
    };

    try {
      // 1. Insert Daily Batch Record to Supabase
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

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Supabase upload failed (${response.status}): ${errBody}`);
      }

      // 2. If stock adjustments exist, reconcile them in Supabase
      if (stockAdjustments && stockAdjustments.length > 0) {
        for (const adj of stockAdjustments) {
          try {
            // Get current stock
            const curRes = await fetch(
              `${SUPABASE_URL}/rest/v1/branch_inventory?branch_id=eq.${branchId}&product_id=eq.${adj.product_id}&select=*`,
              {
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
              }
            );
            const curRows = await curRes.json();
            const curStock = curRows && curRows.length > 0 ? Number(curRows[0].stock_quantity || 0) : 0;

            await fetch(`${SUPABASE_URL}/rest/v1/branch_inventory`, {
              method: 'POST',
              headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
              },
              body: JSON.stringify({
                branch_id: Number(branchId),
                product_id: Number(adj.product_id),
                stock_quantity: curStock + Number(adj.qty_added),
                updated_at: new Date().toISOString()
              })
            });
          } catch (adjErr) {
            console.warn('Could not sync stock adjustment for product', adj.product_id, adjErr);
          }
        }
      }

      // 3. Mark all local orders as synced in AsyncStorage
      const updated = allOrders.map((o) => ({ ...o, synced: true }));
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));

      return {
        success: true,
        message: `Successfully uploaded batch ${batchId} (${pendingOrders.length} orders, ₱${grossSales.toFixed(2)}) directly to Supabase Cloud!`,
        syncedCount: pendingOrders.length,
        grossSales: grossSales
      };
    } catch (err: any) {
      console.error('Batch sync cloud upload error:', err);
      throw err;
    }
  }
}
