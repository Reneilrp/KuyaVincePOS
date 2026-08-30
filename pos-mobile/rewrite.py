import os

pos_register_content = """import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, Image } from 'react-native';
import { ApiService } from '../services/ApiService';
import { usePosStore } from '../stores/usePosStore';
import { Product } from '../types';
import C from '../theme/colors';

interface Props {
  onLogout: () => void;
  onOpenRestock: () => void;
  onOpenTimeclock: () => void;
  onOpenEndOfDay: () => void;
  onOpenCart: () => void;
}

export const PosRegisterScreen: React.FC<Props> = ({ onLogout, onOpenRestock, onOpenTimeclock, onOpenEndOfDay, onOpenCart }) => {
  const branch = usePosStore((s) => s.branch);
  const categories = usePosStore((s) => s.categories);
  const products = usePosStore((s) => s.products);
  const selectedCategoryId = usePosStore((s) => s.selectedCategoryId);
  const searchQuery = usePosStore((s) => s.searchQuery);
  const setCatalog = usePosStore((s) => s.setCatalog);
  const setSelectedCategoryId = usePosStore((s) => s.setSelectedCategoryId);
  const cart = usePosStore((s) => s.cart);
  const addToCart = usePosStore((s) => s.addToCart);
  const updateQuantity = usePosStore((s) => s.updateQuantity);
  const getTotal = usePosStore((s) => s.getTotal);

  useEffect(() => {
    loadCatalog();
  }, [branch?.id]);

  const loadCatalog = async () => {
    try {
      const res = await ApiService.getCatalog(branch ? branch.id : 1);
      if (res.categories && res.products) {
        setCatalog(res.categories, res.products);
      }
    } catch (e) {
      console.warn('Failed to fetch catalog from backend, using fallback mock data');
      const mockCats = [
        { id: 1, name: 'Coffee & Drinks', color: '#3B82F6' },
        { id: 2, name: 'Bakery & Pastries', color: '#F59E0B' },
        { id: 3, name: 'Hot Meals', color: '#EF4444' }
      ];
      const mockProds: Product[] = [
        { id: 1, category_id: 1, category_name: 'Coffee', name: 'Iced Caramel Macchiato', base_price: 145, cost_price: 45, stock: 48, alert_threshold: 10, is_low_stock: false, is_out_of_stock: false },
        { id: 2, category_id: 1, category_name: 'Coffee', name: 'Spanish Latte (Cold)', base_price: 135, cost_price: 40, stock: 6, alert_threshold: 10, is_low_stock: true, is_out_of_stock: false },
        { id: 3, category_id: 2, category_name: 'Bakery', name: 'Butter Croissant', base_price: 85, cost_price: 30, stock: 22, alert_threshold: 10, is_low_stock: false, is_out_of_stock: false },
        { id: 4, category_id: 2, category_name: 'Bakery', name: 'Chocolate Lava Muffin', base_price: 95, cost_price: 35, stock: 0, alert_threshold: 5, is_low_stock: true, is_out_of_stock: true },
        { id: 5, category_id: 3, category_name: 'Meals', name: 'Beef Tapa Rice Bowl', base_price: 180, cost_price: 70, stock: 35, alert_threshold: 5, is_low_stock: false, is_out_of_stock: false }
      ];
      setCatalog(mockCats, mockProds);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategoryId === null || p.category_id === selectedCategoryId;
    const matchesSearch = searchQuery === '' || (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' }}>
        <TouchableOpacity onPress={onOpenEndOfDay}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>☰</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>KuyaVince POS</Text>
        <View style={{ position: 'relative' }}>
          <Text style={{ fontSize: 22 }}>🛒</Text>
          {cart.length > 0 && (
            <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 9 }}>{totalItems}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 52, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
          <TouchableOpacity
            style={{ backgroundColor: selectedCategoryId === null ? '#3B82F6' : '#0F172A', borderColor: '#334155', borderWidth: selectedCategoryId === null ? 0 : 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}
            onPress={() => setSelectedCategoryId(null)}
          >
            <Text style={{ color: selectedCategoryId === null ? 'white' : '#94A3B8', fontWeight: 'bold', fontSize: 12 }}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={{ backgroundColor: selectedCategoryId === cat.id ? '#3B82F6' : '#0F172A', borderColor: '#334155', borderWidth: selectedCategoryId === cat.id ? 0 : 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text style={{ color: selectedCategoryId === cat.id ? 'white' : '#94A3B8', fontWeight: 'bold', fontSize: 12 }}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item: prod }) => {
          const cartItem = cart.find(i => i.product.id === prod.id);
          return (
            <View style={{ backgroundColor: '#1E293B', borderRadius: 16, borderColor: '#334155', borderWidth: 1, padding: 12, flex: 1, margin: 4 }}>
              <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', marginBottom: 8, alignSelf: 'center' }}>
                {prod.image_url ? (
                  <Image source={{ uri: prod.image_url }} style={{ width: 40, height: 40 }} />
                ) : (
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 22 }}>{prod.name.charAt(0)}</Text>
                )}
              </View>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }} numberOfLines={2}>{prod.name}</Text>
              <Text style={{ color: '#34D399', fontWeight: 'bold', fontSize: 15, marginBottom: 8 }}>₱{prod.base_price.toFixed(2)}</Text>
              
              {cartItem ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F172A', borderRadius: 10, padding: 4 }}>
                  <TouchableOpacity style={{ width: 32, height: 32, backgroundColor: '#3B82F6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} onPress={() => updateQuantity(prod.id, cartItem.quantity - 1)}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>-</Text>
                  </TouchableOpacity>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{cartItem.quantity}</Text>
                  <TouchableOpacity style={{ width: 32, height: 32, backgroundColor: '#3B82F6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} onPress={() => addToCart(prod)}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={{ backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }} onPress={() => addToCart(prod)}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>+ Add</Text>
                </TouchableOpacity>
              )}
              {prod.is_out_of_stock && (
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', borderRadius: 16 }}>
                  <Text style={{ color: 'rose', fontWeight: 'bold' }}>OUT OF STOCK</Text>
                </View>
              )}
            </View>
          );
        }}
      />

      <View style={{ height: 64, backgroundColor: '#1E293B', borderTopColor: '#334155', borderTopWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'column' }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>{totalItems} items</Text>
          <Text style={{ color: '#34D399', fontWeight: 'bold', fontSize: 18 }}>₱{getTotal().toFixed(2)}</Text>
        </View>
        {cart.length > 0 && (
          <TouchableOpacity style={{ backgroundColor: '#10B981', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }} onPress={onOpenCart}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Checkout →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
import { StyleSheet } from 'react-native';
"""

cart_review_content = """import React, { useState } from 'react';
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
"""

payment_content = """import React, { useState } from 'react';
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
"""

with open('/home/pheinz/KuyaVincePOS/pos-mobile/src/screens/PosRegisterScreen.tsx', 'w') as f:
    f.write(pos_register_content)
    
with open('/home/pheinz/KuyaVincePOS/pos-mobile/src/screens/CartReviewScreen.tsx', 'w') as f:
    f.write(cart_review_content)
    
with open('/home/pheinz/KuyaVincePOS/pos-mobile/src/screens/PaymentScreen.tsx', 'w') as f:
    f.write(payment_content)
