import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { ApiService } from '../services/ApiService';
import { usePosStore } from '../stores/usePosStore';
import { Branch } from '../types';

export const DeviceActivationScreen: React.FC<{ onActivated: () => void }> = ({ onActivated }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [terminalName, setTerminalName] = useState('Sunmi Handheld 01');
  const [deviceSerial, setDeviceSerial] = useState('SUNMI-DEV-' + Math.floor(100000 + Math.random() * 900000));
  const [loading, setLoading] = useState(false);
  const setDeviceAndBranch = usePosStore((s) => s.setDeviceAndBranch);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const res = await ApiService.getSetupBranches();
      if (res.branches) {
        setBranches(res.branches);
        if (res.branches.length > 0) {
          setSelectedBranchId(res.branches[0].id);
        }
      }
    } catch (e) {
      console.warn('Backend not running locally yet, using default mock branches');
      const fallbackBranches: Branch[] = [
        { id: 1, name: 'Downtown Flagship', code: 'BR-01', address: '101 Rizal Ave' },
        { id: 2, name: 'Mall Galleria', code: 'BR-02', address: 'Level 2, West Wing' },
        { id: 3, name: 'Express Kiosk', code: 'BR-03', address: 'Terminal 3 Station' }
      ];
      setBranches(fallbackBranches);
      setSelectedBranchId(1);
    }
  };

  const handleActivate = async () => {
    if (!selectedBranchId) {
      Alert.alert('Error', 'Please select a store branch');
      return;
    }
    setLoading(true);
    try {
      const res = await ApiService.pairDevice({
        device_serial: deviceSerial,
        branch_id: selectedBranchId,
        terminal_name: terminalName
      });

      const activeBranch = branches.find((b) => b.id === selectedBranchId)!;
      setDeviceAndBranch(
        res.device || { id: 1, branch_id: selectedBranchId, device_serial: deviceSerial, terminal_name: terminalName, device_token: 'DVT_TOKEN' },
        activeBranch
      );
      Alert.alert('Success', `Device registered to ${activeBranch.name}`);
      onActivated();
    } catch (e) {
      // Fallback local activation
      const activeBranch = branches.find((b) => b.id === selectedBranchId)!;
      setDeviceAndBranch(
        { id: 1, branch_id: selectedBranchId, device_serial: deviceSerial, terminal_name: terminalName, device_token: 'DVT_TOKEN' },
        activeBranch
      );
      onActivated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>📱 Sunmi POS Setup</Text>
        <Text style={styles.subtitle}>Assign this handheld terminal to a store branch</Text>

        <Text style={styles.label}>Device Serial Number</Text>
        <TextInput style={[styles.input, styles.disabledInput]} value={deviceSerial} editable={false} />

        <Text style={styles.label}>Terminal Label / Name</Text>
        <TextInput style={styles.input} value={terminalName} onChangeText={setTerminalName} placeholder="e.g. Counter 01" />

        <Text style={styles.label}>Select Store Branch</Text>
        <View style={styles.branchGrid}>
          {branches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.branchButton, selectedBranchId === b.id && styles.branchButtonActive]}
              onPress={() => setSelectedBranchId(b.id)}
            >
              <Text style={[styles.branchCode, selectedBranchId === b.id && styles.textWhite]}>{b.code}</Text>
              <Text style={[styles.branchName, selectedBranchId === b.id && styles.textWhite]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleActivate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>✅ ACTIVATE & INITIALIZE POS</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { backgroundColor: '#1E293B', width: '100%', maxWidth: 440, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#334155' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#F8FAFC', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#CBD5E1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 16, fontSize: 14 },
  disabledInput: { color: '#64748B' },
  branchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  branchButton: { flex: 1, minWidth: '45%', backgroundColor: '#0F172A', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  branchButtonActive: { backgroundColor: '#2563EB', borderColor: '#60A5FA' },
  branchCode: { fontSize: 14, fontWeight: 'bold', color: '#38BDF8', marginBottom: 2 },
  branchName: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  textWhite: { color: '#FFFFFF' },
  submitBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 }
});
