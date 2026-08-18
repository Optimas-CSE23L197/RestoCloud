// app/_layout.jsx
import "../global.css"
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
    initialRouteName: "index",
};

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function prepare() {
            try {
            } catch (e) {
                console.warn(e);
            } finally {
                setIsReady(true);
                await SplashScreen.hideAsync();
            }
        }
        prepare();
    }, []);

    if (!isReady) {
        return null;
    }

    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
            </Stack>
        </AuthProvider>
    );
}