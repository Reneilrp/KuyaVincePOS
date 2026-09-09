import React, { useState } from "react";
import {
  Users,
  Clock,
  Printer,
  CheckCircle,
  Calculator,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Key,
  Search,
  Building2,
  ShieldCheck,
  UserCheck,
  UserX,
  Check
} from "lucide-react";
import { Branch, PayrollItem, StaffRecord } from "../types";
import { supabase } from "../services/supabaseClient";
import { hashPin, generatePinSalt } from "../utils/pinHash";

interface Props {
  branches: Branch[];
  payrollData: PayrollItem[];
  staffList: StaffRecord[];
  onRefreshStaff: () => Promise<void>;
  onCalculate: (branchId: string, startDate: string, endDate: string) => Promise<void>;
  onApprove: (records: PayrollItem[]) => Promise<void>;
  currentUser?: { email: string; role: string } | null;
}

export const PayrollManagerTab: React.FC<Props> = ({
  branches,
  payrollData,
  staffList,
  onRefreshStaff,
  onCalculate,
  onApprove,
  currentUser
}) => {
  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "payroll">("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");

  // Staff CRUD Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRecord | null>(null);
  const [resetPinStaff, setResetPinStaff] = useState<StaffRecord | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("cashier");
  const [branchId, setBranchId] = useState<number>(branches[0]?.id || 1);
  const [pinCode, setPinCode] = useState("1234");
  const [hourlyRate, setHourlyRate] = useState("85.00");
  const [newPin, setNewPin] = useState("1234");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Payroll Calculator State
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCalcBranch, setSelectedCalcBranch] = useState("all");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollItem | null>(null);

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // 1. Create Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pinCode) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("staff_records").insert([
        {
          branch_id: Number(branchId),
          name,
          role,
          pin_code: pinCode,
          hourly_rate: parseFloat(hourlyRate || "85"),
          is_active: true
        }
      ]);

      if (error) throw error;
      await onRefreshStaff();
      setIsCreateModalOpen(false);
      setName("");
      triggerNotice(`✅ Staff member "${name}" registered successfully!`);
    } catch (e: any) {
      alert("Failed to add staff: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Update Staff
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("staff_records")
        .update({
          name: editingStaff.name,
          role: editingStaff.role,
          branch_id: Number(editingStaff.branch_id),
          hourly_rate: parseFloat(String(editingStaff.hourly_rate || 85))
        })
        .eq("id", editingStaff.id);

      if (error) throw error;
      await onRefreshStaff();
      setEditingStaff(null);
      triggerNotice(`✅ Updated details for "${editingStaff.name}"`);
    } catch (e: any) {
      alert("Failed to update staff: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Reset PIN
  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinStaff || newPin.length !== 4) return;

    setIsSubmitting(true);
    try {
      const salt = generatePinSalt();
      const hash = await hashPin(newPin, salt);
      const { error } = await supabase
        .from("staff_records")
        .update({ pin_code: newPin, pin_salt: salt, pin_hash: hash })
        .eq("id", resetPinStaff.id);

      if (error) throw error;
      await onRefreshStaff();
      triggerNotice(`🔑 PIN for "${resetPinStaff.name}" updated to ${newPin}!`);
      setResetPinStaff(null);
    } catch (e: any) {
      alert("Failed to reset PIN: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Toggle Active / Disabled
  const handleToggleStatus = async (staff: StaffRecord) => {
    try {
      const { error } = await supabase
        .from("staff_records")
        .update({ is_active: !staff.is_active })
        .eq("id", staff.id);

      if (error) throw error;
      await onRefreshStaff();
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    }
  };

  // 5. Delete Staff
  const handleDeleteStaff = async (staff: StaffRecord) => {
    if (!confirm(`Are you sure you want to permanently delete "${staff.name}"?`)) return;
    try {
      const { error } = await supabase.from("staff_records").delete().eq("id", staff.id);
      if (error) throw error;
      await onRefreshStaff();
      triggerNotice(`🗑️ Removed "${staff.name}"`);
    } catch (e: any) {
      alert("Failed to delete: " + e.message);
    }
  };

  // Filter staff list
  const activeStaff = staffList.filter(s => !s.is_deleted);
  const filteredStaff = activeStaff.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = filterBranch === "all" || String(s.branch_id) === filterBranch;
    return matchesSearch && matchesBranch;
  });

  const totalGrossPayroll = payrollData.reduce((sum, p) => sum + p.gross_pay, 0);
  const totalHoursWorked = payrollData.reduce((sum, p) => sum + p.total_hours, 0);

  const handleRunCalculation = async () => {
    setIsCalculating(true);
    try {
      await onCalculate(selectedCalcBranch, startDate, endDate);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApprovePayroll = async () => {
    setIsApproving(true);
    try {
      await onApprove(payrollData);
      alert("Payroll approved and archived successfully!");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            👥 Staff Timeclocks & Hourly Payroll Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Centralized company-wide staff directory and automated payroll wage calculations
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveSubTab("directory")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeSubTab === "directory"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            👥 Staff Directory ({staffList.length})
          </button>
          <button
            onClick={() => setActiveSubTab("payroll")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeSubTab === "payroll"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⏰ Wage Calculations & Slips
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* 2. SUB-TAB 1: CENTRALIZED STAFF MASTER DIRECTORY */}
      {activeSubTab === "directory" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff name or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Branch Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer text-xs text-slate-200"
                >
                  <option value="all" className="bg-slate-900 text-white">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)} className="bg-slate-900 text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setBranchId(branches[0]?.id || 1);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Add New Staff Member
            </button>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">No Staff Members Found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Add staff members here so they can be assigned to branches and log into Sunmi terminals with their PIN.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add First Staff Member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Assigned Branch</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Hourly Wage</th>
                    <th className="p-3 text-center">Login PIN</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredStaff.map((staff) => {
                    const assignedBr = branches.find((b) => b.id === staff.branch_id);

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-medium text-white flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold text-xs">
                            {staff.name.charAt(0)}
                          </div>
                          <span>{staff.name}</span>
                        </td>
                        <td className="p-3 text-slate-300">
                          {assignedBr ? `🏢 ${assignedBr.name}` : "Unassigned"}
                        </td>
                        <td className="p-3 text-slate-400 capitalize">{staff.role}</td>
                        <td className="p-3 font-mono font-medium text-white">
                          ₱{Number(staff.hourly_rate || 85).toFixed(2)}/hr
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 tracking-widest">
                            {staff.pin_code ? "••••" : "1234"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-xs font-medium ${staff.is_active ? "text-emerald-400" : "text-slate-500"}`}>
                            {staff.is_active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setResetPinStaff(staff);
                                setNewPin("1234");
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-800 text-blue-400 rounded transition-colors"
                              title="Reset 4-Digit PIN"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingStaff({ ...staff })}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-800 text-slate-300 rounded transition-colors"
                              title="Edit Staff Member"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(staff)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                              title={staff.is_active ? "Deactivate" : "Activate"}
                            >
                              {staff.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff)}
                              disabled={!isSuperAdmin}
                              title={!isSuperAdmin ? 'Super Admin access required' : 'Delete Permanently'}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. SUB-TAB 2: WAGE CALCULATIONS & AUTOMATED SLIPS */}
      {activeSubTab === "payroll" && (
        <div className="space-y-6">
          {/* Date Range & Branch Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                ⏰ Automated Shift Wage Calculator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Calculate staff wages automatically from logged Sunmi timeclocks</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">Branch:</span>
                <select
                  value={selectedCalcBranch}
                  onChange={(e) => setSelectedCalcBranch(e.target.value)}
                  className="bg-transparent text-xs text-slate-900 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)} className="bg-slate-900 text-white">
                      🏢 {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-900 dark:text-slate-200 focus:outline-none cursor-pointer"
                />
                <span className="text-slate-500 text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-900 dark:text-slate-200 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleRunCalculation}
                disabled={isCalculating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                <Calculator className="w-3.5 h-3.5" />
                {isCalculating ? "Calculating..." : "Compute Hours"}
              </button>
            </div>
          </div>

          {/* Payroll KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Payroll Cost</span>
              <p className="text-xl font-semibold font-mono text-white mt-1">
                ₱{totalGrossPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">For selected date cycle</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Accumulated Shift Hours</span>
              <p className="text-xl font-semibold font-mono text-white mt-1">{totalHoursWorked.toFixed(1)} hrs</p>
              <p className="text-xs text-slate-500 mt-0.5">Logged across all branches</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Staff on Payroll</span>
              <p className="text-xl font-semibold font-mono text-blue-400 mt-1">{payrollData.length} Staff</p>
              <p className="text-xs text-slate-500 mt-0.5">Cashiers & branch operators</p>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3 text-center">Hourly Rate</th>
                    <th className="p-3 text-center">Hours Logged</th>
                    <th className="p-3 text-right">Gross Wages</th>
                    <th className="p-3 text-right">Net Payable</th>
                    <th className="p-3 text-right">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {payrollData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        No timeclock records found for this period
                      </td>
                    </tr>
                  ) : (
                    payrollData.map((staff) => (
                      <tr key={staff.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-medium text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                            {staff.staff_name.charAt(0)}
                          </div>
                          <div>
                            <p>{staff.staff_name}</p>
                            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{staff.role}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">🏢 {staff.branch_name}</td>
                        <td className="p-3 text-center font-mono">₱{staff.hourly_rate.toFixed(2)}/hr</td>
                        <td className="p-3 text-center font-mono font-medium text-white">{staff.total_hours.toFixed(1)} hrs</td>
                        <td className="p-3 text-right font-mono text-slate-300">₱{staff.gross_pay.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono font-medium text-white">₱{staff.net_pay.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedPayslip(staff)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded transition-colors"
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

            <div className="p-3 bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Cycle: {startDate} to {endDate}</p>
              <button
                onClick={handleApprovePayroll}
                disabled={isApproving || payrollData.length === 0 || !isSuperAdmin}
                title={!isSuperAdmin ? 'Super Admin access required' : undefined}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                {isApproving ? "Saving..." : "Approve & Finalize Payroll"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Create New Staff */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" /> Add New Staff Member
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Register employee for timeclocks and POS terminal access</p>

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Branch</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        🏢 {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="supervisor">Shift Supervisor</option>
                    <option value="barista">Barista</option>
                    <option value="manager">Store Manager</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hourly Wage (₱/hr)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="85.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">4-Digit Terminal PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="1234"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center text-xs font-mono text-white tracking-widest focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Register Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Staff */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-slate-400" /> Edit Staff Details
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Update employee information and branch transfer</p>

            <form onSubmit={handleUpdateStaff} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Branch</label>
                  <select
                    value={editingStaff.branch_id || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, branch_id: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        🏢 {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="supervisor">Shift Supervisor</option>
                    <option value="barista">Barista</option>
                    <option value="manager">Store Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hourly Wage (₱/hr)</label>
                <input
                  type="number"
                  step="0.5"
                  value={editingStaff.hourly_rate || 85}
                  onChange={(e) => setEditingStaff({ ...editingStaff, hourly_rate: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reset PIN */}
      {resetPinStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-400" /> Reset PIN for {resetPinStaff.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enter a new 4-digit PIN for Sunmi terminal login</p>

            <form onSubmit={handleResetPin} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New 4-Digit PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 5678"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center text-xl font-mono font-semibold text-blue-400 tracking-widest focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPinStaff(null)}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || newPin.length !== 4}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 text-center">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white uppercase">Official Employee Payslip</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedPayslip.branch_name}</p>
              <p className="text-xs text-slate-500">
                Period: {selectedPayslip.period_start} to {selectedPayslip.period_end}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Employee Name:</span>
                <span className="font-medium text-white">{selectedPayslip.staff_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Role:</span>
                <span className="capitalize text-slate-300">{selectedPayslip.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Hourly Pay Rate:</span>
                <span className="font-mono">₱{selectedPayslip.hourly_rate.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Logged Shift Hours:</span>
                <span className="font-mono font-medium text-white">{selectedPayslip.total_hours.toFixed(2)} hours</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Gross Wages:</span>
                <span className="font-mono font-medium text-white">₱{selectedPayslip.gross_pay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Deductions:</span>
                <span className="font-mono">-₱{selectedPayslip.deductions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-800 text-sm font-semibold text-white">
                <span>NET TAKE-HOME PAY:</span>
                <span className="font-mono">₱{selectedPayslip.net_pay.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
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
