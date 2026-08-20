// components/DashboardHeader.jsx
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, Repeat, User, Building2, FileBarChart, LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function DashboardHeader({ title = 'Dashboard - Captain', onReserveTable }) {
    const { selectedRestaurant, restaurantList, userType, logout } = useAuth();

    const waiterName = selectedRestaurant?.usernm;
    const restaurantName = selectedRestaurant?.Restaurantnm;
    const canSwitch = (restaurantList?.length || 0) > 1;
    const isWaiter = userType === "W";

    return (
        <SafeAreaView className="bg-[#d32f2f]">
            <View className="px-4 pt-4">
                {/* Top row: title + reserve + report buttons */}
                <View className="flex-row items-center justify-between">
                    <Text className="text-white text-xl font-extrabold tracking-tight">
                        {title}
                    </Text>

                    <View className="flex-row items-center gap-2">
                        {!isWaiter && (
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/BillRegister')}
                                className="w-9 h-9 items-center justify-center bg-white/10 rounded-full border border-white/40 active:opacity-80"
                            >
                                <FileBarChart size={17} color="#FFFFFF" strokeWidth={2.5} />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={onReserveTable}
                            className="flex-row items-center bg-white/10 px-4 py-2 rounded-full border border-white/40 active:opacity-80"
                        >
                            <Plus size={17} color="#FFFFFF" strokeWidth={2.5} />
                            <Text className="text-white font-semibold text-[14px] ml-1.5 tracking-wide">
                                Reserve
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Details row: restaurant + waiter on the left, actions on the right */}
                {(restaurantName || waiterName) && (
                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-white/15">
                        <View className="flex-1 mr-3">
                            {!!restaurantName && (
                                <View className="flex-row items-center mb-1">
                                    <Building2 size={15} color="#FFFFFF" strokeWidth={2} />
                                    <Text
                                        numberOfLines={1}
                                        className="text-white text-[15px] font-semibold ml-2 flex-1"
                                    >
                                        {restaurantName}
                                    </Text>
                                </View>
                            )}
                            {!!waiterName && (
                                <View className="flex-row items-center">
                                    <User size={14} color="#FFFFFF" strokeWidth={2} />
                                    <Text
                                        numberOfLines={1}
                                        className="text-white/80 text-[13px] ml-2"
                                    >
                                        {userType === 'W' ? 'Waiter' : 'Cashier'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View className="flex-row items-center gap-2">
                            {canSwitch && (
                                <TouchableOpacity
                                    onPress={() => router.push('/(auth)/RestaurantPicker')}
                                    className="flex-row items-center bg-white/20 px-3.5 py-2 rounded-full border border-white/30 active:opacity-80"
                                >
                                    <Repeat size={15} color="#FFFFFF" strokeWidth={2.5} />
                                    <Text className="text-white font-medium text-[12.5px] ml-1.5">
                                        Switch
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                onPress={logout}
                                className="w-9 h-9 items-center justify-center bg-white/10 rounded-full border border-white/30 active:opacity-80"
                            >
                                <LogOut size={16} color="#FFFFFF" strokeWidth={2.5} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}