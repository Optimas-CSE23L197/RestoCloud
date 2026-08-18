// app/(auth)/RestaurantPicker.jsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Building2, ChevronRight, MapPin } from 'lucide-react-native';
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

    const handleSelect = async (restaurant) => {
        await selectRestaurant(restaurant);
        router.replace('/(tabs)/Dashboard');
    };

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* Top Red Background (Consistent with Login Screens) */}
                <View className="absolute top-0 left-0 right-0 h-[38%] bg-[#d32f2f] rounded-b-[40px]" />

                {/* Header Section */}
                <View className="items-center pt-16 pb-6">
                    <Building2 size={52} color="#FFFFFF" strokeWidth={2} className="mb-3" />
                    <Text className="text-3xl text-white font-bold tracking-wider">
                        Select Restaurant
                    </Text>
                    <Text className="text-white/80 text-sm mt-1 font-medium">
                        Choose where you're working today
                    </Text>
                </View>

                {/* Restaurant Cards */}
                <View className="mx-5 mt-2">
                    {(restaurantList || []).map((restaurant, index) => (
                        <TouchableOpacity
                            key={`${restaurant.rcode}-${index}`}
                            onPress={() => handleSelect(restaurant)}
                            className="bg-white rounded-2xl shadow-xl shadow-black/10 p-5 mb-4 flex-row items-center justify-between border border-gray-100"
                        >
                            {/* Left Side: Icon + Info */}
                            <View className="flex-1 flex-row items-center">
                                {/* Icon Circle */}
                                <View className="w-14 h-14 rounded-xl bg-red-50 items-center justify-center mr-4">
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

                            {/* Right Arrow Icon */}
                            <ChevronRight size={22} color="#d32f2f" strokeWidth={2.5} />
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}