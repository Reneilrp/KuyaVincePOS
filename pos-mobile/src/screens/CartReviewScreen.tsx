import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { usePosStore } from '../stores/usePosStore';
import C from '../theme/colors';

interface Props {
  onBack: () => void;
  onProceed: () => void;
}

export const CartReviewScreen: React.FC<Props> = ({ onBack, onProceed }) => {
  const [specialNote, setSpecialNote] = useState('');
  
  const cart = usePosStore(s => s.cart);
  const updateQuantity = usePosStore(s => s.updateQuantity);
  const clearCart = usePosStore(s => s.clearCart);
  const getSubtotal = usePosStore(s => s.getSubtotal);
  const getTotal = usePosStore(s => s.getTotal);
  const discountAmount = usePosStore(s => s.discountAmount);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: 'bold' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Your Order</Text>
        <TouchableOpacity onPress={() => { clearCart(); onBack(); }}>
          <Text style={{ color: '#FB7185', fontSize: 13 }}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 0 }}>
        <Text style={{ color: '#94A3B8', fontSize: 11, letterSpacing: 1, marginHorizontal: 16, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' }}>ORDER ITEMS ({cart.length})</Text>
        
        {cart.map(item => (
          <View key={item.product.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{item.product.name}</Text>
              <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>₱{item.unit_price.toFixed(2)} each</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity style={{ width: 32, height: 32, backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 18 }}>-</Text>
              </TouchableOpacity>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, minWidth: 20, textAlign: 'center' }}>{item.quantity}</Text>
              <TouchableOpacity style={{ width: 32, height: 32, backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 18 }}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={{ minWidth: 60, alignItems: 'flex-end' }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>₱{item.total_price.toFixed(2)}</Text>
            </View>
          </View>
        ))}

        <View style={{ marginHorizontal: 16, marginVertical: 16, backgroundColor: '#1E293B', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#334155' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#94A3B8', fontSize: 14 }}>Subtotal</Text>
            <Text style={{ color: 'white', fontSize: 14 }}>₱{getSubtotal().toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#94A3B8', fontSize: 14 }}>Discount</Text>
            <Text style={{ color: '#34D399', fontSize: 14 }}>— ₱{discountAmount.toFixed(2)}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: '#334155', marginVertical: 10 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>TOTAL</Text>
            <Text style={{ color: '#34D399', fontWeight: 'bold', fontSize: 22 }}>₱{getTotal().toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 6 }}>Add Note / Special Request</Text>
          <TextInput
            style={{ backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 12, padding: 12, color: 'white', fontStyle: 'italic' }}
            placeholder="e.g. less ice, extra spicy..."
            placeholderTextColor="#475569"
            multiline
            value={specialNote}
            onChangeText={setSpecialNote}
          />
        </View>

        <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
          <TouchableOpacity style={{ backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }} onPress={onProceed}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>₱{getTotal().toFixed(2)} • Proceed to Payment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
