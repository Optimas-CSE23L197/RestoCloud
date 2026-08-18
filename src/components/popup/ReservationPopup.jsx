// popup/ReservationPopup.jsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { FileText, X, ChevronDown, Calendar, Clock, Check } from 'lucide-react-native';
import { createReservation } from '../../../api/system.api';
import { useAuth } from '../../../src/context/AuthContext';

export default function ReservationPopup({ visible, onClose, onSave, tables = [] }) {
    const [guestName, setGuestName] = useState('');
    const [phone, setPhone] = useState('');

    // Dropdown States
    const [selectedTable, setSelectedTable] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const [pax, setPax] = useState('2');
    const [date, setDate] = useState('18-08-2026');
    const [time, setTime] = useState('09:35');

    const { selectedRestaurant } = useAuth();
    const hotelCode = selectedRestaurant?.hotelcd || '';

    // Filter only Vacant tables
    const availableTables = tables;

    const handleSelectTable = (table) => {
        setSelectedTable(table);
        setShowDropdown(false);
    };

    const handleSave = async () => {
        if (!guestName || !phone || !selectedTable) {
            Alert.alert('Error', 'Please fill all fields and select a table');
            return;
        }

        const reservationData = {
            guestName,
            phone,
            selectedTable: selectedTable.tableNo,
            pax,
            date,
            time,
            hotelCode,
        };

        const result = await createReservation(reservationData);
        if (result.success) {
            Alert.alert('Success', 'Reservation created successfully!');
            onSave?.();
            onClose();
        } else {
            Alert.alert('Error', result.error || 'Failed to create reservation');
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>

                    {/* 1. Dark Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <FileText size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.headerTitle}>Table Reservation</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                            <X size={24} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* 2. Body */}
                    <ScrollView
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                        showsVerticalScrollIndicator={false}
                    >

                        {/* Guest Name */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>GUEST NAME</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    placeholder="e.g. John Doe"
                                    style={styles.input}
                                    value={guestName}
                                    onChangeText={setGuestName}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        {/* Phone Number */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>PHONE NUMBER</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    placeholder="+91 9876543210"
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        {/* SELECT TABLE - Dropdown */}
                        <View style={[styles.fieldGroup, { zIndex: 20 }]}>
                            <Text style={styles.label}>SELECT TABLE</Text>
                            <Pressable
                                style={styles.inputContainer}
                                onPress={() => setShowDropdown(!showDropdown)}
                            >
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
                                        <ScrollView style={{ maxHeight: 170 }} nestedScrollEnabled={true}>
                                            {availableTables.map((item) => (
                                                <Pressable
                                                    key={item.id}
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

                        {/* Pax (Guests) */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>PAX (GUESTS)</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    placeholder="2"
                                    style={styles.input}
                                    value={pax}
                                    onChangeText={setPax}
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        {/* Date + Time side by side */}
                        <View style={styles.rowGroup}>
                            <View style={[styles.fieldGroup, styles.halfField]}>
                                <Text style={styles.label}>DATE</Text>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputText}>{date}</Text>
                                    <Calendar size={16} color="#888888" strokeWidth={2} />
                                </View>
                            </View>

                            <View style={[styles.fieldGroup, styles.halfField]}>
                                <Text style={styles.label}>TIME</Text>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputText}>{time}</Text>
                                    <Clock size={16} color="#888888" strokeWidth={2} />
                                </View>
                            </View>
                        </View>

                    </ScrollView>

                    {/* 3. Footer Button */}
                    <View style={styles.footer}>
                        <Pressable style={styles.saveBtn} onPress={handleSave}>
                            <Check size={18} color="#FFFFFF" strokeWidth={3} />
                            <Text style={styles.saveText}>Save Reservation</Text>
                        </Pressable>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '92%',
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2c3e50',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeBtn: {
        padding: 4,
    },

    // Body
    body: {
        maxHeight: 460,
    },
    bodyContent: {
        padding: 20,
        paddingBottom: 24,
    },
    fieldGroup: {
        marginBottom: 18,
    },
    rowGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    halfField: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#555',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        height: 46,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    inputText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },

    // Dropdown styles
    dropdown: {
        position: 'absolute',
        top: 46,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
        zIndex: 10,
        paddingVertical: 4,
    },
    dropdownEmpty: {
        padding: 14,
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
    },
    dropdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
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

    // Footer
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fafafa',
    },
    saveBtn: {
        backgroundColor: '#2c3e50',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});