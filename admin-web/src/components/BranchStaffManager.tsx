import React, { useState } from "react";
import { Users, Key, Plus, ShieldCheck, UserCheck, UserX, Check, AlertCircle, UserPlus } from "lucide-react";
import { StaffRecord } from "../types";
import { supabase } from "../services/supabaseClient";

interface Props {
  branchId: number;
  branchName: string;
  staffList: StaffRecord[];
  onRefreshStaff: () => Promise<void>;
}

export const BranchStaffManager: React.FC<Props> = ({
  branchId,
  branchName,
  staffList,
  onRefreshStaff
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSelectExistingModalOpen, setIsSelectExistingModalOpen] = useState(false);
  const [selectedExistingStaffId, setSelectedExistingStaffId] = useState<number | null>(null);

  const [resetPinStaff, setResetPinStaff] = useState<StaffRecord | null>(null);
  const [newPin, setNewPin] = useState("1234");
  const [name, setName] = useState("");
  const [role, setRole] = useState("cashier");
  const [pinCode, setPinCode] = useState("1234");
  const [hourlyRate, setHourlyRate] = useState("85.00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Staff currently assigned to this branch
  const branchStaff = staffList.filter((s) => Number(s.branch_id) === Number(branchId));

  // Staff from other branches or unassigned that can be transferred/assigned here
  const otherStaff = staffList.filter((s) => Number(s.branch_id) !== Number(branchId));

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // 1. Direct Add New Cashier to this Branch
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pinCode) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("staff_records").insert([
        {
          branch_id: branchId,
          name,
          role,
          pin_code: pinCode,
          hourly_rate: parseFloat(hourlyRate || "85"),
          is_active: true
        }
      ]);

      if (error) throw error;
      await onRefreshStaff();
      setIsAddModalOpen(false);
      setName("");
      triggerNotice(`✅ Added cashier "${name}" to ${branchName}`);
    } catch (e: any) {
      alert("Failed to add cashier: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Select and Assign Existing Staff to this Branch
  const handleAssignExistingStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExistingStaffId) return;

    setIsSubmitting(true);
    try {
      const target = staffList.find((s) => s.id === selectedExistingStaffId);
      const { error } = await supabase
        .from("staff_records")
        .update({ branch_id: branchId })
        .eq("id", selectedExistingStaffId);

      if (error) throw error;
      await onRefreshStaff();
      setIsSelectExistingModalOpen(false);
      triggerNotice(`✅ Assigned "${target?.name}" to ${branchName}!`);
    } catch (e: any) {
      alert("Failed to assign staff: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Reset PIN
  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinStaff || !newPin || newPin.length !== 4) {
      alert("Please enter a valid 4-digit numeric PIN.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("staff_records")
        .update({ pin_code: newPin })
        .eq("id", resetPinStaff.id);

      if (error) throw error;
      await onRefreshStaff();
      triggerNotice(`🔑 PIN for "${resetPinStaff.name}" successfully updated to ${newPin}!`);
      setResetPinStaff(null);
    } catch (e: any) {
      alert("Failed to reset PIN: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Toggle Active Status
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Cashier Roster & PIN Access ({branchStaff.length})
          </h3>
          <p className="text-xs text-slate-400">
            Manage cashiers authorized to log into the Sunmi POS terminal at {branchName}
          </p>
        </div>

        {/* Action Buttons: Select Existing or Add New */}
        <div className="flex flex-wrap items-center gap-2">
          {otherStaff.length > 0 && (
            <button
              onClick={() => {
                setSelectedExistingStaffId(otherStaff[0]?.id || null);
                setIsSelectExistingModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-blue-400" /> Select Existing Staff
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New Cashier
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {branchStaff.length === 0 ? (
        <div className="p-10 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">No Cashiers Assigned to this Branch</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Select an existing staff member from your company roster or register a new cashier with a 4-digit PIN.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            {otherStaff.length > 0 && (
              <button
                onClick={() => {
                  setSelectedExistingStaffId(otherStaff[0]?.id || null);
                  setIsSelectExistingModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition"
              >
                <UserPlus className="w-4 h-4 text-blue-400" /> Select Existing Staff
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
            >
              <Plus className="w-4 h-4" /> Add New Cashier
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Staff Name</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Hourly Wage</th>
                <th className="p-3.5 text-center">Active 4-Digit PIN</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {branchStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-bold text-white flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-bold text-xs">
                      {staff.name.charAt(0)}
                    </div>
                    <span>{staff.name}</span>
                  </td>
                  <td className="p-3.5 text-slate-400 capitalize">{staff.role}</td>
                  <td className="p-3.5 font-bold text-slate-200">₱{Number(staff.hourly_rate || 85).toFixed(2)}/hr</td>
                  <td className="p-3.5 text-center">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-slate-950 text-blue-400 border border-slate-800 tracking-widest">
                      {staff.pin_code ? "••••" : "1234"}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        staff.is_active
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-rose-950 text-rose-400 border border-rose-800"
                      }`}
                    >
                      {staff.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setResetPinStaff(staff);
                          setNewPin("1234");
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold rounded-lg transition text-xs flex items-center gap-1"
                        title="Change Cashier PIN"
                      >
                        <Key className="w-3 h-3" /> Reset PIN
                      </button>
                      <button
                        onClick={() => handleToggleStatus(staff)}
                        className={`p-1.5 rounded-lg transition ${
                          staff.is_active
                            ? "bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                            : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        }`}
                        title={staff.is_active ? "Disable Access" : "Enable Access"}
                      >
                        {staff.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Select Existing Staff from Company Directory */}
      {isSelectExistingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" /> Assign Existing Staff to {branchName}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Select an employee from the company-wide directory</p>

            <form onSubmit={handleAssignExistingStaff} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Employee</label>
                <select
                  value={selectedExistingStaffId || ""}
                  onChange={(e) => setSelectedExistingStaffId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {otherStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.role.toUpperCase()} (₱{Number(s.hourly_rate || 85).toFixed(2)}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSelectExistingModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedExistingStaffId}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
                >
                  {isSubmitting ? "Assigning..." : "Assign to Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add New Cashier Directly */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Add Cashier to {branchName}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Cashier will use their 4-digit PIN on the Sunmi terminal</p>

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Cashier Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="supervisor">Shift Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Hourly Rate (₱/hr)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="85.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-400 uppercase mb-1">Initial 4-Digit Login PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="1234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-lg font-mono font-bold text-blue-400 tracking-widest focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Register Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reset PIN */}
      {resetPinStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" /> Reset PIN for {resetPinStaff.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Enter a new 4-digit PIN for Sunmi terminal login</p>

            <form onSubmit={handleResetPinSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">New 4-Digit PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 5678"
                  className="w-full bg-slate-950 border-2 border-blue-500 rounded-xl p-3 text-center text-2xl font-mono font-bold text-blue-400 tracking-widest focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPinStaff(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || newPin.length !== 4}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
