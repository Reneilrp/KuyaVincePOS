import { AnalyticsData, Branch, InventoryItem, PayrollItem } from '../types';

export class ExportService {
  /**
   * Download a string as a file on client machine.
   */
  private static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export Top Sales & Revenue Breakdown to CSV/Excel.
   */
  public static exportSalesToCSV(analytics: AnalyticsData, selectedBranchName: string) {
    const lines: string[] = [];
    const dateStr = new Date().toISOString().split('T')[0];

    lines.push(`"MULTI-BRANCH POS - SALES REPORT"`);
    lines.push(`"Branch Filter","${selectedBranchName}"`);
    lines.push(`"Report Generated","${new Date().toLocaleString()}"`);
    lines.push(`"Gross Sales (PHP)","${analytics.kpis.total_gross_revenue.toFixed(2)}"`);
    lines.push(`"Total Orders","${analytics.kpis.total_sales_count}"`);
    lines.push(`"Average Order Value (PHP)","${analytics.kpis.average_order_value.toFixed(2)}"`);
    lines.push(``);

    // Branch Breakdown
    lines.push(`"BRANCH PERFORMANCE BREAKDOWN"`);
    lines.push(`"Branch Code","Branch Name","Orders Count","Gross Sales (PHP)"`);
    for (const b of analytics.branch_comparison) {
      lines.push(`"${b.code}","${b.name}","${b.order_count}","${b.total_sales.toFixed(2)}"`);
    }
    lines.push(``);

    // Top Selling Products
    lines.push(`"TOP SELLING PRODUCTS"`);
    lines.push(`"Product Name","Units Sold","Total Revenue (PHP)"`);
    for (const p of analytics.top_products) {
      lines.push(`"${p.product_name}","${p.total_qty}","${Number(p.total_revenue).toFixed(2)}"`);
    }

    const csvContent = lines.join('\n');
    this.downloadFile(csvContent, `sales_report_${dateStr}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Export Multi-Branch Inventory Matrix to CSV.
   */
  public static exportInventoryToCSV(items: InventoryItem[], branches: Branch[]) {
    const lines: string[] = [];
    const dateStr = new Date().toISOString().split('T')[0];

    lines.push(`"CROSS-BRANCH INVENTORY BALANCES"`);
    lines.push(`"Export Date","${dateStr}"`);
    lines.push(``);

    // Headers
    const headers = ['Product ID', 'Product Name', 'Category', 'Selling Price (PHP)', 'Cost Price (PHP)'];
    for (const b of branches) {
      headers.push(`${b.name} [${b.code}] Stock`);
    }
    headers.push('Total Stock Available');
    lines.push(headers.map((h) => `"${h}"`).join(','));

    // Rows
    for (const item of items) {
      const row = [
        item.product_id,
        item.name,
        item.category,
        item.base_price.toFixed(2),
        item.cost_price.toFixed(2)
      ];
      for (const b of branches) {
        row.push((item.branch_stocks[b.id] ?? 0) as any);
      }
      row.push(item.total_stock as any);
      lines.push(row.map((val) => `"${val}"`).join(','));
    }

    const csvContent = lines.join('\n');
    this.downloadFile(csvContent, `inventory_balances_${dateStr}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Export Master Payroll Sheet to CSV.
   */
  public static exportPayrollToCSV(payroll: PayrollItem[]) {
    const lines: string[] = [];
    const dateStr = new Date().toISOString().split('T')[0];

    lines.push(`"MASTER STAFF PAYROLL SHEET"`);
    lines.push(`"Export Date","${dateStr}"`);
    lines.push(``);

    lines.push(`"Staff Name","Role","Branch","Period Start","Period End","Hourly Rate","Hours Worked","Gross Pay","Deductions","Bonuses","Net Take-Home Pay"`);

    for (const p of payroll) {
      lines.push(`"${p.staff_name}","${p.role}","${p.branch_name}","${p.period_start}","${p.period_end}","${p.hourly_rate.toFixed(2)}","${p.total_hours.toFixed(2)}","${p.gross_pay.toFixed(2)}","${p.deductions.toFixed(2)}","${p.bonuses.toFixed(2)}","${p.net_pay.toFixed(2)}"`);
    }

    const csvContent = lines.join('\n');
    this.downloadFile(csvContent, `payroll_sheet_${dateStr}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Download Full Raw JSON System Backup.
   */
  public static exportRawJsonBackup(analytics: AnalyticsData, inventory: InventoryItem[], payroll: PayrollItem[]) {
    const backup = {
      export_version: '1.0.0',
      exported_at: new Date().toISOString(),
      analytics,
      inventory,
      payroll
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    this.downloadFile(jsonStr, `pos_full_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  }
}
