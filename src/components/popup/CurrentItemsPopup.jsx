// components/popup/CurrentItemsPopup.jsx
import React, { useMemo } from 'react';
import { Modal, View, Text, Pressable, FlatList, useWindowDimensions } from 'react-native';
import { ShoppingBag, X, Table2, User, Utensils } from 'lucide-react-native';

export default function CurrentItemsPopup({ visible, onClose, table, items = [], waiterName = "captain1" }) {
    const { height: SCREEN_HEIGHT } = useWindowDimensions();

    const LIST_MIN_HEIGHT = Math.min(320, SCREEN_HEIGHT * 0.38);
    const LIST_MAX_HEIGHT = Math.min(480, SCREEN_HEIGHT * 0.58);

    // ✅ Try-Catch + Empty check
    const mergedItems = useMemo(() => {
        try {
            if (!Array.isArray(items) || items.length === 0) {
                return [];
            }

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
                    map.set(id, {
                        ...item,
                        id,
                        qty,
                        amount,
                        rate,
                    });
                }
            });

            return Array.from(map.values());
        } catch (error) {
            console.error('[CurrentItemsPopup] Error merging items:', error);
            return [];
        }
    }, [items]);

    const totalAmount = mergedItems.reduce((sum, item) => sum + item.amount, 0);

    const renderItem = ({ item, index }) => {
        const { qty, amount, rate } = item;

        return (
            <View className={`flex-row items-start py-3 px-1 gap-2.5 ${index % 2 === 1 ? 'bg-[#fafbfc]' : ''}`}>
                <View className="min-w-[28px] h-7 px-1.5 rounded-lg bg-[#eef4fb] border border-[#d7e4f2] items-center justify-center">
                    <Text className="text-[13px] font-extrabold text-[#2c3e50] leading-4">
                        {qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2)}
                    </Text>
                </View>
                <View className="flex-1">
                    <Text className="text-[14.5px] font-semibold text-[#2b2f36] leading-5" numberOfLines={2}>
                        {item.menunm || item.name || 'Item'}
                    </Text>
                    <View className="flex-row flex-wrap items-center mt-1">
                        {!!rate && (
                            <Text className="text-[12px] font-medium text-[#9199a3] leading-4">
                                ₹{rate.toFixed(2)} / unit
                            </Text>
                        )}
                        {!!item.kitchennote && (
                            <Text className="text-[12px] font-semibold text-[#e08a2c] leading-4" numberOfLines={1}>
                                {'  •  '}{item.kitchennote}
                            </Text>
                        )}
                    </View>
                </View>
                <Text className="w-[84px] text-right text-[14.5px] font-bold text-[#1f2937] leading-5">
                    ₹{amount.toFixed(2)}
                </Text>
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/60 justify-center items-center">
                <View className="w-[94%] max-w-[520px] bg-white rounded-2xl overflow-hidden" style={{ maxHeight: '92%' }}>

                    {/* Header */}
                    <View className="flex-row justify-between items-center bg-[#2c3e50] px-5 py-5">
                        <View className="flex-row items-center gap-3">
                            <View className="w-[38px] h-[38px] rounded-xl bg-white/15 items-center justify-center">
                                <ShoppingBag size={20} color="#FFFFFF" strokeWidth={2.3} />
                            </View>
                            <View>
                                <Text className="text-[17px] font-bold text-white leading-5">Current Order</Text>
                                <Text className="text-[12.5px] text-white/70 mt-0.5 font-medium leading-4">
                                    {mergedItems.length} item{mergedItems.length !== 1 ? 's' : ''} in cart
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10} className="p-1">
                            <X size={22} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* Body */}
                    <View className="p-5">

                        {/* Table + Captain badges */}
                        <View className="flex-row gap-2.5 mb-4.5">
                            <View className="flex-row items-center bg-[#eef2f6] px-3.5 py-2 rounded-lg border border-[#e3e8ee] gap-1.5">
                                <Table2 size={15} color="#2c3e50" strokeWidth={2.3} />
                                <Text className="text-[13px] font-bold text-[#2c3e50] leading-4">Table {table?.tableNo || 'T-01'}</Text>
                            </View>
                            <View className="flex-row items-center bg-[#eef2f6] px-3.5 py-2 rounded-lg border border-[#e3e8ee] gap-1.5">
                                <User size={15} color="#2c3e50" strokeWidth={2.3} />
                                <Text className="text-[13px] font-bold text-[#2c3e50] leading-4">{waiterName}</Text>
                            </View>
                        </View>

                        {/* Column headers */}
                        <View className="flex-row items-center py-3 px-1 border-b border-[#e5e5e5] border-b-[1.5px]">
                            <Text className="w-[36px] text-center text-[11.5px] font-extrabold text-[#8a8f98] tracking-wider leading-4">QTY</Text>
                            <Text className="flex-1 ml-2.5 text-[11.5px] font-extrabold text-[#8a8f98] tracking-wider leading-4">ITEM</Text>
                            <Text className="w-[84px] text-right text-[11.5px] font-extrabold text-[#8a8f98] tracking-wider leading-4">AMOUNT</Text>
                        </View>

                        {/* Item list */}
                        <View style={{ minHeight: mergedItems.length ? LIST_MIN_HEIGHT : undefined, maxHeight: LIST_MAX_HEIGHT }}>
                            <FlatList
                                data={mergedItems}
                                keyExtractor={(item, index) => `${item.id ?? index}`}
                                renderItem={renderItem}
                                showsVerticalScrollIndicator={true}
                                contentContainerStyle={mergedItems.length === 0 && { flexGrow: 1, justifyContent: 'center' }}
                                ListEmptyComponent={
                                    <View className="items-center justify-center py-8 gap-2.5">
                                        <Utensils size={34} color="#c9ccd1" strokeWidth={1.5} />
                                        <Text className="text-center text-[14px] font-medium text-[#9199a3] leading-5">
                                            No items in this order
                                        </Text>
                                    </View>
                                }
                            />
                        </View>

                        {/* Total footer */}
                        {mergedItems.length > 0 && (
                            <View className="flex-row justify-between items-center mt-4 pt-4 border-t-[1.5px] border-[#e5e5e5]">
                                <Text className="text-[16px] font-bold text-[#333] leading-5">Total</Text>
                                <Text className="text-[20px] font-bold text-[#27ae60] leading-6">₹{totalAmount.toFixed(2)}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}