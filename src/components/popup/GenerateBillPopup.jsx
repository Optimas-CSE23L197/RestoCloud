// components/popup/GenerateBillPopup.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, Pressable, ScrollView, TextInput, Alert, useWindowDimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Receipt, X, Utensils, UtensilsCrossed, Wine } from 'lucide-react-native';
import { saveBill, getCurrentItems } from '../../../api/system.api';
import { useAuth } from '../../../src/context/AuthContext';

export default function GenerateBillPopup({ visible, onClose, onBillSaved, table, waiterName }) {
    const [loading, setLoading] = useState(false);
    const [fetchingItems, setFetchingItems] = useState(false);
    const [billItems, setBillItems] = useState([]);

    const { selectedRestaurant } = useAuth();
    const posCd = selectedRestaurant?.posmenucd || selectedRestaurant?.rcode;
    const userCd = selectedRestaurant?.usercd || '0000000001';
    const { height: SCREEN_HEIGHT } = useWindowDimensions();

    useEffect(() => {
        if (visible && table?.tableCode) {
            fetchCurrentItems();
        }
    }, [visible]);

    const fetchCurrentItems = async () => {
        if (!posCd || !table?.tableCode) return;
        setFetchingItems(true);
        try {
            const result = await getCurrentItems(posCd, table.tableCode);
            if (result.success && Array.isArray(result.data)) {
                setBillItems(result.data);
            } else {
                setBillItems([]);
            }
        } catch (error) {
            console.error('[GenerateBill] ❌ Fetch error:', error);
            setBillItems([]);
        } finally {
            setFetchingItems(false);
        }
    };

    const mergeItems = (items) => {
        const map = new Map();
        items.forEach((item) => {
            const id = item.menucd ?? item.menunm;
            const qty = parseFloat(item.qty || 0);
            const amount = parseFloat(item.amt || 0);
            const rate = parseFloat(item.rate || 0);
            if (map.has(id)) {
                const existing = map.get(id);
                existing.qty += qty;
                existing.amount += amount;
            } else {
                map.set(id, { ...item, id, qty, amount, rate });
            }
        });
        return Array.from(map.values());
    };

    const { foodItems, barItems } = useMemo(() => {
        const food = billItems.filter((item) => (item.fb || '').toUpperCase() === 'F');
        const bar = billItems.filter((item) => (item.fb || '').toUpperCase() !== 'F');
        return {
            foodItems: mergeItems(food),
            barItems: mergeItems(bar),
        };
    }, [billItems]);

    const calculateBillTotals = (items) => {
        let foodSubtotal = 0;
        let barSubtotal = 0;
        let totalGst = 0;
        let totalSchg = 0;
        items.forEach((item) => {
            const amt = parseFloat(item.amt) || 0;
            const gst = parseFloat(item.gstamt) || 0;
            const schg = parseFloat(item.schgamt) || 0;
            if ((item.fb || '').toUpperCase() === 'F') {
                foodSubtotal += amt;
            } else {
                barSubtotal += amt;
            }
            totalGst += gst;
            totalSchg += schg;
        });
        const netPayable = foodSubtotal + barSubtotal;
        return { foodSubtotal, barSubtotal, totalGst, totalSchg, netPayable };
    };

    const { foodSubtotal, barSubtotal, totalGst, totalSchg, netPayable } = useMemo(() => {
        return calculateBillTotals(billItems);
    }, [billItems]);

    const foodSubtotalDisplay = foodItems.reduce((sum, item) => sum + item.amount, 0);
    const barSubtotalDisplay = barItems.reduce((sum, item) => sum + item.amount, 0);

    const handleMakeBill = async () => {
        if (!table?.tableCode) {
            Alert.alert('Error', 'Table code not found');
            return;
        }
        setLoading(true);
        const result = await saveBill({
            poscd: posCd,
            tablcd: table.tableCode,
            usercd: userCd,
            fdiscamt: 0, // No discount
        });
        setLoading(false);
        if (result.success) {
            Alert.alert('Success', 'Bill generated successfully!');
            if (onBillSaved) onBillSaved();
            else onClose();
        } else {
            Alert.alert('Error', result.error || 'Failed to generate bill');
        }
    };

    const renderSection = ({ icon: Icon, title, accentColor, items, sectionSubtotal }) => (
        <View className="mx-5 mb-4 rounded-xl border border-gray-200 overflow-hidden">
            <View className={`flex-row justify-between items-center px-4 py-3 border-b ${accentColor.border} ${accentColor.bg}`}>
                <View className="flex-row items-center gap-2">
                    <Icon size={16} color={accentColor.text} strokeWidth={2.3} />
                    <Text className={`text-sm font-extrabold tracking-wide ${accentColor.text}`}>{title}</Text>
                </View>
                <Text className={`text-xs font-bold opacity-80 ${accentColor.text}`}>
                    {items.length} item{items.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {items.length > 0 ? (
                <View className="bg-white px-4">
                    {items.map((item, index) => (
                        <View key={item.id ?? index} className={`flex-row items-start py-3 gap-2.5 ${index % 2 === 1 ? 'bg-[#fafbfc] -mx-4 px-4' : ''}`}>
                            <View className={`min-w-[28px] h-7 px-1.5 rounded-lg items-center justify-center border ${accentColor.badgeBg} ${accentColor.badgeBorder}`}>
                                <Text className={`text-xs font-extrabold ${accentColor.text}`}>
                                    {item.qty % 1 === 0 ? item.qty.toFixed(0) : item.qty.toFixed(2)}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-[#2b2f36] leading-5" numberOfLines={2}>
                                    {item.menunm || 'Item'}
                                </Text>
                                <View className="flex-row flex-wrap items-center mt-1">
                                    {!!item.rate && (
                                        <Text className="text-[11.5px] font-medium text-[#9199a3] leading-4">
                                            ₹{parseFloat(item.rate).toFixed(2)} / unit
                                        </Text>
                                    )}
                                    {!!item.kitchennote && (
                                        <Text className="text-[11.5px] font-semibold text-[#e08a2c] leading-4">
                                            {'  •  '}{item.kitchennote}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Text className="w-20 text-right text-sm font-bold text-[#1f2937] mt-0.5 leading-5">
                                ₹{item.amount.toFixed(2)}
                            </Text>
                        </View>
                    ))}
                    <View className="pt-2.5 pb-3 border-t border-gray-100 mt-0.5">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-[13.5px] font-bold text-[#2c3e50]">{title} Subtotal</Text>
                            <Text className={`text-[15px] font-extrabold ${accentColor.text}`}>
                                ₹{sectionSubtotal.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>
            ) : (
                <View className="items-center justify-center py-5 bg-white gap-2">
                    <Utensils size={24} color="#c9ccd1" strokeWidth={1.5} />
                    <Text className="text-center text-[13px] font-medium text-[#9199a3] leading-5">
                        No {title.toLowerCase()} items
                    </Text>
                </View>
            )}
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/60 justify-center items-center">
                <View className="w-[94%] max-w-[520px] bg-white rounded-2xl overflow-hidden" style={{ maxHeight: SCREEN_HEIGHT * 0.9 }}>

                    {/* Header */}
                    <View className="flex-row justify-between items-center bg-[#2c3e50] px-5 py-4">
                        <View className="flex-row items-center gap-3">
                            <View className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center">
                                <Receipt size={19} color="#FFFFFF" strokeWidth={2.3} />
                            </View>
                            <View>
                                <Text className="text-[16.5px] font-bold text-white tracking-wide leading-5">Generate Bill</Text>
                                <Text className="text-[12px] text-white/70 mt-0.5 font-medium leading-4">
                                    {fetchingItems ? 'Loading items…' : `${foodItems.length + barItems.length} item${(foodItems.length + barItems.length) !== 1 ? 's' : ''}`}
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={8} className="p-1">
                            <X size={22} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* Scrollable Body */}
                    <ScrollView className="flex-grow-0" contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={true}>

                        {/* Table + Captain */}
                        <View className="flex-row gap-2.5 px-5 pt-4 pb-3.5">
                            <View className="flex-1">
                                <Text className="text-[11px] font-bold text-[#8a94a0] mb-1.5 tracking-wider leading-4">TABLE</Text>
                                <View className="border border-[#e4e7eb] rounded-lg bg-[#f8f9fa] px-3.5 py-2.5">
                                    <Text className="text-[14px] font-semibold text-[#2c3e50] leading-5">{table?.tableNo || 'T-01'}</Text>
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="text-[11px] font-bold text-[#8a94a0] mb-1.5 tracking-wider leading-4">CAPTAIN</Text>
                                <View className="border border-[#e4e7eb] rounded-lg bg-[#f8f9fa] px-3.5 py-2.5">
                                    <Text className="text-[14px] font-semibold text-[#2c3e50] leading-5" numberOfLines={1}>{waiterName}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Loading State */}
                        {fetchingItems && (
                            <View className="justify-center items-center py-10">
                                <ActivityIndicator size="large" color="#2c3e50" />
                                <Text className="mt-3 text-[14px] text-[#666] leading-5">Fetching items...</Text>
                            </View>
                        )}

                        {!fetchingItems && (
                            <>
                                {/* Food Section */}
                                {renderSection({
                                    icon: UtensilsCrossed,
                                    title: 'Food',
                                    accentColor: {
                                        bg: 'bg-[#eaf6ee]',
                                        border: 'border-[#cbe9d4]',
                                        text: 'text-[#1e7d3a]',
                                        badgeBg: 'bg-[#e1f4e7]',
                                        badgeBorder: 'border-[#bfe4cb]',
                                    },
                                    items: foodItems,
                                    sectionSubtotal: foodSubtotalDisplay,
                                })}

                                {/* Bar Section */}
                                {renderSection({
                                    icon: Wine,
                                    title: 'Bar',
                                    accentColor: {
                                        bg: 'bg-[#fdeeea]',
                                        border: 'border-[#f6d3c9]',
                                        text: 'text-[#c0472a]',
                                        badgeBg: 'bg-[#fbe4dc]',
                                        badgeBorder: 'border-[#f2c6b6]',
                                    },
                                    items: barItems,
                                    sectionSubtotal: barSubtotalDisplay,
                                })}
                            </>
                        )}

                        {/* Final Combined Summary */}
                        <View className="bg-[#f8f9fa] p-4 rounded-xl mx-5 mb-1 border border-[#eee] gap-0.5">
                            <View className="flex-row justify-between py-1.5">
                                <Text className="text-[13px] text-[#717985] leading-5">Food Subtotal (incl. tax)</Text>
                                <Text className="text-[13px] font-semibold text-[#333] leading-5">₹{foodSubtotalDisplay.toFixed(2)}</Text>
                            </View>
                            <View className="flex-row justify-between py-1.5">
                                <Text className="text-[13px] text-[#717985] leading-5">Bar Subtotal (incl. tax)</Text>
                                <Text className="text-[13px] font-semibold text-[#333] leading-5">₹{barSubtotalDisplay.toFixed(2)}</Text>
                            </View>
                            <View className="flex-row justify-between py-1.5">
                                <Text className="text-[13px] text-[#717985] leading-5">GST (already included)</Text>
                                <Text className="text-[13px] font-semibold text-[#333] leading-5">₹{totalGst.toFixed(2)}</Text>
                            </View>
                            <View className="flex-row justify-between py-1.5">
                                <Text className="text-[13px] text-[#717985] leading-5">Service Charge (already included)</Text>
                                <Text className="text-[13px] font-semibold text-[#333] leading-5">₹{totalSchg.toFixed(2)}</Text>
                            </View>
                            <View className="flex-row justify-between mt-2 pt-2.5 border-t border-[#e0e4e8]">
                                <Text className="text-[15px] font-bold text-[#2c3e50] leading-5">Net Payable</Text>
                                <Text className="text-[18px] font-bold text-[#27ae60] leading-6">₹{netPayable.toFixed(2)}</Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Fixed Footer - Make Bill Button */}
                    <View className="px-5 pt-3.5 pb-5 border-t border-[#eee] bg-white">
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleMakeBill}
                            disabled={loading || billItems.length === 0}
                            className={`w-full flex-row items-center justify-center py-3.5 rounded-xl ${loading || billItems.length === 0 ? 'bg-[#a5adb5]' : 'bg-[#27ae60]'}`}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                            ) : (
                                <Receipt size={17} color="#FFFFFF" strokeWidth={2.5} className="mr-2" />
                            )}
                            <Text className="text-white text-[15.5px] font-bold text-center">
                                {loading ? 'Generating...' : billItems.length === 0 ? 'No Items' : 'Make Bill'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}