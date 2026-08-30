import React, { useState } from 'react';
import { Smartphone, Plus, CheckCircle2, Wifi, WifiOff, Key, Building2 } from 'lucide-react';
import { Branch, Device } from '../types';

interface Props {
  branches: Branch[];
  devices: Device[];
  onPairNewDevice: (serial: string, branchId: number, name: string) => Promise<void>;
}

export const DeviceProvisioningTab: React.FC<Props> = ({ branches, devices, onPairNewDevice }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceSerial, setDeviceSerial] = useState('SUNMI-V2S-' + Math.floor(100000 + Math.random() * 900000));
  const [selectedBranchId, setSelectedBranchId] = useState<number>(branches[0]?.id || 1);
  const [terminalName, setTerminalName] = useState('Handheld Counter 02');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onPairNewDevice(deviceSerial, selectedBranchId, terminalName);
      setIsModalOpen(false);
      setDeviceSerial('SUNMI-V2S-' + Math.floor(100000 + Math.random() * 900000));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Register Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            📱 Dynamic Sunmi Device Provisioning & Onboarding
          </h2>
          <p className="text-xs text-slate-400">Manage registered Sunmi handheld POS devices across Branch 1, 2, 3 and add new hardware</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Provision New Device
        </button>
      </div>

      {/* 2. Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => {
          const isOnline = device.status === 'online';
          const branch = branches.find((b) => b.id === device.branch_id);

          return (
            <div key={device.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{device.terminal_name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{device.device_serial}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  isOnline
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Branch:</span>
                  <span className="font-semibold text-blue-400">🏢 {branch ? branch.name : `Branch #${device.branch_id}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Branch Code:</span>
                  <span className="font-mono text-slate-300">[{branch ? branch.code : 'BR-XX'}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hardware Bridge:</span>
                  <span className="text-slate-300">Sunmi 58mm AIDL</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                <span>Last Activity: Just now</span>
                <span className="text-emerald-400 font-medium">Ready for Orders</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Provisioning Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🔑 Pair & Provision Sunmi Device
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add a new Sunmi POS terminal and bind it to a physical branch location
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Hardware Serial Number</label>
                <input
                  type="text"
                  required
                  value={deviceSerial}
                  onChange={(e) => setDeviceSerial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assign to Store Branch</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.name} [{b.code}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Terminal Display Name</label>
                <input
                  type="text"
                  required
                  value={terminalName}
                  onChange={(e) => setTerminalName(e.target.value)}
                  placeholder="e.g. Branch 1 - Handheld 02"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Activate Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
