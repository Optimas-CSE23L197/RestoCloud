// components/popup/GenerateBillPopup.jsx
import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { Receipt, X, Ticket } from 'lucide-react-native';
import { generateBill } from '../../../api/system.api';
import { useAuth } from '../../../src/context/AuthContext';

export default function GenerateBillPopup({ visible, onClose, table, items = [] }) {
    const [discount, setDiscount] = useState('');
    const [loading, setLoading] = useState(false);

    const { selectedRestaurant } = useAuth();
    const hotelGroupCode = selectedRestaurant?.hotelgrpcd || '';

    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const discountAmt = parseFloat(discount) || 0;
    const netPayable = subtotal + cgst + sgst - discountAmt;

    // ✅ Generate Bill API Call
    const handleMakeBill = async () => {
        if (!table?.tableCode) {
            Alert.alert('Error', 'Table code not found');
            return;
        }

        setLoading(true);
        const result = await generateBill(table.tableCode, hotelGroupCode);
        setLoading(false);

        if (result.success) {
            Alert.alert('Success', 'Bill generated successfully!');
            onClose();
        } else {
            Alert.alert('Error', result.error || 'Failed to generate bill');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Receipt size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.headerTitle}>Generate Bill</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.body}>
                        <View style={styles.topRow}>
                            <View style={styles.field}>
                                <Text style={styles.label}>SELECTED TABLE</Text>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputText}>{table?.tableNo || 'T-01'}</Text>
                                </View>
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>ASSIGNED CAPTAIN</Text>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputText}>Captain1</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerCell, styles.colItem]}>ITEM</Text>
                            <Text style={[styles.headerCell, styles.colQty]}>QTY</Text>
                            <Text style={[styles.headerCell, styles.colAmount]}>AMOUNT</Text>
                        </View>

                        {items.map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <Text style={[styles.itemText, styles.colItem]}>{item.name}</Text>
                                <Text style={[styles.itemText, styles.colQty]}>{item.qty}</Text>
                                <Text style={[styles.itemText, styles.colAmount]}>₹{item.total}</Text>
                            </View>
                        ))}

                        <View style={styles.discountSection}>
                            <Text style={styles.label}>DISCOUNT CODE / OFFER</Text>
                            <View style={styles.discountRow}>
                                <TextInput
                                    placeholder="Enter coupon code"
                                    style={styles.discountInput}
                                    value={discount}
                                    onChangeText={setDiscount}
                                />
                                <Pressable style={styles.applyBtn}>
                                    <Ticket size={16} color="#333333" strokeWidth={2.5} />
                                    <Text style={styles.applyText}>Apply</Text>
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.summary}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Gross Total:</Text>
                                <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>CGST (2.5%):</Text>
                                <Text style={styles.summaryValue}>₹{cgst.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>SGST (2.5%):</Text>
                                <Text style={styles.summaryValue}>₹{sgst.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Discount:</Text>
                                <Text style={[styles.summaryValue, styles.discountText]}>- ₹{discountAmt.toFixed(2)}</Text>
                            </View>
                            <View style={[styles.summaryRow, styles.netRow]}>
                                <Text style={styles.netLabel}>Net Payable:</Text>
                                <Text style={styles.netValue}>₹{netPayable.toFixed(2)}</Text>
                            </View>
                        </View>

                        <Pressable
                            style={[styles.makeBillBtn, loading && styles.makeBillBtnDisabled]}
                            onPress={handleMakeBill}
                            disabled={loading}
                        >
                            <Receipt size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.makeBillText}>
                                {loading ? 'Generating...' : 'Make Bill'}
                            </Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '92%', maxWidth: 500, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', paddingHorizontal: 16, paddingVertical: 14 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
    closeBtn: { padding: 4 },
    body: { padding: 16 },
    topRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    field: { flex: 1 },
    label: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 6, letterSpacing: 0.5 },
    inputContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10 },
    inputText: { fontSize: 14, color: '#333', fontWeight: '500' },
    tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerCell: { fontSize: 12, fontWeight: '700', color: '#555' },
    colItem: { flex: 2 },
    colQty: { flex: 0.8, textAlign: 'center' },
    colAmount: { flex: 1.2, textAlign: 'right' },
    itemRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    itemText: { fontSize: 13, color: '#333' },
    discountSection: { marginTop: 16, marginBottom: 16 },
    discountRow: { flexDirection: 'row', gap: 10 },
    discountInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 12, height: 44, fontSize: 14 },
    applyBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333', borderRadius: 6, paddingHorizontal: 12, height: 44, gap: 6 },
    applyText: { fontSize: 14, fontWeight: '600', color: '#333' },
    summary: { backgroundColor: '#f8f9fa', padding: 14, borderRadius: 8, marginBottom: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    summaryLabel: { fontSize: 13, color: '#666' },
    summaryValue: { fontSize: 13, fontWeight: '500', color: '#333' },
    discountText: { color: '#e74c3c' },
    netRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#ddd' },
    netLabel: { fontSize: 15, fontWeight: '700', color: '#333' },
    netValue: { fontSize: 16, fontWeight: 'bold', color: '#27ae60' },
    makeBillBtn: { backgroundColor: '#27ae60', paddingVertical: 14, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    makeBillBtnDisabled: { backgroundColor: '#a5adb5' },
    makeBillText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});