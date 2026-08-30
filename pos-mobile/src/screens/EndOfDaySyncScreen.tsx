import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { BatchSyncService } from '../services/BatchSyncService';
import { SunmiPrinterDriver } from '../services/SunmiPrinterDriver';
import { usePosStore } from '../stores/usePosStore';
import { useLanguage } from '../context/LanguageContext';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
type ClosingMode = 'eod' | 'handover';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const EndOfDaySyncScreen: React.FC<Props> = ({ visible, onClose }) => {
  const { t } = useLanguage();
  const branch = usePosStore((s) => s.branch);
  const device = usePosStore((s) => s.device);
  const cashier = usePosStore((s) => s.activeCashier);
  const openingFloat = usePosStore((s) => s.openingFloat);
  const setActiveCashier = usePosStore((s) => s.setActiveCashier);
  const setActiveShiftId = usePosStore((s) => s.setActiveShiftId);
  const stockAdjustments = usePosStore((s) => s.stockAdjustments);
  const clearStockAdjustments = usePosStore((s) => s.clearStockAdjustments);

  const [mode, setMode] = useState<ClosingMode>('eod');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [totalGrossRevenue, setTotalGrossRevenue] = useState(0);
  const [cashSales, setCashSales] = useState(0);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  const [countedCash, setCountedCash] = useState('');
  const expectedDrawer = openingFloat + cashSales;
  const counted = parseFloat(countedCash || '0');
  const variance = counted - expectedDrawer;
  const isBalanced = Math.abs(variance) < 0.01;

  // Manager Override Modal for Offline Exit
  const [isManagerBypassOpen, setIsManagerBypassOpen] = useState(false);
  const [bypassPin, setBypassPin] = useState('');

  const loadDayStats = async () => {
    try {
      const orders = await BatchSyncService.getLocalOrders();
      setTotalOrdersCount(orders.length);
      const pending = orders.filter((o) => !o.synced);
      setUnsyncedCount(pending.length);

      let gross = 0;
      let cash = 0;
      for (const ord of orders) {
        gross += Number(ord.total_amount || 0);
        cash += Number(ord.total_amount || 0);
      }
      setTotalGrossRevenue(gross);
      setCashSales(cash);
    } catch (e) {
      console.warn('Could not read offline stats', e);
    }
  };

  useEffect(() => {
    if (visible) {
      loadDayStats();
      setSyncStatus('idle');
    }
  }, [visible]);

  // 1-Tap Cloud Sync
  const handle1TapBatchSync = async () => {
    setSyncStatus('syncing');
    try {
      const shiftSummary = {
        cashier_id: cashier?.id || 1,
        cashier_name: cashier?.name || 'Cashier',
        opening_float: openingFloat,
        counted_cash: counted,
        closing_cash: expectedDrawer,
        variance: variance,
        total_gross_sales: totalGrossRevenue,
        orders_count: totalOrdersCount,
        closed_at: new Date().toISOString()
      };

      await BatchSyncService.pushDailyBatchToServer(
        branch?.id || 1,
        device?.device_serial || 'SUNMI-V2S-BR01-01',
        shiftSummary,
        stockAdjustments
      );

      setSyncStatus('success');
      clearStockAdjustments();
      await loadDayStats();
    } catch (e: any) {
      setSyncStatus('error');
      Alert.alert('Sync Failed', e.message || 'Could not upload daily batch to cloud.');
    }
  };

  // Print Shift X-Reading (Mid-Day Handover)
  const handlePrintXReport = async () => {
    try {
      await SunmiPrinterDriver.printXReport({
        branch_name: branch?.name || 'KuyaVince POS',
        cashier_name: cashier?.name || 'Cashier',
        shift_start: '8:00 AM',
        shift_end: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orders_count: totalOrdersCount,
        cash_sales: cashSales,
        opening_float: openingFloat,
        expected_cash: expectedDrawer,
        counted_cash: counted,
        variance: variance
      });
      Alert.alert('X-Reading Printed', 'Mid-Day Shift Handover receipt printed successfully.');
    } catch (e: any) {
      Alert.alert('Printer Error', e.message || 'Failed to print X-Report.');
    }
  };

  // Print Official Z-Report (End-of-Day)
  const handlePrintZReport = async () => {
    try {
      await SunmiPrinterDriver.printZReport({
        branch_name: branch?.name || 'KuyaVince POS',
        device_serial: device?.device_serial || 'SUNMI-V2S-BR01-01',
        date: new Date().toLocaleDateString(),
        total_orders: totalOrdersCount,
        gross_sales: totalGrossRevenue,
        cash_sales: cashSales,
        opening_float: openingFloat,
        expected_cash: expectedDrawer,
        counted_cash: counted,
        variance: variance
      });
      Alert.alert('Z-Report Printed', 'Official End-of-Day Z-Reading audit slip printed.');
    } catch (e: any) {
      Alert.alert('Printer Error', e.message || 'Failed to print Z-Report.');
    }
  };

  // Issue 4: Mid-Day Handover Exit (Keeps orders queued for EOD)
  const handleCompleteHandover = () => {
    if (!countedCash) {
      Alert.alert('Count Required', 'Please count and enter the cash drawer total before handing over the register.');
      return;
    }

    Alert.alert(
      '🔄 Confirm Shift Handover',
      `Handing over register with ₱${counted.toFixed(2)} counted cash to next cashier.\n\nYour shift hours and sales will be recorded.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Turn Over Register',
          onPress: async () => {
            await handlePrintXReport();
            setActiveCashier(null);
            setActiveShiftId(null);
            onClose();
          }
        }
      ]
    );
  };

  // Issue 2: Hard-Gated Sync Enforcement on EOD Exit
  const handleEodSignOut = () => {
    if (unsyncedCount > 0 && syncStatus !== 'success') {
      Alert.alert(
        '🛑 Cloud Upload Required',
        `You have ${unsyncedCount} sales order(s) that have not been uploaded to the cloud.\n\nYou cannot end the shift without syncing today's revenue to the admin portal.`,
        [
          {
            text: '📤 Upload Now (Required)',
            onPress: handle1TapBatchSync
          },
          {
            text: 'Manager Override PIN',
            style: 'destructive',
            onPress: () => setIsManagerBypassOpen(true)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } else {
      setActiveCashier(null);
      setActiveShiftId(null);
      onClose();
    }
  };

  const handleManagerBypassUnlock = () => {
    if (bypassPin === '9999' || bypassPin === '0000' || bypassPin === '1111') {
      setIsManagerBypassOpen(false);
      setBypassPin('');
      setActiveCashier(null);
      setActiveShiftId(null);
      onClose();
      Alert.alert('⚠️ Manager Override', 'Logged out offline by Store Manager authorization.');
    } else {
      Alert.alert('Invalid Manager PIN', 'The entered manager PIN is incorrect.');
      setBypassPin('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBg}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Mode Switcher: Mid-Day Handover vs End-of-Day Closing */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'eod' && styles.modeTabActive]}
              onPress={() => setMode('eod')}
            >
              <Text style={[styles.modeTabText, mode === 'eod' && styles.modeTabTextActive]}>
                🌙 Final End-of-Day Closing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'handover' && styles.modeTabActive]}
              onPress={() => setMode('handover')}
            >
              <Text style={[styles.modeTabText, mode === 'handover' && styles.modeTabTextActive]}>
                🔄 Mid-Day Shift Handover
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle}>
            {mode === 'eod' ? t('endOfDayHeader') : 'Mid-Day Register Turnover'}
          </Text>
          <Text style={styles.headerSub}>
            {branch?.name || 'Main Branch'} • Cashier: {cashier?.name || 'Cashier'}
          </Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {mode === 'eod' ? t('shiftPerformance') : '📊 Shift Performance (Cashier Turnover)'}
            </Text>
            
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('totalOrdersCompleted')}</Text>
              <Text style={styles.rowValueWhite}>{totalOrdersCount} {t('items')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('totalCashSales')}</Text>
              <Text style={styles.rowValueHighlight}>₱{totalGrossRevenue.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.simpleRow}>
              <Text style={styles.rowLabel}>{t('startingFloat')}</Text>
              <Text style={styles.rowLabel}>₱{openingFloat.toFixed(2)}</Text>
            </View>
            <View style={styles.simpleRow}>
              <Text style={styles.rowLabel}>{t('expectedInDrawer')}</Text>
              <Text style={styles.rowValueWhite}>₱{expectedDrawer.toFixed(2)}</Text>
            </View>

            <View style={styles.countedRow}>
              <div>
                <Text style={styles.rowLabelHighlight}>{t('actualCountedCash')}</Text>
                <Text style={styles.subText}>{t('drawerCountSub')}</Text>
              </div>
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

          {/* Status Badge */}
          <View style={styles.statusBadgeContainer}>
            {isBalanced ? (
              <View style={styles.badgeBalanced}><Text style={styles.badgeBalancedText}>{t('balancedStatus')}</Text></View>
            ) : variance < 0 ? (
              <View style={styles.badgeShort}><Text style={styles.badgeShortText}>{t('shortStatus', { amount: Math.abs(variance).toFixed(2) })}</Text></View>
            ) : (
              <View style={styles.badgeOver}><Text style={styles.badgeOverText}>{t('overStatus', { amount: variance.toFixed(2) })}</Text></View>
            )}
          </View>

          {/* MODE A: FINAL END OF DAY CLOSING (Hard Cloud Sync + Z-Report) */}
          {mode === 'eod' && (
            <>
              {(syncStatus === 'idle' || syncStatus === 'error') && (
                <>
                  <TouchableOpacity style={styles.uploadBtn} onPress={handle1TapBatchSync}>
                    <Text style={styles.uploadBtnText}>{t('uploadSalesBtn')}</Text>
                  </TouchableOpacity>
                  <Text style={styles.uploadHelper}>
                    {unsyncedCount > 0
                      ? t('uploadHelperPending', { count: unsyncedCount })
                      : t('uploadHelperAllSynced')}
                  </Text>
                </>
              )}

              {syncStatus === 'syncing' && (
                <View style={styles.syncingContainer}>
                  <ActivityIndicator color="#3B82F6" size="large" />
                  <Text style={styles.syncingText}>{t('uploadingOrders')}</Text>
                </View>
              )}

              {syncStatus === 'success' && (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>{t('syncedSuccess')}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.printBtn} onPress={handlePrintZReport}>
                <Text style={styles.printBtnText}>{t('printZReportBtn')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.signOutBtn} onPress={handleEodSignOut}>
                <Text style={styles.signOutBtnText}>{t('signOutEndShift')}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* MODE B: MID-DAY SHIFT HANDOVER (Print X-Reading + Turn over register to next cashier) */}
          {mode === 'handover' && (
            <View style={{ gap: 12 }}>
              <TouchableOpacity style={styles.printXBtn} onPress={handlePrintXReport}>
                <Text style={styles.printXBtnText}>🖸️ Print Shift X-Reading Slip</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.handoverBtn} onPress={handleCompleteHandover}>
                <Text style={styles.handoverBtnText}>🤝 Complete Handover & Log Out Cashier</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ padding: 12, alignItems: 'center' }} onPress={onClose}>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>Cancel & Return to POS</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Manager Override Bypass Modal */}
      <Modal visible={isManagerBypassOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔑 Manager Emergency Bypass</Text>
            <Text style={styles.modalSub}>
              Enter Store Manager PIN to authorize offline shift sign-out without cloud sync (e.g. internet down).
            </Text>

            <TextInput
              style={styles.bypassInput}
              secureTextEntry
              maxLength={6}
              keyboardType="numeric"
              value={bypassPin}
              onChangeText={setBypassPin}
              placeholder="Manager PIN"
              placeholderTextColor="#64748B"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#334155', padding: 14, borderRadius: 12, alignItems: 'center' }}
                onPress={() => setIsManagerBypassOpen(false)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 2, backgroundColor: '#DC2626', padding: 14, borderRadius: 12, alignItems: 'center' }}
                onPress={handleManagerBypassUnlock}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Authorize Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20 },
  modeTabs: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeTabActive: { backgroundColor: '#3B82F6' },
  modeTabText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  modeTabTextActive: { color: 'white' },
  headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 20, textAlign: 'center' },
  headerSub: { color: '#94A3B8', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  summaryCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  summaryTitle: { color: 'white', fontWeight: 'bold', fontSize: 15, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#334155' },
  rowLabel: { color: '#94A3B8', fontSize: 13 },
  rowLabelHighlight: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
  subText: { color: '#64748B', fontSize: 10 },
  rowValueWhite: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  rowValueHighlight: { color: '#34D399', fontWeight: 'bold', fontSize: 16, fontFamily: 'monospace' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 10 },
  simpleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  countedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, marginTop: 4 },
  input: { backgroundColor: '#0F172A', borderWidth: 2, borderColor: '#3B82F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: 'white', fontWeight: 'bold', fontSize: 16, width: 120, textAlign: 'right', fontFamily: 'monospace' },
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
  printXBtn: { borderWidth: 1, borderColor: '#60A5FA', backgroundColor: '#1E3A5F', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  printXBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  handoverBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  handoverBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  signOutBtn: { paddingVertical: 12, alignItems: 'center' },
  signOutBtnText: { color: '#FB7185', fontSize: 13, textAlign: 'center', fontWeight: 'bold' },

  // Manager Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#1E293B', width: '100%', maxWidth: 360, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
  modalSub: { color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  bypassInput: { backgroundColor: '#0F172A', borderWidth: 2, borderColor: '#DC2626', borderRadius: 14, color: 'white', fontWeight: 'bold', fontSize: 24, padding: 14, textAlign: 'center', fontFamily: 'monospace' }
});
