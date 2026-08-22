// Shows the printer currently assigned to each role (Kitchen, Bar,
// Cashier) and lets the user remove one — clearing it from
// AsyncStorage via PrinterStorage.removeRole. Pull down to refresh
// after coming back from PrinterSetupScreen.

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import { Wifi, Bluetooth, Printer, ChevronLeft, Trash2, Plus } from 'lucide-react-native';
import { router } from 'expo-router';

import { PRINTER_TYPE, PRINTER_ROLE } from '../../printer/core/PrinterTypes';
import PrinterStorage from '../../printer/storage/PrinterStorage';

const HEADER_COLOR = '#d32f2f';

const ROLE_META = {
    [PRINTER_ROLE.KITCHEN]: { label: 'Kitchen' },
    [PRINTER_ROLE.BAR]: { label: 'Bar' },
    [PRINTER_ROLE.CASHIER]: { label: 'Cashier' },
};

const ROLE_ORDER = [PRINTER_ROLE.KITCHEN, PRINTER_ROLE.BAR, PRINTER_ROLE.CASHIER];

export default function ManagePrintersScreen() {
    const insets = useSafeAreaInsets();
    const [printers, setPrinters] = useState({ kitchen: null, bar: null, cashier: null });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deletingRole, setDeletingRole] = useState(null);

    const loadPrinters = useCallback(async () => {
        try {
            const all = await PrinterStorage.getAll();
            setPrinters(all);
        } catch (error) {
            Alert.alert('Load failed', error.message || 'Could not load saved printers.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Reload every time this screen comes into focus — picks up
    // anything just saved from PrinterSetupScreen.
    useFocusEffect(
        useCallback(() => {
            loadPrinters();
        }, [loadPrinters])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadPrinters();
    };

    const confirmDelete = (role) => {
        const printer = printers[role];
        if (!printer) return;

        Alert.alert(
            'Remove printer',
            `Remove "${printer.name}" from ${ROLE_META[role].label}? This can't be undone — you'll need to set it up again.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => handleDelete(role),
                },
            ]
        );
    };

    const handleDelete = async (role) => {
        setDeletingRole(role);
        try {
            await PrinterStorage.removeRole(role);
            setPrinters((prev) => ({ ...prev, [role]: null }));
        } catch (error) {
            Alert.alert('Remove failed', error.message || 'Could not remove this printer.');
        } finally {
            setDeletingRole(null);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" backgroundColor={HEADER_COLOR} translucent={false} />

            <View style={{ backgroundColor: HEADER_COLOR, paddingTop: insets.top }}>
                <View className="flex-row items-center px-3 pt-2.5 pb-3.5">
                    <Pressable
                        onPress={() => router.back()}
                        hitSlop={10}
                        className="w-9 h-9 items-center justify-center bg-white/10 rounded-full border border-white/30 active:opacity-80 mr-2.5"
                    >
                        <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
                    </Pressable>
                    <View className="flex-1">
                        <Text className="text-white text-[17px] font-extrabold tracking-tight">
                            Manage Printers
                        </Text>
                        <Text className="text-white/80 text-[11.5px] font-medium mt-0.5">
                            One printer per role
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[HEADER_COLOR]} tintColor={HEADER_COLOR} />
                }
            >
                {ROLE_ORDER.map((role) => {
                    const printer = printers[role];
                    const isDeleting = deletingRole === role;

                    return (
                        <View
                            key={role}
                            className="border border-[#e5e5e5] rounded-xl p-4 mb-3"
                        >
                            <Text className="text-[11px] font-bold text-[#999] uppercase mb-2">
                                {ROLE_META[role].label}
                            </Text>

                            {printer ? (
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-lg bg-[#f2f2f2] items-center justify-center mr-3">
                                        {printer.type === PRINTER_TYPE.WIFI ? (
                                            <Wifi size={18} color="#2563eb" strokeWidth={2.3} />
                                        ) : (
                                            <Bluetooth size={18} color="#2563eb" strokeWidth={2.3} />
                                        )}
                                    </View>

                                    <View className="flex-1">
                                        <Text className="text-[14.5px] font-bold text-[#1c2530]">
                                            {printer.name}
                                        </Text>
                                        <Text className="text-[12px] text-[#888] mt-0.5">
                                            {printer.type === PRINTER_TYPE.WIFI
                                                ? `${printer.ip}:${printer.port}`
                                                : printer.address}
                                            {'  •  '}{printer.paperWidth}mm
                                        </Text>
                                    </View>

                                    <Pressable
                                        onPress={() => confirmDelete(role)}
                                        disabled={isDeleting}
                                        hitSlop={10}
                                        className="w-9 h-9 items-center justify-center rounded-full bg-red-50 active:opacity-70 ml-2"
                                    >
                                        <Trash2 size={16} color="#dc2626" strokeWidth={2.2} />
                                    </Pressable>
                                </View>
                            ) : (
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-10 h-10 rounded-lg bg-[#f2f2f2] items-center justify-center mr-3">
                                            <Printer size={18} color="#999" strokeWidth={2} />
                                        </View>
                                        <Text className="text-[13px] text-[#999] flex-1">
                                            No printer assigned
                                        </Text>
                                    </View>

                                    <Pressable
                                        onPress={() => router.push('/(tabs)/PrinterSetupScreen')}
                                        className="flex-row items-center bg-[#f2f2f2] px-3 py-1.5 rounded-full active:opacity-70"
                                    >
                                        <Plus size={13} color="#1c2530" strokeWidth={2.5} />
                                        <Text className="text-[12px] font-semibold text-[#1c2530] ml-1">Add</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    );
                })}

                {!loading && !printers.kitchen && !printers.bar && !printers.cashier && (
                    <Text className="text-[13px] text-[#999] text-center mt-4">
                        No printers set up yet. Tap "Add" on any role above to get started.
                    </Text>
                )}
            </ScrollView>
        </View>
    );
}