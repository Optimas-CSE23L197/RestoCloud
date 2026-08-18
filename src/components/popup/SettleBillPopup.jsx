// popup/SettleBillPopup.js
import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import {
    Receipt,
    X,
    CreditCard,
    ChevronDown,
    MousePointer2,
    IndianRupee
} from 'lucide-react-native';

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
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* 2. Body */}
                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

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

                        {/* Payment Mode */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>PAYMENT MODE *</Text>
                            <View style={styles.inputContainer}>
                                <CreditCard size={16} color="#888888" strokeWidth={2} />
                                <Text style={styles.inputText}>{paymentMode}</Text>
                                <ChevronDown size={16} color="#888888" strokeWidth={2} />
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
        borderRadius: 12,
        overflow: 'hidden',
        maxHeight: '90%'
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2c3e50',
        paddingHorizontal: 16,
        paddingVertical: 14
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
        padding: 16,
        maxHeight: 400
    },
    fieldGroup: {
        marginBottom: 12
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#555',
        marginBottom: 6,
        letterSpacing: 0.5
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        paddingHorizontal: 12,
        height: 44,
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
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#eee'
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4
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
        marginTop: 8,
        paddingTop: 8,
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
        borderRadius: 6,
        paddingHorizontal: 12,
        height: 44,
        fontSize: 14,
        color: '#333',
        backgroundColor: '#fff'
    },
    applyBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 6,
        paddingHorizontal: 16,
        height: 44,
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

    // Footer
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fafafa'
    },
    receiveBtn: {
        backgroundColor: '#2c3e50',
        paddingVertical: 14,
        borderRadius: 6,
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