// popup/SettleBillPopup.js
import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import {
    Receipt,
    X,
    Banknote,
    CreditCard,
    Smartphone,
    Landmark,
    Wallet,
    MousePointer2,
    IndianRupee
} from 'lucide-react-native';

// ✅ Payment mode options — add/remove yahan se
const PAYMENT_MODES = [
    { key: 'CASH', label: 'Cash', icon: Banknote },
    { key: 'CARD', label: 'Card', icon: CreditCard },
    { key: 'UPI', label: 'UPI', icon: Smartphone },
    { key: 'BANK', label: 'Bank Transfer', icon: Landmark },
    { key: 'WALLET', label: 'Wallet', icon: Wallet },
];

export default function SettleBillPopup({ visible, onClose, table }) {
    const [discount, setDiscount] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');

    const billData = {
        subTotal: 1350.00,
        cgst: 33.75,
        sgst: 33.75,
        discount: 0.00,
        finalPayable: 1417.50
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>

                    {/* 1. Dark Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Receipt size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.headerTitle}>Settle Bill # {table?.tableNo}</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                            <X size={24} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* 2. Body */}
                    <ScrollView
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                        showsVerticalScrollIndicator={false}
                    >

                        {/* Select Table */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>SELECT TABLE</Text>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputText}>{table?.tableNo}</Text>
                            </View>
                        </View>

                        {/* Assigned Captain */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>ASSIGNED CAPTAIN</Text>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputText}>Captain1</Text>
                            </View>
                        </View>

                        {/* Bill Summary */}
                        <View style={styles.billSummary}>
                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>Sub Total:</Text>
                                <Text style={styles.billValue}>₹{billData.subTotal.toFixed(2)}</Text>
                            </View>
                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>CGST (2.5%):</Text>
                                <Text style={styles.billValue}>₹{billData.cgst.toFixed(2)}</Text>
                            </View>
                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>SGST (2.5%):</Text>
                                <Text style={styles.billValue}>₹{billData.sgst.toFixed(2)}</Text>
                            </View>
                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>Discount:</Text>
                                <Text style={[styles.billValue, styles.discountText]}>- ₹{billData.discount.toFixed(2)}</Text>
                            </View>
                            <View style={[styles.billRow, styles.finalRow]}>
                                <Text style={styles.finalLabel}>Final Payable:</Text>
                                <Text style={styles.finalValue}>₹{billData.finalPayable.toFixed(2)}</Text>
                            </View>
                        </View>

                        {/* Discount Code */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>DISCOUNT CODE / OFFER</Text>
                            <View style={styles.discountContainer}>
                                <TextInput
                                    placeholder="Enter coupon"
                                    style={styles.discountInput}
                                    value={discount}
                                    onChangeText={setDiscount}
                                    placeholderTextColor="#999"
                                />
                                <Pressable style={styles.applyBtn}>
                                    <MousePointer2 size={16} color="#333333" strokeWidth={2.5} />
                                    <Text style={styles.applyText}>Apply</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* ✅ Payment Mode - Chips */}
                        <View style={[styles.fieldGroup, { marginBottom: 4 }]}>
                            <Text style={styles.label}>PAYMENT MODE *</Text>
                            <View style={styles.paymentGrid}>
                                {PAYMENT_MODES.map((mode) => {
                                    const Icon = mode.icon;
                                    const isSelected = paymentMode === mode.key;
                                    return (
                                        <Pressable
                                            key={mode.key}
                                            onPress={() => setPaymentMode(mode.key)}
                                            style={[
                                                styles.paymentChip,
                                                isSelected && styles.paymentChipSelected,
                                            ]}
                                        >
                                            <Icon
                                                size={18}
                                                color={isSelected ? '#FFFFFF' : '#555'}
                                                strokeWidth={2.2}
                                            />
                                            <Text
                                                style={[
                                                    styles.paymentChipText,
                                                    isSelected && styles.paymentChipTextSelected,
                                                ]}
                                            >
                                                {mode.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>

                    {/* 3. Footer Button */}
                    <View style={styles.footer}>
                        <Pressable style={styles.receiveBtn} onPress={onClose}>
                            <IndianRupee size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.receiveText}>Receive Payment</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        width: '92%',
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        maxHeight: '90%'
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2c3e50',
        paddingHorizontal: 20,
        paddingVertical: 16
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff'
    },
    closeBtn: {
        padding: 4
    },

    // Body
    body: {
        maxHeight: 460
    },
    bodyContent: {
        padding: 20,
        paddingBottom: 24
    },
    fieldGroup: {
        marginBottom: 18
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#555',
        marginBottom: 8,
        letterSpacing: 0.5
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 14,
        height: 46,
        gap: 10
    },
    inputText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        fontWeight: '500'
    },

    // Bill Summary
    billSummary: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee'
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5
    },
    billLabel: {
        fontSize: 13,
        color: '#666'
    },
    billValue: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333'
    },
    discountText: {
        color: '#e74c3c'
    },
    finalRow: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#ddd'
    },
    finalLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333'
    },
    finalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#27ae60'
    },

    // Discount
    discountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    discountInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 14,
        height: 46,
        fontSize: 14,
        color: '#333',
        backgroundColor: '#fff'
    },
    applyBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        paddingHorizontal: 18,
        height: 46,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6
    },
    applyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333'
    },

    // Payment Mode Chips
    paymentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    paymentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    paymentChipSelected: {
        backgroundColor: '#2c3e50',
        borderColor: '#2c3e50',
    },
    paymentChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    paymentChipTextSelected: {
        color: '#fff',
    },

    // Footer
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fafafa'
    },
    receiveBtn: {
        backgroundColor: '#2c3e50',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8
    },
    receiveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
});