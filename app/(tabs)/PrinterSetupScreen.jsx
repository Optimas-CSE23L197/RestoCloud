// components/printer/PrinterSetupScreen.jsx
//
// Full flow: pick Bluetooth or WiFi -> discover/enter device ->
// assign role + paper width -> save to PrinterStorage -> test print.

import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Wifi, Bluetooth, Printer, RefreshCw, ChevronLeft, Settings } from 'lucide-react-native';
import { router } from 'expo-router';

import { createPrinterConfig } from '../../printer/core/PrinterConfig';
import { PRINTER_TYPE, PRINTER_ROLE } from '../../printer/core/PrinterTypes';
import PrinterStorage from '../../printer/storage/PrinterStorage';
import PrinterManager from '../../printer/core/PrinterManager';
import { scanWifiPrinters, verifyWifiPrinter } from '../../printer/discovery/WifiDiscovery';
import { discoverAllPrinters } from '../../printer/discovery/BluetoothDiscovery';

const ROLE_OPTIONS = [
    { value: PRINTER_ROLE.KITCHEN, label: 'Kitchen' },
    { value: PRINTER_ROLE.BAR, label: 'Bar' },
    { value: PRINTER_ROLE.CASHIER, label: 'Cashier' },
];

const PAPER_WIDTH_OPTIONS = [58, 80];

// Same red used across DashboardHeader — keep every screen in this flow consistent
const HEADER_COLOR = '#d32f2f';

export default function PrinterSetupScreen({ onDone }) {
    const insets = useSafeAreaInsets();

    // step: 'type' -> 'discover' -> 'assign'
    const [step, setStep] = useState('type');
    const [type, setType] = useState(null); // PRINTER_TYPE.WIFI | BLUETOOTH

    // WiFi state
    const [wifiScanning, setWifiScanning] = useState(false);
    const [wifiProgress, setWifiProgress] = useState({ scanned: 0, total: 0 });
    const [wifiResults, setWifiResults] = useState([]);
    const [manualIp, setManualIp] = useState('');
    const [manualPort, setManualPort] = useState('9100');
    const [manualChecking, setManualChecking] = useState(false);

    // Bluetooth state
    const [btScanning, setBtScanning] = useState(false);
    const [btPaired, setBtPaired] = useState([]);
    const [btNearby, setBtNearby] = useState([]);

    // Selected device (before role assignment)
    const [selectedDevice, setSelectedDevice] = useState(null); // { ip/address, port? }

    // Assignment step
    const [role, setRole] = useState(PRINTER_ROLE.KITCHEN);
    const [paperWidth, setPaperWidth] = useState(80);
    const [printerName, setPrinterName] = useState('');
    const [saving, setSaving] = useState(false);

    // ---------- Back handling per step ----------
    const handleBack = () => {
        if (step === 'assign') {
            // Go back to the discover step for whichever type was picked
            setStep('discover');
            return;
        }
        if (step === 'discover') {
            // Go back to the type-choice step, reset scan state
            setStep('type');
            setType(null);
            setWifiResults([]);
            setBtPaired([]);
            setBtNearby([]);
            return;
        }
        // On the very first step, back leaves the screen entirely
        router.back();
    };

    // ---------- WiFi flow ----------
    const runWifiScan = async () => {
        setWifiScanning(true);
        setWifiResults([]);
        setWifiProgress({ scanned: 0, total: 0 });
        try {
            const results = await scanWifiPrinters({
                onProgress: (scanned, total) => setWifiProgress({ scanned, total }),
            });
            setWifiResults(results);
            if (results.length === 0) {
                Alert.alert('No printers found', 'Auto-scan found nothing on this network. You can enter the IP manually below.');
            }
        } catch (error) {
            Alert.alert('Scan failed', error.message || 'Could not scan the network. Enter the printer IP manually.');
        } finally {
            setWifiScanning(false);
        }
    };

    const checkManualIp = async () => {
        if (!manualIp.trim()) {
            Alert.alert('IP required', 'Enter the printer\'s IP address.');
            return;
        }
        setManualChecking(true);
        try {
            const port = parseInt(manualPort, 10) || 9100;
            const result = await verifyWifiPrinter(manualIp.trim(), port);
            if (result.reachable) {
                setSelectedDevice({ ip: result.ip, port: result.port });
                setPrinterName(`Printer (${result.ip})`);
                setStep('assign');
            } else {
                Alert.alert('Not reachable', `Could not connect to ${manualIp}:${port}. Check the IP and that the printer is on the same network.`);
            }
        } catch (error) {
            Alert.alert('Check failed', error.message || 'Could not verify this IP.');
        } finally {
            setManualChecking(false);
        }
    };

    // ---------- Bluetooth flow ----------
    const runBtDiscovery = async () => {
        setBtScanning(true);
        setBtPaired([]);
        setBtNearby([]);
        try {
            await discoverAllPrinters({
                onPaired: setBtPaired,
                onNearby: setBtNearby,
            });
        } catch (error) {
            Alert.alert('Bluetooth error', error.message || 'Could not scan for Bluetooth devices.');
        } finally {
            setBtScanning(false);
        }
    };

    // ---------- Shared: proceed to role assignment ----------
    const selectWifiDevice = (device) => {
        setSelectedDevice(device);
        setPrinterName(`Printer (${device.ip})`);
        setStep('assign');
    };

    const selectBtDevice = (device) => {
        setSelectedDevice(device);
        setPrinterName(device.name);
        setStep('assign');
    };

    // ---------- Save ----------
    const handleSave = async () => {
        if (!printerName.trim()) {
            Alert.alert('Name required', 'Give this printer a name.');
            return;
        }

        setSaving(true);
        try {
            const config = createPrinterConfig({
                id: type === PRINTER_TYPE.WIFI ? `wifi-${selectedDevice.ip}` : `bt-${selectedDevice.address}`,
                name: printerName.trim(),
                type,
                role,
                ip: type === PRINTER_TYPE.WIFI ? selectedDevice.ip : null,
                port: type === PRINTER_TYPE.WIFI ? selectedDevice.port : 9100,
                address: type === PRINTER_TYPE.BLUETOOTH ? selectedDevice.address : null,
                paperWidth,
            });

            await PrinterStorage.saveRole(role, config);

            // Offer a test print right away so the user knows it actually works
            Alert.alert(
                'Printer saved',
                `${printerName} is set as the ${role} printer. Send a test print?`,
                [
                    { text: 'Skip', style: 'cancel', onPress: () => onDone?.(config) },
                    {
                        text: 'Test Print',
                        onPress: async () => {
                            try {
                                await PrinterManager.testPrinter(config);
                            } catch (error) {
                                Alert.alert('Test print failed', error.message || 'Could not print. Check the connection.');
                            } finally {
                                onDone?.(config);
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            Alert.alert('Save failed', error.message || 'Could not save this printer.');
        } finally {
            setSaving(false);
        }
    };

    // ---------- Shared header (back icon + title, matches DashboardHeader color) ----------
    // Using insets.top directly instead of <SafeAreaView> here — SafeAreaView's
    // top inset was intermittently collapsing to 0 during the rapid re-renders
    // that happen while scanning, letting the status bar overlap the header.
    const ScreenHeader = ({ title, subtitle }) => (
        <View style={{ backgroundColor: HEADER_COLOR, paddingTop: insets.top }}>
            <View className="flex-row items-center px-3 pt-2.5 pb-3.5">
                <Pressable
                    onPress={handleBack}
                    hitSlop={10}
                    className="w-9 h-9 items-center justify-center bg-white/10 rounded-full border border-white/30 active:opacity-80 mr-2.5"
                >
                    <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
                <View className="flex-1">
                    <Text className="text-white text-[17px] font-extrabold tracking-tight">
                        {title}
                    </Text>
                    {!!subtitle && (
                        <Text numberOfLines={1} className="text-white/80 text-[11.5px] font-medium mt-0.5">
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );

    // ---------- Render: Step 1 — choose type ----------
    if (step === 'type') {
        return (
            <View className="flex-1 bg-white">
                <StatusBar style="light" backgroundColor="#d32f2f" translucent={false} />
                <ScreenHeader title="Add a Printer" subtitle="Choose how this printer connects" />

                <View className="px-5 pt-6">
                    <Pressable
                        onPress={() => { setType(PRINTER_TYPE.WIFI); setStep('discover'); runWifiScan(); }}
                        className="flex-row items-center gap-3 p-4 rounded-xl border border-[#e5e5e5] mb-3"
                    >
                        <View className="w-10 h-10 rounded-lg bg-[#e9f1ff] items-center justify-center">
                            <Wifi size={18} color="#2563eb" strokeWidth={2.3} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[14.5px] font-bold text-[#1c2530]">WiFi Printer</Text>
                            <Text className="text-[12px] text-[#888] mt-0.5">Same network, IP-based</Text>
                        </View>
                    </Pressable>

                    <Pressable
                        onPress={() => { setType(PRINTER_TYPE.BLUETOOTH); setStep('discover'); runBtDiscovery(); }}
                        className="flex-row items-center gap-3 p-4 rounded-xl border border-[#e5e5e5]"
                    >
                        <View className="w-10 h-10 rounded-lg bg-[#eef5ff] items-center justify-center">
                            <Bluetooth size={18} color="#2563eb" strokeWidth={2.3} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[14.5px] font-bold text-[#1c2530]">Bluetooth Printer</Text>
                            <Text className="text-[12px] text-[#888] mt-0.5">Paired or nearby device</Text>
                        </View>
                    </Pressable>

                    <Pressable
                        onPress={() => router.push('/(tabs)/ManagePrintersScreen')}
                        className="flex-row items-center gap-3 p-4 rounded-xl border border-[#e5e5e5] mt-3"
                    >
                        <View className="w-10 h-10 rounded-lg bg-[#f2f2f2] items-center justify-center">
                            <Settings size={18} color="#1c2530" strokeWidth={2.3} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[14.5px] font-bold text-[#1c2530]">Manage Printers</Text>
                            <Text className="text-[12px] text-[#888] mt-0.5">View, edit, or remove saved printers</Text>
                        </View>
                    </Pressable>
                </View>
            </View>
        );
    }

    // ---------- Render: Step 2 — discover / pick device ----------
    if (step === 'discover' && type === PRINTER_TYPE.WIFI) {
        return (
            <View className="flex-1 bg-white">
                <StatusBar style="light" backgroundColor="#d32f2f" translucent={false} />
                <ScreenHeader title="WiFi Printer" />

                <View className="flex-1 px-5 pt-5">
                    <Pressable onPress={runWifiScan} disabled={wifiScanning} className="flex-row items-center gap-2 mb-4">
                        <RefreshCw size={14} color="#2563eb" />
                        <Text className="text-[13px] font-semibold text-[#2563eb]">
                            {wifiScanning ? `Scanning... ${wifiProgress.scanned}/${wifiProgress.total}` : 'Rescan network'}
                        </Text>
                    </Pressable>

                    {wifiScanning && <ActivityIndicator size="small" color="#2563eb" style={{ marginBottom: 12 }} />}

                    {/* Wrapped in its own flexible container so the list scrolls
                        independently and never pushes the manual-IP section below
                        off screen, however many results come back. */}
                    <View style={{ flex: 1 }}>
                        <FlatList
                            data={wifiResults}
                            keyExtractor={(item) => item.ip}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => selectWifiDevice(item)}
                                    className="flex-row items-center gap-3 p-3 rounded-xl border border-[#e5e5e5] mb-2"
                                >
                                    <Printer size={16} color="#1c2530" />
                                    <Text className="text-[13.5px] font-semibold text-[#1c2530]">{item.ip}:{item.port}</Text>
                                </Pressable>
                            )}
                            ListEmptyComponent={!wifiScanning ? (
                                <Text className="text-[13px] text-[#999] mb-4">No printers found yet. Try rescanning or enter the IP manually.</Text>
                            ) : null}
                            showsVerticalScrollIndicator={true}
                        />
                    </View>

                    <View className="mt-2 pt-4 pb-6 border-t border-[#eee]">
                        <Text className="text-[13px] font-bold text-[#1c2530] mb-2">Enter IP manually</Text>
                        <View className="flex-row gap-2 mb-2">
                            <TextInput
                                value={manualIp}
                                onChangeText={setManualIp}
                                placeholder="192.168.1.50"
                                keyboardType="numeric"
                                className="flex-1 border border-[#e5e5e5] rounded-lg px-3 py-2.5 text-[13.5px]"
                            />
                            <TextInput
                                value={manualPort}
                                onChangeText={setManualPort}
                                placeholder="9100"
                                keyboardType="numeric"
                                className="w-20 border border-[#e5e5e5] rounded-lg px-3 py-2.5 text-[13.5px]"
                            />
                        </View>
                        <Pressable
                            onPress={checkManualIp}
                            disabled={manualChecking}
                            className="py-3 rounded-lg bg-[#1c2530] items-center"
                        >
                            {manualChecking ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-white text-[13.5px] font-bold">Connect</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }

    if (step === 'discover' && type === PRINTER_TYPE.BLUETOOTH) {
        const combined = [
            ...btPaired.map((d) => ({ ...d, section: 'Paired' })),
            ...btNearby.map((d) => ({ ...d, section: 'Nearby' })),
        ];

        return (
            <View className="flex-1 bg-white">
                <StatusBar style="light" backgroundColor="#d32f2f" translucent={false} />
                <ScreenHeader title="Bluetooth Printer" />

                <View className="flex-1 px-5 pt-5">
                    <Pressable onPress={runBtDiscovery} disabled={btScanning} className="flex-row items-center gap-2 mb-4">
                        <RefreshCw size={14} color="#2563eb" />
                        <Text className="text-[13px] font-semibold text-[#2563eb]">
                            {btScanning ? 'Scanning...' : 'Rescan'}
                        </Text>
                    </Pressable>

                    {btScanning && <ActivityIndicator size="small" color="#2563eb" style={{ marginBottom: 12 }} />}

                    <FlatList
                        data={combined}
                        keyExtractor={(item) => item.address}
                        contentContainerStyle={{ paddingBottom: 24 }}
                        showsVerticalScrollIndicator={true}
                        renderItem={({ item, index }) => {
                            const showHeader = index === 0 || combined[index - 1].section !== item.section;
                            return (
                                <View>
                                    {showHeader && (
                                        <Text className="text-[11px] font-bold text-[#999] uppercase mt-3 mb-1.5">{item.section}</Text>
                                    )}
                                    <Pressable
                                        onPress={() => selectBtDevice(item)}
                                        className="flex-row items-center gap-3 p-3 rounded-xl border border-[#e5e5e5] mb-2"
                                    >
                                        <Printer size={16} color="#1c2530" />
                                        <View className="flex-1">
                                            <Text className="text-[13.5px] font-semibold text-[#1c2530]">{item.name}</Text>
                                            <Text className="text-[11px] text-[#999]">{item.address}</Text>
                                        </View>
                                    </Pressable>
                                </View>
                            );
                        }}
                        ListEmptyComponent={!btScanning ? (
                            <Text className="text-[13px] text-[#999] mt-4">No devices found. Make sure the printer is powered on and discoverable.</Text>
                        ) : null}
                    />
                </View>
            </View>
        );
    }

    // ---------- Render: Step 3 — assign role + paper width ----------
    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" backgroundColor="#d32f2f" translucent={false} />
            <ScreenHeader
                title="Printer Details"
                subtitle={type === PRINTER_TYPE.WIFI ? `${selectedDevice?.ip}:${selectedDevice?.port}` : selectedDevice?.address}
            />

            <View className="flex-1 px-5 pt-6">
                <Text className="text-[13px] font-bold text-[#1c2530] mb-2">Name</Text>
                <TextInput
                    value={printerName}
                    onChangeText={setPrinterName}
                    className="border border-[#e5e5e5] rounded-lg px-3 py-2.5 text-[13.5px] mb-5"
                />

                <Text className="text-[13px] font-bold text-[#1c2530] mb-2">Assign to</Text>
                <View className="flex-row gap-2 mb-5">
                    {ROLE_OPTIONS.map((opt) => (
                        <Pressable
                            key={opt.value}
                            onPress={() => setRole(opt.value)}
                            className="flex-1 py-2.5 rounded-lg items-center"
                            style={{ backgroundColor: role === opt.value ? HEADER_COLOR : '#f2f2f2' }}
                        >
                            <Text style={{ color: role === opt.value ? '#fff' : '#333', fontWeight: '700', fontSize: 13 }}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <Text className="text-[13px] font-bold text-[#1c2530] mb-2">Paper width</Text>
                <View className="flex-row gap-2 mb-6">
                    {PAPER_WIDTH_OPTIONS.map((w) => (
                        <Pressable
                            key={w}
                            onPress={() => setPaperWidth(w)}
                            className="flex-1 py-2.5 rounded-lg items-center"
                            style={{ backgroundColor: paperWidth === w ? HEADER_COLOR : '#f2f2f2' }}
                        >
                            <Text style={{ color: paperWidth === w ? '#fff' : '#333', fontWeight: '700', fontSize: 13 }}>
                                {w}mm {w === 80 ? '(3")' : '(2")'}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <Pressable
                    onPress={handleSave}
                    disabled={saving}
                    className="py-3.5 rounded-xl items-center"
                    style={{ backgroundColor: HEADER_COLOR }}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text className="text-white text-[14px] font-bold">Save Printer</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}