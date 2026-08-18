// app/(auth)/_layout.jsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CompanyLogin" />
            <Stack.Screen name="UserLogin" />
            <Stack.Screen name="RestaurantPicker" />
        </Stack>
    );
}