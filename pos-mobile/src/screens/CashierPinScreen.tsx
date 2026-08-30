import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ApiService } from '../services/ApiService';
import { usePosStore } from '../stores/usePosStore';

export const CashierPinScreen: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
  const [pin, setPin] = useState('');
  const branch = usePosStore((s) => s.branch);
  const device = usePosStore((s) => s.device);
  const setActiveCashier = usePosStore((s) => s.setActiveCashier);
  const setActiveShiftId = usePosStore((s) => s.setActiveShiftId);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const verifyPin = async (enteredPin: string) => {
    try {
      const res = await ApiService.cashierPinLogin(enteredPin, branch?.id);
      if (res.status === 'success' && res.user) {
        setActiveCashier(res.user);

        // Auto open shift with 1000 float if none exists
        try {
          const shiftRes = await ApiService.openShift({
            branch_id: branch ? branch.id : 1,
            cashier_id: res.user.id,
            opening_cash: 1000,
            device_id: device?.id
          });
          if (shiftRes.shift) {
            setActiveShiftId(shiftRes.shift.id);
          }
        } catch (e) {
          console.warn('Shift auto-open error', e);
        }

        onAuthenticated();
      } else {
        Alert.alert('Access Denied', res.message || 'Invalid PIN code');
        setPin('');
      }
    } catch (e) {
      // Fallback for offline demo
      if (enteredPin === '1234' || enteredPin === '9999' || enteredPin === '5678') {
        setActiveCashier({ id: 1, name: 'Cashier (Offline)', role: 'cashier', branch_id: branch?.id || 1 });
        onAuthenticated();
      } else {
        Alert.alert('Error', 'Invalid PIN code (Try: 1234 or 9999)');
        setPin('');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.branchName}>{branch?.name || 'POS Terminal'}</Text>
        <Text style={styles.terminalLabel}>{device?.terminal_name || 'Handheld 01'}</Text>
      </View>

      <Text style={styles.title}>Enter Cashier PIN</Text>
      <View style={styles.pinIndicator}>
        {[0, 1, 2, 3].map((idx) => (
          <View key={idx} style={[styles.dot, pin.length > idx && styles.dotFilled]} />
        ))}
      </View>

      {/* Keypad Grid */}
      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.keyButton, key === 'C' && styles.clearBtn, key === '⌫' && styles.backBtn]}
            onPress={() => {
              if (key === 'C') handleClear();
              else if (key === '⌫') handleBackspace();
              else handleKeyPress(key);
            }}
          >
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: { position: 'absolute', top: 40, alignItems: 'center' },
  branchName: { color: '#38BDF8', fontSize: 16, fontWeight: 'bold' },
  terminalLabel: { color: '#94A3B8', fontSize: 12 },
  title: { color: '#F8FAFC', fontSize: 20, fontWeight: '600', marginBottom: 24 },
  pinIndicator: { flexDirection: 'row', gap: 16, marginBottom: 36 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#475569', backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  keypad: { width: 280, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  keyButton: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  clearBtn: { backgroundColor: '#7F1D1D', borderColor: '#991B1B' },
  backBtn: { backgroundColor: '#334155' },
  keyText: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' }
});
