// components/popup/GuestDetailPopup.jsx
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
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
    const { selectedRestaurant } = useAuth();

    const [mobile, setMobile] = useState('');
    const [name, setName] = useState('');
    const [guestCode, setGuestCode] = useState('');
    const [dob, setDob] = useState('');
    const [doa, setDoa] = useState('');
    const [pax, setPax] = useState('1');
    const [isFetching, setIsFetching] = useState(false);

    const hotelCode = selectedRestaurant?.hotelcd || '';

    const resetForm = () => {
        setMobile('');
        setName('');
        setGuestCode('');
        setDob('');
        setDoa('');
        setPax('1');
        setIsFetching(false);
    }

    useEffect(() => {
        if (!visible) resetForm();
    }, [visible]);

    useEffect(() => {
        resetForm();
    }, [table?.tableCode])

    // Auto-fetch guest as soon as 10 digits are entered
    const handleMobileChange = async (text) => {
        setMobile(text);
        setGuestCode('');

        if (text.length === 10) {
            setIsFetching(true);
            try {
                const result = await getGuestDetails(text, '', '', '', hotelCode);
                if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                    const guest = result.data[0];
                    setName(guest.name || guest.guestnm || '');
                    setDob(guest.dob || '');
                    setDoa(guest.doa || '');
                    setGuestCode(guest.guestcd || guest.guestCode || '');
                } else {
                    setName('');
                    setDob('');
                    setDoa('');
                    setGuestCode('');
                }
            } catch (error) {
                console.error('Error fetching guest:', error);
            } finally {
                setIsFetching(false);
            }
        } else {
            setName('');
            setDob('');
            setDoa('');
            setGuestCode('');
        }
    };

    // GuestDetailPopup.jsx
    const handleProceed = async () => {
        if (!mobile || !name) {
            Alert.alert('Error', 'Please enter Mobile No. and Guest Name');
            return;
        }

        const result = await getGuestDetails(mobile, name, dob, doa, hotelCode);

        if (result.success) {
            let guestCode = '';
            let guestData = null;

            if (Array.isArray(result.data) && result.data.length > 0) {
                guestData = result.data[0];
                guestCode = guestData.guestcd || guestData.guestCode || '';
            }

            onProceed({
                mobile,
                name,
                dob,
                doa,
                pax: Number(pax) || 1,
                guestCode,
                guestData
            });
        } else {
            Alert.alert('Error', 'Failed to register/fetch guest.');
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

                        {/* Mobile No. */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>MOBILE NO.</Text>
                            <View style={styles.inputContainer}>
                                <Phone size={18} color="#888888" strokeWidth={2} />
                                <TextInput
                                    placeholder="10-digit mobile number"
                                    style={styles.input}
                                    value={mobile}
                                    onChangeText={handleMobileChange}
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#999"
                                    maxLength={10}
                                    editable={!isFetching}
                                />
                                {isFetching && (
                                    <ActivityIndicator size="small" color="#d32f2f" style={{ marginLeft: 8 }} />
                                )}
                            </View>
                        </View>

                        {/* Guest Name */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>GUEST NAME</Text>
                            <View style={styles.inputContainer}>
                                <User size={18} color="#888888" strokeWidth={2} />
                                <TextInput
                                    placeholder="Enter full name"
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholderTextColor="#999"
                                    editable={!isFetching}
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
                                    value={pax}
                                    onChangeText={setPax}
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
                                        value={dob}
                                        onChangeText={setDob}
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
                                        value={doa}
                                        onChangeText={setDoa}
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
                        <Pressable style={styles.proceedButton} onPress={handleProceed} disabled={isFetching}>
                            <Text style={styles.proceedButtonText}>
                                {isFetching ? 'Fetching...' : 'Proceed to KOT →'}
                            </Text>
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