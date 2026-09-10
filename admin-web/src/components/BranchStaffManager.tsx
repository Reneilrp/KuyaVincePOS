import React, { useState } from "react";
import { Users, UserX, UserCheck, Key, Plus, ShieldCheck, Lock, X, Check } from "lucide-react";
import { StaffRecord } from "../types";
import { supabase } from "../services/supabaseClient";
import { hashPin, generatePinSalt } from "../utils/pinHash";

interface Props {
  branchId: number | string;
  branchName: string;
  staffList: StaffRecord[];
  onRefreshStaff: () => Promise<void>;
  triggerNotice: (msg: string) => void;
}

export const BranchStaffManager: React.FC<Props> = ({
  branchId,
  branchName,
  staffList,
  onRefreshStaff,
  triggerNotice,
}) => {
  const branchStaff = staffList.filter((s) => Number(s.branch_id) === Number(branchId) && !s.is_deleted);

  // Modals state
  const [resetPinStaff, setResetPinStaff] = useState<StaffRecord | null>(null);
  const [newPin, setNewPin] = useState("1234");
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Staff Form state
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("cashier");
  const [newHourlyRate, setNewHourlyRate] = useState("85.00");
  const [initialPin, setInitialPin] = useState("1234");

  // 1. Reset / Modify Cashier PIN directly from Branch Profile
  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinStaff || newPin.length !== 4) return;

    setIsSubmitting(true);
    try {
      const salt = generatePinSalt();
      const hash = await hashPin(newPin, salt);

      const { error } = await supabase
        .from("staff_records")
        .update({
          pin_code: newPin,
          pin_salt: salt,
          pin_hash: hash,
          updated_at: new Date().toISOString()
        })
        .eq("id", resetPinStaff.id);

      if (error) throw error;
      await onRefreshStaff();
      triggerNotice(`🔑 Success: PIN for "${resetPinStaff.name}" has been updated to "${newPin}". Mobile POS will sync upon next online connection.`);
      setResetPinStaff(null);
      setNewPin("1234");
    } catch (err: any) {
      alert("Failed to reset PIN: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Add New Cashier directly into this Branch
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || initialPin.length !== 4) return;

    setIsSubmitting(true);
    try {
      const salt = generatePinSalt();
      const hash = await hashPin(initialPin, salt);

      const { error } = await supabase.from("staff_records").insert([
        {
          branch_id: Number(branchId),
          name: newName.trim(),
          role: newRole,
          pin_code: initialPin,
          pin_salt: salt,
          pin_hash: hash,
          hourly_rate: parseFloat(newHourlyRate || "85"),
          is_active: true,
          is_deleted: false
        }
      ]);

      if (error) throw error;
      await onRefreshStaff();
      triggerNotice(`✅ Added "${newName}" to ${branchName} with PIN access.`);
      setIsAddStaffModalOpen(false);
      setNewName("");
      setInitialPin("1234");
    } catch (err: any) {
      alert("Failed to create staff: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Toggle Active/Disabled Status
  const handleToggleStatus = async (staff: StaffRecord) => {
    try {
      const { error } = await supabase
        .from("staff_records")
        .update({ is_active: !staff.is_active })
        .eq("id", staff.id);

      if (error) throw error;
      triggerNotice(`Status for ${staff.name} changed to ${!staff.is_active ? "Active" : "Disabled"}.`);
      await onRefreshStaff();
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
      {/* Header with Title & Add Cashier Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Cashier Roster & Terminal PIN Security ({branchStaff.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage cashier accounts and terminal login PINs for <strong className="text-slate-800 dark:text-slate-200">{branchName}</strong>.
          </p>
        </div>

        <button
          onClick={() => setIsAddStaffModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Cashier to Branch
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-lg flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p>
          PIN modifications here are encrypted with salted SHA-256 hashes and saved directly to the cloud database. When this branch terminal connects online, it downloads the updated PIN for offline use.
        </p>
      </div>

      {/* Staff & PIN Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3">Employee Name</th>
              <th className="p-3">Role</th>
              <th className="p-3 text-center">Terminal PIN Status</th>
              <th className="p-3 font-mono">Rate (₱)</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {branchStaff.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                  <Lock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  No cashiers currently assigned to {branchName}. Click "+ Add Cashier to Branch" to register one.
                </td>
              </tr>
            ) : (
              branchStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{staff.name}</p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">ID #{staff.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 capitalize">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {staff.role}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="font-mono text-xs text-slate-800 dark:text-slate-200 font-bold">••••</span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Hash Active
                      </span>
                    </div>
                  </td>
                  <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">
                    ₱{Number(staff.hourly_rate || 85).toFixed(2)}/hr
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs font-medium ${staff.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                      {staff.is_active ? "● Active" : "○ Disabled"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Modify / Reset PIN Button */}
                      <button
                        onClick={() => {
                          setResetPinStaff(staff);
                          setNewPin("1234");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-blue-600 font-medium rounded text-xs transition-colors"
                        title="Change / Reset 4-digit PIN"
                      >
                        <Key className="w-3.5 h-3.5" /> Modify PIN
                      </button>

                      {/* Enable/Disable Access Toggle */}
                      <button
                        onClick={() => handleToggleStatus(staff)}
                        title={staff.is_active ? "Disable POS Access" : "Enable POS Access"}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                      >
                        {staff.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Reset / Modify PIN Modal */}
      {resetPinStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Modify PIN
              </h3>
              <button
                onClick={() => setResetPinStaff(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Updating PIN for <strong className="text-slate-900 dark:text-white">{resetPinStaff.name}</strong> at <strong className="text-slate-900 dark:text-white">{branchName}</strong>.
              </p>
            </div>

            <form onSubmit={handleResetPinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NEW 4-DIGIT PIN CODE
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  pattern="[0-9]{4}"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="1234"
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-blue-600 rounded-lg p-2.5 text-center text-xl font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none"
                />
                <span className="block text-xs text-slate-500 text-center mt-1">Must be exactly 4 digits (e.g. 1234, 4321)</span>
              </div>

              <div className="flex gap-2 pt-2">
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
                  {isSubmitting ? "Updating..." : "Save PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Staff Directly to this Branch */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Register Cashier for {branchName}
              </h3>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Juan dela Cruz"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role / Position
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="supervisor">Shift Supervisor</option>
                    <option value="manager">Store Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hourly Wage (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newHourlyRate}
                    onChange={(e) => setNewHourlyRate(e.target.value)}
                    placeholder="85.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  INITIAL 4-DIGIT PIN CODE
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  pattern="[0-9]{4}"
                  value={initialPin}
                  onChange={(e) => setInitialPin(e.target.value)}
                  placeholder="1234"
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-blue-600 rounded-lg p-2 text-center text-lg font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || initialPin.length !== 4 || !newName.trim()}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Add Cashier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
