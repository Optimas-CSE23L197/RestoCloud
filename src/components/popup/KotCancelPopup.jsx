// components/popup/KotCancelPopup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ban, X, MessageSquareWarning } from 'lucide-react-native';
import { cancelKOT } from '../../../api/system.api';

const MIN_REASON_LENGTH = 10;

export default function KotCancelPopup({ visible, onClose, kot, table, waiterCode, onCancelled }) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inFlightRef = useRef(false);

    useEffect(() => {
        if (visible) {
            setReason('');
            setIsSubmitting(false);
            inFlightRef.current = false;
        }
    }, [visible]);

    const trimmedReason = reason.trim();
    const isValid = trimmedReason.length >= MIN_REASON_LENGTH;

    const handleClose = () => {
        if (isSubmitting) return;
        setReason('');
        onClose();
    };

    const handleConfirm = async () => {
        console.log('[KotCancelPopup] Confirm clicked for KOT:', kot);

        if (!isValid) {
            Alert.alert('Reason too short', 'Please provide a proper cancellation reason.');
            return;
        }
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setIsSubmitting(true);

        try {
            const kotCode = kot?.kotno || kot?.code || kot?.kotcd || '';
            console.log('[KotCancelPopup] Calling cancelKOT with:', {
                kotcd: kotCode,
                tblcd: table?.tableCode,
                cancreason: trimmedReason,
                waitercd: waiterCode,
            });

            const result = await cancelKOT({
                kotcd: kotCode,
                tblcd: table?.tableCode || '',
                cancreason: trimmedReason,
                waitercd: waiterCode || '',
            });

            console.log('[KotCancelPopup] cancelKOT result:', result);

            if (result?.success) {
                Alert.alert('Success', 'KOT cancelled successfully.');
                if (onCancelled) onCancelled(kot);
                onClose();
            } else {
                Alert.alert('Error', result?.error || 'Failed to cancel KOT.');
            }
        } catch (error) {
            console.error('[KotCancelPopup] cancel error:', error);
            Alert.alert('Error', 'Something went wrong while cancelling the KOT.');
        } finally {
            inFlightRef.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View className="flex-1 bg-black/60 justify-center items-center px-6">
                <View className="w-full max-w-[380px] bg-white rounded-2xl p-5">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center gap-2">
                            <View className="w-9 h-9 rounded-xl bg-[#FDEDEC] items-center justify-center">
                                <Ban size={17} color="#D0392B" strokeWidth={2.4} />
                            </View>
                            <View>
                                <Text className="text-[17px] font-bold text-[#1c2530] leading-5">Cancel KOT</Text>
                                <Text className="text-[11.5px] font-semibold text-[#9AA3AF] mt-0.5">
                                    {kot?.kotno || kot?.code || 'KOT'}
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={handleClose} className="p-1" disabled={isSubmitting}>
                            <X size={20} color="#888" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    <Text className="text-[13px] text-[#555] mb-3 leading-5">
                        Please enter the reason for cancelling this KOT:
                    </Text>

                    <TextInput
                        placeholder="e.g. Wrong order, guest changed mind, etc."
                        className="border border-[#ddd] rounded-xl px-4 py-3.5 text-[14px] text-[#333] bg-[#fafafa]"
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        placeholderTextColor="#999"
                        editable={!isSubmitting}
                    />

                    <View className="flex-row justify-end mt-1.5">
                        <Text
                            className="text-[10.5px] font-semibold"
                            style={{ color: isValid ? '#1f8a4c' : '#b5871c' }}
                        >
                            {trimmedReason.length}/{MIN_REASON_LENGTH} min characters
                        </Text>
                    </View>

                    {trimmedReason.length > 0 && (
                        <View
                            className="flex-row items-start gap-2 mt-2 px-3 py-2.5 rounded-xl bg-[#fff4f4]"
                            style={{ borderWidth: 1, borderColor: '#f3caca' }}
                        >
                            <MessageSquareWarning size={14} color="#d32f2f" strokeWidth={2.3} style={{ marginTop: 1 }} />
                            <Text className="flex-1 text-[11.5px] text-[#a02222] font-medium leading-4">
                                Will cancel with reason: "{trimmedReason}"
                            </Text>
                        </View>
                    )}

                    <View className="flex-row gap-3 mt-5">
                        <Pressable
                            onPress={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 py-3.5 rounded-xl bg-[#f0f0f0] items-center justify-center"
                        >
                            <Text className="text-[14px] font-bold text-[#555]">Back</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleConfirm}
                            disabled={isSubmitting || !isValid}
                            className="flex-1 py-3.5 rounded-xl bg-[#d32f2f] items-center justify-center flex-row gap-2"
                            style={{ opacity: !isValid ? 0.6 : 1 }}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ban size={16} color="#FFFFFF" strokeWidth={2.5} />
                                    <Text className="text-white text-[14px] font-bold">Confirm Cancel</Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}