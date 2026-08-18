// app/(tabs)/_layout.jsx
import { Tabs } from 'expo-router';
import { LayoutDashboard } from 'lucide-react-native';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#d32f2f' }}>
            <Tabs.Screen
                name="Dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}