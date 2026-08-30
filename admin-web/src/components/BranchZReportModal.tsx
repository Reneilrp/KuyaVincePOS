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
  ewalletSales: number;
  cardSales: number;
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
  ewalletSales,
  cardSales,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              🧾 58mm Thermal Z-Reading Preview
            </h3>
            <p className="text-[11px] text-slate-400">{branch.name} Audit Slip</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 58mm POS Thermal Receipt Layout */}
        <div className="flex justify-center my-2">
          <div className="bg-white text-black font-mono text-xs w-[300px] p-5 rounded-lg shadow-xl border border-slate-300">
            <div className="text-center space-y-0.5 mb-3">
              <p className="font-black text-sm uppercase">*** DAILY Z-READING ***</p>
              <p className="font-bold text-xs">{branch.name}</p>
              <p className="text-[10px] text-gray-700">Code: [{branch.code}]</p>
              <p className="text-[9px] text-gray-500">Zamboanga City, Philippines</p>
              <p className="text-[10px] text-gray-700 pt-1">Date: {new Date().toISOString().split('T')[0]}  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <div className="border-t border-b border-dashed border-black py-2 my-2 space-y-1">
              <div className="flex justify-between">
                <span>TOTAL GROSS SALES:</span>
                <span className="font-bold">₱{grossSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>TOTAL ORDERS:</span>
                <span className="font-bold">{ordersCount}</span>
              </div>
              <div className="flex justify-between">
                <span>AVERAGE TICKET:</span>
                <span>₱{avgOrder.toFixed(2)}</span>
              </div>
            </div>

            <p className="font-bold text-[11px] mt-2 mb-1">PAYMENT TENDER MIX:</p>
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Cash:</span>
                <span>₱{cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>E-Wallets (GCash/Maya):</span>
                <span>₱{ewalletSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Card Terminal:</span>
                <span>₱{cardSales.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-black my-2 pt-2">
              <p className="font-bold text-[11px] mb-1">CASH RECONCILIATION:</p>
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>₱{openingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales:</span>
                  <span>₱{cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Expected in Drawer:</span>
                  <span>₱{expectedDrawer.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual Counted:</span>
                  <span>₱{actualCount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-dotted border-gray-400">
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
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20"
          >
            <Printer className="w-4 h-4" /> Print Thermal Slip
          </button>
        </div>
      </div>
    </div>
  );
};
