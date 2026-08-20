// app/(auth)/CompanyLogin.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Alert,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Building2, ArrowLeft, Mail, Lock, LogIn, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { groupLogin as apiGroupLogin } from '../../api/system.api';
import * as SecureStore from 'expo-secure-store';

export default function CompanyLogin() {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { groupLogin } = useAuth();

    // Auto-fill saved credentials on mount
    useEffect(() => {
        const loadSavedCredentials = async () => {
            try {
                console.log('[CompanyLogin] Loading saved credentials from SecureStore...');
                const savedId = await SecureStore.getItemAsync('COMPANY_LOGIN_ID');
                const savedPass = await SecureStore.getItemAsync('COMPANY_PASSWORD');

                if (savedId) {
                    setLoginId(savedId);
                    console.log('[CompanyLogin] Saved Login ID found, auto-filled.');
                } else {
                    console.log('[CompanyLogin] No saved Login ID found.');
                }

                if (savedPass) {
                    setPassword(savedPass);
                    console.log('[CompanyLogin] Saved password found, auto-filled.');
                } else {
                    console.log('[CompanyLogin] No saved password found.');
                }
            } catch (error) {
                console.error('[CompanyLogin] Error loading saved credentials:', error);
            }
        };
        loadSavedCredentials();
    }, []);

    const handleLogin = async () => {
        console.log('[CompanyLogin] Login button pressed. loginId:', loginId);

        if (!loginId || !password) {
            console.warn('[CompanyLogin] Validation failed - missing loginId or password');
            Alert.alert('Error', 'Please enter Login ID and Password');
            return;
        }

        setLoading(true);
        console.log('[CompanyLogin] Calling groupLogin API...');

        try {
            const result = await groupLogin(loginId, password, apiGroupLogin);
            console.log('[CompanyLogin] groupLogin result:', result?.success);

            if (result.success) {
                console.log('[CompanyLogin] Login successful, navigating to UserLogin');
                router.replace('/(auth)/UserLogin');
            } else {
                console.warn('[CompanyLogin] Login failed:', result.error);
                Alert.alert('Login Failed', result.error || 'Invalid credentials');
            }
        } catch (error) {
            console.error('[CompanyLogin] Unexpected error during login:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                    onPress={() => {
                        console.log('[CompanyLogin] Back button pressed');
                        router.back();
                    }}
                    className="absolute top-12 left-5 z-10 p-2.5 bg-white/20 rounded-full active:bg-white/30"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>

                <View className="items-center pt-16 pb-6 mt-4">
                    <View className="bg-white/15 p-4 rounded-full mb-3 shadow-2xl shadow-black/30 border border-white/20">
                        <Building2 size={44} color="#FFFFFF" strokeWidth={2} />
                    </View>

                    <Text className="text-3xl text-white font-bold tracking-wider drop-shadow-lg">RestoCloud</Text>

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
                                placeholder="Enter your company ID"
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

                    {/* Password with Eye Toggler */}
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
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                                placeholderTextColor="#999"
                            />
                            {/* ✅ Eye Toggler */}
                            <TouchableOpacity
                                onPress={() => setShowPassword((prev) => !prev)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                {showPassword ? (
                                    <EyeOff size={18} color="#888888" strokeWidth={2} />
                                ) : (
                                    <Eye size={18} color="#888888" strokeWidth={2} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                        className={`w-full py-3.5 rounded-xl flex-row items-center justify-center shadow-lg mt-5 ${loading ? 'bg-red-400' : 'bg-[#d32f2f]'
                            }`}
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

                {/* Minimal premium footer */}
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
        </KeyboardAvoidingView>
    );
}