import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
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
  const getTotal = usePosStore((s) => s.getTotal);

  const total = getTotal();

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
                style={{ width: 32, height: 32, backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
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

        {/* Total Summary Card */}
        <View style={{ marginHorizontal: 16, marginVertical: 16, backgroundColor: '#1E293B', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#334155' }}>
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
