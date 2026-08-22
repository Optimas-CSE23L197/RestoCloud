// app/(tabs)/BillRegister.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Calendar, Receipt, UtensilsCrossed, Wine, X, Layers, ChevronDown, ChevronUp, Wallet } from 'lucide-react-native';

import { getBillRegister, getPayModeSummary } from '../../api/system.api';
import { useAuth } from '../../src/context/AuthContext';

const BRAND_RED = '#d32f2f';
const BRAND_RED_DARK = '#a01f1f';

// Human labels for payment mode codes seen in Pay_mode_1/2/3.
const PAY_MODE_LABELS = {
    C: 'Cash',
    R: 'Credit Card',
    A: 'Credit A/C',
    D: 'Debit Card',
    P: 'Magic Pin',
    O: 'Online',
    M: 'Room Service',
    S: 'Swiggy',
    U: 'UPI',
    Z: 'Zomato',
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDisplayDate(date) {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Short display for section headers, e.g. "19 Aug 2026".
function formatSectionDate(dateStr) {
    // dateStr is "yyyy-mm-dd" as returned by the API in billdt.
    const [y, m, d] = dateStr.split('-');
    const monthIdx = parseInt(m, 10) - 1;
    return `${parseInt(d, 10)} ${MONTH_SHORT[monthIdx] || m} ${y}`;
}

function isSameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isFutureDay(day, today) {
    const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d > t;
}

function addDays(date, delta) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    return d;
}

function combineModes(row) {
    const modes = [row.Pay_mode_1, row.Pay_mode_2, row.Pay_mode_3]
        .filter((m) => m && m.trim() !== '')
        .map((m) => PAY_MODE_LABELS[m] || m);
    return modes.length > 0 ? modes.join(' + ') : '—';
}

// Groups raw report rows into bill "groups" keyed by foodbillno. A group
// with both an F row and an L row is a paired table bill (food + bar settled
// together); a group with only one is shown as a single card.
function groupBills(rows) {
    const map = new Map();
    const order = [];

    rows.forEach((row) => {
        const key = row.foodbillno || row.billno;
        if (!map.has(key)) {
            map.set(key, { key, food: null, bar: null, billdt: row.billdt });
            order.push(key);
        }
        const entry = map.get(key);
        if (row.FB === 'L') entry.bar = row;
        else entry.food = row;
    });

    return order.map((key) => map.get(key));
}

// Groups bill-groups further by billdt into ordered date sections, each
// carrying its own subtotal. Sections are sorted chronologically.
function groupByDate(billGroups) {
    const map = new Map();

    billGroups.forEach((group) => {
        const dateKey = group.billdt || 'unknown';
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey).push(group);
    });

    const sections = Array.from(map.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
        .map(([dateKey, groups]) => {
            const subtotal = groups.reduce((sum, g) => {
                const foodAmt = g.food ? parseFloat(g.food.Net_Bill_amt) || 0 : 0;
                const barAmt = g.bar ? parseFloat(g.bar.Net_Bill_amt) || 0 : 0;
                return sum + foodAmt + barAmt;
            }, 0);
            return { dateKey, groups, subtotal };
        });

    return sections;
}

// Builds a 6-row calendar grid (42 cells) for the given month, padded with
// leading/trailing days from adjacent months so every week row is full.
function buildCalendarGrid(viewYear, viewMonth) {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
        cells.push({ date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ date: new Date(viewYear, viewMonth, d), inMonth: true });
    }
    while (cells.length < 42) {
        const nextIdx = cells.length - (startWeekday + daysInMonth) + 1;
        cells.push({ date: new Date(viewYear, viewMonth + 1, nextIdx), inMonth: false });
    }
    return cells;
}

// Custom calendar modal — no external date-picker library.
// minDate/maxDate optionally constrain selectable days (used to keep
// fromDate <= toDate <= today).
function CalendarModal({ visible, selectedDate, onSelect, onClose, minDate, maxDate, title }) {
    const today = new Date();
    const effectiveMax = maxDate || today;

    const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

    useEffect(() => {
        if (visible) {
            setViewYear(selectedDate.getFullYear());
            setViewMonth(selectedDate.getMonth());
        }
    }, [visible, selectedDate]);

    const grid = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

    const goPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const goNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const isDisabled = (date) => {
        if (isFutureDay(date, effectiveMax)) return true;
        if (minDate) {
            const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
            if (d < min) return true;
        }
        return false;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable className="flex-1 bg-black/55 justify-center items-center px-6" onPress={onClose}>
                <Pressable className="w-full max-w-[360px] bg-white rounded-2xl overflow-hidden" onPress={(e) => e.stopPropagation()}>
                    <View className="flex-row items-center justify-between px-4 py-3.5" style={{ backgroundColor: BRAND_RED }}>
                        <View>
                            {title && (
                                <Text className="text-white text-[10.5px] font-bold tracking-wide mb-0.5 opacity-90">
                                    {title}
                                </Text>
                            )}
                            <Text className="text-white text-[14.5px] font-extrabold">
                                {MONTH_NAMES[viewMonth]} {viewYear}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                            <Pressable onPress={goPrevMonth} className="p-1.5 bg-white/15 rounded-full">
                                <ChevronLeft size={16} color="#FFFFFF" strokeWidth={2.5} />
                            </Pressable>
                            <Pressable onPress={goNextMonth} className="p-1.5 bg-white/15 rounded-full">
                                <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                            </Pressable>
                            <Pressable onPress={onClose} className="p-1.5 bg-white/15 rounded-full ml-1">
                                <X size={16} color="#FFFFFF" strokeWidth={2.5} />
                            </Pressable>
                        </View>
                    </View>

                    <View className="flex-row px-3 pt-3">
                        {WEEKDAY_LABELS.map((w, i) => (
                            <View key={i} className="flex-1 items-center">
                                <Text className="text-[11px] font-bold text-[#999]">{w}</Text>
                            </View>
                        ))}
                    </View>

                    <View className="flex-row flex-wrap px-3 pb-4 pt-1">
                        {grid.map((cell, idx) => {
                            const selected = isSameDay(cell.date, selectedDate);
                            const disabled = isDisabled(cell.date);
                            const isToday = isSameDay(cell.date, today);

                            return (
                                <Pressable
                                    key={idx}
                                    disabled={disabled}
                                    onPress={() => {
                                        onSelect(cell.date);
                                        onClose();
                                    }}
                                    style={{ width: `${100 / 7}%` }}
                                    className="items-center justify-center py-1.5"
                                >
                                    <View
                                        className="w-8 h-8 rounded-full items-center justify-center"
                                        style={{
                                            backgroundColor: selected ? BRAND_RED : 'transparent',
                                            borderWidth: isToday && !selected ? 1.5 : 0,
                                            borderColor: BRAND_RED,
                                        }}
                                    >
                                        <Text
                                            className="text-[13px] font-semibold"
                                            style={{
                                                color: disabled
                                                    ? '#ccc'
                                                    : selected
                                                        ? '#FFFFFF'
                                                        : cell.inMonth
                                                            ? '#333'
                                                            : '#bbb',
                                            }}
                                        >
                                            {cell.date.getDate()}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// One bill card. Renders a single food OR bar line, or — when paired — both
// lines stacked with a divider and a combined total footer.
function BillCard({ group, index }) {
    const { food, bar } = group;
    const isEven = index % 2 === 0;
    const isPaired = !!food && !!bar;

    const foodAmt = food ? parseFloat(food.Net_Bill_amt) || 0 : 0;
    const barAmt = bar ? parseFloat(bar.Net_Bill_amt) || 0 : 0;
    const combinedTotal = foodAmt + barAmt;

    const tableLabel =
        (food?.tablenm && food.tablenm.trim() !== '' && food.tablenm) ||
        (bar?.tablenm && bar.tablenm.trim() !== '' && bar.tablenm) ||
        '—';

    return (
        <View
            className="rounded-2xl overflow-hidden mb-3"
            style={{
                backgroundColor: isEven ? '#FFFFFF' : '#FBF7F7',
                borderWidth: 1,
                borderColor: isPaired ? '#f1c7c7' : '#eee',
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
            }}
        >
            {isPaired && (
                <View className="flex-row items-center gap-1.5 px-3.5 pt-2.5 pb-1">
                    <Layers size={11} color={BRAND_RED} strokeWidth={2.5} />
                    <Text className="text-[10px] font-extrabold tracking-wider" style={{ color: BRAND_RED }}>
                        PAIRED BILL · TABLE {tableLabel}
                    </Text>
                </View>
            )}

            {food && (
                <View className="flex-row items-center px-3.5 py-2.5">
                    <View className="w-8 h-8 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: '#FDF0E7' }}>
                        <UtensilsCrossed size={15} color="#B8511F" strokeWidth={2.3} />
                    </View>
                    <View className="flex-1 mr-2">
                        <Text className="text-[13.5px] font-bold text-[#2c3e50]">{food.billno}</Text>
                        <View className="flex-row items-center mt-0.5 gap-3">
                            {!isPaired && <Text className="text-[11px] text-[#888]">Table {tableLabel}</Text>}
                            <Text className="text-[11px] text-[#888]">{combineModes(food)}</Text>
                        </View>
                    </View>
                    <Text className="text-[14px] font-extrabold text-[#2c3e50]">₹{foodAmt.toFixed(2)}</Text>
                </View>
            )}

            {isPaired && <View className="h-px bg-[#f1e2e2] mx-3.5" />}

            {bar && (
                <View className="flex-row items-center px-3.5 py-2.5">
                    <View className="w-8 h-8 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: '#F3ECFA' }}>
                        <Wine size={15} color="#5B2A86" strokeWidth={2.3} />
                    </View>
                    <View className="flex-1 mr-2">
                        <Text className="text-[13.5px] font-bold text-[#2c3e50]">{bar.billno}</Text>
                        <View className="flex-row items-center mt-0.5 gap-3">
                            {!isPaired && <Text className="text-[11px] text-[#888]">Bar</Text>}
                            <Text className="text-[11px] text-[#888]">{combineModes(bar)}</Text>
                        </View>
                    </View>
                    <Text className="text-[14px] font-extrabold text-[#2c3e50]">₹{barAmt.toFixed(2)}</Text>
                </View>
            )}

            {isPaired && (
                <View className="flex-row items-center justify-between px-3.5 py-2.5" style={{ backgroundColor: '#FCEFEF' }}>
                    <Text className="text-[11px] font-bold tracking-wide" style={{ color: BRAND_RED_DARK }}>
                        COMBINED TOTAL
                    </Text>
                    <Text className="text-[15px] font-extrabold" style={{ color: BRAND_RED_DARK }}>
                        ₹{combinedTotal.toFixed(2)}
                    </Text>
                </View>
            )}
        </View>
    );
}

// A date section header shown above each day's bills when the selected
// range spans more than one date. Shows the date + that day's subtotal.
function DateSectionHeader({ dateKey, subtotal, billCount }) {
    return (
        <View className="flex-row items-center justify-between mb-2 mt-1 px-1">
            <View className="flex-row items-center gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND_RED }} />
                <Text className="text-[13px] font-extrabold text-[#2c3e50]">
                    {formatSectionDate(dateKey)}
                </Text>
                <Text className="text-[11px] font-semibold text-[#999]">
                    · {billCount} bill{billCount > 1 ? 's' : ''}
                </Text>
            </View>
            <Text className="text-[12.5px] font-extrabold" style={{ color: BRAND_RED_DARK }}>
                ₹{subtotal.toFixed(2)}
            </Text>
        </View>
    );
}

// Collapsible Payment Summary — Mode of Pay vs Total Amount, fetched from
// paymodesumm.php for the selected From/To range (server-side aggregated,
// so split payments are already correctly totalled — no need to re-derive
// this from bill rows).
function PaymentSummarySection({ summaryRows, isLoading, expanded, onToggle }) {
    const summaryTotal = useMemo(
        () => summaryRows.reduce((sum, r) => sum + (parseFloat(r.Rcpt_amt) || 0), 0),
        [summaryRows]
    );

    if (!isLoading && summaryRows.length === 0) return null;

    return (
        <View className="mb-1" style={{ borderTopWidth: 1, borderTopColor: '#f1e2e2' }}>
            <Pressable
                onPress={onToggle}
                className="flex-row items-center justify-between px-5 pt-3 pb-2"
            >
                <View className="flex-row items-center gap-2">
                    <Wallet size={14} color={BRAND_RED_DARK} strokeWidth={2.3} />
                    <Text className="text-[12.5px] font-extrabold tracking-wide" style={{ color: BRAND_RED_DARK }}>
                        PAYMENT SUMMARY
                    </Text>
                </View>
                {expanded ? (
                    <ChevronUp size={16} color="#999" strokeWidth={2.3} />
                ) : (
                    <ChevronDown size={16} color="#999" strokeWidth={2.3} />
                )}
            </Pressable>

            {expanded && (
                <View className="px-5 pb-2">
                    {isLoading ? (
                        <View className="py-3 items-center">
                            <ActivityIndicator size="small" color={BRAND_RED} />
                        </View>
                    ) : (
                        <>
                            {/* Column headers */}
                            <View className="flex-row items-center justify-between py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: '#f1e2e2' }}>
                                <Text className="text-[10.5px] font-bold text-[#999] tracking-wide">MODE OF PAY</Text>
                                <Text className="text-[10.5px] font-bold text-[#999] tracking-wide">TOTAL AMOUNT</Text>
                            </View>

                            {summaryRows.map((row) => (
                                <View
                                    key={row.Pay_mode}
                                    className="flex-row items-center justify-between py-2"
                                    style={{ borderBottomWidth: 1, borderBottomColor: '#f6ecec' }}
                                >
                                    <Text className="text-[13px] font-semibold text-[#2c3e50]">
                                        {PAY_MODE_LABELS[row.Pay_mode] || row.Pay_mode}
                                    </Text>
                                    <Text className="text-[13px] font-bold text-[#2c3e50]">
                                        ₹{(parseFloat(row.Rcpt_amt) || 0).toFixed(2)}
                                    </Text>
                                </View>
                            ))}

                            {/* Summary total */}
                            <View className="flex-row items-center justify-between pt-2.5">
                                <Text className="text-[12.5px] font-extrabold tracking-wide" style={{ color: BRAND_RED_DARK }}>
                                    TOTAL
                                </Text>
                                <Text className="text-[15px] font-extrabold" style={{ color: BRAND_RED_DARK }}>
                                    ₹{summaryTotal.toFixed(2)}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            )}
        </View>
    );
}

export default function BillRegisterScreen() {
    const insets = useSafeAreaInsets();
    const { selectedRestaurant } = useAuth();
    const posCd = selectedRestaurant?.posmenucd || selectedRestaurant?.rcode || '';

    const today = new Date();

    // Two independent pickers, both default to today. fromDate cannot be
    // after toDate; toDate cannot be after today or before fromDate.
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromCalendar, setShowFromCalendar] = useState(false);
    const [showToCalendar, setShowToCalendar] = useState(false);

    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Payment Summary (Mode of Pay vs Total Amount) state — mirrors the
    // From/To range used for the bill list.
    const [summaryRows, setSummaryRows] = useState([]);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summaryExpanded, setSummaryExpanded] = useState(false);

    const isRangeMode = !isSameDay(fromDate, toDate);
    const isSingleToday = !isRangeMode && isSameDay(fromDate, today);

    const fetchReport = useCallback(async () => {
        if (!posCd) return;
        setIsLoading(true);
        try {
            const fromStr = formatDate(fromDate);
            const toStr = formatDate(toDate);
            const result = await getBillRegister(posCd, fromStr, toStr, 'N');
            if (result.success && Array.isArray(result.data)) {
                setRows(result.data);
            } else {
                // Any failure is treated the same as "no bills" — no error
                // banner is ever shown to the user.
                setRows([]);
            }
        } catch (err) {
            console.error('[BillRegister] fetch error:', err);
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    }, [posCd, fromDate, toDate]);

    const fetchPaymentSummary = useCallback(async () => {
        if (!posCd) return;
        setIsSummaryLoading(true);
        try {
            const fromStr = formatDate(fromDate);
            const toStr = formatDate(toDate);
            const result = await getPayModeSummary(posCd, fromStr, toStr, 'N');
            if (result.success && Array.isArray(result.data)) {
                setSummaryRows(result.data);
            } else {
                setSummaryRows([]);
            }
        } catch (err) {
            console.error('[BillRegister] payment summary fetch error:', err);
            setSummaryRows([]);
        } finally {
            setIsSummaryLoading(false);
        }
    }, [posCd, fromDate, toDate]);

    useEffect(() => {
        fetchReport();
        fetchPaymentSummary();
    }, [fetchReport, fetchPaymentSummary]);

    const handleSelectFrom = (date) => {
        setFromDate(date);
        // Keep the range valid — pull toDate up if it's now before fromDate.
        if (date > toDate) setToDate(date);
    };

    const handleSelectTo = (date) => {
        setToDate(date);
        // Keep the range valid — pull fromDate back if it's now after toDate.
        if (date < fromDate) setFromDate(date);
    };

    const jumpToday = () => {
        setFromDate(new Date());
        setToDate(new Date());
    };

    const billGroups = useMemo(() => groupBills(rows), [rows]);
    const dateSections = useMemo(() => groupByDate(billGroups), [billGroups]);

    const grandTotal = useMemo(
        () => rows.reduce((sum, r) => sum + (parseFloat(r.Net_Bill_amt) || 0), 0),
        [rows]
    );

    // Flatten sections into a single FlatList data array: a 'header' item
    // followed by its 'bill' items, so everything renders on one page/list
    // with natural scrolling instead of nested lists.
    const listData = useMemo(() => {
        if (!isRangeMode) {
            // Single date selected — no section headers, just the bills.
            return billGroups.map((g) => ({ type: 'bill', group: g }));
        }
        const items = [];
        dateSections.forEach((section) => {
            items.push({
                type: 'header',
                key: `header-${section.dateKey}`,
                dateKey: section.dateKey,
                subtotal: section.subtotal,
                billCount: section.groups.length,
            });
            section.groups.forEach((g) => {
                items.push({ type: 'bill', group: g });
            });
        });
        return items;
    }, [isRangeMode, billGroups, dateSections]);

    return (
        <View className="flex-1 bg-gray-50">
            {/* Matches the red status bar used on Dashboard — without this,
                the status bar falls back to the OS default (white bg / dark
                icons) instead of inheriting the header's red background. */}
            <StatusBar style="light" backgroundColor={BRAND_RED} translucent={false} />

            {/* Header — using insets.top as explicit paddingTop instead of
                relying on <SafeAreaView edges={['top']}> here. SafeAreaView's
                inset was intermittently collapsing to 0 on this screen during
                re-renders (date change / calendar open-close triggers a
                re-fetch), which let the status bar icons overlap the header
                text, same root cause fixed on PrinterSetupScreen. */}
            <View style={{ backgroundColor: BRAND_RED, paddingTop: insets.top }}>
                <View className="flex-row items-center justify-between px-4 py-3.5">
                    <View className="flex-row items-center gap-2.5">
                        <Pressable onPress={() => router.back()} className="p-1.5 bg-white/15 rounded-full">
                            <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                        <View className="flex-row items-center gap-2">
                            <Receipt size={17} color="#FFFFFF" strokeWidth={2.3} />
                            <Text className="text-white text-[16px] font-extrabold tracking-wide">
                                Bill Register
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Date range navigator — two pickers, From and To */}
            <View className="px-4 pt-3.5 pb-2">
                <View className="flex-row items-center gap-2">
                    <Pressable
                        onPress={() => setShowFromCalendar(true)}
                        className="flex-1 bg-white rounded-xl px-3 py-2.5"
                        style={{ borderWidth: 1, borderColor: '#e8d5d5' }}
                    >
                        <Text className="text-[10px] font-bold text-[#aaa] tracking-wide mb-0.5">FROM</Text>
                        <View className="flex-row items-center gap-1.5">
                            <Calendar size={13} color={BRAND_RED} strokeWidth={2.2} />
                            <Text className="text-[13px] font-bold text-[#2c3e50]">
                                {isSameDay(fromDate, today) ? 'Today' : formatDisplayDate(fromDate)}
                            </Text>
                        </View>
                    </Pressable>

                    <Pressable
                        onPress={() => setShowToCalendar(true)}
                        className="flex-1 bg-white rounded-xl px-3 py-2.5"
                        style={{ borderWidth: 1, borderColor: '#e8d5d5' }}
                    >
                        <Text className="text-[10px] font-bold text-[#aaa] tracking-wide mb-0.5">TO</Text>
                        <View className="flex-row items-center gap-1.5">
                            <Calendar size={13} color={BRAND_RED} strokeWidth={2.2} />
                            <Text className="text-[13px] font-bold text-[#2c3e50]">
                                {isSameDay(toDate, today) ? 'Today' : formatDisplayDate(toDate)}
                            </Text>
                        </View>
                    </Pressable>
                </View>

                {!isSingleToday && (
                    <Pressable onPress={jumpToday} className="self-start mt-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#FCEFEF' }}>
                        <Text className="text-[11.5px] font-bold" style={{ color: BRAND_RED }}>Jump to Today</Text>
                    </Pressable>
                )}
            </View>

            <CalendarModal
                visible={showFromCalendar}
                selectedDate={fromDate}
                onSelect={handleSelectFrom}
                onClose={() => setShowFromCalendar(false)}
                maxDate={today}
                title="SELECT FROM DATE"
            />

            <CalendarModal
                visible={showToCalendar}
                selectedDate={toDate}
                onSelect={handleSelectTo}
                onClose={() => setShowToCalendar(false)}
                minDate={fromDate}
                maxDate={today}
                title="SELECT TO DATE"
            />

            {/* List */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_RED} />
                </View>
            ) : billGroups.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-16 h-16 rounded-full items-center justify-center mb-3" style={{ backgroundColor: '#FCEFEF' }}>
                        <Receipt size={26} color={BRAND_RED} strokeWidth={1.8} />
                    </View>
                    <Text className="text-[14.5px] text-[#555] font-bold">No bills found</Text>
                    <Text className="text-[12.5px] text-[#999] mt-1 text-center">
                        There's no billing activity for this date range
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={listData}
                    keyExtractor={(item, idx) => (item.type === 'header' ? item.key : `bill-${item.group.key}-${idx}`)}
                    renderItem={({ item, index }) =>
                        item.type === 'header' ? (
                            <DateSectionHeader dateKey={item.dateKey} subtotal={item.subtotal} billCount={item.billCount} />
                        ) : (
                            <BillCard group={item.group} index={index} />
                        )
                    }
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Footer: Payment Summary + Grand Total */}
            {!isLoading && billGroups.length > 0 && (
                <View className="bg-white" style={{ borderTopWidth: 1, borderTopColor: '#f1e2e2' }}>
                    <PaymentSummarySection
                        summaryRows={summaryRows}
                        isLoading={isSummaryLoading}
                        expanded={summaryExpanded}
                        onToggle={() => setSummaryExpanded((e) => !e)}
                    />

                    <View className="px-5 pt-3 pb-5" style={{ borderTopWidth: summaryExpanded || summaryRows.length > 0 ? 1 : 0, borderTopColor: '#f1e2e2' }}>
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-[12px] font-bold text-[#999] tracking-wide">
                                    {billGroups.length} BILL{billGroups.length > 1 ? 'S' : ''} · {rows.length} LINE{rows.length > 1 ? 'S' : ''}
                                </Text>
                                <Text className="text-[13.5px] font-bold text-[#6b6b6b] tracking-wide mt-0.5">
                                    TOTAL BILL AMOUNT
                                </Text>
                            </View>
                            <Text className="text-[24px] font-extrabold" style={{ color: BRAND_RED_DARK }}>
                                ₹{grandTotal.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}