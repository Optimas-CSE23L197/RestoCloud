// app/(auth)/CompanyLogin.jsx
import React, { useState, useEffect } from 'react'; // <-- useEffect import
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Building2, ArrowLeft, Mail, Lock, LogIn } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { groupLogin as apiGroupLogin } from '../../api/system.api';
import * as SecureStore from 'expo-secure-store'; // <-- Import

export default function CompanyLogin() {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { groupLogin } = useAuth();

    // ✅ Auto-fill saved credentials on mount
    useEffect(() => {
        const loadSavedCredentials = async () => {
            try {
                const savedId = await SecureStore.getItemAsync('COMPANY_LOGIN_ID');
                const savedPass = await SecureStore.getItemAsync('COMPANY_PASSWORD');
                if (savedId) setLoginId(savedId);
                if (savedPass) setPassword(savedPass);
            } catch (error) {
                console.error('Error loading saved credentials:', error);
            }
        };
        loadSavedCredentials();
    }, []);

    const handleLogin = async () => {
        if (!loginId || !password) {
            Alert.alert('Error', 'Please enter Login ID and Password');
            return;
        }

        setLoading(true);
        const result = await groupLogin(loginId, password, apiGroupLogin);
        setLoading(false);

        if (result.success) {
            router.replace('/(auth)/UserLogin');
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
                    <Building2 size={48} color="#FFFFFF" strokeWidth={2} className="mb-3" />
                    <Text className="text-3xl text-white font-bold tracking-wider">Check-In Cloud</Text>
                    <Text className="text-white/80 text-sm mt-1 font-medium">Login to your account</Text>
                </View>

                <View className="bg-white mx-5 rounded-2xl shadow-2xl shadow-black/20 p-6">
                    <Text className="text-xl font-bold text-gray-800 mb-1">Welcome Back</Text>
                    <Text className="text-gray-500 text-sm mb-6">Enter your credentials to continue</Text>

                    <View className="mb-4">
                        <Text className="text-xs font-bold text-gray-600 mb-1.5 tracking-wider">LOGIN ID</Text>
                        <View className="flex-row items-center border border-gray-200 rounded-lg bg-gray-50 px-3 h-12">
                            <Mail size={18} color="#888888" strokeWidth={2} />
                            <TextInput
                                placeholder="demohotel"
                                className="flex-1 ml-3 text-[14px] text-gray-800"
                                value={loginId}
                                onChangeText={setLoginId}
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View className="mb-5">
                        <Text className="text-xs font-bold text-gray-600 mb-1.5 tracking-wider">PASSWORD</Text>
                        <View className="flex-row items-center border border-gray-200 rounded-lg bg-gray-50 px-3 h-12">
                            <Lock size={18} color="#888888" strokeWidth={2} />
                            <TextInput
                                placeholder="dm@123"
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