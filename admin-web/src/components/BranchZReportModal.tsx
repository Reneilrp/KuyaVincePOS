import React from 'react';
import { Printer, X } from 'lucide-react';
import { Branch } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  branch: Branch;
  grossSales: number;
  ordersCount: number;
  cashSales: number;

  openingFloat?: number;
  countedCash?: number;
}

export const BranchZReportModal: React.FC<Props> = ({
  visible,
  onClose,
  branch,
  grossSales,
  ordersCount,
  cashSales,
  openingFloat = 1000.0,
  countedCash
}) => {
  if (!visible) return null;

  const expectedDrawer = openingFloat + cashSales;
  const actualCount = countedCash !== undefined ? countedCash : expectedDrawer;
  const variance = actualCount - expectedDrawer;
  const avgOrder = ordersCount > 0 ? grossSales / ordersCount : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md shadow-xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              🧾 58mm Thermal Z-Reading Preview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{branch.name} Audit Slip</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 58mm POS Thermal Receipt Layout */}
        <div className="flex justify-center my-2">
          <div className="bg-white text-black font-mono text-xs w-[300px] p-5 rounded-lg border border-slate-300">
            <div className="text-center space-y-0.5 mb-3">
              <p className="font-semibold text-sm uppercase">*** DAILY Z-READING ***</p>
              <p className="font-semibold text-xs">{branch.name}</p>
              <p className="text-[10px] text-gray-700">Code: [{branch.code}]</p>
              <p className="text-[9px] text-gray-500">Zamboanga City, Philippines</p>
              <p className="text-[10px] text-gray-700 pt-1">Date: {new Date().toISOString().split('T')[0]}  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <div className="border-t border-b border-dashed border-black py-2 my-2 space-y-1">
              <div className="flex justify-between">
                <span>TOTAL GROSS SALES:</span>
                <span className="font-semibold">₱{grossSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>TOTAL ORDERS:</span>
                <span className="font-semibold">{ordersCount}</span>
              </div>
              <div className="flex justify-between">
                <span>AVERAGE TICKET:</span>
                <span>₱{avgOrder.toFixed(2)}</span>
              </div>
            </div>

            <p className="font-semibold text-[11px] mt-2 mb-1">PAYMENT TENDER MIX:</p>
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Cash:</span>
                <span>₱{cashSales.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-black my-2 pt-2">
              <p className="font-semibold text-[11px] mb-1">CASH RECONCILIATION:</p>
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>₱{openingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales:</span>
                  <span>₱{cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Expected in Drawer:</span>
                  <span>₱{expectedDrawer.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual Counted:</span>
                  <span>₱{actualCount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t border-dotted border-gray-400">
                  <span>Variance:</span>
                  <span className={variance < 0 ? 'text-red-600' : ''}>
                    {variance === 0 ? '₱0.00 [BALANCED]' : variance > 0 ? `+₱${variance.toFixed(2)} [OVER]` : `-₱${Math.abs(variance).toFixed(2)} [SHORT]`}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-black pt-3 mt-4 space-y-3 text-[10px]">
              <div>
                <p>Manager Signature: __________________</p>
              </div>
              <div>
                <p>Cashier Signature: __________________</p>
              </div>
              <div className="text-center pt-2 text-[9px] text-gray-500">
                <p>KuyaVince POS • Cloud System</p>
                <p>*** END OF AUDIT REPORT ***</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Thermal Slip
          </button>
        </div>
      </div>
    </div>
  );
};
