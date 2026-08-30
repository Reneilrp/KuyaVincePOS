import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ThermalReceiptData } from '../types';
import { SunmiPrinterDriver } from '../services/SunmiPrinterDriver';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  receiptData: ThermalReceiptData;
  onNewOrder: () => void;
}

export const ReceiptSuccessScreen: React.FC<Props> = ({ receiptData, onNewOrder }) => {
  const { t } = useLanguage();

  useEffect(() => {
    SunmiPrinterDriver.printReceipt(receiptData).catch(console.warn);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <Text style={styles.heroTitle}>{t('paymentSuccessful')}</Text>
        <Text style={styles.heroSub}>{t('receiptPrinting')}</Text>
      </View>

      <View style={styles.receiptCard}>
        <Text style={styles.receiptHeader}>KuyaVince POS</Text>
        <Text style={styles.receiptSubHeader}>{receiptData.store_header.name}</Text>
        <Text style={styles.receiptAddress}>{receiptData.store_header.address}</Text>
        <Text style={styles.dashedLine}>{'-'.repeat(30)}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.metaText}>Receipt {receiptData.order_info.order_number}</Text>
          <Text style={styles.metaText}>{receiptData.order_info.date_time}</Text>
        </View>
        <Text style={styles.metaText}>Cashier: {receiptData.order_info.cashier}</Text>
        <Text style={styles.dashedLine}>{'-'.repeat(30)}</Text>
        {receiptData.items.map((item, idx) => (
          <View style={styles.rowItem} key={idx}>
            <Text style={styles.itemText}>{item.name} x{item.qty}</Text>
            <Text style={styles.itemPrice}>₱{item.total_price}</Text>
          </View>
        ))}
        <Text style={styles.dashedLine}>{'-'.repeat(30)}</Text>
        <View style={styles.rowRight}>
          <Text style={styles.totalLabel}>TOTAL: ₱{receiptData.totals.total}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.cashLabel}>Cash: ₱{receiptData.totals.amount_tendered}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.changeLabel}>Sukli / Change: ₱{receiptData.totals.change}</Text>
        </View>
        <Text style={styles.dashedLine}>{'-'.repeat(30)}</Text>
        <Text style={styles.footerMessage}>{receiptData.footer.message}</Text>
        <Text style={styles.footerNotice}>{receiptData.footer.notice}</Text>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.newOrderBtn} onPress={onNewOrder}>
          <Text style={styles.newOrderText}>{t('newOrderBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printAgainBtn} onPress={() => SunmiPrinterDriver.printReceipt(receiptData)}>
          <Text style={styles.printAgainText}>{t('printAgainBtn')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { paddingBottom: 40 },
  hero: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#022C22', borderWidth: 3, borderColor: '#34D399', alignItems: 'center', justifyContent: 'center' },
  successIcon: { color: 'white', fontWeight: 'bold', fontSize: 36 },
  heroTitle: { color: 'white', fontWeight: 'bold', fontSize: 24, marginTop: 16 },
  heroSub: { color: '#94A3B8', fontSize: 13, marginTop: 6 },
  receiptCard: { marginHorizontal: 32, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, elevation: 4 },
  receiptHeader: { color: '#111827', fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
  receiptSubHeader: { color: '#6B7280', fontSize: 12, textAlign: 'center' },
  receiptAddress: { color: '#9CA3AF', fontSize: 11, textAlign: 'center' },
  dashedLine: { color: '#D1D5DB', fontSize: 10, textAlign: 'center', marginVertical: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { color: '#6B7280', fontSize: 11 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between' },
  itemText: { flex: 1, color: '#111827', fontSize: 11 },
  itemPrice: { color: '#111827', fontSize: 11, fontWeight: 'bold', textAlign: 'right' },
  rowRight: { flexDirection: 'row', justifyContent: 'flex-end' },
  totalLabel: { color: '#111827', fontWeight: 'bold', fontSize: 13, textAlign: 'right' },
  cashLabel: { color: '#374151', fontSize: 11, textAlign: 'right' },
  changeLabel: { color: '#059669', fontSize: 11, fontWeight: 'bold', textAlign: 'right' },
  footerMessage: { color: '#6B7280', fontStyle: 'italic', fontSize: 11, textAlign: 'center' },
  footerNotice: { color: '#9CA3AF', fontSize: 10, textAlign: 'center' },
  buttonsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginTop: 24 },
  newOrderBtn: { flex: 1, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', borderRadius: 16, paddingVertical: 14 },
  newOrderText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  printAgainBtn: { flex: 1, backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 14 },
  printAgainText: { color: 'white', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }
});
