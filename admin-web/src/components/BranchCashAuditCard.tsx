import React, { useState } from 'react';
import { DollarSign, AlertCircle, CheckCircle2, Edit3, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  branchName: string;
  cashSales: number;
  openingFloat?: number;
  // Cashier-entered count from the Sunmi EOD batch (authoritative, read-only unless overridden)
  cashierEnteredCash?: number;
  // Admin-entered override value
  initialCountedCash?: number;
  isAdminOverride?: boolean;
  onSaveCountedCash?: (counted: number) => void;
  onEnableOverride?: () => void;
}

export const BranchCashAuditCard: React.FC<Props> = ({
  branchName,
  cashSales,
  openingFloat = 1000.0,
  cashierEnteredCash,
  initialCountedCash,
  isAdminOverride = false,
  onSaveCountedCash,
  onEnableOverride
}) => {
  const { t } = useLanguage();
  const expectedCash = openingFloat + cashSales;
  const [actualCounted, setActualCounted] = useState<string>(
    initialCountedCash !== undefined ? initialCountedCash.toFixed(2) : expectedCash.toFixed(2)
  );
  const [isEditing, setIsEditing] = useState(false);

  // One value for variance — cashier's if present and not overridden, otherwise admin input
  const showCashierReadOnly = cashierEnteredCash !== undefined && !isAdminOverride;
  const parsedCounted = showCashierReadOnly
    ? cashierEnteredCash
    : (parseFloat(actualCounted) || 0);

  const variance = parsedCounted - expectedCash;
  const isBalanced = Math.abs(variance) < 0.01;
  const isOver = variance > 0.01;
  const isShort = variance < -0.01;

  const handleSave = () => {
    if (onSaveCountedCash) {
      onSaveCountedCash(parseFloat(actualCounted) || 0);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> {t('cashBalancingTitle')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('cashBalancingSubtitle')} ({branchName})
          </p>
        </div>

        {/* Variance Status Badge */}
        <div className="flex items-center gap-2">
          {isBalanced && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('statusBalanced')}
            </span>
          )}
          {isOver && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('statusOver', { amount: variance.toFixed(2) })}
            </span>
          )}
          {isShort && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-xs font-bold shadow-sm animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" /> {t('statusShort', { amount: Math.abs(variance).toFixed(2) })}
            </span>
          )}
        </div>
      </div>

      {/* 4-Column Cash Reconciliation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 pt-1">
        {/* 1. Opening Float */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {t('startingFloat')}
          </span>
          <p className="text-lg font-bold text-slate-200 mt-1">₱{openingFloat.toFixed(2)}</p>
          <span className="text-[10px] text-slate-500">{t('startingFloatSub')}</span>
        </div>

        {/* 2. Cash Sales */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {t('todayCashSales')}
          </span>
          <p className="text-lg font-bold text-emerald-400 mt-1">+₱{cashSales.toFixed(2)}</p>
          <span className="text-[10px] text-slate-500">{t('todayCashSalesSub')}</span>
        </div>

        {/* 3. Expected Total */}
        <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/50 bg-blue-950/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
            {t('expectedDrawer')}
          </span>
          <p className="text-lg font-black text-blue-400 mt-1">₱{expectedCash.toFixed(2)}</p>
          <span className="text-[10px] text-slate-500">{t('expectedDrawerSub')}</span>
        </div>

        {/* 4. Actual Physical Counted */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t('actualCounted')}
            </span>
            {showCashierReadOnly ? (
              <button
                onClick={onEnableOverride}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 border border-amber-700 rounded px-1.5 py-0.5"
              >
                <AlertCircle className="w-3 h-3" /> {t('adminOverride')}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> {isEditing ? t('done') : t('editCount')}
              </button>
            )}
          </div>

          {showCashierReadOnly ? (
            <>
              {/* Cashier read-only display */}
              <p className="text-lg font-black text-white mt-1">₱{cashierEnteredCash!.toFixed(2)}</p>
              <span className="text-[10px] text-slate-400">{t('enteredByCashier')}</span>
            </>
          ) : (
            <>
              {isAdminOverride && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-full mb-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {t('adminOverrideActive')}
                </span>
              )}
              {isEditing ? (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={actualCounted}
                    onChange={(e) => setActualCounted(e.target.value)}
                    className="w-full bg-slate-900 border border-blue-500 rounded-lg px-2 py-1 text-sm font-bold text-white focus:outline-none"
                  />
                  <button
                    onClick={handleSave}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
                  >
                    {t('save')}
                  </button>
                </div>
              ) : (
                <p className="text-lg font-black text-white mt-1">₱{parsedCounted.toFixed(2)}</p>
              )}
              <span className="text-[10px] text-slate-500">{t('actualCountedSub')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
