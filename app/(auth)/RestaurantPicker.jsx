// app/(auth)/RestaurantPicker.jsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Building2, ChevronRight, MapPin, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function RestaurantPicker() {
    const { restaurantList, selectRestaurant, isLoggedIn } = useAuth();

    // Safety check: Agar list empty hai toh CompanyLogin pe bhej do
    useEffect(() => {
        if (!isLoggedIn || !restaurantList || restaurantList.length === 0) {
            Alert.alert('Error', 'Please login first');
            router.replace('/(auth)/CompanyLogin');
        }
    }, [isLoggedIn, restaurantList]);

    const handleSelect = async (pos) => {
        // Pass the whole object to selectRestaurant
        await selectRestaurant(pos);
        router.replace('/(tabs)/Dashboard');
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" backgroundColor="#d32f2f" />
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Top Red Background (Consistent with Login Screens) */}
                <View className="absolute top-0 left-0 right-0 h-[38%] bg-[#d32f2f] rounded-b-[40px]" />

                {/* Header Section */}
                <View className="items-center pt-16 pb-6 mt-2">
                    {/* Logo with premium styling */}
                    <View className="bg-white/15 p-4 rounded-full mb-3 shadow-2xl shadow-black/30 border border-white/20">
                        <Building2 size={44} color="#FFFFFF" strokeWidth={2} />
                    </View>

                    {/* ✅ RestoCloud Branding */}
                    <Text className="text-3xl text-white font-bold tracking-wider drop-shadow-lg">
                        RestoCloud
                    </Text>

                    {/* ✅ Premium tagline */}
                    <View className="flex-row items-center mt-2">
                        <Sparkles size={13} color="rgba(255,255,255,0.85)" strokeWidth={2} />
                        <Text className="text-white/80 text-sm font-medium tracking-wide ml-1.5">
                            Streamline your restaurant operations
                        </Text>
                    </View>

                    {/* Select Restaurant Title */}
                    <Text className="text-white text-xl font-semibold tracking-wide mt-6">
                        Select Restaurant
                    </Text>
                    <Text className="text-white/70 text-sm mt-1 font-medium">
                        Choose where you're working today
                    </Text>

                    {/* ✅ Decorative dots */}
                    <View className="flex-row mt-3 space-x-3">
                        <View className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                        <View className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                        <View className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                    </View>
                </View>

                {/* Restaurant Cards */}
                <View className="mx-5 mt-2">
                    {(restaurantList || []).map((restaurant, index) => (
                        <TouchableOpacity
                            key={`${restaurant.rcode}-${index}`}
                            onPress={() => handleSelect(restaurant)}
                            activeOpacity={0.8}
                            className="bg-white rounded-3xl shadow-2xl shadow-black/15 p-5 mb-4 flex-row items-center justify-between border border-gray-100/80"
                        >
                            {/* Left Side: Icon + Info */}
                            <View className="flex-1 flex-row items-center">
                                {/* Premium Icon Circle */}
                                <View className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 items-center justify-center mr-4 shadow-sm">
                                    <Building2 size={24} color="#d32f2f" strokeWidth={2} />
                                </View>

                                {/* Text Info */}
                                <View className="flex-1">
                                    <Text className="text-[17px] font-extrabold text-gray-900 tracking-tight">
                                        {restaurant.Restaurantnm}
                                    </Text>
                                    {!!restaurant.address && (
                                        <View className="flex-row items-center mt-1">
                                            <MapPin size={14} color="#888888" strokeWidth={2} />
                                            <Text className="text-[13px] text-gray-500 ml-1.5">
                                                {restaurant.address}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Premium Right Arrow Icon */}
                            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                                <ChevronRight size={20} color="#d32f2f" strokeWidth={2.5} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ✅ Premium Footer with white space graphic */}
                <View className="mt-8 px-5 items-center">
                    <View className="w-16 h-px bg-gray-300 opacity-50 mb-4" />

                    <View className="flex-row items-center">
                        <ShieldCheck size={13} color="#d32f2f" strokeWidth={2} />
                        <Text className="text-[11px] text-gray-400 font-medium ml-1.5 tracking-wide">
                            Your data is encrypted and secure
                        </Text>
                    </View>

                    <Text className="text-[9px] text-gray-300 mt-4 tracking-[2px] uppercase">
                        © 2026 RestoCloud
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}