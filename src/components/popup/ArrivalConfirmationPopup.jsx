// popup/ArrivalConfirmationPopup.js
import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Shield, X, Check, XCircle } from 'lucide-react-native';

export default function ArrivalConfirmationPopup({ visible, onClose, table, onGuestArrived }) {
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
                            <Shield size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.headerTitle}>Table {table?.tableNo}</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <X size={22} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* 2. Body */}
                    <View style={styles.body}>
                        <Text style={styles.question}>
                            Has the guest arrived for this table?
                        </Text>

                        {/* Yes Button (Green) */}
                        <Pressable
                            style={styles.yesButton}
                            onPress={() => {
                                onGuestArrived?.();
                                onClose();
                            }}
                        >
                            <Check size={18} color="#FFFFFF" strokeWidth={3} />
                            <Text style={styles.yesText}>Yes, Guest Arrived</Text>
                        </Pressable>

                        {/* No Button (White) */}
                        <Pressable style={styles.noButton} onPress={onClose}>
                            <XCircle size={18} color="#555555" strokeWidth={2} />
                            <Text style={styles.noText}>No, Still Waiting</Text>
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
    },
    modalContainer: {
        width: '85%',
        maxWidth: 380,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2c3e50', // Dark Grey
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 6,
    },
    closeBtn: {
        padding: 4,
    },

    // Body
    body: {
        padding: 20,
        alignItems: 'center',
    },
    question: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },

    // Buttons
    yesButton: {
        backgroundColor: '#27ae60', // Green
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 10,
        flexDirection: 'row',
        gap: 8,
    },
    yesText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    noButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flexDirection: 'row',
        gap: 8,
    },
    noText: {
        color: '#555',
        fontSize: 15,
        fontWeight: '600',
    },
});