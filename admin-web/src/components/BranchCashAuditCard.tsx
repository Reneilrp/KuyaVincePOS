import React, { useState } from 'react';
import { DollarSign, AlertCircle, Edit3 } from 'lucide-react';
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" /> {t('cashBalancingTitle')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('cashBalancingSubtitle')} ({branchName})
          </p>
        </div>

        {/* Variance Status Text */}
        <div className="flex items-center gap-2">
          {isBalanced && (
            <span className="text-xs font-medium text-slate-300">
              {t('statusBalanced')}
            </span>
          )}
          {isOver && (
            <span className="text-xs font-medium text-slate-300 font-mono">
              +{t('statusOver', { amount: variance.toFixed(2) })}
            </span>
          )}
          {isShort && (
            <span className="text-xs font-medium text-rose-400 font-mono">
              -{t('statusShort', { amount: Math.abs(variance).toFixed(2) })}
            </span>
          )}
        </div>
      </div>

      {/* 4-Column Cash Reconciliation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
        {/* 1. Opening Float */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <span className="text-xs font-medium text-slate-400 block">
            {t('startingFloat')}
          </span>
          <p className="text-base font-semibold font-mono text-slate-200 mt-1">₱{openingFloat.toFixed(2)}</p>
          <span className="text-xs text-slate-500 mt-0.5 block">{t('startingFloatSub')}</span>
        </div>

        {/* 2. Cash Sales */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <span className="text-xs font-medium text-slate-400 block">
            {t('todayCashSales')}
          </span>
          <p className="text-base font-semibold font-mono text-slate-200 mt-1">+₱{cashSales.toFixed(2)}</p>
          <span className="text-xs text-slate-500 mt-0.5 block">{t('todayCashSalesSub')}</span>
        </div>

        {/* 3. Expected Total */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <span className="text-xs font-medium text-slate-400 block">
            {t('expectedDrawer')}
          </span>
          <p className="text-base font-semibold font-mono text-white mt-1">₱{expectedCash.toFixed(2)}</p>
          <span className="text-xs text-slate-500 mt-0.5 block">{t('expectedDrawerSub')}</span>
        </div>

        {/* 4. Actual Physical Counted */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-400">
              {t('actualCounted')}
            </span>
            {showCashierReadOnly ? (
              <button
                onClick={onEnableOverride}
                className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {t('adminOverride')}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> {isEditing ? t('done') : t('editCount')}
              </button>
            )}
          </div>

          {showCashierReadOnly ? (
            <>
              <p className="text-base font-semibold font-mono text-white mt-1">₱{cashierEnteredCash!.toFixed(2)}</p>
              <span className="text-xs text-slate-500 mt-0.5 block">{t('enteredByCashier')}</span>
            </>
          ) : (
            <>
              {isAdminOverride && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400 mb-1 mt-0.5">
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
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSave}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
                  >
                    {t('save')}
                  </button>
                </div>
              ) : (
                <p className="text-base font-semibold font-mono text-white mt-1">₱{parsedCounted.toFixed(2)}</p>
              )}
              <span className="text-xs text-slate-500 mt-0.5 block">{t('actualCountedSub')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
