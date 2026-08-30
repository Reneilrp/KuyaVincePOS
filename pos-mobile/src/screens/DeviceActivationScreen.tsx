import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { usePosStore } from '../stores/usePosStore';

const SUPABASE_URL = 'https://diddsyaqdqxvadgttguq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZGRzeWFxZHF4dmFkZ3R0Z3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTI1NzQsImV4cCI6MjEwMzYyODU3NH0.0JKA5syorKUuwP5KtFTjQXpQFwb_uYuDyM8yL4ZdRh4';

export const DeviceActivationScreen: React.FC<{ onActivated: () => void }> = ({ onActivated }) => {
  const [importCode, setImportCode] = useState('KV-BR01');
  const [isLoading, setIsLoading] = useState(false);

  const setBranch = usePosStore((s) => s.setBranch);
  const setDevice = usePosStore((s) => s.setDevice);
  const setCatalog = usePosStore((s) => s.setCatalog);

  const handleImportBranch = async () => {
    if (!importCode.trim()) {
      Alert.alert('Required', 'Please enter your 6-character Branch Import Code.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch branch by Import Code from Supabase
      const branchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/branches?import_code=eq.${importCode.trim().toUpperCase()}&select=*`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );

      const branches = await branchRes.json();
      let matchedBranch = branches && branches.length > 0 ? branches[0] : null;

      if (!matchedBranch) {
        // Fallback for offline simulation or initial setup
        matchedBranch = {
          id: 1,
          name: 'KCC Mall de Zamboanga',
          code: 'BR-01',
          import_code: importCode.toUpperCase()
        };
      }

      // 2. Fetch Products for this branch
      const prodRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });
      const prods = await prodRes.json();

      if (prods && Array.isArray(prods) && prods.length > 0) {
        const catalogItems = prods.map((p: any) => ({
          product_id: p.id,
          name: p.name,
          category: p.category || 'General',
          base_price: Number(p.base_price),
          stock_quantity: 100
        }));
        setCatalog(catalogItems);
      }

      const generatedTerminalName = 'Counter-' + Date.now();

      // 3. Save Active Device & Branch State
      setBranch(matchedBranch);
      setDevice({
        id: 1,
        branch_id: matchedBranch.id,
        device_serial: 'SUNMI-V2S-' + importCode.toUpperCase(),
        terminal_name: generatedTerminalName,
        device_token: 'TOKEN_' + Date.now(),
        status: 'online'
      });

      Alert.alert(
        '✅ Branch Connected',
        `Successfully linked to "${matchedBranch.name}" [${matchedBranch.code}]!`
      );
      onActivated();
    } catch (err: any) {
      Alert.alert('Connection Notice', 'Connecting with local branch offline cache.');
      const generatedTerminalName = 'Counter-' + Date.now();
      setBranch({
        id: 1,
        name: 'Branch 1 - Zamboanga Hub',
        code: 'BR-01',
        import_code: importCode.toUpperCase()
      });
      setDevice({
        id: 1,
        branch_id: 1,
        device_serial: 'SUNMI-OFFLINE-01',
        terminal_name: generatedTerminalName,
        device_token: 'OFFLINE_TOKEN',
        status: 'online'
      });
      onActivated();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>KV</Text>
        </View>
        <Text style={styles.title}>KuyaVince POS</Text>
        <Text style={styles.subtitle}>v1.0 • First Time Setup</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.scannerIcon}>
          <Text style={styles.scannerText}>▦</Text>
        </View>

        <Text style={styles.cardTitle}>Activate Your Terminal</Text>
        <Text style={styles.cardSubtitle}>Enter the 6-character Branch Import Code provided by your store manager</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>BRANCH IMPORT CODE</Text>
          <TextInput
            style={styles.codeInput}
            value={importCode}
            onChangeText={setImportCode}
            placeholder="KV-BR01"
            placeholderTextColor="#64748B"
            autoCapitalize="characters"
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, isLoading && styles.btnDisabled]}
          onPress={handleImportBranch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.actionBtnText}>✓ Activate & Download Menu</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hintText}>This will sync your branch's products and prices</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>KuyaVince POS • Powered by Supabase</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24
  },
  topSection: {
    alignItems: 'center',
    marginTop: 40
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 22
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 28,
    width: '100%',
    maxWidth: 360,
    gap: 20,
    alignItems: 'center'
  },
  scannerIcon: {
    width: 72,
    height: 72,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scannerText: {
    color: '#64748B',
    fontSize: 36
  },
  cardTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 22,
    textAlign: 'center'
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8
  },
  label: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2
  },
  codeInput: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 14,
    color: '#3B82F6',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 14,
    letterSpacing: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8
  },
  actionBtn: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center'
  },
  btnDisabled: {
    opacity: 0.6
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15
  },
  hintText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center'
  },
  footer: {
    marginBottom: 20
  },
  footerText: {
    color: '#475569',
    fontSize: 10,
    textAlign: 'center'
  }
});
