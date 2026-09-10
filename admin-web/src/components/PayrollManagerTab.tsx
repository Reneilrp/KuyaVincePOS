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

  // Edit Staff Form State (integrated PIN, Status, and Delete)
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("cashier");
  const [editBranchId, setEditBranchId] = useState<number>(branches[0]?.id || 1);
  const [editHourlyRate, setEditHourlyRate] = useState("85.00");
  const [editPinCode, setEditPinCode] = useState("1234");
  const [editIsActive, setEditIsActive] = useState(true);

  // Create Staff Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("cashier");
  const [branchId, setBranchId] = useState<number>(branches[0]?.id || 1);
  const [pinCode, setPinCode] = useState("1234");
  const [hourlyRate, setHourlyRate] = useState("85.00");
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

  // Open Edit Modal & Populate Form
  const openEditModal = (staff: StaffRecord) => {
    setEditingStaff(staff);
    setEditName(staff.name || "");
    setEditRole(staff.role || "cashier");
    setEditBranchId(staff.branch_id || branches[0]?.id || 1);
    setEditHourlyRate(String(staff.hourly_rate || 85));
    setEditPinCode(staff.pin_code || "1234");
    setEditIsActive(staff.is_active !== false);
  };

  // 1. Create Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || pinCode.length !== 4) {
      alert("Please enter a valid staff name and 4-digit PIN.");
      return;
    }

    setIsSubmitting(true);
    try {
      const salt = generatePinSalt();
      const hash = await hashPin(pinCode, salt);
      const { error } = await supabase.from("staff_records").insert([
        {
          branch_id: Number(branchId),
          name: name.trim(),
          role,
          pin_code: pinCode,
          pin_salt: salt,
          pin_hash: hash,
          hourly_rate: parseFloat(hourlyRate || "85"),
          is_active: true
        }
      ]);

      if (error) throw error;
      await onRefreshStaff();
      setIsCreateModalOpen(false);
      setName("");
      setPinCode("1234");
      triggerNotice(`✅ Staff member "${name.trim()}" registered with secure PIN hash!`);
    } catch (e: any) {
      alert("Failed to add staff: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Update Staff (includes Name, Branch, Role, Hourly Wage, PIN, and Active Status)
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editName.trim()) return;
    if (editPinCode.length !== 4) {
      alert("Terminal PIN must be exactly 4 numeric digits.");
      return;
    }

    setIsSubmitting(true);
    try {
      const salt = generatePinSalt();
      const hash = await hashPin(editPinCode, salt);

      const { error } = await supabase
        .from("staff_records")
        .update({
          name: editName.trim(),
          role: editRole,
          branch_id: Number(editBranchId),
          hourly_rate: parseFloat(editHourlyRate || "85"),
          pin_code: editPinCode,
          pin_salt: salt,
          pin_hash: hash,
          is_active: editIsActive
        })
        .eq("id", editingStaff.id);

      if (error) throw error;
      await onRefreshStaff();
      setEditingStaff(null);
      triggerNotice(`✅ Updated details and security credentials for "${editName.trim()}"`);
    } catch (e: any) {
      alert("Failed to update staff: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Delete Staff
  const handleDeleteStaff = async (staff: StaffRecord) => {
    if (!confirm(`Are you sure you want to permanently delete "${staff.name}"? This action cannot be undone.`)) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("staff_records").delete().eq("id", staff.id);
      if (error) throw error;
      await onRefreshStaff();
      setEditingStaff(null);
      triggerNotice(`🗑️ Removed "${staff.name}"`);
    } catch (e: any) {
      alert("Failed to delete staff: " + e.message);
    } finally {
      setIsSubmitting(false);
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
      {/* 1. Sub-Tab Switcher */}
      <div className="flex items-center">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab("directory")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeSubTab === "directory"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            👥 Staff Directory ({staffList.length})
          </button>
          <button
            onClick={() => setActiveSubTab("payroll")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeSubTab === "payroll"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ⏰ Wage Calculations & Slips
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-slate-950 border border-emerald-200 dark:border-slate-800 text-emerald-800 dark:text-emerald-400 text-xs flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* 2. SUB-TAB 1: CENTRALIZED STAFF MASTER DIRECTORY */}
      {activeSubTab === "directory" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Branch Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {b.name} {b.is_active === false ? "(Inactive)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                const firstActive = branches.find(b => b.is_active !== false);
                setBranchId(firstActive?.id || branches[0]?.id || 1);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add New Staff Member
            </button>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Staff Members Found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Add staff members here so they can be assigned to branches and log into Sunmi terminals with their PIN.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add First Staff Member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
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
                        <td className="p-3 font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold text-xs">
                            {staff.name.charAt(0)}
                          </div>
                          <span>{staff.name}</span>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {assignedBr ? `🏢 ${assignedBr.name}` : "Unassigned"}
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 capitalize">{staff.role}</td>
                        <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">
                          ₱{Number(staff.hourly_rate || 85).toFixed(2)}/hr
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 tracking-widest">
                            {staff.pin_code ? "••••" : "1234"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-xs font-medium ${staff.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                            {staff.is_active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => openEditModal(staff)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                            title="Edit Staff Member"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
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
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      🏢 {b.name} {b.is_active === false ? "(Inactive)" : ""}
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
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                />
                <span className="text-slate-500 text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleRunCalculation}
                disabled={isCalculating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs"
              >
                <Calculator className="w-3.5 h-3.5" />
                {isCalculating ? "Calculating..." : "Compute Hours"}
              </button>
            </div>
          </div>

          {/* Payroll KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Payroll Cost</span>
              <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1">
                ₱{totalGrossPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">For selected date cycle</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Accumulated Shift Hours</span>
              <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1">{totalHoursWorked.toFixed(1)} hrs</p>
              <p className="text-xs text-slate-500 mt-0.5">Logged across active branches</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Staff on Payroll</span>
              <p className="text-xl font-semibold font-mono text-blue-600 dark:text-blue-400 mt-1">{payrollData.length} Staff</p>
              <p className="text-xs text-slate-500 mt-0.5">Cashiers & branch operators</p>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
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
                        <td className="p-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {staff.staff_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{staff.staff_name}</p>
                            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{staff.role}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">🏢 {staff.branch_name}</td>
                        <td className="p-3 text-center font-mono">₱{staff.hourly_rate.toFixed(2)}/hr</td>
                        <td className="p-3 text-center font-mono font-medium text-slate-900 dark:text-white">{staff.total_hours.toFixed(1)} hrs</td>
                        <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">₱{staff.gross_pay.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono font-medium text-slate-900 dark:text-white">₱{staff.net_pay.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedPayslip(staff)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors"
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

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Cycle: {startDate} to {endDate}</p>
              <button
                onClick={handleApprovePayroll}
                disabled={isApproving || payrollData.length === 0 || !isSuperAdmin}
                title={!isSuperAdmin ? 'Super Admin access required' : undefined}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
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
                      <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        🏢 {b.name} {b.is_active === false ? "(Inactive)" : ""}
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
                    <option value="cashier" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Cashier</option>
                    <option value="supervisor" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Shift Supervisor</option>
                    <option value="barista" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Barista</option>
                    <option value="manager" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Store Manager</option>
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center text-xs font-mono text-slate-900 dark:text-white tracking-widest focus:outline-none focus:border-blue-500"
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

      {/* Modal: Edit Staff Details (Integrated with PIN reset, status toggle, and delete) */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Edit Staff Member
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update credentials, branch assignment, PIN, active status, or delete
              </p>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4 pt-1">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-normal"
                />
              </div>

              {/* Assigned Branch & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Branch
                  </label>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        🏢 {b.name} {b.is_active === false ? "(Inactive)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="cashier" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Cashier</option>
                    <option value="supervisor" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Shift Supervisor</option>
                    <option value="barista" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Barista</option>
                    <option value="manager" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Store Manager</option>
                  </select>
                </div>
              </div>

              {/* Hourly Wage & 4-Digit Login PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hourly Wage (₱/hr)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editHourlyRate}
                    onChange={(e) => setEditHourlyRate(e.target.value)}
                    placeholder="85.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Terminal PIN</span>
                    <span className="text-[10px] text-slate-400 font-normal">4 Digits</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={editPinCode}
                      onChange={(e) => setEditPinCode(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="1234"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 tracking-widest focus:outline-none focus:border-blue-500"
                    />
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Staff Status Selector (Active vs Deactivated) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Operational Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsActive(true)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      editIsActive
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-400"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Active
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Can log into Sunmi POS
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditIsActive(false)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      !editIsActive
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Deactivated
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Login blocked on POS
                    </p>
                  </button>
                </div>
              </div>

              {/* Danger Zone: Delete Staff */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Permanent Removal</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Delete this staff profile completely</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(editingStaff)}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  title="Delete Staff"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Staff
                </button>
              </div>

              {/* Action Buttons */}
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
                  disabled={isSubmitting || editPinCode.length !== 4}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 text-center">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white uppercase">Official Employee Payslip</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{selectedPayslip.branch_name}</p>
              <p className="text-xs text-slate-500">
                Period: {selectedPayslip.period_start} to {selectedPayslip.period_end}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Employee Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedPayslip.staff_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Role:</span>
                <span className="capitalize text-slate-700 dark:text-slate-300">{selectedPayslip.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Hourly Pay Rate:</span>
                <span className="font-mono text-slate-900 dark:text-white">₱{selectedPayslip.hourly_rate.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Logged Shift Hours:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{selectedPayslip.total_hours.toFixed(2)} hours</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Gross Wages:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">₱{selectedPayslip.gross_pay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Deductions:</span>
                <span className="font-mono text-slate-900 dark:text-white">-₱{selectedPayslip.deductions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
                <span>NET TAKE-HOME PAY:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">₱{selectedPayslip.net_pay.toFixed(2)}</span>
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
