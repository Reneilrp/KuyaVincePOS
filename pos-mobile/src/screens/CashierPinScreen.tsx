import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
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
    <SafeAreaView style={styles.container}>
      <View style={styles.onlineBadge}>
        <Text style={styles.onlineBadgeText}>● Online</Text>
      </View>
      
      <View style={styles.centerSection}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>KV</Text>
        </View>
        <Text style={styles.title}>KuyaVince POS</Text>
        <Text style={styles.subtitle}>{branch?.name || 'Branch 1 - Main Hub'}</Text>
        
        <View style={{ height: 28 }} />
        
        <Text style={styles.welcomeText}>Welcome Back 👋</Text>
        <Text style={styles.instructionText}>Enter your 4-digit PIN to start your shift</Text>
        
        <View style={styles.pinRow}>
          {[0, 1, 2, 3].map((idx) => (
            <View key={idx} style={[styles.pinDot, pin.length > idx && styles.pinDotFilled]} />
          ))}
        </View>
        
        <View style={{ height: 28 }} />
        
        <View style={styles.numpadGrid}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((key) => {
            const isBackspace = key === '⌫';
            const isSubmit = key === '✓';
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.keyButton,
                  isSubmit && styles.submitButton
                ]}
                onPress={() => {
                  if (isBackspace) handleBackspace();
                  else if (isSubmit) {
                    if (pin.length === 4) verifyPin(pin);
                  }
                  else handleKeyPress(key);
                }}
              >
                <Text style={[styles.keyText, isSubmit && styles.submitKeyText]}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <Text style={styles.forgotText}>Forgot PIN? Ask your store manager</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  onlineBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#022C22', borderWidth: 1, borderColor: '#065F46', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  onlineBadgeText: { color: '#34D399', fontSize: 10, fontWeight: 'bold' },
  
  centerSection: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  title: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18, marginTop: 10 },
  subtitle: { color: '#94A3B8', fontSize: 12 },
  
  welcomeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 26 },
  instructionText: { color: '#94A3B8', fontSize: 13, marginTop: 6, marginBottom: 28 },
  
  pinRow: { flexDirection: 'row', gap: 16 },
  pinDot: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#334155', backgroundColor: 'transparent' },
  pinDotFilled: { borderColor: '#3B82F6', backgroundColor: '#3B82F6' },
  
  numpadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: 296, justifyContent: 'center' },
  keyButton: { width: 88, height: 62, borderRadius: 14, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  submitButton: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  keyText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 22 },
  submitKeyText: { color: '#FFFFFF' },
  
  forgotText: { color: '#94A3B8', fontSize: 12, marginTop: 20 }
});
