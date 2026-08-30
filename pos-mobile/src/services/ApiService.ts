import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';

export class ApiService {
  private static baseUrl = DEFAULT_API_BASE_URL;

  public static setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public static async getSetupBranches() {
    const res = await fetch(`${this.baseUrl}/devices/setup-branches`);
    return await res.json();
  }

  public static async pairDevice(payload: { device_serial: string; branch_id: number; terminal_name: string }) {
    const res = await fetch(`${this.baseUrl}/devices/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  public static async cashierPinLogin(pin_code: string, branch_id?: number) {
    const res = await fetch(`${this.baseUrl}/auth/cashier-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin_code, branch_id })
    });
    return await res.json();
  }

  public static async getCatalog(branch_id: number) {
    const res = await fetch(`${this.baseUrl}/catalog?branch_id=${branch_id}`);
    return await res.json();
  }

  public static async processCheckout(payload: any) {
    try {
      const res = await fetch(`${this.baseUrl}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      // Offline fallback queueing
      await this.queueOfflineOrder(payload);
      return {
        status: 'offline_queued',
        message: 'Network offline. Order queued in local storage and will sync automatically.',
        data: {
          receipt: {
            store_header: { name: 'Offline Mode (Queued)', branch_code: 'OFFLINE' },
            order_info: { order_number: 'OFF-' + Date.now(), date_time: new Date().toISOString(), cashier: 'Cashier', payment_method: payload.payment_method },
            items: payload.items.map((it: any) => ({ name: 'Product #' + it.product_id, qty: it.quantity, unit_price: '0.00', total_price: '0.00' })),
            totals: { subtotal: '0.00', discount: '0.00', total: String(payload.amount_tendered), amount_tendered: String(payload.amount_tendered), change: '0.00' },
            footer: { message: 'OFFLINE TRANSACTION RECORDED', notice: 'Receipt will be reconciled upon sync' }
          }
        }
      };
    }
  }

  public static async openShift(payload: { branch_id: number; cashier_id: number; opening_cash: number; device_id?: number }) {
    const res = await fetch(`${this.baseUrl}/shifts/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  public static async closeShift(shift_id: number, closing_cash: number) {
    const res = await fetch(`${this.baseUrl}/shifts/${shift_id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closing_cash })
    });
    return await res.json();
  }

  public static async clockIn(user_id: number, branch_id: number) {
    const res = await fetch(`${this.baseUrl}/timeclock/in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, branch_id })
    });
    return await res.json();
  }

  public static async clockOut(user_id: number) {
    const res = await fetch(`${this.baseUrl}/timeclock/out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    return await res.json();
  }

  public static async restock(branch_id: number, product_id: number, quantity: number, notes?: string) {
    const res = await fetch(`${this.baseUrl}/inventory/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch_id, product_id, quantity, notes })
    });
    return await res.json();
  }

  private static async queueOfflineOrder(orderPayload: any) {
    try {
      const existingStr = await AsyncStorage.getItem('pos_offline_queue');
      const queue = existingStr ? JSON.parse(existingStr) : [];
      queue.push({
        ...orderPayload,
        client_tx_id: 'TX_OFF_' + Date.now() + '_' + Math.random().toString(36).substring(7),
        queued_at: new Date().toISOString()
      });
      await AsyncStorage.setItem('pos_offline_queue', JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to queue offline order', e);
    }
  }
}
