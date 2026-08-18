// components/popup/CurrentItemsPopup.jsx
import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { ShoppingBag, X, Trash2, Table, User } from 'lucide-react-native';

export default function CurrentItemsPopup({ visible, onClose, table, items = [] }) {
    const renderItem = ({ item }) => (
        <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
            </View>
            <Text style={styles.itemQty}>{item.qty}</Text>
            <Text style={styles.itemAmount}>₹{item.total}</Text>
            <Pressable style={styles.deleteBtn}>
                <Trash2 size={16} color="#e74c3c" strokeWidth={2.5} />
            </Pressable>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.headerTitle}>Current Order Items</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    <View style={styles.body}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoBadge}>
                                <Table size={14} color="#FFFFFF" strokeWidth={2} />
                                <Text style={styles.infoBadgeText}>Table {table?.tableNo || 'T-01'}</Text>
                            </View>
                            <View style={styles.infoBadge}>
                                <User size={14} color="#FFFFFF" strokeWidth={2} />
                                <Text style={styles.infoBadgeText}>Captain1</Text>
                            </View>
                        </View>

                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerCell, styles.colItem]}>ITEM</Text>
                            <Text style={[styles.headerCell, styles.colQty]}>QTY</Text>
                            <Text style={[styles.headerCell, styles.colAmount]}>AMOUNT</Text>
                            <Text style={[styles.headerCell, styles.colAction]}>ACTION</Text>
                        </View>

                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItem}
                            style={{ maxHeight: 300 }}
                            ListEmptyComponent={<Text style={styles.emptyText}>No items in this order</Text>}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '92%', maxWidth: 500, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', paddingHorizontal: 16, paddingVertical: 14 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
    closeBtn: { padding: 4 },
    body: { padding: 16 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 10 },
    infoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3498db', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, gap: 6 },
    infoBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerCell: { fontSize: 12, fontWeight: '700', color: '#555' },
    colItem: { flex: 2 },
    colQty: { flex: 0.8, textAlign: 'center' },
    colAmount: { flex: 1.2, textAlign: 'right' },
    colAction: { flex: 0.8, textAlign: 'center' },
    itemRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', alignItems: 'center' },
    itemInfo: { flex: 2 },
    itemName: { fontSize: 14, color: '#333', fontWeight: '500' },
    itemNotes: { fontSize: 11, color: '#888', marginTop: 2 },
    itemQty: { flex: 0.8, textAlign: 'center', fontSize: 14, color: '#333' },
    itemAmount: { flex: 1.2, textAlign: 'right', fontSize: 14, color: '#333', fontWeight: '500' },
    deleteBtn: { flex: 0.8, alignItems: 'center' },
    emptyText: { textAlign: 'center', color: '#999', padding: 20, fontSize: 14 },
});