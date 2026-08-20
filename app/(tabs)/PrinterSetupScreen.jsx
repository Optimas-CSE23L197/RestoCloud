// screens/cashier/PrinterSetupScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
    Modal,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import {
    Printer,
    ChefHat,
    Wine,
    Receipt,
    Bluetooth,
    Wifi,
    Check,
    ChevronRight,
    X,
    RefreshCw,
    Trash2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────
// Storage keys — local, per-device (backend sync: future work)
// ─────────────────────────────────────────────────────────
const STORAGE_KEY = 'printer_config_v1';

const ROLES = [
    {
        key: 'kitchen',
        label: 'Kitchen',
        sublabel: 'Food KOT prints here',
        icon: ChefHat,
        accent: '#2c7a4b',
        accentBg: '#e9f6ef',
    },
    {
        key: 'bar',
        label: 'Bar Counter',
        sublabel: 'Liquor / non-food KOT prints here',
        icon: Wine,
        accent: '#9c4dcc',
        accentBg: '#f5ecfc',
    },
    {
        key: 'cashier',
        label: 'Cashier',
        sublabel: 'All bills print here (food, liquor, or both)',
        icon: Receipt,
        accent: '#c77c1f',
        accentBg: '#fbf2e6',
    },
];

// TODO(core-logic): replace with real Bluetooth + WiFi discovery
// (react-native-thermal-printer / esc-pos-printer / custom native module — TBD)
// This stub exists only so the screen is interactive before printer
// library integration is approved.
async function discoverPrintersStub() {
    await new Promise((res) => setTimeout(res, 900));
    return [
        { id: 'bt-001', name: 'EPSON TM-T82 (Kitchen)', type: 'bluetooth' },
        { id: 'bt-002', name: 'Xprinter XP-58 (Bar)', type: 'bluetooth' },
        { id: 'wifi-001', name: 'EPSON TM-T88VI', type: 'wifi', ip: '192.168.1.42' },
        { id: 'wifi-002', name: 'Rongta RP-58', type: 'wifi', ip: '192.168.1.58' },
    ];
}

export default function PrinterSetupScreen() {
    const [config, setConfig] = useState({ kitchen: null, bar: null, cashier: null });
    const [loading, setLoading] = useState(true);
    const [pickerRole, setPickerRole] = useState(null); // which role is being assigned
    const [scanning, setScanning] = useState(false);
    const [discovered, setDiscovered] = useState([]);

    // ── Load saved config on mount ──
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) setConfig(JSON.parse(raw));
            } catch (error) {
                console.error('[PrinterSetupScreen] Load error:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const persistConfig = useCallback(async (next) => {
        setConfig(next);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
            console.error('[PrinterSetupScreen] Save error:', error);
            Alert.alert('Error', 'Could not save printer setting. Please try again.');
        }
    }, []);

    const openPickerFor = async (roleKey) => {
        setPickerRole(roleKey);
        setScanning(true);
        setDiscovered([]);
        try {
            const results = await discoverPrintersStub();
            setDiscovered(results);
        } catch (error) {
            console.error('[PrinterSetupScreen] Discovery error:', error);
            Alert.alert('Error', 'Could not scan for printers.');
        } finally {
            setScanning(false);
        }
    };

    const assignPrinter = (printer) => {
        const next = { ...config, [pickerRole]: printer };
        persistConfig(next);
        setPickerRole(null);
    };

    const clearAssignment = (roleKey) => {
        Alert.alert('Remove printer', 'Unassign this printer from its role?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => persistConfig({ ...config, [roleKey]: null }),
            },
        ]);
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-[#f5f6f8]">
                <ActivityIndicator size="large" color="#2c3e50" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#f5f6f8]">
            {/* Header */}
            <View className="bg-[#2c3e50] px-5 pt-5 pb-6">
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-white/15 items-center justify-center">
                        <Printer size={20} color="#FFFFFF" strokeWidth={2.2} />
                    </View>
                    <View>
                        <Text className="text-[18px] font-bold text-white leading-6">Printer Setup</Text>
                        <Text className="text-[12.5px] text-white/70 font-medium mt-0.5">
                            Assign printers for kitchen, bar & billing
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Info strip */}
                <View className="flex-row items-start gap-2.5 bg-[#eef4fb] border border-[#d7e4f2] rounded-xl px-3.5 py-3 mb-4">
                    <View className="w-5 h-5 rounded-full bg-[#2c3e50] items-center justify-center mt-0.5">
                        <Text className="text-white text-[11px] font-bold">i</Text>
                    </View>
                    <Text className="flex-1 text-[12.5px] text-[#3d5266] leading-[18px] font-medium">
                        Food KOTs route to Kitchen, bar/liquor KOTs route to Bar, and all bills print at
                        Cashier. If a role has no printer assigned, you'll be asked to pick one at print time.
                    </Text>
                </View>

                {/* Role cards */}
                <View className="gap-3">
                    {ROLES.map((role) => {
                        const Icon = role.icon;
                        const assigned = config[role.key];
                        return (
                            <View
                                key={role.key}
                                className="bg-white rounded-2xl border border-[#e5e8ec] overflow-hidden"
                            >
                                <View className="flex-row items-center px-4 py-4 gap-3">
                                    <View
                                        className="w-11 h-11 rounded-xl items-center justify-center"
                                        style={{ backgroundColor: role.accentBg }}
                                    >
                                        <Icon size={21} color={role.accent} strokeWidth={2.2} />
                                    </View>

                                    <View className="flex-1">
                                        <Text className="text-[15px] font-bold text-[#232830] leading-5">
                                            {role.label}
                                        </Text>
                                        <Text className="text-[12px] text-[#8a8f98] font-medium leading-4 mt-0.5">
                                            {role.sublabel}
                                        </Text>
                                    </View>
                                </View>

                                <View className="h-[1px] bg-[#eef0f2] mx-4" />

                                {assigned ? (
                                    <View className="flex-row items-center px-4 py-3.5 gap-3">
                                        <View className="w-8 h-8 rounded-lg bg-[#e9f6ef] items-center justify-center">
                                            {assigned.type === 'bluetooth' ? (
                                                <Bluetooth size={15} color="#2c7a4b" strokeWidth={2.3} />
                                            ) : (
                                                <Wifi size={15} color="#2c7a4b" strokeWidth={2.3} />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text
                                                className="text-[13.5px] font-semibold text-[#2b2f36]"
                                                numberOfLines={1}
                                            >
                                                {assigned.name}
                                            </Text>
                                            <Text className="text-[11.5px] text-[#9199a3] font-medium mt-0.5">
                                                {assigned.type === 'bluetooth'
                                                    ? 'Bluetooth'
                                                    : `WiFi • ${assigned.ip}`}
                                            </Text>
                                        </View>
                                        <Pressable
                                            onPress={() => openPickerFor(role.key)}
                                            hitSlop={8}
                                            className="px-3 py-1.5 rounded-lg bg-[#eef2f6] active:bg-[#e3e8ee]"
                                        >
                                            <Text className="text-[12px] font-bold text-[#2c3e50]">Change</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => clearAssignment(role.key)}
                                            hitSlop={8}
                                            className="w-8 h-8 items-center justify-center rounded-full active:bg-[#fdecea]"
                                        >
                                            <Trash2 size={16} color="#e74c3c" strokeWidth={2.2} />
                                        </Pressable>
                                    </View>
                                ) : (
                                    <Pressable
                                        onPress={() => openPickerFor(role.key)}
                                        className="flex-row items-center justify-between px-4 py-3.5 active:bg-[#fafbfc]"
                                    >
                                        <Text className="text-[13.5px] font-semibold text-[#9199a3]">
                                            Not assigned
                                        </Text>
                                        <View className="flex-row items-center gap-1">
                                            <Text className="text-[13px] font-bold text-[#2c3e50]">
                                                Assign printer
                                            </Text>
                                            <ChevronRight size={16} color="#2c3e50" strokeWidth={2.3} />
                                        </View>
                                    </Pressable>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* ── Printer picker modal ── */}
            <Modal
                visible={!!pickerRole}
                transparent
                animationType="slide"
                onRequestClose={() => setPickerRole(null)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-3xl overflow-hidden" style={{ maxHeight: '75%' }}>
                        {/* Header */}
                        <View className="flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-[#eef0f2]">
                            <View>
                                <Text className="text-[16px] font-bold text-[#232830]">
                                    Select printer
                                </Text>
                                <Text className="text-[12px] text-[#9199a3] font-medium mt-0.5">
                                    {ROLES.find((r) => r.key === pickerRole)?.label}
                                </Text>
                            </View>
                            <Pressable
                                onPress={() => setPickerRole(null)}
                                hitSlop={10}
                                className="w-8 h-8 items-center justify-center rounded-full bg-[#f2f3f5]"
                            >
                                <X size={18} color="#2c3e50" strokeWidth={2.4} />
                            </Pressable>
                        </View>

                        {/* Rescan bar */}
                        <Pressable
                            onPress={() => openPickerFor(pickerRole)}
                            disabled={scanning}
                            className="flex-row items-center justify-center gap-2 py-3 border-b border-[#eef0f2] active:bg-[#fafbfc]"
                        >
                            {scanning ? (
                                <ActivityIndicator size="small" color="#2c3e50" />
                            ) : (
                                <RefreshCw size={14} color="#2c3e50" strokeWidth={2.3} />
                            )}
                            <Text className="text-[13px] font-bold text-[#2c3e50]">
                                {scanning ? 'Scanning…' : 'Scan again'}
                            </Text>
                        </Pressable>

                        {/* Discovered list */}
                        <FlatList
                            data={discovered}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingVertical: 6 }}
                            ItemSeparatorComponent={() => <View className="h-[1px] bg-[#f0f1f3] ml-16" />}
                            ListEmptyComponent={
                                !scanning && (
                                    <View className="items-center justify-center py-10 gap-2">
                                        <Printer size={30} color="#c9ccd1" strokeWidth={1.5} />
                                        <Text className="text-[13px] text-[#9199a3] font-medium">
                                            No printers found nearby
                                        </Text>
                                    </View>
                                )
                            }
                            renderItem={({ item }) => {
                                const isSelected = config[pickerRole]?.id === item.id;
                                return (
                                    <Pressable
                                        onPress={() => assignPrinter(item)}
                                        className="flex-row items-center px-5 py-3.5 gap-3 active:bg-[#fafbfc]"
                                    >
                                        <View className="w-9 h-9 rounded-lg bg-[#eef2f6] items-center justify-center">
                                            {item.type === 'bluetooth' ? (
                                                <Bluetooth size={16} color="#2c3e50" strokeWidth={2.2} />
                                            ) : (
                                                <Wifi size={16} color="#2c3e50" strokeWidth={2.2} />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[14px] font-semibold text-[#2b2f36]">
                                                {item.name}
                                            </Text>
                                            <Text className="text-[11.5px] text-[#9199a3] font-medium mt-0.5">
                                                {item.type === 'bluetooth' ? 'Bluetooth' : `WiFi • ${item.ip}`}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <View className="w-6 h-6 rounded-full bg-[#2c7a4b] items-center justify-center">
                                                <Check size={14} color="#FFFFFF" strokeWidth={3} />
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}