// components/DashboardHeader.jsx
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, Repeat, User, Building2, FileBarChart, LogOut, Printer } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function DashboardHeader({ title = 'Dashboard', onReserveTable }) {
    const { selectedRestaurant, restaurantList, userType, logout } = useAuth();

    const waiterName = selectedRestaurant?.usernm;
    const restaurantName = selectedRestaurant?.Restaurantnm;
    const canSwitch = (restaurantList?.length || 0) > 1;
    const isWaiter = userType === "W";

    return (
        <SafeAreaView className="bg-[#d32f2f]" edges={['top']}>
            <View className="px-4 pt-2.5 pb-2.5">
                {/* Single compact row: title on the left, everything else on the right */}
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-2">
                        <Text
                            numberOfLines={1}
                            className="text-white text-[17px] font-extrabold tracking-tight"
                        >
                            {title} {!isWaiter ? "Cashier" : "Captain"}
                        </Text>
                        {(restaurantName || waiterName) && (
                            <View className="flex-row items-center mt-0.5">
                                {!!restaurantName && (
                                    <View className="flex-row items-center">
                                        <Building2 size={11} color="#FFFFFF" strokeWidth={2} />
                                        <Text
                                            numberOfLines={1}
                                            className="text-white/80 text-[11.5px] font-medium ml-1"
                                        >
                                            {restaurantName}
                                        </Text>
                                    </View>
                                )}
                                {!!restaurantName && !!waiterName && (
                                    <Text className="text-white/50 text-[11px] mx-1.5">•</Text>
                                )}
                                {!!waiterName && (
                                    <View className="flex-row items-center">
                                        <User size={11} color="#FFFFFF" strokeWidth={2} />
                                        <Text className="text-white/80 text-[11.5px] font-medium ml-1">
                                            {userType === 'W' ? 'Waiter' : 'Cashier'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    <View className="flex-row items-center gap-1.5">
                        {!isWaiter && (
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/BillRegister')}
                                className="w-10 h-10 items-center justify-center bg-white/10 rounded-full border border-white/30 active:opacity-80"
                            >
                                <FileBarChart size={15} color="#FFFFFF" strokeWidth={2.5} />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/PrinterSetupScreen')}
                            className="w-8 h-8 items-center justify-center bg-white/10 rounded-full border border-white/30 active:opacity-80"
                        >
                            <Printer size={15} color="#FFFFFF" strokeWidth={2.5} />
                        </TouchableOpacity>

                        {canSwitch && (
                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/RestaurantPicker')}
                                className="w-8 h-8 items-center justify-center bg-white/10 rounded-full border border-white/30 active:opacity-80"
                            >
                                <Repeat size={15} color="#FFFFFF" strokeWidth={2.5} />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={onReserveTable}
                            className="flex-row items-center bg-white/15 px-3 py-1.5 rounded-full border border-white/40 active:opacity-80"
                        >
                            <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
                            <Text className="text-white font-semibold text-[12.5px] ml-1 tracking-wide">
                                Reserve
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={logout}
                            className="w-8 h-8 items-center justify-center bg-white/10 rounded-full border border-white/30 active:opacity-80"
                        >
                            <LogOut size={14} color="#FFFFFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView >
    );
}