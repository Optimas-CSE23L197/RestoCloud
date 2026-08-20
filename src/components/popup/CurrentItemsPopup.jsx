// components/popup/CurrentItemsPopup.jsx
import React, { useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, FlatList, useWindowDimensions, Alert, ActivityIndicator } from 'react-native';
import { ShoppingBag, X, Table2, User, Utensils, Trash2 } from 'lucide-react-native';
import { cancelKOTItem } from '../../../api/system.api';
import { useAuth } from '../../../src/context/AuthContext';

export default function CurrentItemsPopup({ visible, onClose, table, items = [], waiterName = "captain1", onItemCancelled }) {
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const [cancellingId, setCancellingId] = useState(null);

    const { selectedRestaurant } = useAuth();
    const waiterCd = selectedRestaurant?.usercd || '0000000001';

    // ✅ Fixed: always give the list container a real height, even when empty.
    // Previously `minHeight: mergedItems.length ? LIST_MIN_HEIGHT : undefined` collapsed
    // the container to 0 when there were no items, and FlatList's ListEmptyComponent
    // with `flexGrow: 1` inside a 0/undefined-height parent crashed/blanked on Android.
    const LIST_MIN_HEIGHT = Math.min(300, SCREEN_HEIGHT * 0.34);
    const LIST_MAX_HEIGHT = Math.min(440, SCREEN_HEIGHT * 0.52);
    const EMPTY_HEIGHT = Math.min(220, SCREEN_HEIGHT * 0.26);

    // ✅ Merge duplicate items
    const mergedItems = useMemo(() => {
        try {
            if (!Array.isArray(items) || items.length === 0) return [];
            const map = new Map();
            items.forEach((item) => {
                const id = item.menucd ?? item.name ?? item.menunm;
                const qty = parseFloat(item.qty || 0);
                const amount = parseFloat(item.amt || item.amount || 0);
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
        } catch (error) {
            console.error('[CurrentItemsPopup] Error merging items:', error);
            return [];
        }
    }, [items]);

    const totalAmount = mergedItems.reduce((sum, item) => sum + item.amount, 0);
    const hasItems = mergedItems.length > 0;

    // ✅ Handle Cancel Item
    const handleCancelItem = async (item) => {
        const kotdtlcode = item.kotdtlcode || item.kotdtlcd || item.code;
        if (!kotdtlcode) {
            Alert.alert('Error', 'Item code not found.');
            return;
        }

        Alert.alert(
            'Cancel Item',
            `Are you sure you want to cancel "${item.menunm || item.name || 'Item'}"?`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        setCancellingId(kotdtlcode);
                        try {
                            const result = await cancelKOTItem({
                                code: kotdtlcode,
                                cancreason: 'Cancelled by waiter',
                                waitercd: waiterCd,
                            });
                            if (result?.success) {
                                Alert.alert('Success', 'Item cancelled successfully.');
                                if (onItemCancelled) onItemCancelled();
                                onClose(); // close and refresh
                            } else {
                                Alert.alert('Error', result?.error || 'Failed to cancel item.');
                            }
                        } catch (error) {
                            console.error('[CurrentItemsPopup] Cancel error:', error);
                            Alert.alert('Error', 'Something went wrong.');
                        } finally {
                            setCancellingId(null);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item, index }) => {
        const { qty, amount, rate } = item;
        const isCancelling = cancellingId === (item.kotdtlcode || item.kotdtlcd || item.code);

        return (
            <View className={`flex-row items-center py-3.5 px-2 gap-3 ${index % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'}`}>
                <View className="min-w-[32px] h-8 px-2 rounded-lg bg-[#eef4fb] border border-[#d7e4f2] items-center justify-center">
                    <Text className="text-[13px] font-extrabold text-[#2c3e50]" numberOfLines={1}>
                        {qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2)}
                    </Text>
                </View>

                <View className="flex-1 pr-1">
                    <Text className="text-[14px] font-semibold text-[#2b2f36] leading-[18px]" numberOfLines={2}>
                        {item.menunm || item.name || 'Item'}
                    </Text>
                    <View className="flex-row flex-wrap items-center mt-1 gap-1">
                        {!!rate && (
                            <Text className="text-[11.5px] font-medium text-[#9199a3]">
                                ₹{rate.toFixed(2)} / unit
                            </Text>
                        )}
                        {!!item.kitchennote && (
                            <Text className="text-[11.5px] font-semibold text-[#e08a2c]" numberOfLines={1}>
                                • {item.kitchennote}
                            </Text>
                        )}
                    </View>
                </View>

                <Text className="w-[76px] text-right text-[14px] font-bold text-[#1f2937]">
                    ₹{amount.toFixed(2)}
                </Text>

                <Pressable
                    onPress={() => handleCancelItem(item)}
                    disabled={isCancelling}
                    hitSlop={8}
                    className="w-8 h-8 items-center justify-center rounded-full active:bg-[#fdecea]"
                >
                    {isCancelling ? (
                        <ActivityIndicator size="small" color="#e74c3c" />
                    ) : (
                        <Trash2 size={17} color="#e74c3c" strokeWidth={2.2} />
                    )}
                </Pressable>
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/60 justify-center items-center px-4">
                <View className="w-full max-w-[520px] bg-white rounded-2xl overflow-hidden" style={{ maxHeight: '90%' }}>

                    {/* Header */}
                    <View className="flex-row justify-between items-center bg-[#2c3e50] px-5 py-4">
                        <View className="flex-row items-center gap-3">
                            <View className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center">
                                <ShoppingBag size={19} color="#FFFFFF" strokeWidth={2.3} />
                            </View>
                            <View>
                                <Text className="text-[16px] font-bold text-white leading-5">Current Order</Text>
                                <Text className="text-[12px] text-white/70 mt-0.5 font-medium leading-4">
                                    {mergedItems.length} item{mergedItems.length !== 1 ? 's' : ''} in cart
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10} className="p-1">
                            <X size={21} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* Body */}
                    <View className="px-5 pt-4 pb-5">
                        {/* Table + Captain badges */}
                        <View className="flex-row gap-2 mb-3.5">
                            <View className="flex-row items-center bg-[#eef2f6] px-3 py-1.5 rounded-lg border border-[#e3e8ee] gap-1.5">
                                <Table2 size={14} color="#2c3e50" strokeWidth={2.3} />
                                <Text className="text-[12.5px] font-bold text-[#2c3e50]">Table {table?.tableNo || 'T-01'}</Text>
                            </View>
                            <View className="flex-row items-center bg-[#eef2f6] px-3 py-1.5 rounded-lg border border-[#e3e8ee] gap-1.5">
                                <User size={14} color="#2c3e50" strokeWidth={2.3} />
                                <Text className="text-[12.5px] font-bold text-[#2c3e50]">{waiterName}</Text>
                            </View>
                        </View>

                        {/* Column headers - only when there are items */}
                        {hasItems && (
                            <View className="flex-row items-center py-2.5 px-2 border-b-[1.5px] border-[#e5e5e5]">
                                <Text className="w-8 text-center text-[11px] font-extrabold text-[#8a8f98] tracking-wider">QTY</Text>
                                <Text className="flex-1 ml-3 text-[11px] font-extrabold text-[#8a8f98] tracking-wider">ITEM</Text>
                                <Text className="w-[76px] text-right text-[11px] font-extrabold text-[#8a8f98] tracking-wider">AMOUNT</Text>
                            </View>
                        )}

                        {/* Item list — fixed height container regardless of empty/non-empty */}
                        {hasItems ? (
                            <View style={{ minHeight: LIST_MIN_HEIGHT, maxHeight: LIST_MAX_HEIGHT }}>
                                <FlatList
                                    data={mergedItems}
                                    keyExtractor={(item, index) => `${item.id ?? index}`}
                                    renderItem={renderItem}
                                    showsVerticalScrollIndicator={true}
                                    ItemSeparatorComponent={() => <View className="h-[1px] bg-[#f0f1f3]" />}
                                />
                            </View>
                        ) : (
                            <View style={{ height: EMPTY_HEIGHT }} className="items-center justify-center gap-2.5">
                                <Utensils size={32} color="#c9ccd1" strokeWidth={1.5} />
                                <Text className="text-center text-[13.5px] font-medium text-[#9199a3]">
                                    No items in this order
                                </Text>
                            </View>
                        )}

                        {/* Total footer */}
                        {hasItems && (
                            <View className="flex-row justify-between items-center mt-3.5 pt-3.5 border-t-[1.5px] border-[#e5e5e5]">
                                <Text className="text-[15px] font-bold text-[#333]">Total</Text>
                                <Text className="text-[19px] font-bold text-[#27ae60]">₹{totalAmount.toFixed(2)}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}