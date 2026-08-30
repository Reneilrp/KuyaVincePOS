import React, { useState } from 'react';
import { Users, Clock, Printer, CheckCircle, Calculator, Calendar } from 'lucide-react';
import { Branch, PayrollItem } from '../types';

interface Props {
  branches: Branch[];
  payrollData: PayrollItem[];
  onCalculate: (branchId: string, startDate: string, endDate: string) => Promise<void>;
  onApprove: (records: PayrollItem[]) => Promise<void>;
}

export const PayrollManagerTab: React.FC<Props> = ({ branches, payrollData, onCalculate, onApprove }) => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollItem | null>(null);

  const totalGrossPayroll = payrollData.reduce((sum, p) => sum + p.gross_pay, 0);
  const totalHoursWorked = payrollData.reduce((sum, p) => sum + p.total_hours, 0);

  const handleRunCalculation = async () => {
    setIsCalculating(true);
    try {
      await onCalculate(selectedBranch, startDate, endDate);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApprovePayroll = async () => {
    setIsApproving(true);
    try {
      await onApprove(payrollData);
      alert('Payroll approved and archived successfully!');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Date Range & Branch Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            👥 Staff Timeclock & Automated Payroll
          </h2>
          <p className="text-xs text-slate-400">Calculate staff wages automatically from logged Sunmi timeclocks</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-400 font-medium">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)} className="bg-slate-900 text-white">
                  🏢 {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleRunCalculation}
            disabled={isCalculating}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
          >
            <Calculator className="w-3.5 h-3.5" />
            {isCalculating ? 'Calculating...' : 'Compute Hours'}
          </button>
        </div>
      </div>

      {/* 2. Payroll KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Payroll Cost</span>
          <p className="text-2xl font-bold text-emerald-400 mt-2">₱{totalGrossPayroll.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-1">For selected date cycle</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Accumulated Shift Hours</span>
          <p className="text-2xl font-bold text-blue-400 mt-2">{totalHoursWorked.toFixed(1)} hrs</p>
          <p className="text-xs text-slate-400 mt-1">Logged across all 3 branches</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Staff Active on Payroll</span>
          <p className="text-2xl font-bold text-purple-400 mt-2">{payrollData.length} Staff</p>
          <p className="text-xs text-slate-400 mt-1">Cashiers & branch operators</p>
        </div>
      </div>

      {/* 3. Payroll Calculation Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4 text-center">Hourly Rate</th>
                <th className="py-3.5 px-4 text-center">Hours Logged</th>
                <th className="py-3.5 px-4 text-right">Gross Wages</th>
                <th className="py-3.5 px-4 text-right">Net Payable</th>
                <th className="py-3.5 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {payrollData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">No timeclock records found for this period</td>
                </tr>
              ) : (
                payrollData.map((staff) => (
                  <tr key={staff.user_id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-400">
                        {staff.staff_name.charAt(0)}
                      </div>
                      <div>
                        <p>{staff.staff_name}</p>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{staff.role}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">🏢 {staff.branch_name}</td>
                    <td className="py-3 px-4 text-center font-mono">₱{staff.hourly_rate.toFixed(2)}/hr</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-400">{staff.total_hours.toFixed(1)} hrs</td>
                    <td className="py-3 px-4 text-right font-medium">₱{staff.gross_pay.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">₱{staff.net_pay.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPayslip(staff)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> View Slip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <p className="text-xs text-slate-400">Cycle: {startDate} to {endDate}</p>
          <button
            onClick={handleApprovePayroll}
            disabled={isApproving || payrollData.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {isApproving ? 'Saving...' : 'Approve & Finalize Payroll'}
          </button>
        </div>
      </div>

      {/* 4. Payslip Printable Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="border-b border-slate-800 pb-4 mb-4 text-center">
              <h3 className="text-base font-bold text-white uppercase">Official Employee Payslip</h3>
              <p className="text-xs text-blue-400 font-semibold">{selectedPayslip.branch_name}</p>
              <p className="text-[11px] text-slate-400">Period: {selectedPayslip.period_start} to {selectedPayslip.period_end}</p>
            </div>

            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Employee Name:</span>
                <span className="font-semibold text-white">{selectedPayslip.staff_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Role:</span>
                <span className="uppercase text-xs font-mono">{selectedPayslip.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Hourly Pay Rate:</span>
                <span>₱{selectedPayslip.hourly_rate.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Logged Shift Hours:</span>
                <span className="font-bold text-blue-400">{selectedPayslip.total_hours.toFixed(2)} hours</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Gross Wages:</span>
                <span className="font-semibold text-white">₱{selectedPayslip.gross_pay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Deductions / SSS / Tax:</span>
                <span>-₱{selectedPayslip.deductions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-700 text-base font-bold text-white">
                <span>NET TAKE-HOME PAY:</span>
                <span className="text-emerald-400">₱{selectedPayslip.net_pay.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
