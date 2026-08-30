import React, { useState } from 'react';
import { Building2, Copy, Check, Plus, Edit2, QrCode, Smartphone } from 'lucide-react';
import { Branch } from '../types';

interface Props {
  branches: Branch[];
  onSaveBranch: (branch: Partial<Branch>) => Promise<void>;
}

export const BranchSetupManager: React.FC<Props> = ({ branches, onSaveBranch }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleOpenNew = () => {
    const nextNum = branches.length + 1;
    setEditingBranch({
      name: `Branch ${nextNum} - Zamboanga`,
      code: `BR-0${nextNum}`,
      import_code: `KV-BR0${nextNum}`,
      address: 'Zamboanga City',
      phone: '+63 917 000 0000',
      is_active: true
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch({ ...branch });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editingBranch.name || !editingBranch.import_code) return;

    setIsSubmitting(true);
    try {
      await onSaveBranch(editingBranch);
      setIsEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Add Branch button */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            🏢 Store Branches & Sunmi Device Import Codes
          </h2>
          <p className="text-xs text-slate-400">
            Set up your physical branches and get the unique 6-character Import Codes for your Sunmi handhelds
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Add New Branch
        </button>
      </div>

      {/* 2. Branch Cards Grid with Highlighted Import Codes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {branches.map((branch) => {
          const isCopied = copiedCode === branch.import_code;

          return (
            <div
              key={branch.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-900 flex items-center justify-center text-blue-400 font-bold">
                    🏢
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{branch.name}</h3>
                    <p className="text-xs text-slate-400">{branch.address || 'Zamboanga City'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(branch)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  title="Edit Branch"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Highlighted Branch Import Code Box for Sunmi */}
              <div className="bg-slate-950 border-2 border-dashed border-blue-500/40 rounded-xl p-4 text-center space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  📱 Sunmi Mobile Import Code
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xl font-mono font-black text-blue-400 tracking-widest">
                    {branch.import_code || `KV-BR0${branch.id}`}
                  </span>
                  <button
                    onClick={() => handleCopy(branch.import_code || `KV-BR0${branch.id}`)}
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs"
                    title="Copy Import Code"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Enter this code on the Sunmi device to download this branch's menu & stock
                </p>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Code: <strong className="text-slate-200">{branch.code}</strong></span>
                <span>Contact: {branch.phone || 'N/A'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Edit / Add Branch Modal */}
      {isEditModalOpen && editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🏢 {editingBranch.id ? 'Edit Branch Details' : 'Create New Branch'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure branch location and its Sunmi mobile pairing code</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={editingBranch.name || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  placeholder="e.g. KCC Mall de Zamboanga"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.code || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value })}
                    placeholder="e.g. BR-01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Sunmi Import Code</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.import_code || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, import_code: e.target.value })}
                    placeholder="e.g. KV-BR01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-blue-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Address / Location</label>
                <input
                  type="text"
                  value={editingBranch.address || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  placeholder="e.g. Gov. Camins Ave, Zamboanga City"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingBranch.phone || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                  placeholder="e.g. +63 917 123 4567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
