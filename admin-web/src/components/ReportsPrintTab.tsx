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

  const handleExportSales = () => {
    ExportService.exportSalesToCSV(analytics, selectedBranchName);
    triggerNotification('Sales ledger exported to CSV');
  };

  const handleExportInventory = () => {
    ExportService.exportInventoryToCSV(inventory, branches);
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              📥 Client Data Retrieval & Export Center
            </h2>
            <p className="text-xs text-slate-400">Download full offline copies in Excel, CSV, or raw JSON format (100% data ownership)</p>
          </div>
          {downloadSuccess && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {downloadSuccess}
            </span>
          )}
        </div>

        {/* 1-Click Export Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <button
            onClick={handleExportSales}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500 text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Sales (CSV)
          </button>

          <button
            onClick={handleExportInventory}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500 text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            Export Stock Balances (CSV)
          </button>

          <button
            onClick={handleExportPayroll}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500 text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-400" />
            Export Payroll (CSV)
          </button>

          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500 text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <Database className="w-4 h-4 text-amber-400" />
            Download JSON Backup
          </button>
        </div>
      </div>

      {/* 2. Drag & Drop Offline JSON Uploader */}
      <OfflineJsonDropzone onImportBatch={onImportOfflineBatch} />

      {/* 3. Physical Print Center (Z-Reading & A4) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            🖨️ Daily Z-Reports & Executive Print Center
          </h2>
          <p className="text-xs text-slate-400">Generate printable 58mm thermal receipts or full A4 financial summaries</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setReportType('z_read')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                reportType === 'z_read' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              58mm Thermal Z-Read
            </button>
            <button
              onClick={() => setReportType('a4_summary')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                reportType === 'a4_summary' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              A4 Financial Audit
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
          >
            <Printer className="w-4 h-4" /> Print Document
          </button>
        </div>
      </div>

      {/* 4. Document Preview Area */}
      <div className="flex justify-center p-6 bg-slate-950/60 border border-slate-800 rounded-2xl">
        {reportType === 'z_read' ? (
          /* 58mm Sunmi Thermal Z-Reading Simulation */
          <div className="bg-white text-black font-mono text-xs w-[320px] p-6 rounded-lg shadow-2xl border border-slate-300">
            <div className="text-center mb-4">
              <p className="font-bold text-sm">*** DAILY Z-READING REPORT ***</p>
              <p className="font-bold">{selectedBranchName}</p>
              <p className="text-[10px] text-gray-600">Date: {new Date().toISOString().split('T')[0]}</p>
              <p className="text-[10px] text-gray-600">Time: {new Date().toLocaleTimeString()}</p>
            </div>

            <div className="border-t border-b border-black py-2 my-2 space-y-1">
              <div className="flex justify-between">
                <span>Total Gross Sales:</span>
                <span className="font-bold">₱{kpis.total_gross_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <span className="font-bold">{kpis.total_sales_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Order:</span>
                <span>₱{kpis.average_order_value.toFixed(2)}</span>
              </div>
            </div>

            <p className="font-bold mt-2">PAYMENT BREAKDOWN:</p>
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
              <p>Supabase + Vercel Cloud POS</p>
              <p>Authorized Client Audit Copy</p>
              <p>*** END OF Z-REPORT ***</p>
            </div>
          </div>
        ) : (
          /* Full A4 Financial Audit Report */
          <div className="bg-white text-slate-900 w-full max-w-3xl p-8 rounded-xl shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900">Multi-Branch Financial Audit</h2>
                <p className="text-sm text-slate-600">{selectedBranchName}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Report Date: {new Date().toLocaleDateString()}</p>
                <p>Generated by Store Admin</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-100 rounded-lg">
                <span className="text-xs text-slate-500 uppercase font-semibold">Total Revenue</span>
                <p className="text-xl font-bold text-slate-900 mt-1">₱{kpis.total_gross_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 bg-slate-100 rounded-lg">
                <span className="text-xs text-slate-500 uppercase font-semibold">Transactions</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{kpis.total_sales_count} Sales</p>
              </div>
              <div className="p-4 bg-slate-100 rounded-lg">
                <span className="text-xs text-slate-500 uppercase font-semibold">Average Ticket</span>
                <p className="text-xl font-bold text-slate-900 mt-1">₱{kpis.average_order_value.toFixed(2)}</p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-800 uppercase mb-3">Branch Breakdown Performance</h3>
            <table className="w-full text-left text-xs mb-6 border border-slate-200">
              <thead className="bg-slate-100 uppercase text-slate-600">
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
                    <td className="p-2.5 font-semibold text-slate-900">{b.name}</td>
                    <td className="p-2.5 text-slate-600">{b.code}</td>
                    <td className="p-2.5 text-center">{b.order_count}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">₱{b.total_sales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-slate-300 pt-4 flex justify-between items-center text-xs text-slate-500">
              <span>Supabase + Vercel Cloud Point of Sale System</span>
              <span>Page 1 of 1</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
