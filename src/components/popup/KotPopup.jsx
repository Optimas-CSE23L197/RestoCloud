// components/popup/KotPopup.jsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import {
    FileText,
    X,
    User,
    Table,
    Search,
    Plus,
    ChevronDown,
    ArrowLeftRight,
    Eye,
    Receipt,
    Save
} from 'lucide-react-native';

// Import the 3 new popups
import TableTransferPopup from './TableTransferPopup';
import CurrentItemsPopup from './CurrentItemsPopup';
import GenerateBillPopup from './GenerateBillPopup';

export default function KotPopup({ visible, onClose, table, onProceed, menuItems = [], posCd, tables = [] }) {
    const [quantity, setQuantity] = useState('1');
    const [instructions, setInstructions] = useState('');
    const [items, setItems] = useState([]);

    // Search + dropdown state for "Select Food Item"
    const [searchText, setSearchText] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState(null);

    // States for 3 new popups
    const [showTransferPopup, setShowTransferPopup] = useState(false);
    const [showCurrentItemsPopup, setShowCurrentItemsPopup] = useState(false);
    const [showBillPopup, setShowBillPopup] = useState(false);

    const filteredMenuItems = menuItems.filter((m) =>
        (m.menuname || '')
            .toLowerCase()
            .includes(searchText.toLowerCase())
    );

    // Some items (liquor) have rate = "0.00" and use peg/bottle rates instead
    const getDisplayRate = (menuItem) => {
        const rate = parseFloat(menuItem.rate) || 0;
        if (rate > 0) return rate;
        const smallPeg = parseFloat(menuItem.smallpegrt) || 0;
        if (smallPeg > 0) return smallPeg;
        const bottle = parseFloat(menuItem.bottrate) || 0;
        if (bottle > 0) return bottle;
        return 0;
    };

    const handlePickMenuItem = (menuItem) => {
        setSelectedMenuItem(menuItem);
        setSearchText(menuItem.menuname || '');
        setShowDropdown(false);
    };

    const handleAddItem = () => {
        if (!selectedMenuItem) return;

        const qty = parseInt(quantity) || 1;
        const price = getDisplayRate(selectedMenuItem);

        const newItem = {
            id: Date.now(),
            menucode: selectedMenuItem.menucode,
            name: selectedMenuItem.menuname,
            price,
            qty,
            total: price * qty,
            baryn: selectedMenuItem.beeryn === 'Y' ? 'Y' : 'N',
            pegdtl: '',
            infoforkot: '',
        };
        setItems([...items, newItem]);

        // reset selection
        setSelectedMenuItem(null);
        setSearchText('');
        setQuantity('1');
    };

    const handleProceed = () => {
        if (!items || items.length === 0) {
            Alert.alert('Error', 'Please add at least one item before saving.');
            return;
        }

        const kotData = {
            items: items.map((item) => ({
                menucode: item.menucode,
                qty: item.qty,
                price: item.price,
                baryn: item.baryn || 'N',
                pegdtl: item.pegdtl || '',
                infoforkot: item.infoforkot || '',
            })),
            pax: parseInt(quantity) || 1,
            tableCode: table?.tableCode || '',
            waiterCode: '0000000001',
            guestCode: '',
            posCd: posCd,
        };

        onProceed(kotData);
    };

    const renderItemRow = (item) => (
        <View style={styles.tableRow} key={item.id}>
            <Text style={[styles.cell, styles.colItem]}>{item.name}</Text>
            <Text style={[styles.cell, styles.colPrice]}>{item.price}</Text>
            <Text style={[styles.cell, styles.colQty]}>{item.qty}</Text>
            <Text style={[styles.cell, styles.colTotal]}>₹{item.total}</Text>
            <Pressable
                style={[styles.cell, styles.colAction]}
                onPress={() => setItems(items.filter(i => i.id !== item.id))}
            >
                <X size={16} color="#e74c3c" strokeWidth={2.5} />
            </Pressable>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>

                    {/* 1. Dark Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <FileText size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.headerTitle}>Create New KOT / Order</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* 2. Body */}
                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                        {/* Selected Table */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>SELECTED TABLE</Text>
                            <View style={styles.inputContainer}>
                                <Table size={16} color="#888888" strokeWidth={2} />
                                <Text style={styles.inputText}>{table?.tableNo || 'T-01'}</Text>
                            </View>
                        </View>

                        {/* Assigned Captain */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>ASSIGNED CAPTAIN</Text>
                            <View style={styles.inputContainer}>
                                <User size={16} color="#888888" strokeWidth={2} />
                                <Text style={styles.inputText}>Captain1</Text>
                            </View>
                        </View>

                        {/* Select Food Item — now a working search + dropdown */}
                        <View style={[styles.fieldGroup, { zIndex: 20 }]}>
                            <Text style={styles.label}>SELECT FOOD ITEM</Text>
                            <Pressable
                                style={styles.inputContainer}
                                onPress={() => setShowDropdown((prev) => !prev)}
                            >
                                <Search size={16} color="#888888" strokeWidth={2} />
                                <TextInput
                                    placeholder="Search & select item..."
                                    style={styles.input}
                                    placeholderTextColor="#999"
                                    value={searchText}
                                    onFocus={() => setShowDropdown(true)}
                                    onChangeText={(text) => {
                                        setSearchText(text);
                                        setSelectedMenuItem(null);
                                        setShowDropdown(true);
                                    }}
                                />
                                <ChevronDown size={16} color="#888888" strokeWidth={2} />
                            </Pressable>

                            {showDropdown && (
                                <View style={styles.dropdown}>
                                    {menuItems.length === 0 ? (
                                        <Text style={styles.dropdownEmpty}>Loading menu...</Text>
                                    ) : filteredMenuItems.length === 0 ? (
                                        <Text style={styles.dropdownEmpty}>No matching items</Text>
                                    ) : (
                                        <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                                            {filteredMenuItems.map((menuItem, idx) => (
                                                <Pressable
                                                    key={menuItem.menucode ?? idx}
                                                    style={styles.dropdownRow}
                                                    onPress={() => handlePickMenuItem(menuItem)}
                                                >
                                                    <Text style={styles.dropdownItemName}>
                                                        {menuItem.menuname}
                                                    </Text>
                                                    <Text style={styles.dropdownItemPrice}>
                                                        ₹{getDisplayRate(menuItem)}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Quantity */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>QUANTITY</Text>
                            <View style={styles.inputContainer}>
                                <Text style={styles.qtyIcon}>#</Text>
                                <TextInput
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    style={styles.input}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Add Item Button */}
                        <Pressable
                            style={[styles.addItemBtn, !selectedMenuItem && styles.addItemBtnDisabled]}
                            onPress={handleAddItem}
                            disabled={!selectedMenuItem}
                        >
                            <Plus size={18} color="#FFFFFF" strokeWidth={3} />
                            <Text style={styles.addItemText}>Add Item</Text>
                        </Pressable>

                        {/* Items Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerCell, styles.colItem]}>ITEM NAME</Text>
                            <Text style={[styles.headerCell, styles.colPrice]}>PRICE (₹)</Text>
                            <Text style={[styles.headerCell, styles.colQty]}>QTY</Text>
                            <Text style={[styles.headerCell, styles.colTotal]}>TOTAL (₹)</Text>
                            <Text style={[styles.headerCell, styles.colAction]}>ACTION</Text>
                        </View>

                        {/* Items List */}
                        <View style={styles.tableBody}>
                            {items.length > 0 ? items.map(renderItemRow) : <Text style={styles.emptyText}>No items added yet</Text>}
                        </View>

                        {/* Special Instructions */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>SPECIAL INSTRUCTIONS / COOKING NOTES</Text>
                            <TextInput
                                value={instructions}
                                onChangeText={setInstructions}
                                placeholder="e.g. Less spicy, make naan extra crispy..."
                                style={styles.textArea}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </ScrollView>

                    {/* 3. Footer Action Buttons */}
                    <View style={styles.footer}>
                        <View style={styles.footerRow}>
                            {/* TRANSFER BUTTON - UPDATED */}
                            <Pressable style={[styles.actionBtn, styles.transferBtn]} onPress={() => setShowTransferPopup(true)}>
                                <ArrowLeftRight size={14} color="#3498db" strokeWidth={2.5} />
                                <Text style={styles.transferText}>Transfer</Text>
                            </Pressable>

                            <Pressable style={[styles.actionBtn, styles.currentBtn]} onPress={() => setShowCurrentItemsPopup(true)}>
                                <Eye size={14} color="#3498db" strokeWidth={2.5} />
                                <Text style={styles.currentText}>Current Items</Text>
                            </Pressable>
                        </View>
                        <View style={styles.footerRow}>
                            <Pressable style={[styles.actionBtn, styles.billBtn]} onPress={() => setShowBillPopup(true)}>
                                <Receipt size={14} color="#FFFFFF" strokeWidth={2.5} />
                                <Text style={styles.billText}>Make Bill</Text>
                            </Pressable>
                            <Pressable style={[styles.actionBtn, styles.saveBtn]} onPress={handleProceed}>
                                <Save size={14} color="#FFFFFF" strokeWidth={2.5} />
                                <Text style={styles.saveText}>Save & Print KOT</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>

            {/* ========================================== */}
            {/* Add 3 new popups here                         */}
            {/* ========================================== */}
            <TableTransferPopup
                visible={showTransferPopup}
                onClose={() => setShowTransferPopup(false)}
                currentTable={table?.tableNo}
                tables={tables}
            />
            <CurrentItemsPopup
                visible={showCurrentItemsPopup}
                onClose={() => setShowCurrentItemsPopup(false)}
                table={table}
                items={items}
            />
            <GenerateBillPopup
                visible={showBillPopup}
                onClose={() => setShowBillPopup(false)}
                table={table}
                items={items}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        width: '92%',
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        maxHeight: '90%'
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2c3e50',
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff'
    },
    closeBtn: {
        padding: 4
    },

    // Body
    body: {
        padding: 16,
        maxHeight: 400
    },
    fieldGroup: {
        marginBottom: 12
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#555',
        marginBottom: 6,
        letterSpacing: 0.5
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        paddingHorizontal: 12,
        height: 44,
        gap: 10
    },
    inputText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        fontWeight: '500'
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#333'
    },
    qtyIcon: {
        fontSize: 16,
        color: '#888',
        fontWeight: '600',
    },

    // Dropdown for food item search
    dropdown: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
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
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderColor: '#f5f5f5',
    },
    dropdownItemName: {
        fontSize: 13,
        color: '#333',
        flex: 1,
    },
    dropdownItemPrice: {
        fontSize: 13,
        color: '#2c3e50',
        fontWeight: '600',
    },

    // Add Item Button
    addItemBtn: {
        backgroundColor: '#2c3e50',
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16
    },
    addItemBtnDisabled: {
        backgroundColor: '#a5adb5',
    },
    addItemText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600'
    },

    // Table
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    headerCell: {
        fontSize: 11,
        fontWeight: '700',
        color: '#555',
        textAlign: 'center'
    },
    tableBody: {
        marginBottom: 12,
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#f5f5f5',
        alignItems: 'center'
    },
    cell: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center'
    },
    colItem: { flex: 2.5, textAlign: 'left', paddingLeft: 4 },
    colPrice: { flex: 1 },
    colQty: { flex: 0.8 },
    colTotal: { flex: 1.2 },
    colAction: { flex: 0.8 },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        padding: 20,
        fontSize: 14
    },

    // TextArea
    textArea: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 12,
        fontSize: 14,
        color: '#333',
        minHeight: 60,
        backgroundColor: '#fff'
    },

    // Footer
    footer: {
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fafafa',
        flexDirection: 'column',
        gap: 8
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        flexDirection: 'row',
        gap: 6,
    },

    // Button variants
    transferBtn: {
        backgroundColor: '#fff',
        borderColor: '#3498db'
    },
    transferText: {
        color: '#3498db',
        fontWeight: '600',
        fontSize: 13
    },
    currentBtn: {
        backgroundColor: '#fff',
        borderColor: '#3498db'
    },
    currentText: {
        color: '#3498db',
        fontWeight: '600',
        fontSize: 13
    },
    billBtn: {
        backgroundColor: '#27ae60',
        borderColor: '#27ae60'
    },
    billText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13
    },
    saveBtn: {
        backgroundColor: '#2c3e50',
        borderColor: '#2c3e50'
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13
    },
});