// popup/GuestDetailPopup.jsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import {
    Armchair,
    X,
    User,
    Phone,
    Users,
    Gift
} from 'lucide-react-native';
import { getGuestDetails } from '../../../api/system.api';
import { useAuth } from '../../../src/context/AuthContext';

export default function GuestDetailPopup({ visible, table, onClose, onProceed }) {
    const { hotelCode } = useAuth();
    const [mobile, setMobile] = useState('');
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [doa, setDoa] = useState('');

    const handleFetchGuest = async () => {
        const result = await getGuestDetails(mobile, name, dob, doa, hotelCode);
        if (result.success) {
            console.log('Guest Found:', result.data);
            // Proceed to KOT
        } else {
            Alert.alert('Error', 'Guest not found');
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
                <View style={styles.container}>

                    {/* 1. Red Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Armchair size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.headerTitle}>
                                Guest Details ({table?.tableNo || 'New'})
                            </Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeIconBtn}>
                            <X size={22} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* 2. Form Body */}
                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

                        {/* Guest Name */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>GUEST NAME</Text>
                            <View style={styles.inputContainer}>
                                <User size={18} color="#888888" strokeWidth={2} />
                                <TextInput
                                    placeholder="Enter full name"
                                    style={styles.input}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        {/* Mobile No. */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>MOBILE NO.</Text>
                            <View style={styles.inputContainer}>
                                <Phone size={18} color="#888888" strokeWidth={2} />
                                <TextInput
                                    placeholder="10-digit mobile number"
                                    style={styles.input}
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        {/* No. of Pax */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>NO. OF PAX *</Text>
                            <View style={styles.inputContainer}>
                                <Users size={18} color="#888888" strokeWidth={2} />
                                <TextInput
                                    placeholder="1"
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        {/* DOB & DOA Row */}
                        <View style={styles.rowContainer}>
                            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>DOB (DD/MM)</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        placeholder="DD/MM"
                                        style={styles.input}
                                        placeholderTextColor="#999"
                                    />
                                </View>
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>DOA (DD/MM)</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        placeholder="DD/MM"
                                        style={styles.input}
                                        placeholderTextColor="#999"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Info Box */}
                        <View style={styles.infoBox}>
                            <Gift size={20} color="#00bcd4" strokeWidth={2} />
                            <Text style={styles.infoText}>
                                We will send Greetings and Offers on Special Days.
                            </Text>
                        </View>

                    </ScrollView>

                    {/* 3. Footer Button */}
                    <View style={styles.footer}>
                        <Pressable style={styles.proceedButton} onPress={onProceed}>
                            <Text style={styles.proceedButtonText}>Proceed to KOT →</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#d32f2f',
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff'
    },
    closeIconBtn: {
        padding: 4
    },

    // Body
    body: {
        padding: 16,
        maxHeight: 400
    },
    fieldGroup: {
        marginBottom: 14
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#444',
        marginBottom: 6,
        letterSpacing: 0.5
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 44,
        gap: 10
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#333'
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    // Info Box
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#00bcd4',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f0fcff',
        marginTop: 4,
        gap: 10
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#555',
        lineHeight: 16
    },

    // Footer
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    proceedButton: {
        backgroundColor: '#d32f2f',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center'
    },
    proceedButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
});