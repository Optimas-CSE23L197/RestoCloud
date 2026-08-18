// components/DashboardHeader.jsx
import { View, Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import Button from './Button';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardHeader({ title = 'Dashboard - Captain', onReserveTable }) {
    return (
        <SafeAreaView className="bg-red-600">
            <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="text-white text-lg font-bold">{title}</Text>
                <Button
                    label="Reserve"
                    size="lg"
                    variant="outline"
                    icon={<Plus size={15} color="#DC2626" />}
                    onPress={onReserveTable}
                />
            </View>
        </SafeAreaView>
    );
}