// popup/ReservationPopup.jsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {
    CalendarPlus,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Clock,
    Check,
    User,
    Phone,
    Users,
    LayoutGrid,
} from 'lucide-react-native';
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const isFormValid = guestName.trim() && phone.trim() && selectedTable;

    const handleSave = async () => {
        if (!isFormValid) {
            Alert.alert('Error', 'Please fill all fields and select a table');
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/60 justify-center items-center px-5">
                <View
                    className="w-full max-w-[460px] bg-white rounded-2xl overflow-hidden"
                    style={{
                        maxHeight: '88%',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.25,
                        shadowRadius: 16,
                        elevation: 12,
                    }}
                >

                    {/* 1. Header */}
                    <View className="flex-row justify-between items-center px-5 pt-4 pb-3.5 bg-[#1c2530]">
                        <View className="flex-row items-center gap-2.5">
                            <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                                <CalendarPlus size={16} color="#FFFFFF" strokeWidth={2.4} />
                            </View>
                            <View>
                                <Text className="text-[16px] font-bold text-white leading-5">Table Reservation</Text>
                                <Text className="text-[11.5px] font-semibold text-white/60 mt-0.5">
                                    Book a table in advance
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10} className="p-1" disabled={isSubmitting}>
                            <X size={20} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* 2. Body */}
                    <ScrollView
                        style={{ maxHeight: 460 }}
                        contentContainerClassName="p-5 pb-2"
                        showsVerticalScrollIndicator={false}
                    >

                        {/* Guest Name */}
                        <View className="mb-4">
                            <Text className="text-[11px] font-bold text-[#8a94a0] tracking-wider mb-2">
                                GUEST NAME
                            </Text>
                            <View className="flex-row items-center border border-[#e5e5e5] rounded-xl bg-[#fafbfc] px-3.5 h-[48px] gap-2.5">
                                <User size={16} color="#9AA3AF" strokeWidth={2.2} />
                                <TextInput
                                    placeholder="e.g. John Doe"
                                    className="flex-1 text-[14.5px] text-[#222]"
                                    value={guestName}
                                    onChangeText={setGuestName}
                                    placeholderTextColor="#aab0b8"
                                />
                            </View>
                        </View>

                        {/* Phone Number */}
                        <View className="mb-4">
                            <Text className="text-[11px] font-bold text-[#8a94a0] tracking-wider mb-2">
                                PHONE NUMBER
                            </Text>
                            <View className="flex-row items-center border border-[#e5e5e5] rounded-xl bg-[#fafbfc] px-3.5 h-[48px] gap-2.5">
                                <Phone size={16} color="#9AA3AF" strokeWidth={2.2} />
                                <TextInput
                                    placeholder="+91 9876543210"
                                    className="flex-1 text-[14.5px] text-[#222]"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#aab0b8"
                                />
                            </View>
                        </View>

                        {/* Pax + Table row */}
                        <View className="flex-row gap-3 mb-1" style={{ zIndex: 20 }}>
                            {/* Pax */}
                            <View className="w-[100px]">
                                <Text className="text-[11px] font-bold text-[#8a94a0] tracking-wider mb-2">
                                    PAX
                                </Text>
                                <View className="flex-row items-center border border-[#e5e5e5] rounded-xl bg-[#fafbfc] px-3 h-[48px] gap-2">
                                    <Users size={15} color="#9AA3AF" strokeWidth={2.2} />
                                    <TextInput
                                        placeholder="2"
                                        className="flex-1 text-[14.5px] text-[#222] font-semibold"
                                        value={pax}
                                        onChangeText={setPax}
                                        keyboardType="numeric"
                                        placeholderTextColor="#aab0b8"
                                    />
                                </View>
                            </View>

                            {/* SELECT TABLE - Dropdown */}
                            <View className="flex-1 relative">
                                <Text className="text-[11px] font-bold text-[#8a94a0] tracking-wider mb-2">
                                    TABLE
                                </Text>
                                <Pressable
                                    className="flex-row items-center justify-between border rounded-xl px-3.5 h-[48px]"
                                    style={{
                                        borderColor: selectedTable ? '#2c3e50' : '#e5e5e5',
                                        backgroundColor: selectedTable ? '#2c3e5010' : '#fafbfc',
                                    }}
                                    onPress={() => setShowDropdown(!showDropdown)}
                                >
                                    <View className="flex-row items-center gap-2">
                                        <LayoutGrid
                                            size={15}
                                            color={selectedTable ? '#2c3e50' : '#9AA3AF'}
                                            strokeWidth={2.2}
                                        />
                                        <Text
                                            className={`text-[14.5px] font-semibold ${selectedTable ? 'text-[#2c3e50]' : 'text-[#aab0b8]'
                                                }`}
                                        >
                                            {selectedTable ? selectedTable.tableNo : 'Select Table'}
                                        </Text>
                                    </View>
                                    <ChevronDown size={16} color="#9AA3AF" strokeWidth={2.2} />
                                </Pressable>

                                {showDropdown && (
                                    <View
                                        className="absolute top-[76px] left-0 right-0 bg-white border border-[#e5e5e5] rounded-xl py-1"
                                        style={{
                                            maxHeight: 220,
                                            zIndex: 30,
                                            elevation: 6,
                                            shadowColor: '#000',
                                            shadowOpacity: 0.12,
                                            shadowRadius: 8,
                                            shadowOffset: { width: 0, height: 4 },
                                        }}
                                    >
                                        {availableTables.length === 0 ? (
                                            <Text className="p-3.5 text-[13px] text-[#999] text-center">
                                                No vacant tables available
                                            </Text>
                                        ) : (
                                            <ScrollView
                                                style={{ maxHeight: 220 }}
                                                nestedScrollEnabled={true}
                                                showsVerticalScrollIndicator={true}
                                                keyboardShouldPersistTaps="handled"
                                            >
                                                {availableTables.map((item) => {
                                                    const active = selectedTable?.id === item.id;
                                                    return (
                                                        <Pressable
                                                            key={item.id}
                                                            className="flex-row justify-between items-center py-3 px-3.5 border-b border-[#f5f5f5]"
                                                            style={active ? { backgroundColor: '#f4f6f8' } : undefined}
                                                            onPress={() => handleSelectTable(item)}
                                                        >
                                                            <Text className="text-sm text-[#333] font-semibold">
                                                                {item.tableNo}
                                                            </Text>
                                                            <View className="flex-row items-center gap-1">
                                                                {active && <Check size={13} color="#2c3e50" strokeWidth={3} />}
                                                                <Text className="text-xs text-[#16A34A] font-bold">
                                                                    Vacant
                                                                </Text>
                                                            </View>
                                                        </Pressable>
                                                    );
                                                })}
                                            </ScrollView>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Date + Time side by side */}
                        <View className="flex-row gap-3 mt-4 mb-2">
                            <View className="flex-1">
                                <Text className="text-[11px] font-bold text-[#8a94a0] tracking-wider mb-2">
                                    DATE
                                </Text>
                                <Pressable
                                    className="flex-row items-center justify-between border border-[#e5e5e5] rounded-xl bg-[#fafbfc] px-3.5 h-[48px]"
                                    onPress={openDatePicker}
                                >
                                    <Text className="text-[14px] text-[#222] font-semibold">{date}</Text>
                                    <Calendar size={16} color="#9AA3AF" strokeWidth={2.2} />
                                </Pressable>
                            </View>

                            <View className="flex-1">
                                <Text className="text-[11px] font-bold text-[#8a94a0] tracking-wider mb-2">
                                    TIME
                                </Text>
                                <Pressable
                                    className="flex-row items-center justify-between border border-[#e5e5e5] rounded-xl bg-[#fafbfc] px-3.5 h-[48px]"
                                    onPress={openTimePicker}
                                >
                                    <Text className="text-[14px] text-[#222] font-semibold">{time}</Text>
                                    <Clock size={16} color="#9AA3AF" strokeWidth={2.2} />
                                </Pressable>
                            </View>
                        </View>

                    </ScrollView>

                    {/* 3. Footer Button */}
                    <View className="px-5 pt-3 pb-4 border-t border-[#eee] bg-white">
                        <Pressable
                            onPress={handleSave}
                            disabled={isSubmitting || !isFormValid}
                            className="w-full flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-[#27ae60]"
                            style={{ opacity: !isFormValid ? 0.5 : 1 }}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Check size={17} color="#FFFFFF" strokeWidth={3} />
                                    <Text className="text-white text-[14.5px] font-bold">Save Reservation</Text>
                                </>
                            )}
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
                <Pressable
                    className="flex-1 bg-black/50 justify-center items-center px-6"
                    onPress={() => setShowDatePicker(false)}
                >
                    <Pressable
                        className="w-full max-w-[340px] bg-white rounded-2xl p-4"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 12,
                            elevation: 10,
                        }}
                        onPress={(e) => e.stopPropagation?.()}
                    >

                        {/* Calendar Header */}
                        <View className="flex-row items-center justify-between mb-3">
                            <Pressable
                                onPress={goPrevMonth}
                                className="w-8 h-8 rounded-full items-center justify-center bg-[#f3f4f6]"
                                hitSlop={8}
                            >
                                <ChevronLeft size={20} color="#2c3e50" strokeWidth={2.5} />
                            </Pressable>
                            <Text className="text-[15px] font-bold text-[#2c3e50]">
                                {MONTH_NAMES[calendarMonth]} {calendarYear}
                            </Text>
                            <Pressable
                                onPress={goNextMonth}
                                className="w-8 h-8 rounded-full items-center justify-center bg-[#f3f4f6]"
                                hitSlop={8}
                            >
                                <ChevronRight size={20} color="#2c3e50" strokeWidth={2.5} />
                            </Pressable>
                        </View>

                        {/* Weekday Labels */}
                        <View className="flex-row mb-1">
                            {WEEKDAY_LABELS.map((wd, idx) => (
                                <View key={idx} className="flex-1 items-center py-1.5">
                                    <Text className="text-[11px] font-bold text-[#999]">{wd}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Day Grid */}
                        <View className="flex-row flex-wrap">
                            {buildCalendarGrid().map((day, idx) => {
                                if (day === null) {
                                    return (
                                        <View
                                            key={`empty-${idx}`}
                                            className="items-center justify-center mb-0.5"
                                            style={{ width: `${100 / 7}%`, aspectRatio: 1 }}
                                        />
                                    );
                                }
                                const selected = isSelectedDay(day);
                                const todayFlag = isToday(day);
                                return (
                                    <Pressable
                                        key={idx}
                                        className="items-center justify-center mb-0.5"
                                        style={{ width: `${100 / 7}%`, aspectRatio: 1 }}
                                        onPress={() => handleSelectDay(day)}
                                    >
                                        <View
                                            className={`w-8 h-8 rounded-full items-center justify-center ${selected
                                                    ? 'bg-[#2c3e50]'
                                                    : todayFlag
                                                        ? 'border-[1.5px] border-[#2c3e50]'
                                                        : ''
                                                }`}
                                        >
                                            <Text
                                                className={`text-[13px] font-medium ${selected
                                                        ? 'text-white font-bold'
                                                        : todayFlag
                                                            ? 'text-[#2c3e50] font-bold'
                                                            : 'text-[#333]'
                                                    }`}
                                            >
                                                {day}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Pressable
                            className="mt-3 self-center py-2 px-4"
                            onPress={() => setShowDatePicker(false)}
                        >
                            <Text className="text-[13px] font-semibold text-[#888]">Close</Text>
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
                <Pressable
                    className="flex-1 bg-black/50 justify-center items-center px-6"
                    onPress={() => setShowTimePicker(false)}
                >
                    <Pressable
                        className="w-full max-w-[280px] bg-white rounded-2xl p-[18px]"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 12,
                            elevation: 10,
                        }}
                        onPress={(e) => e.stopPropagation?.()}
                    >

                        <Text className="text-[15px] font-bold text-[#2c3e50] text-center mb-3.5">
                            Select Time
                        </Text>

                        <View className="flex-row items-center justify-center gap-2">
                            {/* Hours */}
                            <View className="items-center">
                                <Text className="text-[11px] font-bold text-[#999] mb-1.5">Hour</Text>
                                <ScrollView
                                    style={{ height: 160, width: 64 }}
                                    className="border border-[#eee] rounded-lg"
                                    showsVerticalScrollIndicator={false}
                                    nestedScrollEnabled
                                >
                                    {HOURS.map((h) => {
                                        const active = h === tempHour;
                                        return (
                                            <Pressable
                                                key={h}
                                                className={`py-2.5 items-center ${active ? 'bg-[#2c3e50]' : ''}`}
                                                onPress={() => setTempHour(h)}
                                            >
                                                <Text
                                                    className={`text-sm font-medium ${active ? 'text-white font-bold' : 'text-[#333]'
                                                        }`}
                                                >
                                                    {pad2(h)}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>

                            <Text className="text-xl font-bold text-[#888] mt-[18px]">:</Text>

                            {/* Minutes */}
                            <View className="items-center">
                                <Text className="text-[11px] font-bold text-[#999] mb-1.5">Min</Text>
                                <ScrollView
                                    style={{ height: 160, width: 64 }}
                                    className="border border-[#eee] rounded-lg"
                                    showsVerticalScrollIndicator={false}
                                    nestedScrollEnabled
                                >
                                    {MINUTES.map((m) => {
                                        const active = m === tempMinute;
                                        return (
                                            <Pressable
                                                key={m}
                                                className={`py-2.5 items-center ${active ? 'bg-[#2c3e50]' : ''}`}
                                                onPress={() => setTempMinute(m)}
                                            >
                                                <Text
                                                    className={`text-sm font-medium ${active ? 'text-white font-bold' : 'text-[#333]'
                                                        }`}
                                                >
                                                    {pad2(m)}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </View>

                        <Pressable
                            className="mt-4 bg-[#2c3e50] py-3 rounded-lg items-center justify-center flex-row gap-1.5"
                            onPress={confirmTime}
                        >
                            <Check size={16} color="#fff" strokeWidth={3} />
                            <Text className="text-white text-sm font-bold">
                                Set {pad2(tempHour)}:{pad2(tempMinute)}
                            </Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </Modal>
    );
}