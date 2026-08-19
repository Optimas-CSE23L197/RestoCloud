// app/(auth)/UserLogin.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, ArrowLeft, LogIn, ShieldCheck, Sparkles, Building2 } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { userLogin as apiUserLogin } from '../../api/system.api';
import * as SecureStore from 'expo-secure-store';

export default function UserLogin() {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { userLogin, hotelGroupCode } = useAuth();

    // Auto-fill saved User credentials on mount
    useEffect(() => {
        const loadSavedCredentials = async () => {
            try {
                const savedId = await SecureStore.getItemAsync('USER_LOGIN_ID');
                const savedPass = await SecureStore.getItemAsync('USER_PASSWORD');
                if (savedId) setLoginId(savedId);
                if (savedPass) setPassword(savedPass);
            } catch (error) {
                console.error('Error loading saved credentials:', error);
            }
        };
        loadSavedCredentials();
    }, []);

    // Safety Check: agar hotelGroupCode null hai, toh CompanyLogin pe bhejo
    useEffect(() => {
        if (!hotelGroupCode) {
            Alert.alert('Error', 'Please login as Company first');
            router.replace('/(auth)/CompanyLogin');
        }
    }, [hotelGroupCode]);

    const handleLogin = async () => {
        if (!loginId || !password) {
            Alert.alert('Error', 'Please enter Login ID and Password');
            return;
        }

        setLoading(true);
        const result = await userLogin(loginId, password, apiUserLogin);
        setLoading(false);

        if (result.success) {
            // Save User credentials securely for auto-fill next time
            await SecureStore.setItemAsync('USER_LOGIN_ID', loginId);
            await SecureStore.setItemAsync('USER_PASSWORD', password);

            if (result.needsRestaurantSelection) {
                // Multiple restaurants → Show Restaurant Picker
                router.replace('/(auth)/RestaurantPicker');
            } else {
                // Single restaurant → Direct Dashboard
                router.replace('/(tabs)/Dashboard');
            }
        } else {
            Alert.alert('Login Failed', result.error || 'Invalid credentials');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-gray-50"
        >
            <StatusBar barStyle="light-content" backgroundColor="#d32f2f" />
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
            >
                <View className="absolute top-0 left-0 right-0 h-[38%] bg-[#d32f2f] rounded-b-[40px]" />

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-5 z-10 p-2.5 bg-white/20 rounded-full active:bg-white/30"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>

                <View className="items-center pt-16 pb-6 mt-4">
                    {/* Logo icon */}
                    <View className="bg-white/15 p-4 rounded-full mb-3 shadow-2xl shadow-black/30 border border-white/20">
                        <Building2 size={44} color="#FFFFFF" strokeWidth={2} />
                    </View>

                    {/* ✅ Branding: RestoCloud */}
                    <Text className="text-3xl text-white font-bold tracking-wider drop-shadow-lg">RestoCloud</Text>

                    {/* ✅ Premium tagline */}
                    <View className="flex-row items-center mt-2">
                        <Sparkles size={13} color="rgba(255,255,255,0.85)" strokeWidth={2} />
                        <Text className="text-white/80 text-sm font-medium tracking-wide ml-1.5">
                            Streamline your restaurant operations
                        </Text>
                    </View>
                </View>

                <View className="bg-white mx-5 rounded-3xl shadow-2xl shadow-black/30 p-6 mt-2 border border-gray-100/50">
                    <Text className="text-xl font-bold text-gray-800 mb-1">Welcome Back</Text>
                    <Text className="text-gray-500 text-sm mb-6">Enter your credentials to continue</Text>

                    {/* Login ID */}
                    <View className="mb-4">
                        <Text className="text-xs font-bold text-gray-600 mb-1.5 tracking-wider">
                            LOGIN ID
                        </Text>
                        <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50/80 px-3 h-12 focus:border-[#d32f2f] shadow-sm">
                            <Mail size={18} color="#888888" strokeWidth={2} />
                            <TextInput
                                placeholder="Enter your user ID"
                                className="flex-1 ml-3 text-[14px] text-gray-800"
                                value={loginId}
                                onChangeText={setLoginId}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View className="mb-2">
                        <Text className="text-xs font-bold text-gray-600 mb-1.5 tracking-wider">
                            PASSWORD
                        </Text>
                        <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50/80 px-3 h-12 shadow-sm">
                            <Lock size={18} color="#888888" strokeWidth={2} />
                            <TextInput
                                placeholder="Enter your password"
                                className="flex-1 ml-3 text-[14px] text-gray-800"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                        className={`w-full py-3.5 rounded-xl flex-row items-center justify-center shadow-lg mt-5 ${loading ? 'bg-red-400' : 'bg-[#d32f2f]'}`}
                    >
                        {loading ? (
                            <Text className="text-white font-bold text-[16px]">Logging in...</Text>
                        ) : (
                            <>
                                <LogIn size={18} color="#FFFFFF" strokeWidth={2.5} />
                                <Text className="text-white font-bold text-[16px] ml-2">Login</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ✅ Premium footer with white space graphic */}
                <View className="mt-8 px-5 items-center">
                    <View className="w-16 h-px bg-gray-300 opacity-50 mb-4" />

                    <View className="flex-row items-center">
                        <ShieldCheck size={13} color="#d32f2f" strokeWidth={2} />
                        <Text className="text-[11px] text-gray-400 font-medium ml-1.5 tracking-wide">
                            Your data is encrypted and secure
                        </Text>
                    </View>

                    {/* ✅ Copyright updated */}
                    <Text className="text-[9px] text-gray-300 mt-4 tracking-[2px] uppercase">
                        © 2026 RestoCloud
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}