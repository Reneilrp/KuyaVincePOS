import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { usePosStore } from '../stores/usePosStore';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onBack: () => void;
  onProceed: () => void;
}

export const CartReviewScreen: React.FC<Props> = ({ onBack, onProceed }) => {
  const { t } = useLanguage();
  const [specialNote, setSpecialNote] = useState('');
  
  const cart = usePosStore((s) => s.cart);
  const updateQuantity = usePosStore((s) => s.updateQuantity);
  const clearCart = usePosStore((s) => s.clearCart);
  const getSubtotal = usePosStore((s) => s.getSubtotal);
  const getTotal = usePosStore((s) => s.getTotal);
  const seniorDiscount = usePosStore((s) => s.seniorDiscount);
  const setSeniorDiscount = usePosStore((s) => s.setSeniorDiscount);

  const subtotal = getSubtotal();
  const total = getTotal();
  const discountDeduction = subtotal - total;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      {/* Top Navigation */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: 'bold' }}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{t('yourOrder')}</Text>
        <TouchableOpacity onPress={() => { clearCart(); onBack(); }}>
          <Text style={{ color: '#FB7185', fontSize: 13 }}>{t('clearAll')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 0 }}>
        <Text style={{ color: '#94A3B8', fontSize: 11, letterSpacing: 1, marginHorizontal: 16, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', fontWeight: 'bold' }}>
          {t('orderItems', { count: cart.length })}
        </Text>
        
        {cart.map((item) => (
          <View key={item.product.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{item.product.name}</Text>
              <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>₱{item.unit_price.toFixed(2)} {t('each')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                style={{ width: 32, height: 32, backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
              >
                <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 18 }}>-</Text>
              </TouchableOpacity>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, minWidth: 20, textAlign: 'center' }}>
                {item.quantity}
              </Text>
              <TouchableOpacity
                style={{ width: 32, height: 32, backgroundColor: '#3B82F6', borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
              >
                <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 18 }}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={{ minWidth: 70, alignItems: 'flex-end' }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>₱{item.total_price.toFixed(2)}</Text>
            </View>
          </View>
        ))}

        {/* Philippine Statutory Senior / PWD 20% Discount */}
        <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#1E293B', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#334155' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Senior Citizen / PWD (20%)</Text>
              <Text style={{ color: '#94A3B8', fontSize: 10, marginTop: 2 }}>Statutory 20% discount on 1 individual meal</Text>
            </View>
            <Switch
              value={seniorDiscount.enabled}
              onValueChange={(val) => setSeniorDiscount({ ...seniorDiscount, enabled: val })}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor={seniorDiscount.enabled ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          {seniorDiscount.enabled && (
            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' }}>
              <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 }}>
                SENIOR / PWD OSCA BOOKLET ID NUMBER
              </Text>
              <TextInput
                style={{ backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: 'white', fontSize: 13 }}
                placeholder="e.g. OSCA-ZAM-2026-0912"
                placeholderTextColor="#64748B"
                value={seniorDiscount.idNumber}
                onChangeText={(text) => setSeniorDiscount({ ...seniorDiscount, idNumber: text })}
              />
            </View>
          )}
        </View>

        {/* Total Summary Card */}
        <View style={{ marginHorizontal: 16, marginVertical: 14, backgroundColor: '#1E293B', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#334155' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#94A3B8', fontSize: 13 }}>Subtotal</Text>
            <Text style={{ color: 'white', fontSize: 13 }}>₱{subtotal.toFixed(2)}</Text>
          </View>

          {discountDeduction > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#34D399', fontSize: 13 }}>Senior/PWD Discount (20%)</Text>
              <Text style={{ color: '#34D399', fontSize: 13, fontWeight: 'bold' }}>— ₱{discountDeduction.toFixed(2)}</Text>
            </View>
          )}

          <View style={{ height: 1, backgroundColor: '#334155', marginVertical: 8 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>{t('totalAmountDue')}</Text>
              <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>{t('cashAtCounter')}</Text>
            </div>
            <Text style={{ color: '#34D399', fontWeight: 'bold', fontSize: 28, fontFamily: 'monospace' }}>
              ₱{total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Special Request / Notes */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 6, fontWeight: '600' }}>{t('addSpecialNote')}</Text>
          <TextInput
            style={{ backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 12, padding: 12, color: 'white', fontStyle: 'italic' }}
            placeholder={t('notePlaceholder')}
            placeholderTextColor="#475569"
            multiline
            value={specialNote}
            onChangeText={setSpecialNote}
          />
        </View>

        <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            onPress={onProceed}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              {t('proceedToPayment', { total: total.toFixed(2) })}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
