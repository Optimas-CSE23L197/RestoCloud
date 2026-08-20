// app/(auth)/_layout.jsx
import { Stack } from 'expo-router';
import { View, Text, Image } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

export default function AuthLayout() {
    return (
        <View className="flex-1 bg-white">
            {/* Auth Screens (Stack) */}
            <Stack screenOptions={{ headerShown: false }} />

            {/* ✅ Footer — Fixed at bottom */}
            <View className="absolute bottom-0 left-0 right-0 items-center py-4 px-5 bg-white border-t border-[#f0f0f0]">
                {/* Company Logo */}
                <Image
                    source={require('../../assets/company-logo.jpeg')}
                    className="w-[60px] h-[60px] mb-1.5 rounded-lg"
                    resizeMode="contain"
                />

                {/* Secure Text */}
                <View className="flex-row items-center gap-1.5 mb-1">
                    <ShieldCheck size={16} color="#d32f2f" strokeWidth={2.3} />
                    <Text className="text-[12px] font-medium text-[#666]">
                        Abatech Solution
                    </Text>
                </View>

                {/* Copyright (optional) */}
                <Text className="text-[10px] text-[#aaa] tracking-wide">
                    © 2026 RESTO CLOUD
                </Text>
            </View>
        </View>
    );
}