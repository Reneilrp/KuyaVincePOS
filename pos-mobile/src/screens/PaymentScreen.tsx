import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { ThermalReceiptData } from '../types';
import { ApiService } from '../services/ApiService';
import { BatchSyncService } from '../services/BatchSyncService';
import { SunmiPrinterDriver } from '../services/SunmiPrinterDriver';
import { usePosStore } from '../stores/usePosStore';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onBack: () => void;
  onSuccess: (receipt: ThermalReceiptData) => void;
}

export const PaymentScreen: React.FC<Props> = ({ onBack, onSuccess }) => {
  const { t } = useLanguage();
  const [tenderedInput, setTenderedInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const branch = usePosStore((s) => s.branch);
  const device = usePosStore((s) => s.device);
  const cashier = usePosStore((s) => s.activeCashier);
  const activeShiftId = usePosStore((s) => s.activeShiftId);
  const cart = usePosStore((s) => s.cart);
  const clearCart = usePosStore((s) => s.clearCart);
  const getTotal = usePosStore((s) => s.getTotal);

  const total = getTotal();
  const tenderedAmount = parseFloat(tenderedInput || '0');
  const changeAmount = Math.max(0, tenderedAmount - total);
  const isSufficient = tenderedAmount >= total;

  const handleQuickCash = (amt: number) => {
    setTenderedInput(String(amt));
  };

  const handleExactCash = () => {
    setTenderedInput(String(total));
  };

  const handleConfirm = async () => {
    if (!isSufficient) {
      Alert.alert(t('accessDenied'), t('enterValidAmount'));
      return;
    }
    
    setIsProcessing(true);
    try {
      const payload = {
        branch_id: branch?.id || 1,
        device_id: device?.id,
        cashier_id: cashier?.id,
        shift_id: activeShiftId,
        payment_method: 'cash',
        total_amount: total,
        amount_tendered: tenderedAmount,
        change_amount: changeAmount,
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price
        }))
      };

      const res = await ApiService.submitOrder(payload);
      
      let receipt: ThermalReceiptData = res.receipt;
      
      if (!receipt) {
        receipt = {
          store_header: {
            name: branch?.name || 'KuyaVince POS',
            address: 'Zamboanga City Hub',
            contact: '0917-000-0000'
          },
          order_info: {
            order_number: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
            date_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cashier: cashier?.name || 'Cashier'
          },
          items: cart.map((i) => ({
            name: i.product.name,
            qty: i.quantity,
            unit_price: i.unit_price.toFixed(2),
            total_price: i.total_price.toFixed(2)
          })),
          totals: {
            subtotal: total.toFixed(2),
            discount: '0.00',
            total: total.toFixed(2),
            amount_tendered: tenderedAmount.toFixed(2),
            change: changeAmount.toFixed(2),
            payment_method: 'CASH'
          },
          footer: {
            message: 'Maraming Salamat! Please come again.',
            notice: 'Official Cash Sales Invoice'
          }
        };
      }
      
      // 1. Save locally to offline-first batch queue for End-of-Day Sync
      await BatchSyncService.saveOrderLocally({
        order_number: receipt.order_info.order_number,
        client_tx_id: 'TX-' + Date.now(),
        subtotal: total,
        total_amount: total,
        payment_method: 'cash',
        amount_tendered: tenderedAmount,
        change_amount: changeAmount,
        created_at: new Date().toISOString(),
        items: cart.map(i => ({
          product_id: i.product.id,
          name: i.product.name,
          qty: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price
        }))
      });

      // 2. Print Thermal Slip
      try {
        await SunmiPrinterDriver.printReceipt(receipt);
      } catch (e) {
        console.warn('Thermal print warning', e);
      }
      
      clearCart();
      onSuccess(receipt);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      {/* Top Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: 'bold' }}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>{t('cashPaymentHeader')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Order Total Display */}
        <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 16, backgroundColor: '#1E293B', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#334155' }}>
          <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, textAlign: 'center' }}>{t('totalAmountDue')}</Text>
          <Text style={{ color: '#34D399', fontWeight: 'bold', fontSize: 38, fontFamily: 'monospace', textAlign: 'center', marginTop: 4 }}>₱{total.toFixed(2)}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 2 }}>{cart.reduce((s, i) => s + i.quantity, 0)} {t('items')}</Text>
        </View>

        {/* Cash Tendered Input */}
        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.2 }}>{t('cashTendered')}</Text>
            <TouchableOpacity onPress={handleExactCash} style={{ backgroundColor: '#1E3A5F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: 'bold' }}>{t('exactAmount')}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={{ backgroundColor: '#1E293B', borderWidth: 2, borderColor: isSufficient ? '#10B981' : '#3B82F6', borderRadius: 16, padding: 16, color: 'white', fontWeight: 'bold', fontSize: 30, fontFamily: 'monospace', textAlign: 'center' }}
            keyboardType="numeric"
            placeholder="₱ 0.00"
            placeholderTextColor="#475569"
            autoFocus
            value={tenderedInput}
            onChangeText={setTenderedInput}
          />
        </View>
        
        {/* Quick Peso Chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, gap: 8, marginBottom: 16 }}>
          {[50, 100, 200, 500, 1000].map((amt) => (
            <TouchableOpacity
              key={amt}
              style={{ flex: 1, minWidth: 60, backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}
              onPress={() => handleQuickCash(amt)}
            >
              <Text style={{ color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' }}>₱{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Change Display Card */}
        <View style={{ marginHorizontal: 16, backgroundColor: isSufficient ? '#022C22' : '#1E293B', borderWidth: 1, borderColor: isSufficient ? '#065F46' : '#334155', borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: 'bold' }}>{t('sukliChange')}</Text>
            <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>{isSufficient ? t('returnToCustomer') : t('awaitingPayment')}</Text>
          </div>
          <Text style={{ color: isSufficient ? '#34D399' : '#64748B', fontWeight: 'bold', fontSize: 26, fontFamily: 'monospace' }}>
            ₱ {changeAmount.toFixed(2)}
          </Text>
        </View>

        {/* Sticky Confirm & Print Button */}
        <View style={{ marginHorizontal: 16, marginTop: 24 }}>
          <TouchableOpacity
            style={{
              backgroundColor: isSufficient ? '#10B981' : '#334155',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: isProcessing ? 0.7 : 1
            }}
            disabled={isProcessing || !isSufficient}
            onPress={handleConfirm}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                {isSufficient ? t('confirmPrintReceipt') : t('enterValidAmount')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
