// components/popup/SettleBillPopup.jsx
import React, { useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, ScrollView, Alert, useWindowDimensions, TouchableOpacity } from 'react-native';
import {
    Receipt,
    X,
    Banknote,
    CreditCard,
    Smartphone,
    Landmark,
    Wallet,
    MousePointer2,
    Check
} from 'lucide-react-native';
import { receivePayment } from '../../../api/system.api';
import { useAuth } from '../../../src/context/AuthContext';

// ✅ Payment mode options — EXACTLY as per your screenshot (10 options)
const PAYMENT_MODES = [
    { key: 'C', label: 'Cash', icon: Banknote },
    { key: 'R', label: 'Credit Card', icon: CreditCard },
    { key: 'A', label: 'Credit A/C', icon: Landmark },
    { key: 'D', label: 'Debit Card', icon: CreditCard },
    { key: 'P', label: 'Magic Pin', icon: Wallet },
    { key: 'O', label: 'Online', icon: Smartphone },
    { key: 'M', label: 'Room Service', icon: Receipt },
    { key: 'S', label: 'Swiggy', icon: Smartphone },
    { key: 'U', label: 'UPI', icon: Smartphone },
    { key: 'Z', label: 'Zomato', icon: Smartphone },
];

const MODAL_H_PADDING = 20;
const GRID_GAP = 10;

export default function SettleBillPopup({ visible, onClose, table }) {
    const [discountPercent, setDiscountPercent] = useState('');
    const [paymentMode, setPaymentMode] = useState('C');
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

    // ✅ Get userType from Auth
    const { selectedRestaurant, userType } = useAuth();
    const isWaiter = userType === 'W';

    // ✅ Dynamic grid calculation
    const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.94, 560);
    const AVAILABLE_WIDTH = MODAL_WIDTH - MODAL_H_PADDING * 2;
    const NUM_COLUMNS = AVAILABLE_WIDTH < 340 ? 3 : AVAILABLE_WIDTH < 460 ? 4 : 5;
    const TILE_SIZE = (AVAILABLE_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

    const userCd = selectedRestaurant?.usercd || '0000000001';

    // ✅ Bill data from Dashboard
    const fbillcd = table?.fbillcd?.trim() || null;
    const baseAmount = table?.amount || 0;

    // ✅ Calculate bill with taxes
    const subTotal = baseAmount;
    const cgst = subTotal * 0.025;
    const sgst = subTotal * 0.025;
    const totalWithTax = subTotal + cgst + sgst;

    // ✅ Discount calculation (in %)
    const discountAmt = (totalWithTax * parseFloat(discountPercent || 0)) / 100;
    const finalPayable = totalWithTax - discountAmt;

    // ✅ Receive Payment
    const handleSettleBill = async () => {
        if (isWaiter) {
            Alert.alert('Access Denied', 'Waiters cannot settle bills.');
            return;
        }

        if (!table?.tableCode) {
            Alert.alert('Error', 'Table code not found');
            return;
        }

        if (!fbillcd) {
            Alert.alert('Error', 'Bill ID not found. Please generate bill first.');
            return;
        }

        try {
            console.log('[SettleBill] 💳 Calling receivePayment API with mode:', paymentMode);
            const payRes = await receivePayment({
                fbillcd: fbillcd,
                amt1: finalPayable,
                mode1: paymentMode,
                tipsamt: 0,
                tranno: '',
            });

            console.log('[SettleBill] 💳 receivePayment response:', payRes);

            if (payRes.success) {
                console.log('[SettleBill] 🟢 Payment successful!');
                Alert.alert('Success', 'Bill settled successfully!');
                onClose();
            } else {
                console.error('[SettleBill] ❌ Payment failed:', payRes.error);
                Alert.alert('Error', 'Payment failed: ' + (payRes.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('[SettleBill] 🔴 Exception:', error);
            Alert.alert('Error', 'Something went wrong during bill settlement.');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/60 justify-center items-center">
                <View className="w-[94%] max-w-[560px] bg-white rounded-2xl overflow-hidden" style={{ maxHeight: SCREEN_HEIGHT * 0.9, width: MODAL_WIDTH }}>

                    {/* Header */}
                    <View className="flex-row justify-between items-center bg-[#2c3e50] px-5 py-4">
                        <View className="flex-row items-center gap-3">
                            <View className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center">
                                <Receipt size={19} color="#FFFFFF" strokeWidth={2.3} />
                            </View>
                            <View>
                                <Text className="text-[16.5px] font-bold text-white tracking-wide leading-5">Settle Bill</Text>
                                <Text className="text-[12px] text-white/70 mt-0.5 font-medium leading-4">
                                    Table # {table?.tableNo}
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10} className="p-1">
                            <X size={22} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* Scrollable Body */}
                    <ScrollView className="flex-grow-0" contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>

                        {/* Table + Captain */}
                        <View className="flex-row gap-2.5 px-5 pt-4 pb-3.5">
                            <View className="flex-1">
                                <Text className="text-[11px] font-bold text-[#8a94a0] mb-1.5 tracking-wider leading-4">TABLE</Text>
                                <View className="border border-[#e4e7eb] rounded-lg bg-[#f8f9fa] px-3.5 py-2.5">
                                    <Text className="text-[14px] font-semibold text-[#2c3e50] leading-5">{table?.tableNo}</Text>
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="text-[11px] font-bold text-[#8a94a0] mb-1.5 tracking-wider leading-4">CAPTAIN</Text>
                                <View className="border border-[#e4e7eb] rounded-lg bg-[#f8f9fa] px-3.5 py-2.5">
                                    <Text className="text-[14px] font-semibold text-[#2c3e50] leading-5" numberOfLines={1}>Captain1</Text>
                                </View>
                            </View>
                        </View>

                        {/* Bill Summary */}
                        <View className="bg-[#f8f9fa] p-4 rounded-xl mx-5 mb-4 border border-[#eee]">
                            <View className="flex-row justify-between py-1.5">
                                <Text className="text-[13px] text-[#717985] leading-5">Bill #</Text>
                                <Text className="text-[13px] font-semibold text-[#333] leading-5">{fbillcd}</Text>
                            </View>
                            <View className="flex-row justify-between py-1.5">
                                <Text className="text-[13px] text-[#717985] leading-5">Sub Total</Text>
                                <Text className="text-[13px] font-semibold text-[#333] leading-5">₹{subTotal.toFixed(2)}</Text>
                            </View>
                            <View className="flex-row justify-between py-1.5">
                                <Text className="text-[13px] text-[#717985] leading-5">CGST (2.5%)</Text>
                                <Text className="text-[13px] font-semibold text-[#333] leading-5">₹{cgst.toFixed(2)}</Text>
                            </View>
                            <View className="flex-row justify-between py-1.5">
                                <Text className="text-[13px] text-[#717985] leading-5">SGST (2.5%)</Text>
                                <Text className="text-[13px] font-semibold text-[#333] leading-5">₹{sgst.toFixed(2)}</Text>
                            </View>
                            {discountAmt > 0 && (
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-[13px] text-[#717985] leading-5">Discount ({discountPercent}%)</Text>
                                    <Text className="text-[13px] font-semibold text-[#e74c3c] leading-5">
                                        - ₹{discountAmt.toFixed(2)}
                                    </Text>
                                </View>
                            )}
                            <View className="flex-row justify-between mt-2 pt-2.5 border-t border-[#e0e4e8]">
                                <Text className="text-[15px] font-bold text-[#2c3e50] leading-5">Final Payable</Text>
                                <Text className="text-[18px] font-bold text-[#27ae60] leading-6">₹{finalPayable.toFixed(2)}</Text>
                            </View>
                        </View>

                        {/* Discount Code - Only for Cashier (in %) */}
                        {!isWaiter && (
                            <View className="mx-5 mb-4">
                                <Text className="text-[11px] font-bold text-[#8a94a0] mb-1.5 tracking-wider leading-4">DISCOUNT (%)</Text>
                                <View className="flex-row gap-2.5">
                                    <TextInput
                                        placeholder="Enter discount %"
                                        className="flex-1 border border-[#e0e0e0] rounded-lg px-3.5 h-12 text-[14.5px] text-[#333] bg-white"
                                        value={discountPercent}
                                        onChangeText={setDiscountPercent}
                                        keyboardType="numeric"
                                        placeholderTextColor="#999"
                                    />
                                </View>
                            </View>
                        )}

                        {/* Payment Mode - Only for Cashier */}
                        {!isWaiter && (
                            <View className="mx-5 mb-2">
                                <Text className="text-[11px] font-bold text-[#8a94a0] mb-3 tracking-wider leading-4">PAYMENT MODE *</Text>
                                <View className="flex-row flex-wrap gap-[10px]">
                                    {PAYMENT_MODES.map((mode) => {
                                        const Icon = mode.icon;
                                        const isSelected = paymentMode === mode.key;
                                        return (
                                            <Pressable
                                                key={mode.key}
                                                onPress={() => setPaymentMode(mode.key)}
                                                className={`items-center justify-center border-[1.5px] border-[#e5e5e5] rounded-xl py-3 px-1 bg-white min-h-[74px] relative ${isSelected ? 'border-[#2c3e50] border-2 bg-[#eef4fb]' : ''}`}
                                                style={{ width: TILE_SIZE }}
                                            >
                                                {isSelected && (
                                                    <View className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-[#27ae60] items-center justify-center border-2 border-white z-10">
                                                        <Check size={10} color="#FFFFFF" strokeWidth={3.5} />
                                                    </View>
                                                )}
                                                <View className={`w-8 h-8 rounded-lg items-center justify-center mb-1.5 ${isSelected ? 'bg-[#2c3e50]' : 'bg-[#f2f4f6]'}`}>
                                                    <Icon
                                                        size={18}
                                                        color={isSelected ? '#FFFFFF' : '#2c3e50'}
                                                        strokeWidth={2.2}
                                                    />
                                                </View>
                                                <Text className={`text-[10px] font-bold text-center leading-[12.5px] ${isSelected ? 'text-[#1a2530]' : 'text-[#555]'}`} numberOfLines={2}>
                                                    {mode.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer - Receive Payment */}
                    {!isWaiter && (
                        <View className="px-5 pt-3.5 pb-5 border-t border-[#eee] bg-white">
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={handleSettleBill}
                                className="w-full flex-row items-center justify-center py-3.5 rounded-xl bg-[#27ae60]"
                            >
                                <Text className="text-white text-[15.5px] font-bold text-center">Receive Payment</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isWaiter && (
                        <View className="px-5 pt-3.5 pb-5 border-t border-[#eee] bg-white">
                            <View className="w-full items-center justify-center py-3">
                                <Text className="text-gray-500 text-sm text-center">
                                    Only Cashier can settle this bill
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}