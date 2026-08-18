// SimplePopupModal.js
import React from 'react';
import { Modal as RNModal, View, Text, Pressable, StyleSheet } from 'react-native';

export default function SimplePopupModal({ visible, onClose, children, title }) {
    return (
        <RNModal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header with title and close button */}
                    <View style={styles.header}>
                        {title && <Text style={styles.title}>{title}</Text>}
                        <Pressable style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>×</Text>
                        </Pressable>
                    </View>

                    {/* Content */}
                    <View style={styles.modalContent}>
                        {children}
                    </View>
                </View>
            </View>
        </RNModal>
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
        width: '88%',
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        position: 'relative',
        minHeight: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    modalContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    closeButton: {
        padding: 4,
        marginLeft: 12,
    },
    closeText: {
        fontSize: 28,
        color: '#999',
        fontWeight: '300',
        lineHeight: 28,
    },
});