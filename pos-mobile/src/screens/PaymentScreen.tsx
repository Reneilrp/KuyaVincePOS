import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { ThermalReceiptData } from '../types';
import { ApiService } from '../services/ApiService';
import { SunmiPrinterDriver } from '../services/SunmiPrinterDriver';
import { usePosStore } from '../stores/usePosStore';
import C from '../theme/colors';

interface Props {
  onBack: () => void;
  onSuccess: (receipt: ThermalReceiptData) => void;
}

type PayMethod = 'cash' | 'gcash' | 'card';

export const PaymentScreen: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('cash');
  const [tenderedInput, setTenderedInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const branch = usePosStore(s => s.branch);
  const device = usePosStore(s => s.device);
  const cashier = usePosStore(s => s.activeCashier);
  const activeShiftId = usePosStore(s => s.activeShiftId);
  const cart = usePosStore(s => s.cart);
  const clearCart = usePosStore(s => s.clearCart);
  const getTotal = usePosStore(s => s.getTotal);

  const total = getTotal();
  const tenderedAmount = parseFloat(tenderedInput || '0');
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, tenderedAmount - total) : 0;

  const paymentOptions = [
    { icon: '$', label: 'Cash', value: 'cash' },
    { icon: 'P', label: 'GCash / Maya', value: 'gcash' },
    { icon: 'C', label: 'Card / Other', value: 'card' }
  ];

  const handleConfirm = async () => {
    if (paymentMethod === 'cash' && tenderedAmount < total) {
      Alert.alert('Payment Error', 'Cash tendered is less than the total amount.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const payload = {
        branch_id: branch?.id || 1,
        device_id: device?.id,
        cashier_id: cashier?.id,
        shift_id: activeShiftId,
        payment_method: paymentMethod,
        total_amount: total,
        amount_tendered: paymentMethod === 'cash' ? tenderedAmount : total,
        items: cart.map(i => ({
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
          order_number: 'ORD-' + Math.floor(Math.random()*10000),
          date: new Date().toISOString(),
          cashier: cashier?.name || 'Cashier',
          items: cart.map(i => ({
            name: i.product.name,
            qty: i.quantity,
            price: i.unit_price,
            total: i.total_price
          })),
          subtotal: total,
          total: total,
          payment_method: paymentMethod,
          amount_tendered: paymentMethod === 'cash' ? tenderedAmount : total,
          change: changeAmount
        };
      }
      
      try {
        await SunmiPrinterDriver.printReceipt(receipt);
      } catch(e) {
        console.warn('Printer error', e);
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
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: 'bold' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>Payment</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView>
        <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 12, backgroundColor: '#1E293B', borderRadius: 20, padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, textAlign: 'center' }}>ORDER TOTAL</Text>
          <Text style={{ color: '#34D399', fontWeight: 'bold', fontSize: 36, fontFamily: 'monospace', textAlign: 'center' }}>₱{total.toFixed(2)}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center' }}>{cart.length} items</Text>
        </View>

        <Text style={{ marginHorizontal: 16, marginBottom: 10, color: '#94A3B8', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.2 }}>SELECT PAYMENT METHOD</Text>
        
        <View style={{ marginHorizontal: 16, gap: 10 }}>
          {paymentOptions.map(option => {
            const isSelected = paymentMethod === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={{ height: 64, borderRadius: 16, borderWidth: 2, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderColor: isSelected ? '#3B82F6' : '#334155', backgroundColor: isSelected ? '#1E3A5F' : '#1E293B' }}
                onPress={() => setPaymentMethod(option.value as PayMethod)}
              >
                <Text style={{ color: isSelected ? '#3B82F6' : '#94A3B8', fontSize: 20, marginRight: 12 }}>{option.icon}</Text>
                <Text style={{ color: isSelected ? 'white' : '#94A3B8', fontWeight: 'bold', fontSize: 15, flex: 1 }}>{option.label}</Text>
                {isSelected && <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            )
          })}
        </View>

        {paymentMethod === 'cash' && (
          <>
            <Text style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 8, color: '#94A3B8', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.2 }}>CASH TENDERED</Text>
            <TextInput
              style={{ marginHorizontal: 16, backgroundColor: '#1E293B', borderWidth: 2, borderColor: '#3B82F6', borderRadius: 16, padding: 16, color: 'white', fontWeight: 'bold', fontSize: 28, fontFamily: 'monospace' }}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#475569"
              value={tenderedInput}
              onChangeText={setTenderedInput}
            />
            
            <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 10, gap: 8 }}>
              {[50, 100, 200, 500].map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={{ backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}
                  onPress={() => setTenderedInput(String(amt))}
                >
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>₱{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: '#022C22', borderWidth: 1, borderColor: '#065F46', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>Change:</Text>
              <Text style={{ color: '#34D399', fontWeight: 'bold', fontSize: 20 }}>₱ {changeAmount.toFixed(2)}</Text>
            </View>
          </>
        )}

        <View style={{ marginHorizontal: 16, marginBottom: 20, marginTop: 16 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: isProcessing ? 0.7 : 1 }}
            disabled={isProcessing}
            onPress={handleConfirm}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>🖸️ Confirm & Print Receipt</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
