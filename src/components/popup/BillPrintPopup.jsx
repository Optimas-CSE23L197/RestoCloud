// components/popup/BillPrintPopup.jsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Printer, X, FileText } from 'lucide-react-native';
import { getBillPrintDetails } from '../../../api/system.api';
import { useAuth } from '../../../src/context/AuthContext';

// 3-inch Thermal Paper = ~32 chars per line
const PAPER_CHAR_WIDTH = 32;

// ---------- Utility functions ----------
function padLine(left, right, width = PAPER_CHAR_WIDTH) {
    const cleanLeft = String(left || '').trim();
    let cleanRight = String(right || '').trim();
    if (cleanRight.length > width - 1) {
        cleanRight = cleanRight.substring(0, width - 4) + '...';
    }
    const space = Math.max(width - cleanLeft.length - cleanRight.length, 1);
    return cleanLeft + ' '.repeat(space) + cleanRight;
}

function centerLine(text, width = PAPER_CHAR_WIDTH) {
    text = String(text || '').trim();
    if (text.length === 0) return '';
    const pad = Math.max(Math.floor((width - text.length) / 2), 0);
    return ' '.repeat(pad) + text;
}

function divider(width = PAPER_CHAR_WIDTH, char = '-') {
    return char.repeat(width);
}

function parseDate(dateStr) {
    if (!dateStr) return new Date().toLocaleString();
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

// Strip HTML tags from backend terms
function stripHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

// ---------- Amount in Words (Indian numbering) ----------
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitWords(n) {
    if (n < 20) return ONES[n];
    return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}

function threeDigitWords(n) {
    let str = '';
    if (n >= 100) {
        str += ONES[Math.floor(n / 100)] + ' Hundred';
        n %= 100;
        if (n) str += ' ';
    }
    if (n) str += twoDigitWords(n);
    return str;
}

function numberToWords(num) {
    num = Math.round(num);
    if (num === 0) return 'Zero';
    let str = '';
    const crore = Math.floor(num / 10000000); num %= 10000000;
    const lakh = Math.floor(num / 100000); num %= 100000;
    const thousand = Math.floor(num / 1000); num %= 1000;
    const hundred = num;
    if (crore) str += threeDigitWords(crore) + ' Crore ';
    if (lakh) str += threeDigitWords(lakh) + ' Lakh ';
    if (thousand) str += threeDigitWords(thousand) + ' Thousand ';
    if (hundred) str += threeDigitWords(hundred);
    return str.trim();
}

function rupeesInWords(amount) {
    const rupees = Math.round(parseFloat(amount || 0));
    return `Rupees : ${numberToWords(rupees)} Only`;
}

// ---------- Build Food Bill (Tax-Invoice) ----------
function buildFoodBillText(data, restaurantName, restaurantAddress, gstin, phone, email) {
    if (!data) return 'No data available';
    const lines = [];
    lines.push(centerLine(restaurantName || 'RESTAURANT'));
    lines.push(centerLine(restaurantAddress || ''));
    lines.push(`GST No. : ${gstin || ''}`);
    lines.push(`FSSAI No. : ${data?.fssaino || '0'}`);
    lines.push(padLine(`📞 : ${phone || ''}`, phone || ''));
    lines.push(centerLine(`@ : ${email || ''}`));
    lines.push(centerLine('Tax-Invoice'));
    lines.push(centerLine(`Table. : ${data?.tableno || '-'}`));
    lines.push(divider());

    // ✅ FIX: Bill No. aur Date alag-alag lines me
    lines.push(`Bill No. : ${data?.fbillno || data?.billno || '-'}`);
    lines.push(`Date     : ${parseDate(data?.fbilldttm || data?.billdt)}`);

    lines.push(`Cashier : ${data?.waiternm || 'admin'}`);
    lines.push(divider());
    lines.push(padLine('Qty', 'Particulars'));
    lines.push(padLine('', 'Rate     Amt'));
    lines.push(divider());

    const foodItems = (data?.items || []).filter(item => item.fb === 'N' || item.fb === 'F');
    foodItems.forEach(item => {
        // ✅ Fix: Qty ko integer dikhao (".000" hatao)
        const qty = parseFloat(item.qty || 0).toFixed(0);
        const rate = parseFloat(item.rate || 0).toFixed(2);
        const amt = parseFloat(item.amt || 0).toFixed(2);
        const name = item.menunm || item.name || 'Item';
        const peg = item.sbpeg ? ` ${item.sbpeg}` : '';
        // ✅ Fix: Long name break karo
        const MAX_NAME_LENGTH = PAPER_CHAR_WIDTH - 6;
        if (name.length > MAX_NAME_LENGTH) {
            let remaining = name;
            while (remaining.length > 0) {
                const chunk = remaining.substring(0, MAX_NAME_LENGTH);
                remaining = remaining.substring(MAX_NAME_LENGTH);
                if (remaining.length > 0) {
                    lines.push(chunk);
                } else {
                    lines.push(padLine(chunk, qty));
                }
            }
        } else {
            lines.push(padLine(`${name}${peg}`, qty));
        }
        lines.push(padLine('', `${rate}     ${amt}`));
        if (item.altermenunm) {
            lines.push(`  ${item.altermenunm}`);
        }
    });

    lines.push(divider());
    const gross = parseFloat(data?.basicamt || data?.dramt || 0).toFixed(2);
    lines.push(padLine(`Gross`, ` ${gross}`));
    lines.push(padLine(`CGST`, ` ${parseFloat(data?.cgstamt || 0).toFixed(2)}`));
    lines.push(padLine(`SGST`, ` ${parseFloat(data?.sgstamt || 0).toFixed(2)}`));
    lines.push(padLine(`Schg`, ` ${parseFloat(data?.schgamt || 0).toFixed(2)}`));
    lines.push(padLine(`R.Off`, ` ${parseFloat(data?.rndoff || 0).toFixed(2)}`));
    lines.push(divider());
    const netAmt = parseFloat(data?.dramt || 0).toFixed(2);
    lines.push(centerLine(`Net Bill Amount : ${netAmt}`));
    lines.push(divider());
    lines.push(`Rupees : ${numberToWords(netAmt)} Only`);
    lines.push(divider());
    lines.push(`HSN Code : ${data?.hsncd || '996331'}`);
    lines.push(`Narration : ${data?.billnarr || '-'}`);
    lines.push(divider());
    lines.push('E & O.E.                Signature');
    lines.push('');
    lines.push(centerLine('Terms and Conditions:-'));
    const foodTerms = stripHtml(data?.terms_condition);
    if (foodTerms) lines.push(centerLine(foodTerms));
    return lines.join('\n');
}

// ---------- Build Liquor Bill (Invoice) — includes Food + Liquor total at bottom ----------
function buildLiquorBillText(data, restaurantName, restaurantAddress, gstin, phone, email, foodNetAmt, liquorNetAmt) {
    if (!data) return 'No data available';
    const lines = [];
    lines.push(centerLine(restaurantName || 'RESTAURANT'));
    lines.push(centerLine(restaurantAddress || ''));
    lines.push(`VAT No. : ${data?.vatno || ''}`);
    lines.push(padLine(`📞 : ${phone || ''}`, phone || ''));
    lines.push(centerLine(`@ : ${email || ''}`));
    lines.push(centerLine('Invoice'));
    lines.push(centerLine(`Table. : ${data?.tableno || '-'}`));
    lines.push(divider());

    // ✅ FIX: Bill No. aur Date alag-alag lines me
    lines.push(`Bill No. : ${data?.bbillno || data?.billno || '-'}`);
    lines.push(`Date     : ${parseDate(data?.fbilldttm || data?.billdt)}`);

    lines.push(`Waiter : ${data?.waiternm || 'admin'}`);
    lines.push(divider());
    lines.push(padLine('Qty', 'Particulars'));
    lines.push(padLine('', 'Rate     Amt'));
    lines.push(divider());

    (data?.items || []).filter(item => item.fb === 'Y' || item.fb === 'L').forEach(item => {
        // ✅ Fix: Qty ko integer dikhao
        const qty = parseFloat(item.qty || 0).toFixed(0);
        const rate = parseFloat(item.rate || 0).toFixed(2);
        const amt = parseFloat(item.amt || 0).toFixed(2);
        const name = item.menunm || item.name || 'Item';
        const peg = item.sbpeg ? ` ${item.sbpeg}` : '';
        const MAX_NAME_LENGTH = PAPER_CHAR_WIDTH - 6;
        if (name.length > MAX_NAME_LENGTH) {
            let remaining = name;
            while (remaining.length > 0) {
                const chunk = remaining.substring(0, MAX_NAME_LENGTH);
                remaining = remaining.substring(MAX_NAME_LENGTH);
                if (remaining.length > 0) {
                    lines.push(chunk);
                } else {
                    lines.push(padLine(chunk, qty));
                }
            }
        } else {
            lines.push(padLine(`${name}${peg}`, qty));
        }
        lines.push(padLine('', `${rate}     ${amt}`));
        if (item.altermenunm) {
            lines.push(`  ${item.altermenunm}`);
        }
    });

    lines.push(divider());
    const gross = parseFloat(data?.bbasicamt || data?.bdramt || 0).toFixed(2);
    lines.push(padLine(`Gross`, ` ${gross}`));
    lines.push(padLine(`VAT`, ` ${parseFloat(data?.Bvatamt || 0).toFixed(2)}`));
    lines.push(padLine(`Schg`, ` ${parseFloat(data?.bschgamt || 0).toFixed(2)}`));
    lines.push(padLine(`R.Off`, ` ${parseFloat(data?.brndoff || 0).toFixed(2)}`));
    lines.push(divider());
    const netAmt = parseFloat(data?.bdramt || 0).toFixed(2);
    lines.push(centerLine(`Net Bill Amount : ${netAmt}`));
    lines.push(divider());
    lines.push(`Rupees : ${numberToWords(netAmt)} Only`);
    lines.push(divider());
    lines.push(`HSN Code : ${data?.hsncd || '996321'}`);
    lines.push(`Narration : ${data?.billnarr || '-'}`);
    lines.push(divider());
    lines.push('E & O.E.                Signature');
    lines.push('');
    lines.push(centerLine('Terms and Conditions:-'));
    const liquorTerms = stripHtml(data?.terms_condition);
    if (liquorTerms) lines.push(centerLine(liquorTerms));

    lines.push('');
    lines.push(divider());
    const combinedTotal = (parseFloat(foodNetAmt || 0) + parseFloat(liquorNetAmt || 0)).toFixed(2);
    lines.push(centerLine(`Food : ${foodNetAmt} + Liquor : ${liquorNetAmt} = Total : ${combinedTotal}`));
    return lines.join('\n');
}

// ---------- Reusable Thermal Preview Component ----------
function ThermalBillPreview({
    isFood,
    data,
    billNo,
    receiptText,
    isLoading,
    extraFooter
}) {
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
    onPrint,
}) {
    const [foodData, setFoodData] = useState(null);
    const [barData, setBarData] = useState(null);
    const [isFoodLoading, setIsFoodLoading] = useState(false);
    const [isBarLoading, setIsBarLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const { selectedRestaurant } = useAuth();
    const restaurantName = selectedRestaurant?.Restaurantnm || 'Restaurant';
    const restaurantAddress = selectedRestaurant?.address || 'Kolkata';
    const gstin = selectedRestaurant?.gst_in || '';
    const phone = selectedRestaurant?.phone || '9798755665';
    const email = selectedRestaurant?.email || '';

    const fetchFoodBill = async () => {
        if (!foodBillCd) return null;
        setIsFoodLoading(true);
        try {
            const result = await getBillPrintDetails(posCd, foodBillCd);
            console.log('[BillPrintPopup] Food API result:', result);
            if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
                return { ...result.data[0], items: result.data };
            } else {
                console.warn('[BillPrintPopup] Food data empty or malformed:', result);
                return null;
            }
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
            console.log('[BillPrintPopup] Bar API result:', result);
            if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
                return { ...result.data[0], items: result.data };
            } else {
                console.warn('[BillPrintPopup] Bar data empty or malformed:', result);
                return null;
            }
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
                const [food, bar] = await Promise.all([fetchFoodBill(), fetchBarBill()]);
                setFoodData(food);
                setBarData(bar);
            };
            loadData();
        } else {
            setFoodData(null);
            setBarData(null);
        }
    }, [visible, foodBillCd, barBillCd]);

    const foodNetAmt = parseFloat(foodData?.dramt || 0).toFixed(2);
    const barNetAmt = parseFloat(barData?.bdramt || 0).toFixed(2);

    const foodReceiptText = foodData ? buildFoodBillText(foodData, restaurantName, restaurantAddress, gstin, phone, email) : '';
    const barReceiptText = barData ? buildLiquorBillText(barData, restaurantName, restaurantAddress, gstin, phone, email, foodNetAmt, barNetAmt) : '';

    const handlePrint = async () => {
        if (!onPrint) {
            Alert.alert('No printer connected', 'Please set up a printer bridge.');
            return;
        }
        if (isPrinting) return;

        setIsPrinting(true);
        try {
            if (foodData) {
                await onPrint({ type: 'food', text: foodReceiptText, table, charWidth: PAPER_CHAR_WIDTH });
            }
            if (barData) {
                await onPrint({ type: 'liquor', text: barReceiptText, table, charWidth: PAPER_CHAR_WIDTH });
            }
        } catch (error) {
            console.error('[BillPrintPopup] Print error:', error);
            Alert.alert('Print failed', 'Could not send bill to printer.');
        } finally {
            setIsPrinting(false);
        }
    };

    const printButtonLabel = isPrinting ? 'Printing...' : (foodData && barData ? 'Print Both Bills' : foodData ? 'Print Food Bill' : 'Print Liquor Bill');

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/60 justify-center items-center px-6">
                <View className="w-full max-w-[400px] bg-white rounded-2xl overflow-hidden" style={{ maxHeight: '88%' }}>
                    {/* Header */}
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

                        {/* Food Bill Preview */}
                        {foodData && (
                            <ThermalBillPreview
                                isFood={true}
                                data={foodData}
                                billNo={foodData?.fbillno || foodData?.billno}
                                receiptText={foodReceiptText}
                                isLoading={isFoodLoading}
                            />
                        )}

                        {/* Liquor Bill Preview */}
                        {barData && (
                            <ThermalBillPreview
                                isFood={false}
                                data={barData}
                                billNo={barData?.bbillno || barData?.billno}
                                receiptText={barReceiptText}
                                isLoading={isBarLoading}
                                extraFooter={
                                    <Text className="text-[11px] font-bold text-[#1c2530] text-center mt-2">
                                        Food : {foodNetAmt} + Liquor : {barNetAmt} = Total : {(parseFloat(foodNetAmt) + parseFloat(barNetAmt)).toFixed(2)}
                                    </Text>
                                }
                            />
                        )}
                    </ScrollView>

                    {/* Footer — Print Button */}
                    {(foodData || barData) && (
                        <View className="px-5 pt-3 pb-5 border-t border-[#eee] bg-white">
                            <Pressable
                                onPress={handlePrint}
                                disabled={isPrinting || isFoodLoading || isBarLoading}
                                className="w-full flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-[#1c2530]"
                                style={{ opacity: (isPrinting || isFoodLoading || isBarLoading) ? 0.6 : 1 }}
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