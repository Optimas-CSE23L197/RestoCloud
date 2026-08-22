// components/popup/BillPrintPopup.jsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Printer, X, FileText } from 'lucide-react-native';
import { getBillPrintDetails } from '../../../api/system.api';
import { useAuth } from '../../../src/context/AuthContext';
import { buildFoodBillText, buildLiquorBillText } from '../../../printer/templates/BillTemplate';
import PrinterManager from '../../../printer/core/PrinterManager';

// ---------- Reusable Thermal Preview Component ----------
function ThermalBillPreview({ isFood, data, billNo, receiptText, isLoading }) {
    if (!data && !isLoading) return null;

    const label = isFood ? 'Tax-Invoice' : 'Invoice';

    return (
        <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[13px] font-bold text-[#2c3e50]">{label}</Text>
                <Text className="text-[10px] text-[#888]">{billNo || '-'}</Text>
            </View>

            {isLoading ? (
                <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#2c3e50" />
                </View>
            ) : (
                <View
                    style={{
                        width: '100%',
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E5E5E5',
                        borderStyle: 'dashed',
                        padding: 10,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                            fontSize: 10,
                            lineHeight: 14,
                            color: '#000000',
                        }}
                    >
                        {receiptText}
                    </Text>
                </View>
            )}
        </View>
    );
}

export default function BillPrintPopup({
    visible,
    onClose,
    table,
    posCd,
    foodBillCd,
    barBillCd,
}) {
    const [foodData, setFoodData] = useState(null);
    const [barData, setBarData] = useState(null);
    const [isFoodLoading, setIsFoodLoading] = useState(false);
    const [isBarLoading, setIsBarLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [cashierPaperWidth, setCashierPaperWidth] = useState(80);

    const { selectedRestaurant } = useAuth();
    const restaurantName = selectedRestaurant?.Restaurantnm || 'Restaurant';
    const restaurantAddress = selectedRestaurant?.address || 'Kolkata';
    const gstin = selectedRestaurant?.gst_in || '';
    const phone = selectedRestaurant?.phone || '9798755665';
    const email = selectedRestaurant?.email || '';

    const meta = { restaurantName, restaurantAddress, gstin, phone, email };

    const fetchFoodBill = async () => {
        if (!foodBillCd) return null;
        setIsFoodLoading(true);
        try {
            const result = await getBillPrintDetails(posCd, foodBillCd);
            if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
                return { ...result.data[0], items: result.data };
            }
            console.warn('[BillPrintPopup] Food data empty or malformed:', result);
            return null;
        } catch (error) {
            console.error('[BillPrintPopup] Food bill fetch error:', error);
            return null;
        } finally {
            setIsFoodLoading(false);
        }
    };

    const fetchBarBill = async () => {
        if (!barBillCd) return null;
        setIsBarLoading(true);
        try {
            const result = await getBillPrintDetails(posCd, barBillCd);
            if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
                return { ...result.data[0], items: result.data };
            }
            console.warn('[BillPrintPopup] Bar data empty or malformed:', result);
            return null;
        } catch (error) {
            console.error('[BillPrintPopup] Bar bill fetch error:', error);
            return null;
        } finally {
            setIsBarLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            const loadData = async () => {
                const [food, bar, printer] = await Promise.all([
                    fetchFoodBill(),
                    fetchBarBill(),
                    PrinterManager.getPrinterForRole('cashier'),
                ]);
                setFoodData(food);
                setBarData(bar);
                setCashierPaperWidth(printer?.paperWidth || 80); // no printer set yet -> default 80mm
            };
            loadData();
        } else {
            setFoodData(null);
            setBarData(null);
        }
    }, [visible, foodBillCd, barBillCd]);

    const foodNetAmt = parseFloat(foodData?.dramt || 0).toFixed(2);
    const barNetAmt = parseFloat(barData?.bdramt || 0).toFixed(2);

    const foodReceiptText = foodData
        ? buildFoodBillText(foodData, meta, cashierPaperWidth)
        : '';
    const barReceiptText = barData
        ? buildLiquorBillText(barData, meta, foodNetAmt, barNetAmt, cashierPaperWidth)
        : '';

    const handlePrint = async () => {
        if (isPrinting) return;

        setIsPrinting(true);
        const errors = [];

        try {
            if (foodData) {
                try {
                    await PrinterManager.printText('cashier', foodReceiptText);
                } catch (error) {
                    console.error('[BillPrintPopup] Food print error:', error);
                    errors.push(error);
                }
            }

            if (barData) {
                try {
                    await PrinterManager.printText('cashier', barReceiptText);
                } catch (error) {
                    console.error('[BillPrintPopup] Bar print error:', error);
                    errors.push(error);
                }
            }

            if (errors.length > 0) {
                const isConfigError = errors.some((e) =>
                    e.message?.includes('No printer configured')
                );

                if (isConfigError) {
                    Alert.alert(
                        'Printer Not Set',
                        'Cashier printer is not configured. Please set it up in Printer Settings before printing.',
                    );
                } else {
                    Alert.alert(
                        'Print Failed',
                        errors[0].message || 'Could not send bill to printer.',
                    );
                }
            }
        } finally {
            setIsPrinting(false);
        }
    };

    const printButtonLabel = isPrinting
        ? 'Printing...'
        : foodData && barData
            ? 'Print Both Bills'
            : foodData
                ? 'Print Food Bill'
                : 'Print Liquor Bill';

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/60 justify-center items-center px-6">
                <View className="w-full max-w-[400px] bg-white rounded-2xl overflow-hidden" style={{ maxHeight: '88%' }}>
                    <View className="flex-row justify-between items-center bg-[#1c2530] px-5 py-4">
                        <View className="flex-row items-center gap-2.5">
                            <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                                <Printer size={16} color="#FFFFFF" strokeWidth={2.4} />
                            </View>
                            <View>
                                <Text className="text-[16px] font-bold text-white leading-5">Print Bill</Text>
                                <Text className="text-[11.5px] font-semibold text-white/60 mt-0.5">
                                    Table {table?.tableNo || '-'}
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10} className="p-1">
                            <X size={20} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={{ maxHeight: 460 }}
                        contentContainerStyle={{ padding: 16 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {!foodData && !barData && !isFoodLoading && !isBarLoading && (
                            <View className="items-center py-8 gap-2">
                                <FileText size={24} color="#c9ccd1" strokeWidth={1.6} />
                                <Text className="text-[13px] text-[#999] font-medium text-center">
                                    No bill data available
                                </Text>
                            </View>
                        )}

                        {foodData && (
                            <ThermalBillPreview
                                isFood={true}
                                data={foodData}
                                billNo={foodData?.fbillno || foodData?.billno}
                                receiptText={foodReceiptText}
                                isLoading={isFoodLoading}
                            />
                        )}

                        {barData && (
                            <ThermalBillPreview
                                isFood={false}
                                data={barData}
                                billNo={barData?.bbillno || barData?.billno}
                                receiptText={barReceiptText}
                                isLoading={isBarLoading}
                            />
                        )}
                    </ScrollView>

                    {(foodData || barData) && (
                        <View className="px-5 pt-3 pb-5 border-t border-[#eee] bg-white">
                            <Pressable
                                onPress={handlePrint}
                                disabled={isPrinting || isFoodLoading || isBarLoading}
                                className="w-full flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-[#1c2530]"
                                style={{ opacity: isPrinting || isFoodLoading || isBarLoading ? 0.6 : 1 }}
                            >
                                {isPrinting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Printer size={16} color="#FFFFFF" strokeWidth={2.5} />
                                        <Text className="text-white text-[14px] font-bold">{printButtonLabel}</Text>
                                    </>
                                )}
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}