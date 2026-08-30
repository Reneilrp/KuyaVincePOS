import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { ApiService } from '../services/ApiService';
import { usePosStore } from '../stores/usePosStore';
import { useLanguage } from '../context/LanguageContext';

export const CashierPinScreen: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
  const { t, language, toggleLanguage } = useLanguage();
  const [pin, setPin] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const branch = usePosStore((s) => s.branch);
  const device = usePosStore((s) => s.device);
  const setActiveCashier = usePosStore((s) => s.setActiveCashier);
  const setActiveShiftId = usePosStore((s) => s.setActiveShiftId);

  // Lockout countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutRemaining > 0) {
      timer = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const isLocked = lockoutRemaining > 0;

  const handleKeyPress = (digit: string) => {
    if (isLocked) return;
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isLocked) return;
    setPin(pin.slice(0, -1));
  };

  const handleFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    setPin('');

    if (nextAttempts >= 5) {
      setLockoutRemaining(30);
      Alert.alert(
        '🔒 Terminal Locked',
        'Too many incorrect PIN attempts. Terminal locked for 30 seconds to prevent unauthorized access.'
      );
    } else {
      Alert.alert(
        t('accessDenied'),
        t('incorrectPinWarning', { attempts: 5 - nextAttempts })
      );
    }
  };

  const verifyPin = async (enteredPin: string) => {
    if (isLocked) return;

    try {
      const res = await ApiService.cashierPinLogin(enteredPin, branch?.id);
      if (res.status === 'success' && res.user) {
        setActiveCashier(res.user);
        setFailedAttempts(0);

        // Auto-Clock In & Shift Initiation
        try {
          const shiftRes = await ApiService.openShift({
            branch_id: branch ? branch.id : 1,
            cashier_id: res.user.id,
            opening_cash: 1000,
            device_id: device?.id,
            clock_in_at: new Date().toISOString()
          });
          if (shiftRes.shift) {
            setActiveShiftId(shiftRes.shift.id);
          }
        } catch (e) {
          console.warn('Auto-shift clock-in info', e);
        }

        onAuthenticated();
      } else {
        handleFailedAttempt();
      }
    } catch (e) {
      // Fallback for offline demo
      if (enteredPin === '1234' || enteredPin === '9999' || enteredPin === '5678') {
        setActiveCashier({ id: 1, name: 'Cashier (Shift Active)', role: 'cashier', branch_id: branch?.id || 1 });
        setActiveShiftId(Date.now());
        setFailedAttempts(0);
        onAuthenticated();
      } else {
        handleFailedAttempt();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Language Toggle & Online Status */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.langToggleBtn} onPress={toggleLanguage}>
          <Text style={styles.langToggleText}>
            {language === 'en' ? '🇺🇸 EN' : '🇵🇭 TL'}
          </Text>
        </TouchableOpacity>

        <View style={styles.onlineBadge}>
          <Text style={styles.onlineBadgeText}>● {t('online')}</Text>
        </View>
      </View>
      
      <View style={styles.centerSection}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>KV</Text>
        </View>
        <Text style={styles.title}>KuyaVince POS</Text>
        <Text style={styles.subtitle}>{branch?.name || 'Branch 1 - Main Hub'}</Text>
        
        <View style={{ height: 20 }} />
        
        <Text style={styles.welcomeText}>{t('welcomeBack')}</Text>
        <Text style={styles.instructionText}>{t('enterPinInstruction')}</Text>

        {/* Lockout Warning Banner */}
        {isLocked && (
          <View style={styles.lockoutBanner}>
            <Text style={styles.lockoutText}>{t('terminalLocked', { seconds: lockoutRemaining })}</Text>
          </View>
        )}
        
        <View style={styles.pinRow}>
          {[0, 1, 2, 3].map((idx) => (
            <View
              key={idx}
              style={[
                styles.pinDot,
                pin.length > idx && styles.pinDotFilled,
                isLocked && styles.pinDotLocked
              ]}
            />
          ))}
        </View>
        
        <View style={{ height: 20 }} />
        
        <View style={styles.numpadGrid}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((key) => {
            const isBackspace = key === '⌫';
            const isSubmit = key === '✓';
            return (
              <TouchableOpacity
                key={key}
                disabled={isLocked}
                style={[
                  styles.keyButton,
                  isSubmit && styles.submitButton,
                  isLocked && styles.keyDisabled
                ]}
                onPress={() => {
                  if (isBackspace) handleBackspace();
                  else if (isSubmit) {
                    if (pin.length === 4) verifyPin(pin);
                  }
                  else handleKeyPress(key);
                }}
              >
                <Text style={[styles.keyText, isSubmit && styles.submitKeyText, isLocked && styles.textMuted]}>
                  {key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <Text style={styles.forgotText}>{t('forgotPin')}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  langToggleBtn: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  langToggleText: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 11 },
  onlineBadge: { backgroundColor: '#022C22', borderWidth: 1, borderColor: '#065F46', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  onlineBadgeText: { color: '#34D399', fontSize: 10, fontWeight: 'bold' },
  
  centerSection: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  title: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18, marginTop: 8 },
  subtitle: { color: '#94A3B8', fontSize: 12 },
  
  welcomeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 24 },
  instructionText: { color: '#94A3B8', fontSize: 12, marginTop: 4, marginBottom: 16 },

  lockoutBanner: { backgroundColor: '#7F1D1D', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#DC2626' },
  lockoutText: { color: '#FEF2F2', fontWeight: 'bold', fontSize: 12 },
  
  pinRow: { flexDirection: 'row', gap: 16 },
  pinDot: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#334155', backgroundColor: 'transparent' },
  pinDotFilled: { borderColor: '#3B82F6', backgroundColor: '#3B82F6' },
  pinDotLocked: { borderColor: '#7F1D1D', backgroundColor: '#450A0A' },
  
  numpadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: 296, justifyContent: 'center' },
  keyButton: { width: 88, height: 58, borderRadius: 14, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  submitButton: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  keyDisabled: { backgroundColor: '#0F172A', borderColor: '#1E293B', opacity: 0.4 },
  keyText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 22 },
  submitKeyText: { color: '#FFFFFF' },
  textMuted: { color: '#475569' },
  
  forgotText: { color: '#94A3B8', fontSize: 12, marginTop: 16 }
});
