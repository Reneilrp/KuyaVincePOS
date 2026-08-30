import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { usePosStore } from '../stores/usePosStore';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onLogout: () => void;
  onOpenRestock: () => void;
  onOpenTimeclock: () => void;
  onOpenEndOfDay: () => void;
  onOpenCart: () => void;
}

export const PosRegisterScreen: React.FC<Props> = ({
  onLogout,
  onOpenRestock,
  onOpenTimeclock,
  onOpenEndOfDay,
  onOpenCart
}) => {
  const { t, language, toggleLanguage } = useLanguage();
  const branch = usePosStore((s) => s.branch);
  const categories = usePosStore((s) => s.categories);
  const products = usePosStore((s) => s.products);
  const selectedCategoryId = usePosStore((s) => s.selectedCategoryId);
  const searchQuery = usePosStore((s) => s.searchQuery);
  const cart = usePosStore((s) => s.cart);

  const setCatalog = usePosStore((s) => s.setCatalog);
  const setSelectedCategoryId = usePosStore((s) => s.setSelectedCategoryId);
  const addToCart = usePosStore((s) => s.addToCart);
  const updateQuantity = usePosStore((s) => s.updateQuantity);
  const getTotal = usePosStore((s) => s.getTotal);

  useEffect(() => {
    loadCatalog();
  }, [branch]);

  const loadCatalog = async () => {
    if (products.length === 0) {
      const mockCats = [
        { id: 1, name: 'Silog Meals', color: '#3B82F6' },
        { id: 2, name: 'Sizzling Specials', color: '#F59E0B' },
        { id: 3, name: 'Cold Drinks', color: '#EF4444' }
      ];
      const mockProds: Product[] = [
        { id: 1, category_id: 1, category_name: 'Silog', name: 'Tapsilog Special', base_price: 135, cost_price: 55, stock: 48, alert_threshold: 10, is_low_stock: false, is_out_of_stock: false },
        { id: 2, category_id: 1, category_name: 'Silog', name: 'Tocilog Delight', base_price: 120, cost_price: 45, stock: 26, alert_threshold: 10, is_low_stock: false, is_out_of_stock: false },
        { id: 3, category_id: 2, category_name: 'Sizzling', name: 'Sizzling Sisig w/ Egg', base_price: 165, cost_price: 65, stock: 22, alert_threshold: 10, is_low_stock: false, is_out_of_stock: false },
        { id: 4, category_id: 2, category_name: 'Sizzling', name: 'Sizzling Pork Chop', base_price: 155, cost_price: 60, stock: 0, alert_threshold: 5, is_low_stock: true, is_out_of_stock: true },
        { id: 5, category_id: 3, category_name: 'Drinks', name: 'House Iced Tea (Large)', base_price: 45, cost_price: 12, stock: 50, alert_threshold: 5, is_low_stock: false, is_out_of_stock: false }
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
      {/* Top Header Bar */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' }}>
        <TouchableOpacity onPress={onOpenEndOfDay} style={{ padding: 4 }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 22 }}>☰</Text>
        </TouchableOpacity>

        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>KuyaVince POS</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={toggleLanguage} style={{ backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: 11 }}>
              {language === 'en' ? '🇺🇸 EN' : '🇵🇭 TL'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpenCart} style={{ position: 'relative', padding: 4 }}>
            <Text style={{ fontSize: 22 }}>🛒</Text>
            {cart.length > 0 && (
              <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 10 }}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills Horizontal Scroll */}
      <View style={{ height: 52, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
          <TouchableOpacity
            style={{ backgroundColor: selectedCategoryId === null ? '#3B82F6' : '#0F172A', borderColor: '#334155', borderWidth: selectedCategoryId === null ? 0 : 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}
            onPress={() => setSelectedCategoryId(null)}
          >
            <Text style={{ color: selectedCategoryId === null ? 'white' : '#94A3B8', fontWeight: 'bold', fontSize: 12 }}>
              {t('allCategory')}
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
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

      {/* 2-Column Product Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item: prod }) => {
          const cartItem = cart.find((i) => i.product.id === prod.id);
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
                <TouchableOpacity
                  style={{ backgroundColor: prod.is_out_of_stock ? '#334155' : '#3B82F6', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}
                  disabled={prod.is_out_of_stock}
                  onPress={() => addToCart(prod)}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>
                    {prod.is_out_of_stock ? t('outOfStock') : t('addBtn')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Sticky Bottom Checkout Bar */}
      <View style={{ height: 64, backgroundColor: '#1E293B', borderTopColor: '#334155', borderTopWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'column' }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>
            {totalItems} {t('items')}
          </Text>
          <Text style={{ color: '#34D399', fontWeight: 'bold', fontSize: 18, fontFamily: 'monospace' }}>
            ₱{getTotal().toFixed(2)}
          </Text>
        </View>
        {cart.length > 0 && (
          <TouchableOpacity style={{ backgroundColor: '#10B981', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }} onPress={onOpenCart}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
              {t('checkoutBtn')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
