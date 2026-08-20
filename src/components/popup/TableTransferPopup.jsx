// components/popup/TableTransferPopup.jsx
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, Alert, ScrollView } from 'react-native';
import { ArrowRight, X, Table, ChevronDown } from 'lucide-react-native';
import { transferTable } from '../../../api/system.api';

export default function TableTransferPopup({ visible, onClose, currentTable, tables = [], onTransferComplete }) {
    const [selectedTable, setSelectedTable] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);

    // Filter only vacant tables, exclude current table
    const availableTables = tables
        .map((t) => ({
            ...t,
            tableNo: t.tableNo ?? t.tableno ?? t.table_no ?? '',
            _status: (t.status || '').toLowerCase(),
        }))
        .filter((t) => t._status === 'vacant' && t.tableNo !== currentTable);

    // Handle Transfer API Call
    const handleConfirm = async () => {
        if (!selectedTable) {
            Alert.alert('Error', 'Please select a target table');
            return;
        }

        // Get table codes from selected table object
        const fromTableCd = tables.find((t) =>
            (t.tableNo ?? t.tableno ?? t.table_no) === currentTable
        )?.tablecd || currentTable;

        const toTableCd = selectedTable.tablecd || selectedTable.id || selectedTable.tableCode;

        if (!fromTableCd || !toTableCd) {
            Alert.alert('Error', 'Table codes not found');
            return;
        }

        setIsTransferring(true);
        try {
            const result = await transferTable(fromTableCd, toTableCd);
            console.log('[TableTransfer] API result:', result);

            if (result.success) {
                Alert.alert('Success', 'Table transferred successfully!');
                onClose();
                if (onTransferComplete) {
                    onTransferComplete();
                }
            } else {
                Alert.alert('Error', result.error || 'Transfer failed');
            }
        } catch (error) {
            console.error('[TableTransfer] Exception:', error);
            Alert.alert('Error', 'Something went wrong during transfer');
        } finally {
            setIsTransferring(false);
        }
    };

    const handleSelectTable = (table) => {
        setSelectedTable(table);
        setShowDropdown(false);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 justify-center items-center bg-black/60">
                <View className="w-[92%] max-w-[500px] bg-white rounded-xl overflow-visible">
                    {/* Header */}
                    <View className="flex-row justify-between items-center bg-[#2c3e50] px-4 py-3.5 rounded-t-xl">
                        <View className="flex-row items-center gap-2.5">
                            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text className="text-[17px] font-bold text-white">Table Transfer</Text>
                        </View>
                        <Pressable onPress={onClose} className="p-1">
                            <X size={24} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* Body */}
                    <View className="p-5" style={{ zIndex: 20 }}>
                        <View className="flex-row items-center justify-between gap-2.5">
                            {/* FROM TABLE */}
                            <View className="flex-1">
                                <Text className="text-xs font-bold text-[#555] mb-1.5 tracking-wide">
                                    FROM TABLE
                                </Text>
                                <View className="flex-row items-center border border-[#ddd] rounded-md px-3 h-11 gap-2.5">
                                    <Table size={16} color="#888888" strokeWidth={2} />
                                    <Text className="flex-1 text-sm text-[#333] font-medium">
                                        {currentTable || 'T-01'}
                                    </Text>
                                </View>
                            </View>

                            <View className="pt-5">
                                <ArrowRight size={20} color="#d32f2f" strokeWidth={2.5} />
                            </View>

                            {/* TO TABLE */}
                            <View className="flex-1" style={{ zIndex: 30 }}>
                                <Text className="text-xs font-bold text-[#555] mb-1.5 tracking-wide">
                                    TO TABLE
                                </Text>
                                <Pressable
                                    className="flex-row items-center border border-[#ddd] rounded-md px-3 h-11 gap-2.5"
                                    onPress={() => setShowDropdown(!showDropdown)}
                                >
                                    <Table size={16} color="#888888" strokeWidth={2} />
                                    <Text
                                        className={`flex-1 text-sm font-medium ${selectedTable ? 'text-[#333]' : 'text-[#999]'
                                            }`}
                                    >
                                        {selectedTable ? selectedTable.tableNo : 'Select Table'}
                                    </Text>
                                    <ChevronDown size={16} color="#888888" strokeWidth={2} />
                                </Pressable>

                                {showDropdown && (
                                    <View
                                        className="absolute top-16 left-0 right-0 bg-white border border-[#ddd] rounded-md shadow-md"
                                        style={{ zIndex: 999, elevation: 10, maxHeight: 250 }}
                                    >
                                        {availableTables.length === 0 ? (
                                            <Text className="p-3 text-[13px] text-[#999] text-center">
                                                No vacant tables available
                                            </Text>
                                        ) : (
                                            <ScrollView
                                                style={{ maxHeight: 250 }}
                                                nestedScrollEnabled={true}
                                                showsVerticalScrollIndicator={true}
                                                persistentScrollbar={true}
                                                keyboardShouldPersistTaps="handled"
                                            >
                                                {availableTables.map((item, idx) => (
                                                    <Pressable
                                                        key={item.id ?? item.tablecd ?? `${item.tableNo}-${idx}`}
                                                        className="flex-row justify-between items-center py-2.5 px-3 border-b border-[#f5f5f5]"
                                                        onPress={() => handleSelectTable(item)}
                                                    >
                                                        <Text className="text-sm text-[#333] font-medium">
                                                            {item.tableNo || 'N/A'}
                                                        </Text>
                                                        <Text className="text-xs text-[#16A34A] font-semibold">
                                                            Vacant
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                            </ScrollView>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            className={`bg-[#0097a7] py-3.5 rounded-md items-center justify-center flex-row gap-2 mt-5 ${isTransferring ? 'opacity-70' : ''}`}
                            onPress={handleConfirm}
                            disabled={isTransferring}
                        >
                            {isTransferring ? (
                                <Text className="text-white text-base font-bold">Transferring...</Text>
                            ) : (
                                <>
                                    <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                                    <Text className="text-white text-base font-bold">Confirm Transfer</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}