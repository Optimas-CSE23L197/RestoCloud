// popup/ReservationPopup.jsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { FileText, X, ChevronDown, ChevronLeft, ChevronRight, Calendar, Clock, Check } from 'lucide-react-native';
import { createReservation } from '../../../api/system.api';
import { useAuth } from '../../../src/context/AuthContext';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad2 = (n) => String(n).padStart(2, '0');

const formatDateDMY = (d) => `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
const formatTimeHM = (h, m) => `${pad2(h)}:${pad2(m)}`;

export default function ReservationPopup({ visible, onClose, onSave, tables = [] }) {
    const [guestName, setGuestName] = useState('');
    const [phone, setPhone] = useState('');

    // Dropdown States
    const [selectedTable, setSelectedTable] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const [pax, setPax] = useState('2');

    const today = new Date();
    const [date, setDate] = useState('18-08-2026');
    const [time, setTime] = useState('09:35');

    // Calendar picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
    const [calendarYear, setCalendarYear] = useState(today.getFullYear());

    // Time picker state
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [tempHour, setTempHour] = useState(9);
    const [tempMinute, setTempMinute] = useState(35);

    const { selectedRestaurant } = useAuth();
    const hotelCode = selectedRestaurant?.hotelcd || '';

    // Filter only Vacant tables
    const availableTables = tables;

    const handleSelectTable = (table) => {
        setSelectedTable(table);
        setShowDropdown(false);
    };

    // ---------- Calendar helpers ----------
    const openDatePicker = () => {
        // Sync calendar view to currently selected date if valid
        const parts = date.split('-');
        if (parts.length === 3) {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                setCalendarMonth(m);
                setCalendarYear(y);
            }
        }
        setShowDatePicker(true);
    };

    const goPrevMonth = () => {
        if (calendarMonth === 0) {
            setCalendarMonth(11);
            setCalendarYear((y) => y - 1);
        } else {
            setCalendarMonth((m) => m - 1);
        }
    };

    const goNextMonth = () => {
        if (calendarMonth === 11) {
            setCalendarMonth(0);
            setCalendarYear((y) => y + 1);
        } else {
            setCalendarMonth((m) => m + 1);
        }
    };

    const buildCalendarGrid = () => {
        const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const cells = [];

        for (let i = 0; i < firstDay; i++) {
            cells.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            cells.push(day);
        }
        return cells;
    };

    const isSelectedDay = (day) => {
        const parts = date.split('-');
        if (parts.length !== 3) return false;
        return (
            parseInt(parts[0], 10) === day &&
            parseInt(parts[1], 10) - 1 === calendarMonth &&
            parseInt(parts[2], 10) === calendarYear
        );
    };

    const isToday = (day) => {
        return (
            day === today.getDate() &&
            calendarMonth === today.getMonth() &&
            calendarYear === today.getFullYear()
        );
    };

    const handleSelectDay = (day) => {
        const picked = new Date(calendarYear, calendarMonth, day);
        setDate(formatDateDMY(picked));
        setShowDatePicker(false);
    };

    // ---------- Time helpers ----------
    const openTimePicker = () => {
        const parts = time.split(':');
        if (parts.length === 2) {
            const h = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            if (!isNaN(h)) setTempHour(h);
            if (!isNaN(m)) setTempMinute(m);
        }
        setShowTimePicker(true);
    };

    const confirmTime = () => {
        setTime(formatTimeHM(tempHour, tempMinute));
        setShowTimePicker(false);
    };

    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    const MINUTES = Array.from({ length: 60 }, (_, i) => i).filter((m) => m % 5 === 0);

    const handleSave = async () => {
        if (!guestName || !phone || !selectedTable) {
            Alert.alert('Error', 'Please fill all fields and select a table');
            return;
        }

        const reservationData = {
            guestName,
            phone,
            selectedTable: selectedTable.tableNo,
            pax,
            date,
            time,
            hotelCode,
        };

        const result = await createReservation(reservationData);
        if (result.success) {
            Alert.alert('Success', 'Reservation created successfully!');
            onSave?.();
            onClose();
        } else {
            Alert.alert('Error', result.error || 'Failed to create reservation');
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
                <View style={styles.modalContainer}>

                    {/* 1. Dark Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <FileText size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.headerTitle}>Table Reservation</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                            <X size={24} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* 2. Body */}
                    <ScrollView
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                        showsVerticalScrollIndicator={false}
                    >

                        {/* Guest Name */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>GUEST NAME</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    placeholder="e.g. John Doe"
                                    style={styles.input}
                                    value={guestName}
                                    onChangeText={setGuestName}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        {/* Phone Number */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>PHONE NUMBER</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    placeholder="+91 9876543210"
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        {/* SELECT TABLE - Dropdown */}
                        <View style={[styles.fieldGroup, { zIndex: 20 }]}>
                            <Text style={styles.label}>SELECT TABLE</Text>
                            <Pressable
                                style={styles.inputContainer}
                                onPress={() => setShowDropdown(!showDropdown)}
                            >
                                <Text style={[styles.inputText, !selectedTable && { color: '#999' }]}>
                                    {selectedTable ? selectedTable.tableNo : 'Select Table'}
                                </Text>
                                <ChevronDown size={16} color="#888888" strokeWidth={2} />
                            </Pressable>

                            {showDropdown && (
                                <View style={styles.dropdown}>
                                    {availableTables.length === 0 ? (
                                        <Text style={styles.dropdownEmpty}>No vacant tables available</Text>
                                    ) : (
                                        <ScrollView style={{ maxHeight: 170 }} nestedScrollEnabled={true}>
                                            {availableTables.map((item) => (
                                                <Pressable
                                                    key={item.id}
                                                    style={styles.dropdownRow}
                                                    onPress={() => handleSelectTable(item)}
                                                >
                                                    <Text style={styles.dropdownItemName}>
                                                        {item.tableNo}
                                                    </Text>
                                                    <Text style={styles.dropdownItemStatus}>
                                                        Vacant
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Pax (Guests) */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>PAX (GUESTS)</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    placeholder="2"
                                    style={styles.input}
                                    value={pax}
                                    onChangeText={setPax}
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        {/* Date + Time side by side */}
                        <View style={styles.rowGroup}>
                            <View style={[styles.fieldGroup, styles.halfField]}>
                                <Text style={styles.label}>DATE</Text>
                                <Pressable style={styles.inputContainer} onPress={openDatePicker}>
                                    <Text style={styles.inputText}>{date}</Text>
                                    <Calendar size={16} color="#888888" strokeWidth={2} />
                                </Pressable>
                            </View>

                            <View style={[styles.fieldGroup, styles.halfField]}>
                                <Text style={styles.label}>TIME</Text>
                                <Pressable style={styles.inputContainer} onPress={openTimePicker}>
                                    <Text style={styles.inputText}>{time}</Text>
                                    <Clock size={16} color="#888888" strokeWidth={2} />
                                </Pressable>
                            </View>
                        </View>

                    </ScrollView>

                    {/* 3. Footer Button */}
                    <View style={styles.footer}>
                        <Pressable style={styles.saveBtn} onPress={handleSave}>
                            <Check size={18} color="#FFFFFF" strokeWidth={3} />
                            <Text style={styles.saveText}>Save Reservation</Text>
                        </Pressable>
                    </View>

                </View>
            </View>

            {/* ================= DATE PICKER MODAL ================= */}
            <Modal
                visible={showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <Pressable style={styles.pickerOverlay} onPress={() => setShowDatePicker(false)}>
                    <Pressable style={styles.calendarCard} onPress={(e) => e.stopPropagation?.()}>

                        {/* Calendar Header */}
                        <View style={styles.calendarHeader}>
                            <Pressable onPress={goPrevMonth} style={styles.calendarNavBtn} hitSlop={8}>
                                <ChevronLeft size={20} color="#2c3e50" strokeWidth={2.5} />
                            </Pressable>
                            <Text style={styles.calendarHeaderText}>
                                {MONTH_NAMES[calendarMonth]} {calendarYear}
                            </Text>
                            <Pressable onPress={goNextMonth} style={styles.calendarNavBtn} hitSlop={8}>
                                <ChevronRight size={20} color="#2c3e50" strokeWidth={2.5} />
                            </Pressable>
                        </View>

                        {/* Weekday Labels */}
                        <View style={styles.weekRow}>
                            {WEEKDAY_LABELS.map((wd, idx) => (
                                <View key={idx} style={styles.weekCell}>
                                    <Text style={styles.weekLabel}>{wd}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Day Grid */}
                        <View style={styles.dayGrid}>
                            {buildCalendarGrid().map((day, idx) => {
                                if (day === null) {
                                    return <View key={`empty-${idx}`} style={styles.dayCell} />;
                                }
                                const selected = isSelectedDay(day);
                                const todayFlag = isToday(day);
                                return (
                                    <Pressable
                                        key={idx}
                                        style={styles.dayCell}
                                        onPress={() => handleSelectDay(day)}
                                    >
                                        <View
                                            style={[
                                                styles.dayCircle,
                                                selected && styles.dayCircleSelected,
                                                !selected && todayFlag && styles.dayCircleToday,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.dayText,
                                                    selected && styles.dayTextSelected,
                                                    !selected && todayFlag && styles.dayTextToday,
                                                ]}
                                            >
                                                {day}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Pressable style={styles.pickerCloseBtn} onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.pickerCloseText}>Close</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ================= TIME PICKER MODAL ================= */}
            <Modal
                visible={showTimePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTimePicker(false)}
            >
                <Pressable style={styles.pickerOverlay} onPress={() => setShowTimePicker(false)}>
                    <Pressable style={styles.timeCard} onPress={(e) => e.stopPropagation?.()}>

                        <Text style={styles.timeCardTitle}>Select Time</Text>

                        <View style={styles.timeColumnsRow}>
                            {/* Hours */}
                            <View style={styles.timeColumn}>
                                <Text style={styles.timeColumnLabel}>Hour</Text>
                                <ScrollView
                                    style={styles.timeScroll}
                                    showsVerticalScrollIndicator={false}
                                    nestedScrollEnabled
                                >
                                    {HOURS.map((h) => {
                                        const active = h === tempHour;
                                        return (
                                            <Pressable
                                                key={h}
                                                style={[styles.timeOption, active && styles.timeOptionActive]}
                                                onPress={() => setTempHour(h)}
                                            >
                                                <Text style={[styles.timeOptionText, active && styles.timeOptionTextActive]}>
                                                    {pad2(h)}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>

                            <Text style={styles.timeColon}>:</Text>

                            {/* Minutes */}
                            <View style={styles.timeColumn}>
                                <Text style={styles.timeColumnLabel}>Min</Text>
                                <ScrollView
                                    style={styles.timeScroll}
                                    showsVerticalScrollIndicator={false}
                                    nestedScrollEnabled
                                >
                                    {MINUTES.map((m) => {
                                        const active = m === tempMinute;
                                        return (
                                            <Pressable
                                                key={m}
                                                style={[styles.timeOption, active && styles.timeOptionActive]}
                                                onPress={() => setTempMinute(m)}
                                            >
                                                <Text style={[styles.timeOptionText, active && styles.timeOptionTextActive]}>
                                                    {pad2(m)}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </View>

                        <Pressable style={styles.timeConfirmBtn} onPress={confirmTime}>
                            <Check size={16} color="#fff" strokeWidth={3} />
                            <Text style={styles.timeConfirmText}>
                                Set {pad2(tempHour)}:{pad2(tempMinute)}
                            </Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '92%',
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2c3e50',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeBtn: {
        padding: 4,
    },

    // Body
    body: {
        maxHeight: 460,
    },
    bodyContent: {
        padding: 20,
        paddingBottom: 24,
    },
    fieldGroup: {
        marginBottom: 18,
    },
    rowGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    halfField: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#555',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        height: 46,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    inputText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },

    // Dropdown styles
    dropdown: {
        position: 'absolute',
        top: 46,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
        zIndex: 10,
        paddingVertical: 4,
    },
    dropdownEmpty: {
        padding: 14,
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
    },
    dropdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderColor: '#f5f5f5',
    },
    dropdownItemName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    dropdownItemStatus: {
        fontSize: 12,
        color: '#16A34A',
        fontWeight: '600',
    },

    // Footer
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fafafa',
    },
    saveBtn: {
        backgroundColor: '#2c3e50',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // ---------- Picker overlay (shared) ----------
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    // ---------- Calendar picker ----------
    calendarCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    calendarNavBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
    },
    calendarHeaderText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2c3e50',
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    weekCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
    },
    weekLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#999',
    },
    dayGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircleSelected: {
        backgroundColor: '#2c3e50',
    },
    dayCircleToday: {
        borderWidth: 1.5,
        borderColor: '#2c3e50',
    },
    dayText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    dayTextSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    dayTextToday: {
        color: '#2c3e50',
        fontWeight: '700',
    },
    pickerCloseBtn: {
        marginTop: 12,
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    pickerCloseText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
    },

    // ---------- Time picker ----------
    timeCard: {
        width: '100%',
        maxWidth: 280,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    timeCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: 14,
    },
    timeColumnsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    timeColumn: {
        alignItems: 'center',
    },
    timeColumnLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#999',
        marginBottom: 6,
    },
    timeScroll: {
        height: 160,
        width: 64,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
    },
    timeOption: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    timeOptionActive: {
        backgroundColor: '#2c3e50',
    },
    timeOptionText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    timeOptionTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    timeColon: {
        fontSize: 20,
        fontWeight: '700',
        color: '#888',
        marginTop: 18,
    },
    timeConfirmBtn: {
        marginTop: 16,
        backgroundColor: '#2c3e50',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    timeConfirmText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});