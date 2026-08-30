import React, { useEffect } from 'react';
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
