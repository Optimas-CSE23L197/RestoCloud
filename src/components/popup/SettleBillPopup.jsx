// components/popup/SettleBillPopup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, TextInput, ScrollView, Alert, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
    Receipt,
    X,
    Banknote,
    CreditCard,
    Smartphone,
    Landmark,
    Wallet,
    Check,
    UtensilsCrossed,
    Wine,
    ShieldCheck,
    Percent,
    Trash2,
    AlertTriangle,
    MessageSquareWarning,
    Printer,
} from 'lucide-react-native';
import { receivePayment, cancelBill, updateTableStatus } from '../../../api/system.api';
import { useAuth } from '../../../src/context/AuthContext';
import { TABLE_STATUS } from '../../../src/constants/tableStatus';
import BillPrintPopup from './BillPrintPopup';

// Payment mode options EXACTLY as per your screenshot (10 options)
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

const MODAL_H_PADDING = 18;
const GRID_GAP = 8;

function BillSection({
    kind,
    billNo,
    amount,
    discountPercent,
    onDiscountChange,
    isWaiter,
}) {
    const isFood = kind === 'food';

    const theme = isFood
        ? {
            accent: '#B8511F',
            accentSoft: '#FDF0E7',
            accentBorder: '#F0C9AE',
            icon: UtensilsCrossed,
            label: 'FOOD BILL',
        }
        : {
            accent: '#5B2A86',
            accentSoft: '#F3ECFA',
            accentBorder: '#D8C2EF',
            icon: Wine,
            label: 'BAR / LIQUOR BILL',
        };

    const Icon = theme.icon;

    const discountAmt = (amount * parseFloat(discountPercent || 0)) / 100;
    const payable = Math.max(amount - discountAmt, 0);

    if (!billNo && amount <= 0) return null;

    return (
        <View
            className="rounded-2xl overflow-hidden mb-4"
            style={{ borderWidth: 1.5, borderColor: theme.accentBorder }}
        >
            <View
                className="flex-row items-center justify-between px-4 py-3"
                style={{ backgroundColor: theme.accent }}
            >
                <View className="flex-row items-center gap-2.5">
                    <View className="w-8 h-8 rounded-lg bg-white/20 items-center justify-center">
                        <Icon size={16} color="#FFFFFF" strokeWidth={2.3} />
                    </View>
                    <View>
                        <Text className="text-[13px] font-extrabold text-white tracking-wider leading-4">
                            {theme.label}
                        </Text>
                        <Text className="text-[10.5px] text-white/75 font-semibold mt-0.5 leading-3.5">
                            {billNo || 'No bill number'}
                        </Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className="text-[10px] text-white/70 font-bold tracking-wide">PAYABLE</Text>
                    <Text className="text-[19px] font-extrabold text-white leading-6">
                        ₹{payable.toFixed(2)}
                    </Text>
                </View>
            </View>

            <View style={{ backgroundColor: theme.accentSoft }} className="px-4 pt-3.5 pb-4">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-[12.5px] text-[#5b5b5b] font-medium">
                        Bill amount <Text className="text-[10.5px] text-[#8a8a8a]">(tax & service incl.)</Text>
                    </Text>
                    <Text className="text-[14.5px] font-bold text-[#2c3e50]">₹{amount.toFixed(2)}</Text>
                </View>

                {!isWaiter && (
                    <View>
                        <Text className="text-[10.5px] font-bold text-[#8a94a0] mb-1.5 tracking-wider">
                            DISCOUNT FOR THIS BILL
                        </Text>
                        <View className="flex-row items-center gap-2.5">
                            <View
                                className="flex-1 flex-row items-center bg-white rounded-xl px-3 h-11"
                                style={{ borderWidth: 1, borderColor: theme.accentBorder }}
                            >
                                <Percent size={14} color={theme.accent} strokeWidth={2.3} />
                                <TextInput
                                    placeholder="0"
                                    className="flex-1 ml-2 text-[14.5px] text-[#333] font-semibold"
                                    value={discountPercent}
                                    onChangeText={onDiscountChange}
                                    keyboardType="numeric"
                                    placeholderTextColor="#b5b5b5"
                                />
                                <Text className="text-[13px] text-[#999] font-semibold">%</Text>
                            </View>
                            {discountAmt > 0 && (
                                <View className="px-3 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: theme.accent }}>
                                    <Text className="text-white text-[12px] font-bold">
                                        -₹{discountAmt.toFixed(2)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

function PaymentModeGrid({ selected, onSelect, tileSize }) {
    return (
        <View className="rounded-2xl bg-white px-4 pt-3.5 pb-4 mb-2" style={{ borderWidth: 1.5, borderColor: '#e5e5e5' }}>
            <Text className="text-[10.5px] font-bold text-[#8a94a0] mb-2 tracking-wider">
                PAYMENT MODE
            </Text>
            <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
                {PAYMENT_MODES.map((mode) => {
                    const ModeIcon = mode.icon;
                    const isSelected = selected === mode.key;
                    return (
                        <Pressable
                            key={mode.key}
                            onPress={() => onSelect(mode.key)}
                            className="items-center justify-center rounded-xl py-2.5 px-1 bg-white relative"
                            style={{
                                width: tileSize,
                                minHeight: 64,
                                borderWidth: isSelected ? 2 : 1,
                                borderColor: isSelected ? '#1c2530' : '#e5e5e5',
                            }}
                        >
                            {isSelected && (
                                <View
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full items-center justify-center border-2 border-white z-10"
                                    style={{ backgroundColor: '#1c2530' }}
                                >
                                    <Check size={9} color="#FFFFFF" strokeWidth={3.5} />
                                </View>
                            )}
                            <View
                                className="w-7 h-7 rounded-lg items-center justify-center mb-1"
                                style={{ backgroundColor: isSelected ? '#1c2530' : '#f2f4f6' }}
                            >
                                <ModeIcon size={15} color={isSelected ? '#FFFFFF' : '#1c2530'} strokeWidth={2.2} />
                            </View>
                            <Text
                                className="text-[9.5px] font-bold text-center leading-3"
                                style={{ color: isSelected ? '#1a2530' : '#666' }}
                                numberOfLines={2}
                            >
                                {mode.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

// ✅ Small Reason Popup Component
function CancelReasonPopup({ visible, onClose, onSubmit, isSubmitting }) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (visible) {
            setReason('');
        }
    }, [visible]);

    const MIN_REASON_LENGTH = 10;

    const handleSubmit = () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            Alert.alert('Error', 'Please enter a reason for cancellation.');
            return;
        }
        if (trimmed.length < MIN_REASON_LENGTH) {
            Alert.alert(
                'Reason too short',
                `Please provide a proper cancellation reason (minimum ${MIN_REASON_LENGTH} characters).`
            );
            return;
        }
        if (isSubmitting) return;
        onSubmit(trimmed);
    };

    const handleClose = () => {
        setReason('');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View className="flex-1 bg-black/60 justify-center items-center px-6">
                <View className="w-full max-w-[380px] bg-white rounded-2xl p-5">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center gap-2">
                            <AlertTriangle size={20} color="#d32f2f" strokeWidth={2.5} />
                            <Text className="text-[17px] font-bold text-[#1c2530]">Cancel Bill</Text>
                        </View>
                        <Pressable onPress={handleClose} className="p-1" disabled={isSubmitting}>
                            <X size={20} color="#888" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    <Text className="text-[13px] text-[#555] mb-3 leading-5">
                        Please enter the reason for cancelling this bill:
                    </Text>

                    <TextInput
                        placeholder="e.g. Wrong order, duplicate bill, etc."
                        className="border border-[#ddd] rounded-xl px-4 py-3.5 text-[14px] text-[#333] bg-[#fafafa]"
                        value={reason}
                        onChangeText={setReason}
                        multiline={true}
                        numberOfLines={3}
                        textAlignVertical="top"
                        placeholderTextColor="#999"
                        editable={!isSubmitting}
                    />

                    <View className="flex-row justify-end mt-1.5">
                        <Text
                            className="text-[10.5px] font-semibold"
                            style={{ color: reason.trim().length >= MIN_REASON_LENGTH ? '#1f8a4c' : '#b5871c' }}
                        >
                            {reason.trim().length}/{MIN_REASON_LENGTH} min characters
                        </Text>
                    </View>

                    {reason.trim().length > 0 && (
                        <View
                            className="flex-row items-start gap-2 mt-2 px-3 py-2.5 rounded-xl bg-[#fff4f4]"
                            style={{ borderWidth: 1, borderColor: '#f3caca' }}
                        >
                            <MessageSquareWarning size={14} color="#d32f2f" strokeWidth={2.3} style={{ marginTop: 1 }} />
                            <Text className="flex-1 text-[11.5px] text-[#a02222] font-medium leading-4">
                                Will cancel with reason: "{reason.trim()}"
                            </Text>
                        </View>
                    )}

                    <View className="flex-row gap-3 mt-5">
                        <Pressable
                            onPress={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 py-3.5 rounded-xl bg-[#f0f0f0] items-center justify-center"
                        >
                            <Text className="text-[14px] font-bold text-[#555]">Cancel</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleSubmit}
                            disabled={isSubmitting || reason.trim().length < MIN_REASON_LENGTH}
                            className="flex-1 py-3.5 rounded-xl bg-[#d32f2f] items-center justify-center flex-row gap-2"
                            style={{ opacity: reason.trim().length < MIN_REASON_LENGTH ? 0.6 : 1 }}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Trash2 size={16} color="#FFFFFF" strokeWidth={2.5} />
                                    <Text className="text-white text-[14px] font-bold">Confirm</Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function SettleBillPopup({ visible, onClose, table }) {
    const [foodDiscountPercent, setFoodDiscountPercent] = useState('');
    const [barDiscountPercent, setBarDiscountPercent] = useState('');
    const [paymentMode, setPaymentMode] = useState('C');
    const [isCancelling, setIsCancelling] = useState(false);
    const [isSettling, setIsSettling] = useState(false);
    const [showReasonPopup, setShowReasonPopup] = useState(false);
    const [confirmedCancelReason, setConfirmedCancelReason] = useState('');

    // ✅ Options menu — footer me, Receive Payment ke side me
    const [showOptions, setShowOptions] = useState(false);
    const [showPrintPopup, setShowPrintPopup] = useState(false);

    const cancelInFlightRef = useRef(false);
    const settleInFlightRef = useRef(false);

    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

    const { selectedRestaurant, userType } = useAuth();
    const isWaiter = userType === 'W';
    const userCd = selectedRestaurant?.usercd || '0000000001';
    const userNm = selectedRestaurant?.usernm || 'Admin';
    const restaurantName = selectedRestaurant?.Restaurantnm || 'Restaurant';
    const posCd = selectedRestaurant?.posmenucd || selectedRestaurant?.rcode || '';

    const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.95, 560);
    const AVAILABLE_WIDTH = MODAL_WIDTH - MODAL_H_PADDING * 2 - 32;
    const NUM_COLUMNS = AVAILABLE_WIDTH < 300 ? 3 : AVAILABLE_WIDTH < 420 ? 4 : 5;
    const TILE_SIZE = (AVAILABLE_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

    const foodBillCd = table?.fbillcd?.trim() || null;
    const foodBillNo = table?.foodbillno?.trim() || null;
    const barBillCd = table?.bbillcd?.trim() || null;
    const barBillNo = table?.liqbillno?.trim() || null;

    const totalAmount = table?.amount || 0;
    const hasFoodBill = !!foodBillCd;
    const hasBarBill = !!barBillCd;

    let foodAmount = 0;
    let barAmount = 0;
    if (hasFoodBill && hasBarBill) {
        foodAmount = totalAmount;
        barAmount = totalAmount;
    } else if (hasFoodBill) {
        foodAmount = totalAmount;
    } else if (hasBarBill) {
        barAmount = totalAmount;
    }

    const foodDiscountAmt = (foodAmount * parseFloat(foodDiscountPercent || 0)) / 100;
    const barDiscountAmt = (barAmount * parseFloat(barDiscountPercent || 0)) / 100;
    const foodPayable = Math.max(foodAmount - foodDiscountAmt, 0);
    const barPayable = Math.max(barAmount - barDiscountAmt, 0);
    const grandTotal = (hasFoodBill ? foodPayable : 0) + (hasBarBill ? barPayable : 0);

    useEffect(() => {
        if (!visible) {
            setConfirmedCancelReason('');
            setShowReasonPopup(false);
            setShowOptions(false);
            setShowPrintPopup(false);
        }
    }, [visible]);

    const settleOne = async (billcd, amt, mode) => {
        return receivePayment({
            fbillcd: billcd,
            amt1: amt,
            mode1: mode,
            tipsamt: 0,
            tranno: '',
        });
    };

    const handleSettleBill = async () => {
        if (isWaiter) {
            Alert.alert('Access Denied', 'Waiters cannot settle bills.');
            return;
        }
        if (!table?.tableCode) {
            Alert.alert('Error', 'Table code not found');
            return;
        }
        if (!hasFoodBill && !hasBarBill) {
            Alert.alert('Error', 'No bill found for this table.');
            return;
        }
        if (settleInFlightRef.current || isSettling) return;

        settleInFlightRef.current = true;
        setIsSettling(true);
        try {
            const results = [];
            if (hasFoodBill) {
                console.log('[SettleBill] 🍽 Settling FOOD bill:', foodBillCd, foodPayable, paymentMode);
                results.push(await settleOne(foodBillCd, foodPayable, paymentMode));
            }
            if (hasBarBill) {
                console.log('[SettleBill] 🍷 Settling BAR bill:', barBillCd, barPayable, paymentMode);
                results.push(await settleOne(barBillCd, barPayable, paymentMode));
            }

            const failed = results.find((r) => !r.success);
            if (failed) {
                console.error('[SettleBill] ❌ Payment failed:', failed.error);
                Alert.alert('Error', 'Payment failed: ' + (failed.error || 'Unknown error'));
                return;
            }

            console.log('[SettleBill] 🟢 All payments successful!');
            Alert.alert('Success', 'Bill settled successfully!');
            onClose();
        } catch (error) {
            console.error('[SettleBill] 🔴 Exception:', error);
            Alert.alert('Error', 'Something went wrong during bill settlement.');
        } finally {
            settleInFlightRef.current = false;
            setIsSettling(false);
        }
    };

    const handleCancelBill = async (reason) => {
        if (isWaiter) {
            Alert.alert('Access Denied', 'Waiters cannot cancel bills.');
            return;
        }

        if (!hasFoodBill && !hasBarBill) {
            Alert.alert('Error', 'No active bill to cancel.');
            return;
        }

        if (!reason || reason.trim().length < 10) {
            Alert.alert('Reason too short', 'Please provide a proper cancellation reason (minimum 10 characters).');
            return;
        }

        if (cancelInFlightRef.current) return;
        cancelInFlightRef.current = true;

        setConfirmedCancelReason(reason);
        setIsCancelling(true);
        setShowReasonPopup(false);
        try {
            const cancelResult = await cancelBill({
                fbillcd: foodBillCd || '',
                bbillcd: barBillCd || '',
                usercd: userCd,
                usernm: userNm,
                reason: reason,
                fromeb: '',
            });

            const rawBody = cancelResult?.raw ?? cancelResult?.data ?? cancelResult?.response;
            const looksLikeApiFailure =
                rawBody !== undefined &&
                (String(rawBody).trim() === '0' || String(rawBody).trim().startsWith('0'));

            if (cancelResult.success && !looksLikeApiFailure) {
                if (table?.tableCode) {
                    await updateTableStatus(table.tableCode, TABLE_STATUS.OCCUPIED, selectedRestaurant?.hotelgrpcd || '');
                }

                Alert.alert('Success', 'Bill cancelled successfully! Table reverted to Occupied.');
                onClose();
            } else {
                const errMsg = looksLikeApiFailure
                    ? 'Server rejected the cancellation (check reason length / bill code).'
                    : (cancelResult.error || 'Failed to cancel bill');
                Alert.alert('Error', errMsg);
                setConfirmedCancelReason('');
            }
        } catch (error) {
            console.error('[SettleBill] Cancel error:', error);
            Alert.alert('Error', 'Something went wrong during bill cancellation.');
            setConfirmedCancelReason('');
        } finally {
            cancelInFlightRef.current = false;
            setIsCancelling(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/65 justify-center items-center">
                <View
                    className="bg-[#f6f4f0] rounded-[22px] overflow-hidden"
                    style={{ maxHeight: SCREEN_HEIGHT * 0.92, width: MODAL_WIDTH }}
                >
                    {/* Header */}
                    <View className="flex-row justify-between items-center bg-[#1c2530] px-5 py-4">
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center">
                                <Receipt size={20} color="#FFFFFF" strokeWidth={2.3} />
                            </View>
                            <View>
                                <Text className="text-[17px] font-extrabold text-white tracking-wide leading-5">
                                    Settle Bill
                                </Text>
                                <Text className="text-[12px] text-white/60 mt-0.5 font-medium leading-4">
                                    Table {table?.tableNo}
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10} className="p-1">
                            <X size={22} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* Tax-included banner */}
                    <View className="flex-row items-center justify-center gap-1.5 bg-[#e8f5ec] py-2 border-b border-[#d3ecdb]">
                        <ShieldCheck size={13} color="#1f8a4c" strokeWidth={2.3} />
                        <Text className="text-[11.5px] font-bold text-[#1f8a4c]">
                            All taxes & service charges already included
                        </Text>
                    </View>

                    {/* Cancellation-in-progress banner */}
                    {isCancelling && confirmedCancelReason ? (
                        <View className="flex-row items-start gap-2 px-4 py-2.5 bg-[#fdeaea] border-b border-[#f3c9c9]">
                            <ActivityIndicator size="small" color="#d32f2f" />
                            <Text className="flex-1 text-[11.5px] text-[#a02222] font-semibold leading-4">
                                Cancelling bill — Reason: "{confirmedCancelReason}"
                            </Text>
                        </View>
                    ) : null}

                    <ScrollView
                        className="flex-grow-0"
                        contentContainerStyle={{ padding: MODAL_H_PADDING, paddingBottom: 8 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {!hasFoodBill && !hasBarBill && (
                            <View className="items-center justify-center py-10">
                                <Text className="text-[13.5px] text-[#999] font-semibold">
                                    No active bill found for this table
                                </Text>
                            </View>
                        )}

                        <BillSection
                            kind="food"
                            billNo={foodBillNo}
                            amount={foodAmount}
                            discountPercent={foodDiscountPercent}
                            onDiscountChange={setFoodDiscountPercent}
                            isWaiter={isWaiter}
                        />

                        <BillSection
                            kind="bar"
                            billNo={barBillNo}
                            amount={barAmount}
                            discountPercent={barDiscountPercent}
                            onDiscountChange={setBarDiscountPercent}
                            isWaiter={isWaiter}
                        />

                        {!isWaiter && (hasFoodBill || hasBarBill) && (
                            <PaymentModeGrid
                                selected={paymentMode}
                                onSelect={setPaymentMode}
                                tileSize={TILE_SIZE}
                            />
                        )}
                    </ScrollView>

                    {/* Grand total + footer */}
                    <View className="px-5 pt-3.5 pb-5 border-t border-[#e5e0d6] bg-white">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-[13.5px] font-bold text-[#6b6b6b] tracking-wide">
                                GRAND TOTAL
                            </Text>
                            <Text className="text-[24px] font-extrabold text-[#1c2530]">
                                ₹{grandTotal.toFixed(2)}
                            </Text>
                        </View>

                        {/* ✅ Footer: Options Icon + Receive Payment Side by Side */}
                        {!isWaiter && (hasFoodBill || hasBarBill) && (
                            <View className="flex-row gap-3">
                                {/* Options Menu (⋮) */}
                                <View className="relative">
                                    <Pressable
                                        onPress={() => setShowOptions(!showOptions)}
                                        className="w-12 h-12 rounded-xl border border-[#3498db] bg-white items-center justify-center"
                                    >
                                        <Text className="text-[#3498db] font-bold text-xl">⋮</Text>
                                    </Pressable>

                                    {/* Dropdown */}
                                    {showOptions && (
                                        <View className="absolute bottom-14 left-0 bg-white border border-[#eee] rounded-xl shadow-lg p-1.5 z-50 elevation-10 gap-1 min-w-[160px]">
                                            <Pressable
                                                className="flex-row items-center gap-2.5 py-2.5 px-3 rounded-lg active:bg-[#f5f5f5]"
                                                onPress={() => {
                                                    setShowOptions(false);
                                                    setShowPrintPopup(true);
                                                }}
                                            >
                                                <Printer size={15} color="#2c3e50" strokeWidth={2.4} />
                                                <Text className="text-[13.5px] font-semibold text-[#2c3e50]">Print Bill</Text>
                                            </Pressable>

                                            <View className="h-[1px] bg-[#eee] mx-1" />

                                            <Pressable
                                                className="flex-row items-center gap-2.5 py-2.5 px-3 rounded-lg active:bg-[#fdeaea]"
                                                disabled={isCancelling || isSettling}
                                                onPress={() => {
                                                    setShowOptions(false);
                                                    setShowReasonPopup(true);
                                                }}
                                            >
                                                <Trash2 size={15} color="#d32f2f" strokeWidth={2.4} />
                                                <Text className="text-[13.5px] font-semibold text-[#d32f2f]">Cancel Bill</Text>
                                            </Pressable>
                                        </View>
                                    )}
                                </View>

                                {/* Receive Payment */}
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={handleSettleBill}
                                    disabled={isCancelling || isSettling}
                                    className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#1f8a4c]"
                                    style={{
                                        opacity: (isCancelling || isSettling) ? 0.6 : 1,
                                        shadowColor: '#1f8a4c',
                                        shadowOpacity: 0.35,
                                        shadowRadius: 8,
                                        shadowOffset: { width: 0, height: 5 },
                                        elevation: 6,
                                    }}
                                >
                                    {isSettling ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Receipt size={17} color="#FFFFFF" strokeWidth={2.5} />
                                            <Text className="text-white text-[14px] font-extrabold tracking-wide">
                                                Receive Payment
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Waiter message */}
                        {isWaiter && (
                            <View className="w-full items-center justify-center py-3">
                                <Text className="text-gray-500 text-sm text-center">
                                    Only Cashier can settle this bill
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Reason Popup */}
            <CancelReasonPopup
                visible={showReasonPopup}
                onClose={() => setShowReasonPopup(false)}
                onSubmit={handleCancelBill}
                isSubmitting={isCancelling}
            />

            {/* Print Bill Popup */}
            <BillPrintPopup
                visible={showPrintPopup}
                onClose={() => setShowPrintPopup(false)}
                table={table}
                posCd={posCd}
                foodBillCd={foodBillCd}
                barBillCd={barBillCd}
                onPrint={(printData) => {
                    console.log('[SettleBillPopup] Print bridge called with:', printData);
                }}
            />
        </Modal>
    );
}