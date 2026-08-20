// components/popup/KOTListPopup.jsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import {
    X,
    FileText,
    Printer,
    Ban,
    ArrowLeftRight,
    Check,
    Receipt,
    ClipboardList,
} from 'lucide-react-native';
import { getPreviousKOTs } from '../../../api/system.api';
import KotCancelPopup from './KotCancelPopup';
import KotTransferPopup from './KotTransferPopup';
import KotPrintPopup from './KotPrintPopup';

function ActionPill({ icon: Icon, label, tone, onPress }) {
    const tones = {
        primary: { bg: '#EAF1FF', border: '#C9DBFF', text: '#2B5FE0', icon: '#2B5FE0' },
        neutral: { bg: '#F1F3F5', border: '#E3E6E9', text: '#4B5563', icon: '#4B5563' },
        danger: { bg: '#FDEDEC', border: '#F6CFC9', text: '#D0392B', icon: '#D0392B' },
        success: { bg: '#EAFAF1', border: '#C8EFD8', text: '#1E8449', icon: '#1E8449' },
    };
    const t = tones[tone] || tones.neutral;

    return (
        <Pressable
            onPress={onPress}
            android_ripple={{ color: t.border }}
            className="flex-row items-center justify-center gap-1.5 rounded-xl px-3 py-2"
            style={{ backgroundColor: t.bg, borderWidth: 1, borderColor: t.border }}
        >
            <Icon size={14} color={t.icon} strokeWidth={2.4} />
            <Text style={{ color: t.text }} className="text-[11.5px] font-bold">
                {label}
            </Text>
        </Pressable>
    );
}

function KotCard({ kot, index, isSelected, onSelectToggle, onPrint, onTransfer, onCancel }) {
    const kotNo = kot.kotno || kot.code || `KOT-${index + 1}`;
    const amount = parseFloat(kot.kotamt || 0);

    return (
        <View
            className="mx-4 mb-3 rounded-2xl overflow-hidden bg-white"
            style={{
                borderWidth: 1.5,
                borderColor: isSelected ? '#2c3e50' : '#EDEFF2',
                shadowColor: '#0F1B2A',
                shadowOpacity: isSelected ? 0.12 : 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: isSelected ? 3 : 1,
            }}
        >
            {/* Top row: KOT number + amount */}
            <Pressable
                onPress={() => onSelectToggle(kot)}
                className="flex-row items-center justify-between px-4 pt-3.5 pb-3"
            >
                <View className="flex-row items-center gap-3 flex-1">
                    <View
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: isSelected ? '#2c3e50' : '#F1F3F5' }}
                    >
                        {isSelected ? (
                            <Check size={18} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                            <ClipboardList size={17} color="#6B7280" strokeWidth={2.2} />
                        )}
                    </View>
                    <View className="flex-1">
                        <Text className="text-[10px] font-bold text-[#9AA3AF] tracking-wider">
                            KOT NUMBER
                        </Text>
                        <Text
                            className="text-[16px] font-extrabold text-[#1C2530] leading-5 mt-0.5"
                            numberOfLines={1}
                        >
                            {kotNo}
                        </Text>
                    </View>
                </View>

                <View className="items-end">
                    <Text className="text-[10px] font-bold text-[#9AA3AF] tracking-wider">
                        AMOUNT
                    </Text>
                    <Text className="text-[18px] font-extrabold text-[#1C2530] leading-6 mt-0.5">
                        ₹{amount.toFixed(2)}
                    </Text>
                </View>
            </Pressable>

            {/* Divider */}
            <View className="h-[1px] bg-[#F1F2F4] mx-4" />

            {/* Action row — always visible, nothing hidden behind a dropdown */}
            <View className="flex-row gap-2 px-4 py-3">
                <View className="flex-1">
                    <ActionPill icon={Printer} label="Print" tone="primary" onPress={() => onPrint(kot)} />
                </View>
                <View className="flex-1">
                    <ActionPill icon={ArrowLeftRight} label="Transfer" tone="neutral" onPress={() => onTransfer(kot)} />
                </View>
                <View className="flex-1">
                    <ActionPill
                        icon={Ban}
                        label="Cancel"
                        tone="danger"
                        onPress={() => {
                            console.log('[KOTList] Cancel clicked for KOT:', kot);
                            onCancel(kot);
                        }}
                    />
                </View>
            </View>
        </View>
    );
}

export default function KOTListPopup({
    visible,
    onClose,
    table,
    tables = [],
    posCd,
    waiterCode = '',
    restaurantName,
    onPrintKOT,
}) {
    const [kotList, setKotList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedKot, setSelectedKot] = useState(null);

    const [cancelTarget, setCancelTarget] = useState(null);
    const [transferTarget, setTransferTarget] = useState(null);
    const [printTarget, setPrintTarget] = useState(null);

    const fetchKOTList = async () => {
        if (!table?.tableCode) {
            Alert.alert('Error', 'Table code not found');
            return;
        }

        setIsLoading(true);
        try {
            console.log('[KOTList] 📞 Fetching KOTs for table:', table.tableCode);
            const result = await getPreviousKOTs(table.tableCode);
            console.log('[KOTList] API Result:', result);

            if (result.success && Array.isArray(result.data)) {
                setKotList(result.data);
            } else {
                setKotList([]);
            }
        } catch (error) {
            console.error('[KOTList] 🔴 Error fetching KOTs:', error);
            setKotList([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (visible && table?.tableCode) {
            fetchKOTList();
            setSelectedKot(null);
        }
    }, [visible, table?.tableCode]);

    const handleSelectToggle = (kot) => {
        const id = kot.kotno || kot.code;
        setSelectedKot((prev) => (prev === id ? null : id));
    };

    // After a cancel/transfer actually succeeds, refresh the KOT list so
    // the cancelled/transferred KOT disappears from this table's list
    // without the user having to close and reopen the popup.
    const handleKotMutated = () => {
        fetchKOTList();
    };

    const totalAmount = kotList.reduce((sum, k) => sum + (parseFloat(k.kotamt) || 0), 0);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/65 justify-center items-center px-4">
                <View
                    className="w-full max-w-[520px] bg-[#F7F8FA] rounded-[24px] overflow-hidden"
                    style={{ maxHeight: '88%' }}
                >
                    {/* Header */}
                    <View className="bg-[#1C2530] px-5 pt-4 pb-4">
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center">
                                    <FileText size={19} color="#FFFFFF" strokeWidth={2.3} />
                                </View>
                                <View>
                                    <Text className="text-[17px] font-extrabold text-white tracking-wide leading-5">
                                        KOT List
                                    </Text>
                                    <Text className="text-[12px] text-white/60 font-semibold mt-0.5 leading-4">
                                        Table {table?.tableNo || '—'}
                                    </Text>
                                </View>
                            </View>
                            <Pressable
                                onPress={onClose}
                                hitSlop={10}
                                className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
                            >
                                <X size={19} color="#FFFFFF" strokeWidth={2.5} />
                            </Pressable>
                        </View>

                        {/* Summary strip */}
                        {!isLoading && kotList.length > 0 && (
                            <View
                                className="flex-row items-center justify-between mt-4 rounded-xl px-4 py-2.5"
                                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                            >
                                <View className="flex-row items-center gap-1.5">
                                    <Receipt size={13} color="#9FB2C9" strokeWidth={2.3} />
                                    <Text className="text-[12px] font-semibold text-[#C7D2DE]">
                                        {kotList.length} KOT{kotList.length !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <Text className="text-[13.5px] font-extrabold text-white">
                                    ₹{totalAmount.toFixed(2)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Body */}
                    {isLoading ? (
                        <View className="py-20 items-center justify-center">
                            <ActivityIndicator size="large" color="#2c3e50" />
                            <Text className="mt-3 text-[14px] text-[#666] font-medium">Loading KOTs...</Text>
                        </View>
                    ) : kotList.length === 0 ? (
                        <View className="py-20 items-center justify-center gap-2 px-8">
                            <View className="w-16 h-16 rounded-2xl bg-[#EEF1F4] items-center justify-center mb-1">
                                <ClipboardList size={26} color="#B0B8C1" strokeWidth={1.8} />
                            </View>
                            <Text className="text-[16px] font-bold text-[#5A6472] text-center">
                                No orders found
                            </Text>
                            <Text className="text-[13px] text-[#9AA3AF] text-center leading-5">
                                This table has no past KOTs yet.
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={{ maxHeight: 480 }}
                            contentContainerStyle={{ paddingTop: 14, paddingBottom: 18 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {kotList.map((kot, index) => (
                                <KotCard
                                    key={kot.kotno || kot.code || index}
                                    kot={kot}
                                    index={index}
                                    isSelected={selectedKot === (kot.kotno || kot.code)}
                                    onSelectToggle={handleSelectToggle}
                                    onPrint={setPrintTarget}
                                    onTransfer={setTransferTarget}
                                    onCancel={setCancelTarget}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>

            {/* 1. Cancel — confirmation with reason before calling the API */}
            <KotCancelPopup
                visible={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                kot={cancelTarget}
                table={table}
                waiterCode={waiterCode}
                onCancelled={handleKotMutated}
            />

            {/* 2. Transfer — shows the full table list, not just occupied/vacant */}
            <KotTransferPopup
                visible={!!transferTarget}
                onClose={() => setTransferTarget(null)}
                kot={transferTarget}
                table={table}
                tables={tables}
                onTransferred={handleKotMutated}
            />

            {/* 3. Print — formatted for a 3" / 58mm thermal printer */}
            <KotPrintPopup
                visible={!!printTarget}
                onClose={() => setPrintTarget(null)}
                kot={printTarget}
                table={table}
                posCd={posCd}
                restaurantName={restaurantName}
                onPrint={onPrintKOT}
            />
        </Modal>
    );
}