// components/popup/KotPrintPopup.jsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Printer, X, FileText, ChefHat, Wine } from 'lucide-react-native';
import { getKOTPrintDetails } from '../../../api/system.api';
import { splitItemsByDestination } from '../../utils/kotItemSplit';

const PAPER_CHAR_WIDTH = 32;

function padLine(left, right, width = PAPER_CHAR_WIDTH) {
    const space = Math.max(width - left.length - right.length, 1);
    return left + ' '.repeat(space) + right;
}

function centerLine(text, width = PAPER_CHAR_WIDTH) {
    const pad = Math.max(Math.floor((width - text.length) / 2), 0);
    return ' '.repeat(pad) + text;
}

function divider(width = PAPER_CHAR_WIDTH, char = '-') {
    return char.repeat(width);
}

// Fix: Long item names break ho jayengi
function buildReceiptText({ table, kot, items, restaurantName, destinationLabel }) {
    const lines = [];
    lines.push(centerLine(restaurantName || 'RESTAURANT'));
    lines.push(centerLine('KOT RECEIPT'));
    lines.push(divider());
    lines.push(padLine(`Table: ${table?.tableNo || '-'}`, `KOT: ${kot?.kotno || kot?.code || '-'}`));
    lines.push(`Date : ${new Date().toLocaleString()}`);
    if (table?.guestName) lines.push(`Guest: ${table.guestName}`);
    lines.push(divider());
    lines.push(padLine('Item', 'Qty'));
    lines.push(divider());

    (items || []).forEach((item) => {
        const name = item.menuname || item.menunm || item.name || 'Item';
        const qty = String(item.qty ?? '');

        // Line overflow fix: agar name > 26 chars hai to break karo
        const MAX_NAME_LENGTH = PAPER_CHAR_WIDTH - 6; // 26 chars
        if (name.length > MAX_NAME_LENGTH) {
            let remaining = name;
            while (remaining.length > 0) {
                const chunk = remaining.substring(0, MAX_NAME_LENGTH);
                remaining = remaining.substring(MAX_NAME_LENGTH);
                if (remaining.length > 0) {
                    lines.push(chunk);
                } else {
                    lines.push(padLine(chunk, qty));
                }
            }
        } else {
            lines.push(padLine(name, qty));
        }

        if (item.infoforkot) {
            lines.push(`  note: ${item.infoforkot}`);
        }
    });

    lines.push(divider());
    lines.push(centerLine(`*** ${destinationLabel} ***`));
    return lines.join('\n');
}

// Reusable print block
function ReceiptBlock({ label, Icon, accent, accentSoft, receiptText, itemCount, onPrint }) {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePress = async () => {
        setIsPrinting(true);
        try {
            await onPrint();
        } catch (error) {
            console.error(`[KotPrintPopup] ${label} print error:`, error);
            Alert.alert('Print failed', `Could not send the ${label} receipt to the printer.`);
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <View className="w-full mb-4">
            <View className="flex-row items-center gap-2 mb-2.5">
                <View
                    className="w-7 h-7 rounded-lg items-center justify-center"
                    style={{ backgroundColor: accentSoft }}
                >
                    <Icon size={14} color={accent} strokeWidth={2.3} />
                </View>
                <Text className="text-[13px] font-extrabold tracking-wide" style={{ color: accent }}>
                    {label} · {itemCount} item{itemCount !== 1 ? 's' : ''}
                </Text>
            </View>

            <View
                style={{
                    width: 260,
                    alignSelf: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E5E5E5',
                    borderStyle: 'dashed',
                    padding: 10,
                }}
            >
                <Text style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 15, color: '#111' }}>
                    {receiptText}
                </Text>
            </View>

            <Pressable
                onPress={handlePress}
                disabled={isPrinting}
                className="flex-row items-center justify-center gap-2 py-3 rounded-xl mt-2.5"
                style={{ backgroundColor: accent, opacity: isPrinting ? 0.6 : 1 }}
            >
                {isPrinting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <>
                        <Printer size={15} color="#FFFFFF" strokeWidth={2.5} />
                        <Text className="text-white text-[13.5px] font-bold">Print {label}</Text>
                    </>
                )}
            </Pressable>
        </View>
    );
}

export default function KotPrintPopup({ visible, onClose, kot, table, posCd, restaurantName, onPrint }) {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    console.log('[KotPrintPopup] posCd:', posCd, 'kot:', kot);

    const fetchPrintDetails = async () => {
        setIsLoading(true);
        try {
            const kotCd = kot?.code || kot?.kotno || kot?.kotcd || '';

            if (!posCd || !kotCd) {
                console.warn('[KotPrintPopup] Missing posCd or kotCd');
                setIsLoading(false);
                return;
            }

            const result = await getKOTPrintDetails(posCd, kotCd);

            if (result?.success && Array.isArray(result.data)) {
                setItems(result.data);
            } else {
                setItems([]);
                if (typeof result?.data === 'string') {
                    console.warn('[KotPrintPopup] Backend message:', result.data);
                }
            }
        } catch (error) {
            console.error('[KotPrintPopup] fetch error:', error);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (visible && kot) {
            fetchPrintDetails();
        }
    }, [visible, kot]);

    const { foodItems, barItems, hasFood, hasBar } = splitItemsByDestination(items);

    const foodReceiptText = hasFood
        ? buildReceiptText({
            table,
            kot,
            items: foodItems,
            restaurantName,
            destinationLabel: 'KITCHEN COPY',
        })
        : '';

    const barReceiptText = hasBar
        ? buildReceiptText({
            table,
            kot,
            items: barItems,
            restaurantName,
            destinationLabel: 'BAR COPY',
        })
        : '';

    const handlePrintFood = async () => {
        if (onPrint) {
            await onPrint({
                destination: 'kitchen',
                text: foodReceiptText,
                table,
                kot,
                items: foodItems,
                charWidth: PAPER_CHAR_WIDTH,
            });
        } else {
            Alert.alert(
                'No printer connected',
                'Hook up a thermal printer bridge (onPrint prop) to send the Kitchen KOT.'
            );
        }
    };

    const handlePrintBar = async () => {
        if (onPrint) {
            await onPrint({
                destination: 'bar',
                text: barReceiptText,
                table,
                kot,
                items: barItems,
                charWidth: PAPER_CHAR_WIDTH,
            });
        } else {
            Alert.alert(
                'No printer connected',
                'Hook up a thermal printer bridge (onPrint prop) to send the Bar KOT.'
            );
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/60 justify-center items-center px-6">
                <View className="w-full max-w-[380px] bg-white rounded-2xl overflow-hidden" style={{ maxHeight: '88%' }}>
                    {/* Header */}
                    <View className="flex-row justify-between items-center px-5 pt-4 pb-3.5 bg-[#1c2530]">
                        <View className="flex-row items-center gap-2.5">
                            <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                                <Printer size={16} color="#FFFFFF" strokeWidth={2.4} />
                            </View>
                            <View>
                                <Text className="text-[16px] font-bold text-white leading-5">Print KOT</Text>
                                <Text className="text-[11.5px] font-semibold text-white/60 mt-0.5">
                                    3" Thermal · {kot?.kotno || kot?.code || 'KOT'}
                                </Text>
                            </View>
                        </View>

                        {/* Cross button with Alert */}
                        <Pressable
                            onPress={() => {
                                // Alert.alert(
                                //     'Bill is saved',
                                //     'This KOT is saved in the KOT List. You can find and print it anytime from the KOT List option inside the KOT popup.',
                                //     [{ text: 'OK' }]
                                // );
                                onClose();
                            }}
                            hitSlop={10}
                            className="p-1"
                        >
                            <X size={20} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {isLoading ? (
                        <View className="py-16 items-center justify-center">
                            <ActivityIndicator size="large" color="#2c3e50" />
                            <Text className="mt-3 text-[13.5px] text-[#666] font-medium">Loading receipt...</Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={{ maxHeight: 460 }}
                            contentContainerStyle={{ padding: 16 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {hasFood && (
                                <ReceiptBlock
                                    label="Kitchen KOT"
                                    Icon={ChefHat}
                                    accent="#2c7a4b"
                                    accentSoft="#e9f6ef"
                                    receiptText={foodReceiptText}
                                    itemCount={foodItems.length}
                                    onPrint={handlePrintFood}
                                />
                            )}

                            {hasBar && (
                                <ReceiptBlock
                                    label="Bar KOT"
                                    Icon={Wine}
                                    accent="#9c4dcc"
                                    accentSoft="#f5ecfc"
                                    receiptText={barReceiptText}
                                    itemCount={barItems.length}
                                    onPrint={handlePrintBar}
                                />
                            )}

                            {!hasFood && !hasBar && !isLoading && (
                                <View className="items-center mt-4 gap-1.5 py-8">
                                    <FileText size={22} color="#c9ccd1" strokeWidth={1.6} />
                                    <Text className="text-[12.5px] text-[#999] font-medium">
                                        No items found for this KOT
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}