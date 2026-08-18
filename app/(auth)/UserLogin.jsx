// app/(auth)/UserLogin.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, ArrowLeft, LogIn } from 'lucide-react-native';
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-gray-50">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="absolute top-0 left-0 right-0 h-[38%] bg-[#d32f2f] rounded-b-[40px]" />
                <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-5 z-10 p-2 bg-white/20 rounded-full">
                    <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>

                <View className="items-center pt-14 pb-6 mt-4">
                    <Text className="text-3xl text-white font-bold tracking-wider">Welcome Back</Text>
                    <Text className="text-white/80 text-sm mt-1 font-medium">Log in to your account</Text>
                </View>

                <View className="bg-white mx-5 rounded-2xl shadow-2xl shadow-black/20 p-6">
                    <Text className="text-sm font-bold text-gray-600 mb-4 tracking-wider">LOGIN CREDENTIALS</Text>

                    <View className="mb-4">
                        <View className="flex-row items-center border border-gray-200 rounded-lg bg-gray-50 px-3 h-12">
                            <Mail size={18} color="#888888" strokeWidth={2} />
                            <TextInput
                                placeholder="waiter"
                                className="flex-1 ml-3 text-[14px] text-gray-800"
                                value={loginId}
                                onChangeText={setLoginId}
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View className="mb-5">
                        <View className="flex-row items-center border border-gray-200 rounded-lg bg-gray-50 px-3 h-12">
                            <Lock size={18} color="#888888" strokeWidth={2} />
                            <TextInput
                                placeholder="waiter"
                                className="flex-1 ml-3 text-[14px] text-gray-800"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleLogin} disabled={loading} className={`w-full py-3.5 rounded-lg flex-row items-center justify-center shadow-md ${loading ? 'bg-red-400' : 'bg-[#d32f2f]'}`}>
                        {loading ? (<Text className="text-white font-bold text-[16px]">Logging in...</Text>) : (
                            <><LogIn size={18} color="#FFFFFF" strokeWidth={2.5} /><Text className="text-white font-bold text-[16px] ml-2">Login</Text></>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}