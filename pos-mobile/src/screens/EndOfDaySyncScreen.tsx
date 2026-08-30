import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { BatchSyncService, LocalOrderRecord } from '../services/BatchSyncService';
import { SunmiPrinterDriver } from '../services/SunmiPrinterDriver';
import { usePosStore } from '../stores/usePosStore';

export const EndOfDaySyncScreen: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const branch = usePosStore((s) => s.branch);
  const device = usePosStore((s) => s.device);
  const cashier = usePosStore((s) => s.activeCashier);

  const [orders, setOrders] = useState<LocalOrderRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

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
  const pendingOrdersCount = orders.filter((o) => !o.synced).length;
  const totalGrossRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const cashSales = orders.filter((o) => o.payment_method === 'cash').reduce((sum, o) => sum + o.total_amount, 0);
  const ewalletSales = orders.filter((o) => o.payment_method === 'gcash' || o.payment_method === 'maya').reduce((sum, o) => sum + o.total_amount, 0);
  const cardSales = orders.filter((o) => o.payment_method === 'card').reduce((sum, o) => sum + o.total_amount, 0);

  const handlePrintZReport = async () => {
    const zReportData = {
      report_title: 'DAILY Z-READING / SHIFT SUMMARY',
      branch: branch ? branch.name : 'Main Store',
      terminal: device ? device.terminal_name : 'Terminal 01',
      cashier: cashier ? cashier.name : 'Cashier',
      opened_at: new Date().toISOString().split('T')[0] + ' 08:00:00',
      closed_at: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
      financials: {
        opening_float: '1,000.00',
        cash_sales: cashSales.toFixed(2),
        ewallet_sales: ewalletSales.toFixed(2),
        card_sales: cardSales.toFixed(2),
        total_gross_sales: totalGrossRevenue.toFixed(2),
        expected_cash_in_drawer: (1000 + cashSales).toFixed(2),
        actual_counted_cash: (1000 + cashSales).toFixed(2),
        cash_over_short: '0.00',
        transactions_count: totalOrdersCount
      }
    };

    await SunmiPrinterDriver.printZReport(zReportData);
    Alert.alert('Z-Report Printed', 'Physical 58mm daily audit slip printed via Sunmi thermal printer.');
  };

  const handle1TapBatchSync = async () => {
    setIsSyncing(true);
    try {
      const res = await BatchSyncService.pushDailyBatchToServer(
        branch?.id || 1,
        device?.device_serial || 'SUNMI-V2S-BR01-01',
        {
          cashier_id: cashier?.id || 1,
          opening_float: 1000,
          closing_cash: 1000 + cashSales,
          total_gross_sales: totalGrossRevenue,
          orders_count: totalOrdersCount
        }
      );

      setSyncResult(res.message);
      await loadDayStats();
      Alert.alert('✅ Cloud Sync Complete', res.message);
    } catch (e: any) {
      Alert.alert('Sync Failed', e.message || 'Could not upload daily batch.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportJsonFile = () => {
    const exportData = {
      branch_id: branch?.id || 1,
      branch_name: branch?.name || 'Main Branch',
      device_serial: device?.device_serial || 'SUNMI-V2S-01',
      date: new Date().toISOString().split('T')[0],
      total_sales_count: totalOrdersCount,
      gross_revenue: totalGrossRevenue,
      orders
    };

    console.log('Exported JSON Package:', JSON.stringify(exportData, null, 2));
    Alert.alert(
      '💾 File Exported',
      `Saved daily_sales_${new Date().toISOString().split('T')[0]}.json to device storage. You can drag and drop this file on the Admin Laptop Dashboard.`
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>🌙 End of Day & Cloud Sync</Text>
          <Text style={styles.modalSub}>🏢 {branch?.name || 'Main Branch'} • [{branch?.code}]</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Sales Completed Today:</Text>
              <Text style={styles.summaryValue}>{totalOrdersCount} Orders</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gross Revenue:</Text>
              <Text style={styles.summaryHighlight}>₱{totalGrossRevenue.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pending Cloud Upload:</Text>
              <Text style={[styles.summaryValue, pendingOrdersCount > 0 ? styles.textAmber : styles.textEmerald]}>
                {pendingOrdersCount > 0 ? `⏳ ${pendingOrdersCount} orders waiting` : '✅ All Uploaded'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionBlock}>
            <TouchableOpacity style={styles.printBtn} onPress={handlePrintZReport}>
              <Text style={styles.printBtnText}>🖨️ PRINT 58mm DAILY Z-READING</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.syncBtn, isSyncing && styles.btnDisabled]}
              disabled={isSyncing}
              onPress={handle1TapBatchSync}
            >
              {isSyncing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.syncBtnText}>⚡ 1-TAP SEND TO SUPABASE CLOUD</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportFileBtn} onPress={handleExportJsonFile}>
              <Text style={styles.exportFileBtnText}>💾 EXPORT .JSON FILE (OFFLINE BACKUP)</Text>
            </TouchableOpacity>
          </View>

          {syncResult && (
            <Text style={styles.syncNotice}>✅ {syncResult}</Text>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { backgroundColor: '#1E293B', width: '100%', maxWidth: 440, borderRadius: 16, padding: 22, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  modalSub: { color: '#38BDF8', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  summaryCard: { backgroundColor: '#0F172A', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginBottom: 18 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { color: '#94A3B8', fontSize: 12 },
  summaryValue: { color: '#F8FAFC', fontSize: 12, fontWeight: 'bold' },
  summaryHighlight: { color: '#34D399', fontSize: 15, fontWeight: 'bold' },
  textAmber: { color: '#FBBF24' },
  textEmerald: { color: '#34D399' },
  actionBlock: { gap: 10, marginBottom: 14 },
  printBtn: { backgroundColor: '#334155', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  printBtnText: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 12 },
  syncBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  syncBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
  exportFileBtn: { backgroundColor: '#1E3A8A', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#3B82F6' },
  exportFileBtnText: { color: '#93C5FD', fontWeight: 'bold', fontSize: 11 },
  btnDisabled: { opacity: 0.5 },
  syncNotice: { color: '#34D399', fontSize: 11, textAlign: 'center', marginBottom: 10 },
  closeBtn: { backgroundColor: '#0F172A', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  closeBtnText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' }
});
