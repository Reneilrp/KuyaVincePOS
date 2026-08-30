import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { ApiService } from '../services/ApiService';
import { usePosStore } from '../stores/usePosStore';

export const TimeclockScreen: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const cashier = usePosStore((s) => s.activeCashier);
  const branch = usePosStore((s) => s.branch);
  const [loading, setLoading] = useState(false);

  const handleClockIn = async () => {
    if (!cashier) return;
    setLoading(true);
    try {
      const res = await ApiService.clockIn(cashier.id, branch?.id || 1);
      Alert.alert('Clocked In', res.message || 'Staff attendance recorded.');
      onClose();
    } catch (e: any) {
      Alert.alert('Clock-In Alert', e.message || 'Could not clock in.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!cashier) return;
    setLoading(true);
    try {
      const res = await ApiService.clockOut(cashier.id);
      Alert.alert('Clocked Out', res.message || 'Staff shift ended.');
      onClose();
    } catch (e: any) {
      Alert.alert('Clock-Out Alert', e.message || 'Could not clock out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>⏱️ Staff Shift Timeclock</Text>
          <Text style={styles.staffName}>Staff: {cashier?.name || 'Cashier'}</Text>
          <Text style={styles.branchSub}>Assigned to {branch?.name || 'Main Branch'}</Text>

          <View style={styles.timeclockActions}>
            <TouchableOpacity
              style={[styles.clockBtn, styles.clockInBtn, loading && styles.btnDisabled]}
              disabled={loading}
              onPress={handleClockIn}
            >
              <Text style={styles.clockBtnIcon}>🟢</Text>
              <Text style={styles.clockBtnText}>CLOCK IN (START SHIFT)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.clockBtn, styles.clockOutBtn, loading && styles.btnDisabled]}
              disabled={loading}
              onPress={handleClockOut}
            >
              <Text style={styles.clockBtnIcon}>🔴</Text>
              <Text style={styles.clockBtnText}>CLOCK OUT (END SHIFT)</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { backgroundColor: '#1E293B', width: '100%', maxWidth: 400, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  staffName: { color: '#38BDF8', fontSize: 14, fontWeight: '600' },
  branchSub: { color: '#94A3B8', fontSize: 12, marginBottom: 20 },
  timeclockActions: { width: '100%', gap: 12, marginBottom: 16 },
  clockBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  clockInBtn: { backgroundColor: '#065F46' },
  clockOutBtn: { backgroundColor: '#991B1B' },
  clockBtnIcon: { fontSize: 14 },
  clockBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
  closeBtn: { width: '100%', backgroundColor: '#334155', padding: 12, borderRadius: 8, alignItems: 'center' },
  closeBtnText: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 13 },
  btnDisabled: { opacity: 0.5 }
});
