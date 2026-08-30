import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { ApiService } from '../services/ApiService';
import { usePosStore } from '../stores/usePosStore';
import { Product } from '../types';

export const StockRestockModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const branch = usePosStore((s) => s.branch);
  const products = usePosStore((s) => s.products);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(products[0]?.id || null);
  const [restockQty, setRestockQty] = useState('20');
  const [notes, setNotes] = useState('Store Floor Restock');
  const [loading, setLoading] = useState(false);

  const handleRestockSubmit = async () => {
    if (!selectedProductId || !restockQty || parseFloat(restockQty) <= 0) {
      Alert.alert('Error', 'Please select a product and enter a valid quantity.');
      return;
    }

    setLoading(true);
    try {
      const res = await ApiService.restock(
        branch ? branch.id : 1,
        selectedProductId,
        parseFloat(restockQty),
        notes
      );
      Alert.alert('Restock Successful', res.message || 'Inventory updated.');
      onClose();
    } catch (e: any) {
      Alert.alert('Restock Failed', e.message || 'Could not update inventory.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>📦 Branch Stock Replenishment</Text>
          <Text style={styles.modalSub}>{branch?.name || 'Main Branch'}</Text>

          <Text style={styles.label}>Select Product to Restock</Text>
          <View style={styles.productSelectBox}>
            {products.slice(0, 5).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.prodSelectBtn, selectedProductId === p.id && styles.prodSelectBtnActive]}
                onPress={() => setSelectedProductId(p.id)}
              >
                <Text style={[styles.prodSelectName, selectedProductId === p.id && styles.textWhite]}>{p.name}</Text>
                <Text style={[styles.prodSelectStock, selectedProductId === p.id && styles.textWhite]}>Current: {p.stock}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Add Quantity</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={restockQty}
            onChangeText={setRestockQty}
            placeholder="Quantity to add (e.g. 50)"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>Notes / Reason</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g., Delivery Batch #102"
            placeholderTextColor="#64748B"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.btnDisabled]}
              disabled={loading}
              onPress={handleRestockSubmit}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>✅ Restock Now</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { backgroundColor: '#1E293B', width: '100%', maxWidth: 440, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  modalSub: { color: '#38BDF8', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  label: { color: '#94A3B8', fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', padding: 12, borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  productSelectBox: { gap: 6, marginBottom: 12 },
  prodSelectBtn: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderRadius: 6, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155' },
  prodSelectBtnActive: { backgroundColor: '#2563EB', borderColor: '#60A5FA' },
  prodSelectName: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  prodSelectStock: { color: '#94A3B8', fontSize: 11 },
  textWhite: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 13 },
  confirmBtn: { flex: 2, backgroundColor: '#10B981', padding: 12, borderRadius: 8, alignItems: 'center' },
  confirmBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  btnDisabled: { opacity: 0.6 }
});
