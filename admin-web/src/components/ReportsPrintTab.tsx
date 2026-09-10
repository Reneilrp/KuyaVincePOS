import React, { useState } from 'react';
import { Printer, FileSpreadsheet, Database, CheckCircle2 } from 'lucide-react';
import { ExportService } from '../services/ExportService';
import { OfflineJsonDropzone } from './OfflineJsonDropzone';
import { AnalyticsData, Branch, InventoryItem, PayrollItem } from '../types';

interface Props {
  branches: Branch[];
  analytics: AnalyticsData;
  inventory: InventoryItem[];
  payroll: PayrollItem[];
  selectedBranchName: string;
  onImportOfflineBatch: (batch: any) => void;
}

export const ReportsPrintTab: React.FC<Props> = ({
  branches,
  analytics,
  inventory,
  payroll,
  selectedBranchName,
  onImportOfflineBatch
}) => {
  const [reportType, setReportType] = useState<'z_read' | 'a4_summary'>('z_read');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const kpis = analytics.kpis;

  const triggerNotification = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const activeBranches = branches.filter((b) => b.is_active !== false);

  const handleExportSales = () => {
    ExportService.exportSalesToCSV(analytics, selectedBranchName);
    triggerNotification('Sales ledger exported to CSV');
  };

  const handleExportInventory = () => {
    ExportService.exportInventoryToCSV(inventory, activeBranches);
    triggerNotification('Inventory balances exported to CSV');
  };

  const handleExportPayroll = () => {
    ExportService.exportPayrollToCSV(payroll);
    triggerNotification('Staff payroll sheet exported to CSV');
  };

  const handleExportBackup = () => {
    ExportService.exportRawJsonBackup(analytics, inventory, payroll);
    triggerNotification('Raw JSON database backup exported');
  };

  return (
    <div className="space-y-6">
      {/* 1. Client Data Export & Retrieval Hub */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              📥 Client Data Retrieval & Export Center
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Download full offline copies in CSV or raw JSON format</p>
          </div>
          {downloadSuccess && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {downloadSuccess}
            </span>
          )}
        </div>

        {/* 1-Click Export Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <button
            onClick={handleExportSales}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Export Sales (CSV)
          </button>

          <button
            onClick={handleExportInventory}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Export Stock Balances (CSV)
          </button>

          <button
            onClick={handleExportPayroll}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Export Payroll (CSV)
          </button>

          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors shadow-xs"
          >
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Download JSON Backup
          </button>
        </div>
      </div>

      {/* 2. Drag & Drop Offline JSON Uploader */}
      <OfflineJsonDropzone onImportBatch={onImportOfflineBatch} />

      {/* 3. Physical Print Center (Z-Reading & A4) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            🖨️ Daily Z-Reports & Executive Print Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Generate printable 58mm thermal receipts or full A4 financial summaries</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setReportType('z_read')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                reportType === 'z_read' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              58mm Thermal Z-Read
            </button>
            <button
              onClick={() => setReportType('a4_summary')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                reportType === 'a4_summary' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              A4 Financial Audit
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print Document
          </button>
        </div>
      </div>

      {/* 4. Document Preview Area */}
      <div className="flex justify-center p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner">
        {reportType === 'z_read' ? (
          /* 58mm Sunmi Thermal Z-Reading Simulation */
          <div className="bg-white text-black font-mono text-xs w-[320px] p-6 rounded-xl border border-slate-300 shadow-md">
            <div className="text-center mb-4">
              <p className="font-semibold text-sm">*** DAILY Z-READING REPORT ***</p>
              <p className="font-semibold">{selectedBranchName}</p>
              <p className="text-[10px] text-gray-600">Date: {new Date().toISOString().split('T')[0]}</p>
              <p className="text-[10px] text-gray-600">Time: {new Date().toLocaleTimeString()}</p>
            </div>

            <div className="border-t border-b border-black py-2 my-2 space-y-1">
              <div className="flex justify-between">
                <span>Total Gross Sales:</span>
                <span className="font-semibold">₱{kpis.total_gross_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <span className="font-semibold">{kpis.total_sales_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Order:</span>
                <span>₱{kpis.average_order_value.toFixed(2)}</span>
              </div>
            </div>

            <p className="font-semibold mt-2">PAYMENT BREAKDOWN:</p>
            <div className="space-y-1 my-1">
              <div className="flex justify-between">
                <span>Cash in Drawer:</span>
                <span>₱{kpis.payment_breakdown.cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>E-Wallets (GCash/Maya):</span>
                <span>₱{kpis.payment_breakdown.ewallet.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Credit/Debit Cards:</span>
                <span>₱{kpis.payment_breakdown.card.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-black pt-2 mt-4 text-center text-[10px]">
              <p>KuyaVince POS System</p>
              <p>Authorized Client Audit Copy</p>
              <p>*** END OF Z-REPORT ***</p>
            </div>
          </div>
        ) : (
          /* Full A4 Financial Audit Report */
          <div className="bg-white text-slate-900 w-full max-w-3xl p-8 rounded-xl border border-slate-300 shadow-md">
            <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold uppercase tracking-tight text-slate-900">Multi-Branch Financial Audit</h2>
                <p className="text-sm text-slate-600">{selectedBranchName}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Report Date: {new Date().toLocaleDateString()}</p>
                <p>Generated by Store Admin</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-100 rounded-lg">
                <span className="text-xs text-slate-500 font-medium">Total Revenue</span>
                <p className="text-xl font-semibold font-mono text-slate-900 mt-1">₱{kpis.total_gross_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 bg-slate-100 rounded-lg">
                <span className="text-xs text-slate-500 font-medium">Transactions</span>
                <p className="text-xl font-semibold font-mono text-slate-900 mt-1">{kpis.total_sales_count} Sales</p>
              </div>
              <div className="p-4 bg-slate-100 rounded-lg">
                <span className="text-xs text-slate-500 font-medium">Average Ticket</span>
                <p className="text-xl font-semibold font-mono text-slate-900 mt-1">₱{kpis.average_order_value.toFixed(2)}</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-800 uppercase mb-3">Branch Breakdown Performance</h3>
            <table className="w-full text-left text-xs mb-6 border border-slate-200">
              <thead className="bg-slate-100 uppercase text-slate-600 font-semibold">
                <tr>
                  <th className="p-2.5">Branch Name</th>
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5 text-center">Orders</th>
                  <th className="p-2.5 text-right">Gross Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {analytics.branch_comparison.map((b) => (
                  <tr key={b.branch_id}>
                    <td className="p-2.5 font-medium text-slate-900">{b.name}</td>
                    <td className="p-2.5 text-slate-600 font-mono">{b.code}</td>
                    <td className="p-2.5 text-center font-mono">{b.order_count}</td>
                    <td className="p-2.5 text-right font-mono font-medium text-slate-900">₱{b.total_sales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-slate-300 pt-4 flex justify-between items-center text-xs text-slate-500">
              <span>KuyaVince POS Point of Sale System</span>
              <span>Page 1 of 1</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
