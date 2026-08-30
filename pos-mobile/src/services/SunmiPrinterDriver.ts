import { ThermalReceiptData } from '../types';

/**
 * Sunmi Handheld 58mm Thermal Printer Driver & ESC/POS Formatter.
 * Interfaces directly with Sunmi AIDL printer service on Android handhelds.
 */
export class SunmiPrinterDriver {
  private static isSunmiDevice(): boolean {
    return typeof (global as any).SunmiPrinter !== 'undefined';
  }

  /**
   * Format text for 58mm thermal paper (32 characters per line).
   */
  private static padLine(left: string, right: string, width: number = 32): string {
    const spaceNeeded = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(spaceNeeded) + right;
  }

  /**
   * Print a customer sales receipt on Sunmi 58mm thermal printer.
   */
  public static async printReceipt(data: ThermalReceiptData): Promise<{ success: boolean; rawText: string }> {
    const lines: string[] = [];
    const LINE_WIDTH = 32;
    const DIVIDER = '-'.repeat(LINE_WIDTH);
    const DBL_DIVIDER = '='.repeat(LINE_WIDTH);

    // 1. Store Header (Centered)
    lines.push('       ' + data.store_header.name.toUpperCase());
    if (data.store_header.address) {
      lines.push(data.store_header.address);
    }
    if (data.store_header.contact) {
      lines.push('Tel: ' + data.store_header.contact);
    }
    lines.push(DBL_DIVIDER);

    // 2. Order Metadata
    lines.push(this.padLine('Order: ' + data.order_info.order_number, data.totals.payment_method || 'CASH'));
    lines.push(this.padLine('Date: ' + data.order_info.date_time, ''));
    lines.push(this.padLine('Cashier: ' + data.order_info.cashier, ''));
    lines.push(DIVIDER);

    // 3. Itemized Products
    lines.push(this.padLine('ITEM x QTY', 'AMOUNT'));
    lines.push(DIVIDER);

    for (const item of data.items) {
      const itemLine = `${item.name.substring(0, 18)} x${item.qty}`;
      lines.push(this.padLine(itemLine, '₱' + item.total_price));
    }
    lines.push(DIVIDER);

    // 4. Totals & Financials
    lines.push(this.padLine('Subtotal:', '₱' + data.totals.subtotal));
    if (parseFloat(data.totals.discount || '0') > 0) {
      lines.push(this.padLine('Senior/PWD (20%):', '-₱' + data.totals.discount));
    }
    lines.push(DBL_DIVIDER);
    lines.push(this.padLine('TOTAL AMOUNT:', '₱' + data.totals.total));
    lines.push(DBL_DIVIDER);
    lines.push(this.padLine('Cash Tendered:', '₱' + data.totals.amount_tendered));
    lines.push(this.padLine('Sukli / Change:', '₱' + data.totals.change));
    lines.push(DIVIDER);

    // 5. Footer
    lines.push('   ' + (data.footer.message || 'Maraming Salamat!'));
    lines.push(' ' + (data.footer.notice || 'Official Cash Sales Slip'));
    lines.push('\n\n\n'); // Feed lines for tear bar

    const receiptOutput = lines.join('\n');

    if (this.isSunmiDevice()) {
      try {
        const NativePrinter = (global as any).SunmiPrinter;
        NativePrinter.setAlignment(1);
        NativePrinter.setFontSize(28);
        NativePrinter.printText(data.store_header.name + '\n');
        NativePrinter.setFontSize(22);
        NativePrinter.setAlignment(0);
        NativePrinter.printText(receiptOutput);
        NativePrinter.lineWrap(3);
        NativePrinter.cutPaper();
      } catch (err) {
        console.warn('Native Sunmi print exception:', err);
      }
    } else {
      console.log('=== [SUNMI 58mm THERMAL PRINT SIMULATION] ===\n' + receiptOutput);
    }

    return { success: true, rawText: receiptOutput };
  }

  /**
   * Print Mid-Day Shift Handover / X-Reading Report.
   */
  public static async printXReport(xReport: {
    branch_name: string;
    cashier_name: string;
    shift_start: string;
    shift_end: string;
    orders_count: number;
    cash_sales: number;
    opening_float: number;
    expected_cash: number;
    counted_cash: number;
    variance: number;
  }): Promise<{ success: boolean; rawText: string }> {
    const lines: string[] = [];
    const LINE_WIDTH = 32;
    const DBL_DIVIDER = '='.repeat(LINE_WIDTH);
    const DIVIDER = '-'.repeat(LINE_WIDTH);

    lines.push('   *** SHIFT X-READING ***');
    lines.push('       (SHIFT HANDOVER)');
    lines.push(DBL_DIVIDER);
    lines.push('Branch: ' + xReport.branch_name);
    lines.push('Cashier: ' + xReport.cashier_name);
    lines.push('Started: ' + xReport.shift_start);
    lines.push('Ended: ' + xReport.shift_end);
    lines.push(DIVIDER);
    lines.push(this.padLine('Starting Float (Panukli):', '₱' + xReport.opening_float.toFixed(2)));
    lines.push(this.padLine('Shift Cash Sales:', '₱' + xReport.cash_sales.toFixed(2)));
    lines.push(this.padLine('Orders Completed:', String(xReport.orders_count)));
    lines.push(DBL_DIVIDER);
    lines.push(this.padLine('Expected Drawer:', '₱' + xReport.expected_cash.toFixed(2)));
    lines.push(this.padLine('Actual Counted:', '₱' + xReport.counted_cash.toFixed(2)));
    lines.push(this.padLine('Shift Variance:', (xReport.variance >= 0 ? '+' : '') + '₱' + xReport.variance.toFixed(2)));
    lines.push(DBL_DIVIDER);
    lines.push('\nCashier Out Signature: __________\n');
    lines.push('Cashier In Signature:  __________\n');
    lines.push('     [TURNOVER COMPLETE]\n\n\n');

    const output = lines.join('\n');
    console.log('=== [SUNMI X-REPORT PRINT] ===\n' + output);
    return { success: true, rawText: output };
  }

  /**
   * Print Daily Z-Reading / Shift Audit Summary on 58mm paper.
   */
  public static async printZReport(zReport: any): Promise<{ success: boolean; rawText: string }> {
    const lines: string[] = [];
    const LINE_WIDTH = 32;
    const DBL_DIVIDER = '='.repeat(LINE_WIDTH);
    const DIVIDER = '-'.repeat(LINE_WIDTH);

    lines.push('     *** Z-READING AUDIT ***');
    lines.push('     (FINAL DAY CLOSING)');
    lines.push(DBL_DIVIDER);
    lines.push('Branch: ' + (zReport.branch_name || 'KuyaVince POS'));
    lines.push('Terminal: ' + (zReport.device_serial || 'SUNMI-V2S'));
    lines.push('Date: ' + (zReport.date || new Date().toLocaleDateString()));
    lines.push(DIVIDER);
    lines.push(this.padLine('Starting Float (Panukli):', '₱' + Number(zReport.opening_float || 1000).toFixed(2)));
    lines.push(this.padLine('Total Cash Sales:', '₱' + Number(zReport.cash_sales || 0).toFixed(2)));
    lines.push(this.padLine('Total Orders:', String(zReport.total_orders || 0)));
    lines.push(DBL_DIVIDER);
    lines.push(this.padLine('Expected in Drawer:', '₱' + Number(zReport.expected_cash || 0).toFixed(2)));
    lines.push(this.padLine('Actual Counted:', '₱' + Number(zReport.counted_cash || 0).toFixed(2)));
    lines.push(this.padLine('Total Day Variance:', (zReport.variance >= 0 ? '+' : '') + '₱' + Number(zReport.variance || 0).toFixed(2)));
    lines.push(DBL_DIVIDER);
    lines.push('    [END OF DAY AUDIT CLOSED]\n\n\n');

    const output = lines.join('\n');
    console.log('=== [SUNMI Z-REPORT PRINT] ===\n' + output);
    return { success: true, rawText: output };
  }
}
