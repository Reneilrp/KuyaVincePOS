import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Modal, StyleSheet } from 'react-native';
import { BatchSyncService } from '../services/BatchSyncService';
import { SunmiPrinterDriver } from '../services/SunmiPrinterDriver';
import { usePosStore } from '../stores/usePosStore';
import C from '../theme/colors';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const EndOfDaySyncScreen: React.FC<Props> = ({ visible, onClose }) => {
  const branch = usePosStore((s) => s.branch);
  const device = usePosStore((s) => s.device);
  const cashier = usePosStore((s) => s.activeCashier);

  const [orders, setOrders] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [countedCash, setCountedCash] = useState('');

  useEffect(() => {
    if (visible) {
      loadDayStats();
    }
  }, [visible]);

  const loadDayStats = async () => {
    const local = await BatchSyncService.getLocalOrders();
    setOrders(local);
  };

  const totalOrdersCount = orders.length;
  const totalGrossRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const cashSales = orders.filter((o) => o.payment_method === 'cash').reduce((sum, o) => sum + o.total_amount, 0);
  const ewalletSales = orders.filter((o) => o.payment_method === 'gcash' || o.payment_method === 'maya').reduce((sum, o) => sum + o.total_amount, 0);
  const cardSales = orders.filter((o) => o.payment_method === 'card').reduce((sum, o) => sum + o.total_amount, 0);

  const openingFloat = 1000;
  const expectedDrawer = openingFloat + cashSales;
  const counted = parseFloat(countedCash || '0');
  const variance = counted - expectedDrawer;
  const isBalanced = Math.abs(variance) < 0.01;

  const handlePrintZReport = async () => {
    const zReportData = {
      report_title: 'DAILY Z-READING / SHIFT SUMMARY',
      branch: branch ? branch.name : 'Main Store',
      terminal: device ? device.terminal_name : 'Terminal 01',
      cashier: cashier ? cashier.name : 'Cashier',
      opened_at: new Date().toISOString().split('T')[0] + ' 08:00:00',
      closed_at: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
      financials: {
        opening_float: openingFloat.toFixed(2),
        cash_sales: cashSales.toFixed(2),
        ewallet_sales: ewalletSales.toFixed(2),
        card_sales: cardSales.toFixed(2),
        total_gross_sales: totalGrossRevenue.toFixed(2),
        expected_cash_in_drawer: expectedDrawer.toFixed(2),
        actual_counted_cash: counted.toFixed(2),
        cash_over_short: variance.toFixed(2),
        transactions_count: totalOrdersCount
      }
    };
    await SunmiPrinterDriver.printZReport(zReportData);
    Alert.alert('Z-Report Printed', 'Physical 58mm daily audit slip printed via Sunmi thermal printer.');
  };

  const handle1TapBatchSync = async () => {
    setSyncStatus('syncing');
    try {
      const res = await BatchSyncService.pushDailyBatchToServer(
        branch?.id || 1,
        device?.device_serial || 'SUNMI-V2S-BR01-01',
        { cashier_id: cashier?.id || 1, opening_float: 1000, closing_cash: expectedDrawer, total_gross_sales: totalGrossRevenue, orders_count: totalOrdersCount }
      );
      setSyncStatus('success');
      await loadDayStats();
    } catch (e: any) {
      setSyncStatus('error');
      Alert.alert('Sync Failed', e.message || 'Could not upload daily batch.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBg}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.headerTitle}>End of Day</Text>
          <Text style={styles.headerSub}>{branch?.name || 'Main Branch'}</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📊 Today's Performance</Text>
            
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Total Orders</Text>
              <Text style={styles.rowValueWhite}>{totalOrdersCount} orders</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Gross Sales</Text>
              <Text style={styles.rowValueHighlight}>₱{totalGrossRevenue.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Cash Collected</Text>
              <Text style={styles.rowValueRegular}>₱{cashSales.toFixed(2)}</Text>
            </View>
            <View style={styles.rowNoBorder}>
              <Text style={styles.rowLabel}>GCash / Maya</Text>
              <Text style={styles.rowValueRegular}>₱{ewalletSales.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.simpleRow}>
              <Text style={styles.rowLabel}>Opening Float</Text>
              <Text style={styles.rowLabel}>₱{openingFloat.toFixed(2)}</Text>
            </View>
            <View style={styles.simpleRow}>
              <Text style={styles.rowLabel}>Expected Drawer</Text>
              <Text style={styles.rowValueWhite}>₱{expectedDrawer.toFixed(2)}</Text>
            </View>

            <View style={styles.countedRow}>
              <Text style={styles.rowLabel}>Counted Cash</Text>
              <TextInput
                style={styles.input}
                value={countedCash}
                onChangeText={setCountedCash}
                keyboardType="numeric"
                placeholder="₱ 0.00"
                placeholderTextColor="#475569"
              />
            </View>
          </View>

          <View style={styles.statusBadgeContainer}>
            {isBalanced ? (
              <View style={styles.badgeBalanced}><Text style={styles.badgeBalancedText}>✓ BALANCED</Text></View>
            ) : variance < 0 ? (
              <View style={styles.badgeShort}><Text style={styles.badgeShortText}>⚠ SHORT ₱{Math.abs(variance).toFixed(2)}</Text></View>
            ) : (
              <View style={styles.badgeOver}><Text style={styles.badgeOverText}>▲ OVER ₱{variance.toFixed(2)}</Text></View>
            )}
          </View>

          {(syncStatus === 'idle' || syncStatus === 'error') && (
            <>
              <TouchableOpacity style={styles.uploadBtn} onPress={handle1TapBatchSync}>
                <Text style={styles.uploadBtnText}>📤 Upload Today's Sales to Cloud</Text>
              </TouchableOpacity>
              <Text style={styles.uploadHelper}>This will sync {totalOrdersCount} orders to your admin dashboard</Text>
            </>
          )}

          {syncStatus === 'syncing' && (
            <View style={styles.syncingContainer}>
              <ActivityIndicator color="#3B82F6" size="large" />
              <Text style={styles.syncingText}>Uploading {totalOrdersCount} orders...</Text>
            </View>
          )}

          {syncStatus === 'success' && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>✅ Synced Successfully! {totalOrdersCount} orders uploaded.</Text>
            </View>
          )}

          <TouchableOpacity style={styles.printBtn} onPress={handlePrintZReport}>
            <Text style={styles.printBtnText}>🖸️ Print 58mm Z-Reading Slip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={onClose}>
            <Text style={styles.signOutBtnText}>Sign Out / End Shift</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20 },
  headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 20, textAlign: 'center' },
  headerSub: { color: '#94A3B8', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  summaryCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, marginBottom: 16 },
  summaryTitle: { color: 'white', fontWeight: 'bold', fontSize: 15, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#334155' },
  rowNoBorder: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { color: '#94A3B8', fontSize: 13 },
  rowValueWhite: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  rowValueHighlight: { color: '#34D399', fontWeight: 'bold', fontSize: 15 },
  rowValueRegular: { color: 'white', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 10 },
  simpleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  countedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  input: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, color: 'white', fontWeight: 'bold', fontSize: 14, width: 110 },
  statusBadgeContainer: { alignItems: 'center', marginVertical: 12 },
  badgeBalanced: { backgroundColor: '#022C22', borderWidth: 1, borderColor: '#065F46', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  badgeBalancedText: { color: '#34D399', fontWeight: 'bold', fontSize: 12 },
  badgeShort: { backgroundColor: '#1A0A0A', borderWidth: 1, borderColor: '#7F1D1D', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  badgeShortText: { color: '#FB7185', fontWeight: 'bold', fontSize: 12 },
  badgeOver: { backgroundColor: '#1A1200', borderWidth: 1, borderColor: '#78350F', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  badgeOverText: { color: '#FBBF24', fontWeight: 'bold', fontSize: 12 },
  uploadBtn: { backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  uploadBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  uploadHelper: { color: '#94A3B8', fontSize: 11, textAlign: 'center', marginBottom: 16 },
  syncingContainer: { alignItems: 'center', paddingVertical: 20, marginBottom: 16 },
  syncingText: { color: '#3B82F6', fontSize: 13, marginTop: 10 },
  successContainer: { backgroundColor: '#022C22', borderWidth: 1, borderColor: '#065F46', borderRadius: 12, padding: 14, marginBottom: 16 },
  successText: { color: '#34D399', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  printBtn: { borderWidth: 1, borderColor: '#3B82F6', backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  printBtnText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 13 },
  signOutBtn: { paddingVertical: 12 },
  signOutBtnText: { color: '#FB7185', fontSize: 12, textAlign: 'center' }
});
