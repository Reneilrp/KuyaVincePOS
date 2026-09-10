import React, { useState } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Clock,
  HardDrive
} from 'lucide-react';
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
  const [activeSubTab, setActiveSubTab] = useState<'print' | 'exports'>('print');
  const [reportType, setReportType] = useState<'z_read' | 'a4_summary'>('z_read');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isDropzoneExpanded, setIsDropzoneExpanded] = useState(false);

  const kpis = analytics.kpis;

  const triggerNotification = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const activeBranches = branches.filter((b) => b.is_active !== false);

  const handleExportSales = () => {
    ExportService.exportSalesToCSV(analytics, selectedBranchName);
    triggerNotification('Sales ledger exported to CSV successfully');
  };

  const handleExportInventory = () => {
    ExportService.exportInventoryToCSV(inventory, activeBranches);
    triggerNotification('Inventory balances exported to CSV successfully');
  };

  const handleExportPayroll = () => {
    ExportService.exportPayrollToCSV(payroll);
    triggerNotification('Staff payroll sheet exported to CSV successfully');
  };

  const handleExportBackup = () => {
    ExportService.exportRawJsonBackup(analytics, inventory, payroll);
    triggerNotification('Raw JSON database backup exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* 1. Sub-Tab Switcher */}
      <div className="flex items-center no-print">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('print')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'print'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" /> Daily Print Center
          </button>
          <button
            onClick={() => setActiveSubTab('exports')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'exports'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Data Exports & Backups
          </button>
        </div>
      </div>

      {/* 2. SUB-TAB 1: PRINT CENTER & PREVIEW */}
      {activeSubTab === 'print' && (
        <div className="space-y-6">
          {/* Print Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm no-print">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                🖨️ Document Format & Print Preview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select format to preview before printing or generating PDF
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setReportType('z_read')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    reportType === 'z_read'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  58mm Thermal Z-Read
                </button>
                <button
                  onClick={() => setReportType('a4_summary')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    reportType === 'a4_summary'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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

          {/* Document Preview Canvas */}
          <div className="flex justify-center p-6 bg-slate-100/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner min-h-[400px]">
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
                    <p className="text-xl font-semibold font-mono text-slate-900 mt-1">
                      ₱{kpis.total_gross_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
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
      )}

      {/* 3. SUB-TAB 2: DATA EXPORTS & BACKUPS */}
      {activeSubTab === 'exports' && (
        <div className="space-y-6">
          {/* Notification Alert */}
          {downloadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Structured Export List Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Company Data Retrieval & CSV Exports
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download structured records in standard CSV or raw JSON format for external accounting and tax audit
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {/* Item 1: Sales Ledger */}
              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Sales Transactions Ledger</h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        CSV
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Completed orders, line items, timestamps, payment methods, and revenue totals
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportSales}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Export Sales
                </button>
              </div>

              {/* Item 2: Stock Balances */}
              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Inventory Stock Balances</h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        CSV
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Active branch stock quantities, product categories, and price overrides
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportInventory}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Export Stock
                </button>
              </div>

              {/* Item 3: Payroll Sheet */}
              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Staff Wage & Payroll Sheet</h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        CSV
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Shift hours logged from Sunmi POS terminals, hourly wage calculations, and net pay
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportPayroll}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Export Payroll
                </button>
              </div>

              {/* Item 4: Database Backup */}
              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Complete System JSON Backup</h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        JSON
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Raw JSON snapshot containing sales batches, branch matrices, and staff directories
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportBackup}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Backup
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Emergency Offline Ingestion */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setIsDropzoneExpanded(!isDropzoneExpanded)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Emergency Offline Batch File Importer
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Import offline .json batch files manually from Sunmi terminals when internet connection was lost
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>{isDropzoneExpanded ? 'Hide' : 'Expand'}</span>
                {isDropzoneExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isDropzoneExpanded && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <OfflineJsonDropzone onImportBatch={onImportOfflineBatch} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
