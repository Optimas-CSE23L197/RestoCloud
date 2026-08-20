// components/popup/KotTransferPopup.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeftRight, X, Check, LayoutGrid } from 'lucide-react-native';
import { transferKOT } from '../../../api/system.api';

export default function KotTransferPopup({ visible, onClose, kot, table, tables = [], onTransferred }) {
    const [selectedTableCode, setSelectedTableCode] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inFlightRef = useRef(false);

    useEffect(() => {
        if (visible) {
            setSelectedTableCode(null);
            setIsSubmitting(false);
            inFlightRef.current = false;
        }
    }, [visible]);

    // ✅ Full table list, excluding only the table this KOT already belongs to.
    const availableTables = useMemo(() => {
        const currentCode = table?.tableCode;
        return (tables || [])
            .filter((t) => (t.tablecd ?? t.tableCode) !== currentCode)
            .map((t) => ({
                code: t.tablecd ?? t.tableCode,
                no: t.tableno ?? t.tableNo,
                status: t.status,
            }))
            .sort((a, b) => (a.no || '').localeCompare(b.no || '', undefined, { numeric: true }));
    }, [tables, table?.tableCode]);

    const handleConfirm = async () => {
        if (!selectedTableCode) {
            Alert.alert('Select a table', 'Please choose a table to transfer this KOT to.');
            return;
        }
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setIsSubmitting(true);

        try {
            const kotCode = kot?.code || kot?.kotno || kot?.kotcd || '';
            if (!kotCode) {
                Alert.alert('Error', 'KOT code not found.');
                return;
            }

            const result = await transferKOT({
                kotcode: kotCode,
                ttablcd: selectedTableCode,
            });

            if (result?.success) {
                Alert.alert('Success', 'KOT transferred successfully.');
                if (onTransferred) onTransferred(kot, selectedTableCode);
                onClose();
            } else {
                Alert.alert('Error', result?.error || 'Failed to transfer KOT.');
            }
        } catch (error) {
            console.error('[KotTransferPopup] transfer error:', error);
            Alert.alert('Error', 'Something went wrong while transferring the KOT.');
        } finally {
            inFlightRef.current = false;
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View className="flex-1 bg-black/60 justify-center items-center px-6">
                <View className="w-full max-w-[420px] bg-white rounded-2xl overflow-hidden" style={{ maxHeight: '80%' }}>
                    {/* Header */}
                    <View className="flex-row justify-between items-center px-5 pt-4 pb-3.5 bg-[#1c2530]">
                        <View className="flex-row items-center gap-2.5">
                            <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                                <ArrowLeftRight size={16} color="#FFFFFF" strokeWidth={2.4} />
                            </View>
                            <View>
                                <Text className="text-[16px] font-bold text-white leading-5">Transfer KOT</Text>
                                <Text className="text-[11.5px] font-semibold text-white/60 mt-0.5">
                                    From Table {table?.tableNo || '—'} · {kot?.kotno || kot?.code || 'KOT'}
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={handleClose} hitSlop={10} className="p-1" disabled={isSubmitting}>
                            <X size={20} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    <Text className="text-[11px] font-bold text-[#8a94a0] tracking-wider px-5 pt-4 pb-1.5">
                        AVAILABLE TABLES ({availableTables.length})
                    </Text>

                    {availableTables.length === 0 ? (
                        <View className="items-center justify-center py-10 px-5">
                            <Text className="text-[13.5px] text-[#999] font-semibold text-center">
                                No other tables found to transfer to.
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={{ maxHeight: 340 }}
                            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="flex-row flex-wrap gap-2 px-1 py-1">
                                {availableTables.map((t) => {
                                    const active = selectedTableCode === t.code;
                                    return (
                                        <Pressable
                                            key={t.code}
                                            onPress={() => setSelectedTableCode(t.code)}
                                            className="flex-row items-center gap-1.5 rounded-xl px-3.5 py-2.5"
                                            style={{
                                                minWidth: 78,
                                                borderWidth: 1.5,
                                                borderColor: active ? '#2c3e50' : '#e5e5e5',
                                                backgroundColor: active ? '#2c3e50' : '#FFFFFF',
                                            }}
                                        >
                                            {active ? (
                                                <Check size={13} color="#FFFFFF" strokeWidth={3} />
                                            ) : (
                                                <LayoutGrid size={13} color="#9AA3AF" strokeWidth={2.2} />
                                            )}
                                            <Text
                                                className="text-[13px] font-bold"
                                                style={{ color: active ? '#FFFFFF' : '#333' }}
                                            >
                                                {t.no}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    )}

                    {/* Footer */}
                    <View className="px-5 pt-3 pb-4 border-t border-[#eee] bg-white">
                        <Pressable
                            onPress={handleConfirm}
                            disabled={isSubmitting || !selectedTableCode}
                            className="w-full flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-[#27ae60]"
                            style={{ opacity: !selectedTableCode ? 0.55 : 1 }}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <ArrowLeftRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                                    <Text className="text-white text-[14.5px] font-bold">
                                        {selectedTableCode ? `Proceed to Table ${availableTables.find(t => t.code === selectedTableCode)?.no || ''}` : 'Select a Table'}
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}