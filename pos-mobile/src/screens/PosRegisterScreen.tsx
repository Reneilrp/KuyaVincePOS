import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { ApiService } from '../services/ApiService';
import { SunmiPrinterDriver } from '../services/SunmiPrinterDriver';
import { usePosStore } from '../stores/usePosStore';
import { Product, ThermalReceiptData } from '../types';

export const PosRegisterScreen: React.FC<{
  onLogout: () => void;
  onOpenRestock: () => void;
  onOpenTimeclock: () => void;
  onOpenEndOfDay: () => void;
}> = ({ onLogout, onOpenRestock, onOpenTimeclock, onOpenEndOfDay }) => {
  const branch = usePosStore((s) => s.branch);
  const device = usePosStore((s) => s.device);
  const cashier = usePosStore((s) => s.activeCashier);
  const activeShiftId = usePosStore((s) => s.activeShiftId);

  const categories = usePosStore((s) => s.categories);
  const products = usePosStore((s) => s.products);
  const selectedCategoryId = usePosStore((s) => s.selectedCategoryId);
  const searchQuery = usePosStore((s) => s.searchQuery);
  const setCatalog = usePosStore((s) => s.setCatalog);
  const setSelectedCategoryId = usePosStore((s) => s.setSelectedCategoryId);
  const setSearchQuery = usePosStore((s) => s.setSearchQuery);

  const cart = usePosStore((s) => s.cart);
  const addToCart = usePosStore((s) => s.addToCart);
  const updateQuantity = usePosStore((s) => s.updateQuantity);
  const removeFromCart = usePosStore((s) => s.removeFromCart);
  const clearCart = usePosStore((s) => s.clearCart);
  const getSubtotal = usePosStore((s) => s.getSubtotal);
  const getTotal = usePosStore((s) => s.getTotal);

  // Modals & Payment State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'maya' | 'card'>('cash');
  const [tenderedInput, setTenderedInput] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ThermalReceiptData | null>(null);

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
    const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotal = getSubtotal();
  const total = getTotal();
  const tenderedAmount = parseFloat(tenderedInput || '0');
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, Math.round((tenderedAmount - total) * 100) / 100) : 0.00;

  const handleQuickCash = (amount: number) => {
    setTenderedInput(String(amount));
  };

  const handleExactCash = () => {
    setTenderedInput(String(total));
  };

  const handleCheckoutSubmit = async () => {
    if (paymentMethod === 'cash' && tenderedAmount < total) {
      Alert.alert('Payment Error', 'Cash tendered is less than the total amount.');
      return;
    }

    setProcessingOrder(true);
    try {
      const payload = {
        branch_id: branch?.id || 1,
        device_id: device?.id,
        cashier_id: cashier?.id,
        shift_id: activeShiftId,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === 'cash' ? tenderedAmount : total,
        discount_amount: 0
      };

      const res = await ApiService.processCheckout(payload);

      if (res.data?.receipt) {
        setLastReceipt(res.data.receipt);
        // Print receipt directly on Sunmi Handheld
        await SunmiPrinterDriver.printReceipt(res.data.receipt);
      }

      clearCart();
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      loadCatalog(); // Refresh live stock counts
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.message || 'Transaction could not be completed.');
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.branchTitle}>🏢 {branch?.name || 'Main Branch'} <Text style={styles.branchCode}>[{branch?.code}]</Text></Text>
          <Text style={styles.cashierSubtitle}>👤 Cashier: {cashier?.name || 'Staff'} • {device?.terminal_name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={onOpenRestock}>
            <Text style={styles.headerBtnText}>📦 Restock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={onOpenTimeclock}>
            <Text style={styles.headerBtnText}>⏱️ Clock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: '#065F46' }]} onPress={onOpenEndOfDay}>
            <Text style={styles.headerBtnText}>📤 Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, styles.logoutBtn]} onPress={onLogout}>
            <Text style={styles.headerBtnText}>🔒 PIN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Main Workspace (Menu Grid + Cart Panel) */}
      <View style={styles.workspace}>
        {/* Left: Product Catalog */}
        <View style={styles.catalogSection}>
          {/* Search & Category Filter Bar */}
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search items or scan barcode..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity
              style={[styles.catTab, selectedCategoryId === null && styles.catTabActive]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text style={[styles.catTabText, selectedCategoryId === null && styles.textWhite]}>All Items</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catTab, selectedCategoryId === cat.id && styles.catTabActive]}
                onPress={() => setSelectedCategoryId(cat.id)}
              >
                <Text style={[styles.catTabText, selectedCategoryId === cat.id && styles.textWhite]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Touch Grid of Products */}
          <ScrollView contentContainerStyle={styles.productGrid}>
            {filteredProducts.map((prod) => (
              <TouchableOpacity
                key={prod.id}
                style={[styles.productCard, prod.is_out_of_stock && styles.productCardDisabled]}
                disabled={prod.is_out_of_stock}
                onPress={() => addToCart(prod)}
              >
                <View style={styles.stockBadgeContainer}>
                  <Text style={[
                    styles.stockBadge,
                    prod.is_out_of_stock ? styles.badgeOut : (prod.is_low_stock ? styles.badgeLow : styles.badgeOk)
                  ]}>
                    {prod.is_out_of_stock ? 'OUT OF STOCK' : `Stock: ${prod.stock}`}
                  </Text>
                </View>
                <Text style={styles.productName} numberOfLines={2}>{prod.name}</Text>
                <Text style={styles.productPrice}>₱{prod.base_price.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Right: Cart Drawer */}
        <View style={styles.cartSection}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>🛒 Current Order ({cart.reduce((sum, i) => sum + i.quantity, 0)})</Text>
            {cart.length > 0 && (
              <TouchableOpacity onPress={clearCart}>
                <Text style={styles.clearCartText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.cartItemsList}>
            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Text style={styles.emptyCartText}>Tap items on the left to add to order</Text>
              </View>
            ) : (
              cart.map((item) => (
                <View key={item.product.id} style={styles.cartItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{item.product.name}</Text>
                    <Text style={styles.cartItemSub}>₱{item.unit_price.toFixed(2)} each</Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemTotal}>₱{item.total_price.toFixed(2)}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Cart Footer */}
          <View style={styles.cartFooter}>
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>₱{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>₱{total.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.checkoutBtn, cart.length === 0 && styles.checkoutBtnDisabled]}
              disabled={cart.length === 0}
              onPress={() => {
                setTenderedInput(String(total));
                setIsCheckoutOpen(true);
              }}
            >
              <Text style={styles.checkoutBtnText}>⚡ CHARGE ₱{total.toFixed(2)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. Checkout Modal */}
      <Modal visible={isCheckoutOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <Text style={styles.modalTotal}>Payable: ₱{total.toFixed(2)}</Text>

            {/* Payment Method Tabs */}
            <View style={styles.paymentMethodTabs}>
              {(['cash', 'gcash', 'maya', 'card'] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.methodTab, paymentMethod === method && styles.methodTabActive]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={[styles.methodTabText, paymentMethod === method && styles.textWhite]}>
                    {method.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentMethod === 'cash' && (
              <View style={styles.cashContainer}>
                <Text style={styles.inputLabel}>Cash Amount Tendered</Text>
                <TextInput
                  style={styles.tenderedInput}
                  keyboardType="numeric"
                  value={tenderedInput}
                  onChangeText={setTenderedInput}
                  placeholder="0.00"
                />

                {/* Quick Cash Buttons */}
                <View style={styles.quickCashRow}>
                  <TouchableOpacity style={styles.quickCashBtn} onPress={handleExactCash}><Text style={styles.quickCashText}>Exact</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.quickCashBtn} onPress={() => handleQuickCash(100)}><Text style={styles.quickCashText}>₱100</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.quickCashBtn} onPress={() => handleQuickCash(500)}><Text style={styles.quickCashText}>₱500</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.quickCashBtn} onPress={() => handleQuickCash(1000)}><Text style={styles.quickCashText}>₱1000</Text></TouchableOpacity>
                </View>

                <View style={styles.changeRow}>
                  <Text style={styles.changeLabel}>Change to Return:</Text>
                  <Text style={styles.changeValue}>₱{changeAmount.toFixed(2)}</Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCheckoutOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, processingOrder && styles.btnDisabled]}
                disabled={processingOrder}
                onPress={handleCheckoutSubmit}
              >
                {processingOrder ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>🖨️ Complete & Print</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Receipt Printed Success Modal */}
      <Modal visible={isReceiptOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.successTitle}>✅ Payment Complete!</Text>
            <Text style={styles.receiptSentNotice}>Customer Receipt printed via Sunmi 58mm Thermal Printer</Text>

            {lastReceipt && (
              <ScrollView style={styles.receiptPreviewBox}>
                <Text style={styles.receiptText}>================================</Text>
                <Text style={[styles.receiptText, { textAlign: 'center', fontWeight: 'bold' }]}>{lastReceipt.store_header.name}</Text>
                <Text style={[styles.receiptText, { textAlign: 'center' }]}>Order #{lastReceipt.order_info.order_number}</Text>
                <Text style={styles.receiptText}>--------------------------------</Text>
                {lastReceipt.items.map((it, idx) => (
                  <Text key={idx} style={styles.receiptText}>{it.name} x{it.qty}  ₱{it.total_price}</Text>
                ))}
                <Text style={styles.receiptText}>--------------------------------</Text>
                <Text style={[styles.receiptText, { fontWeight: 'bold' }]}>TOTAL: ₱{lastReceipt.totals.total}</Text>
                <Text style={styles.receiptText}>Change: ₱{lastReceipt.totals.change}</Text>
                <Text style={styles.receiptText}>================================</Text>
              </ScrollView>
            )}

            <TouchableOpacity style={styles.confirmBtn} onPress={() => setIsReceiptOpen(false)}>
              <Text style={styles.confirmBtnText}>✨ NEXT ORDER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { height: 60, backgroundColor: '#1E293B', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#334155' },
  branchTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' },
  branchCode: { color: '#38BDF8' },
  cashierSubtitle: { color: '#94A3B8', fontSize: 11 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  logoutBtn: { backgroundColor: '#7F1D1D' },
  headerBtnText: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  workspace: { flex: 1, flexDirection: 'row' },
  catalogSection: { flex: 3, padding: 12, borderRightWidth: 1, borderColor: '#334155' },
  searchInput: { backgroundColor: '#1E293B', color: '#F8FAFC', padding: 10, borderRadius: 8, fontSize: 13, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  categoryScroll: { maxHeight: 38, marginBottom: 8 },
  catTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E293B', marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  catTabActive: { backgroundColor: '#2563EB', borderColor: '#60A5FA' },
  catTabText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 20 },
  productCard: { width: '31%', backgroundColor: '#1E293B', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#334155', justifyContent: 'space-between', minHeight: 95 },
  productCardDisabled: { opacity: 0.4, borderColor: '#7F1D1D' },
  stockBadgeContainer: { marginBottom: 4 },
  stockBadge: { fontSize: 9, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  badgeOk: { backgroundColor: '#064E3B', color: '#34D399' },
  badgeLow: { backgroundColor: '#78350F', color: '#FBBF24' },
  badgeOut: { backgroundColor: '#7F1D1D', color: '#F87171' },
  productName: { color: '#F8FAFC', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  productPrice: { color: '#38BDF8', fontSize: 14, fontWeight: 'bold' },
  cartSection: { flex: 2, backgroundColor: '#1E293B', padding: 12, justifyContent: 'space-between' },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#334155', paddingBottom: 8 },
  cartTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' },
  clearCartText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  cartItemsList: { flex: 1, marginVertical: 8 },
  emptyCart: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyCartText: { color: '#64748B', fontSize: 12, textAlign: 'center' },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#334155' },
  cartItemName: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  cartItemSub: { color: '#94A3B8', fontSize: 10 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
  qtyBtn: { width: 24, height: 24, backgroundColor: '#334155', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 14 },
  qtyText: { color: '#F8FAFC', marginHorizontal: 6, fontSize: 12, fontWeight: 'bold' },
  cartItemTotal: { color: '#38BDF8', fontSize: 12, fontWeight: 'bold' },
  cartFooter: { borderTopWidth: 1, borderColor: '#334155', paddingTop: 8 },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  subtotalLabel: { color: '#94A3B8', fontSize: 12 },
  subtotalValue: { color: '#F8FAFC', fontSize: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  totalValue: { color: '#38BDF8', fontSize: 18, fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  checkoutBtnDisabled: { backgroundColor: '#334155', opacity: 0.5 },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { backgroundColor: '#1E293B', width: '100%', maxWidth: 440, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  modalTotal: { color: '#38BDF8', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 8 },
  paymentMethodTabs: { flexDirection: 'row', gap: 6, marginVertical: 12 },
  methodTab: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: '#0F172A', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  methodTabActive: { backgroundColor: '#2563EB', borderColor: '#60A5FA' },
  methodTabText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  cashContainer: { marginVertical: 10 },
  inputLabel: { color: '#94A3B8', fontSize: 11, marginBottom: 4 },
  tenderedInput: { backgroundColor: '#0F172A', color: '#F8FAFC', padding: 12, borderRadius: 8, fontSize: 18, fontWeight: 'bold', borderWidth: 1, borderColor: '#334155', textAlign: 'center' },
  quickCashRow: { flexDirection: 'row', gap: 6, marginVertical: 8 },
  quickCashBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  quickCashText: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, padding: 10, backgroundColor: '#0F172A', borderRadius: 6 },
  changeLabel: { color: '#94A3B8', fontSize: 13 },
  changeValue: { color: '#34D399', fontSize: 16, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 13 },
  confirmBtn: { flex: 2, backgroundColor: '#10B981', padding: 12, borderRadius: 8, alignItems: 'center' },
  confirmBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  btnDisabled: { opacity: 0.6 },
  successTitle: { color: '#34D399', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  receiptSentNotice: { color: '#94A3B8', fontSize: 12, textAlign: 'center', marginVertical: 8 },
  receiptPreviewBox: { maxHeight: 180, backgroundColor: '#0F172A', padding: 10, borderRadius: 8, marginVertical: 12 },
  receiptText: { fontFamily: 'monospace', color: '#CBD5E1', fontSize: 10 },
  textWhite: { color: '#FFFFFF' }
});
