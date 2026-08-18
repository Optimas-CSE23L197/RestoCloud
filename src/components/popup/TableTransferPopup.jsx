// components/popup/TableTransferPopup.jsx
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { ArrowRight, X, Table, ChevronDown } from 'lucide-react-native';

export default function TableTransferPopup({ visible, onClose, currentTable, tables = [] }) {
    const [selectedTable, setSelectedTable] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // Case-insensitive filter for safety
    const availableTables = tables;

    const handleConfirm = () => {
        if (!selectedTable) {
            Alert.alert('Error', 'Please select a target table');
            return;
        }
        console.log(`Transfer from ${currentTable} to ${selectedTable.tableNo}`);
        onClose();
    };

    const handleSelectTable = (table) => {
        setSelectedTable(table);
        setShowDropdown(false);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.headerTitle}>Table Transfer</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    <View style={styles.body}>
                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>FROM TABLE</Text>
                                <View style={styles.inputContainer}>
                                    <Table size={16} color="#888888" strokeWidth={2} />
                                    <Text style={styles.inputText}>{currentTable || 'T-01'}</Text>
                                </View>
                            </View>
                            <View style={styles.arrowContainer}>
                                <ArrowRight size={20} color="#d32f2f" strokeWidth={2.5} />
                            </View>
                            <View style={[styles.field, { zIndex: 20 }]}>
                                <Text style={styles.label}>TO TABLE</Text>
                                <Pressable
                                    style={styles.inputContainer}
                                    onPress={() => setShowDropdown(!showDropdown)}
                                >
                                    <Table size={16} color="#888888" strokeWidth={2} />
                                    <Text style={[styles.inputText, !selectedTable && { color: '#999' }]}>
                                        {selectedTable ? selectedTable.tableNo : 'Select Table'}
                                    </Text>
                                    <ChevronDown size={16} color="#888888" strokeWidth={2} />
                                </Pressable>

                                {showDropdown && (
                                    <View style={styles.dropdown}>
                                        {availableTables.length === 0 ? (
                                            <Text style={styles.dropdownEmpty}>No vacant tables available</Text>
                                        ) : (
                                            <ScrollView
                                                style={{ maxHeight: 250, width: '100%' }}
                                                nestedScrollEnabled={true}
                                                showsVerticalScrollIndicator={true}
                                                persistentScrollbar={true}
                                            >
                                                {availableTables.map((item) => (
                                                    <Pressable
                                                        key={item.id || item.tableNo}
                                                        style={styles.dropdownRow}
                                                        onPress={() => handleSelectTable(item)}
                                                    >
                                                        <Text style={styles.dropdownItemName}>
                                                            {item.tableNo}
                                                        </Text>
                                                        <Text style={styles.dropdownItemStatus}>
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

                        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.confirmText}>Confirm Transfer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '92%', maxWidth: 500, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', paddingHorizontal: 16, paddingVertical: 14 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
    closeBtn: { padding: 4 },
    body: { padding: 20 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    field: { flex: 1 },
    label: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 6, letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 12, height: 44, gap: 10 },
    inputText: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
    arrowContainer: { paddingTop: 20 },
    confirmBtn: { backgroundColor: '#0097a7', paddingVertical: 14, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 20 },
    confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    dropdown: {
        position: 'absolute',
        top: 44,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
        zIndex: 10,
        paddingVertical: 4,
        minHeight: 50,
    },
    dropdownEmpty: {
        padding: 12,
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
    },
    dropdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderColor: '#f5f5f5',
    },
    dropdownItemName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    dropdownItemStatus: {
        fontSize: 12,
        color: '#16A34A',
        fontWeight: '600',
    },
});