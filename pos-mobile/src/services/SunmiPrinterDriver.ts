import { ThermalReceiptData } from '../types';

/**
 * Sunmi Handheld 58mm Thermal Printer Driver & ESC/POS Formatter.
 * Interfaces directly with Sunmi AIDL printer service on Android handhelds.
 */
export class SunmiPrinterDriver {
  private static isSunmiDevice(): boolean {
    // In native Android runtime, checks for window.SunmiPrinter or native module
    return typeof (global as any).SunmiPrinter !== 'undefined';
  }

  /**
   * Format text for 58mm thermal paper (typically 32 characters per line).
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
    lines.push('       [' + data.store_header.branch_code + ']');
    if (data.store_header.address) {
      lines.push(data.store_header.address);
    }
    if (data.store_header.phone) {
      lines.push('Tel: ' + data.store_header.phone);
    }
    lines.push(DBL_DIVIDER);

    // 2. Order Metadata
    lines.push(this.padLine('Order: ' + data.order_info.order_number, data.order_info.payment_method));
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
    if (parseFloat(data.totals.discount) > 0) {
      lines.push(this.padLine('Discount:', '-₱' + data.totals.discount));
    }
    lines.push(DBL_DIVIDER);
    lines.push(this.padLine('TOTAL AMOUNT:', '₱' + data.totals.total));
    lines.push(DBL_DIVIDER);
    lines.push(this.padLine('Tendered (' + data.order_info.payment_method + '):', '₱' + data.totals.amount_tendered));
    lines.push(this.padLine('Change:', '₱' + data.totals.change));
    lines.push(DIVIDER);

    // 5. Footer
    lines.push('   ' + data.footer.message);
    lines.push(' ' + data.footer.notice);
    lines.push('\n\n\n'); // Feed lines for tear bar

    const receiptOutput = lines.join('\n');

    // If native Sunmi AIDL bridge is present:
    if (this.isSunmiDevice()) {
      try {
        const NativePrinter = (global as any).SunmiPrinter;
        NativePrinter.setAlignment(1); // Center
        NativePrinter.setFontSize(28);
        NativePrinter.printText(data.store_header.name + '\n');
        NativePrinter.setFontSize(22);
        NativePrinter.setAlignment(0); // Left
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
   * Print Daily Z-Reading / Shift Audit Summary on 58mm paper.
   */
  public static async printZReport(zReport: any): Promise<{ success: boolean; rawText: string }> {
    const lines: string[] = [];
    const LINE_WIDTH = 32;
    const DBL_DIVIDER = '='.repeat(LINE_WIDTH);
    const DIVIDER = '-'.repeat(LINE_WIDTH);

    lines.push('  *** ' + zReport.report_title + ' ***');
    lines.push('Branch: ' + zReport.branch);
    lines.push('Terminal: ' + zReport.terminal);
    lines.push('Cashier: ' + zReport.cashier);
    lines.push('Opened: ' + zReport.opened_at);
    lines.push('Closed: ' + zReport.closed_at);
    lines.push(DBL_DIVIDER);
    lines.push(this.padLine('Opening Cash Float:', '₱' + zReport.financials.opening_float));
    lines.push(this.padLine('Cash Sales:', '₱' + zReport.financials.cash_sales));
    lines.push(this.padLine('E-Wallet Sales:', '₱' + zReport.financials.ewallet_sales));
    lines.push(this.padLine('Card Sales:', '₱' + zReport.financials.card_sales));
    lines.push(DIVIDER);
    lines.push(this.padLine('TOTAL GROSS SALES:', '₱' + zReport.financials.total_gross_sales));
    lines.push(this.padLine('Total Orders:', String(zReport.financials.transactions_count)));
    lines.push(DBL_DIVIDER);
    lines.push(this.padLine('Expected Cash:', '₱' + zReport.financials.expected_cash_in_drawer));
    lines.push(this.padLine('Actual Counted:', '₱' + zReport.financials.actual_counted_cash));
    lines.push(this.padLine('Over / (Short):', '₱' + zReport.financials.cash_over_short));
    lines.push(DBL_DIVIDER);
    lines.push('       [END OF AUDIT REPORT]\n\n\n');

    const output = lines.join('\n');
    console.log('=== [SUNMI Z-REPORT PRINT] ===\n' + output);
    return { success: true, rawText: output };
  }
}
