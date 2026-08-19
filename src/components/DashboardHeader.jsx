// components/DashboardHeader.jsx
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, Repeat, User, Building2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function DashboardHeader({ title = 'Dashboard - Captain', onReserveTable }) {
    const { selectedRestaurant, restaurantList, userType } = useAuth();

    const waiterName = selectedRestaurant?.usernm;
    const waiterCode = selectedRestaurant?.usercd;
    const restaurantName = selectedRestaurant?.Restaurantnm;
    const canSwitch = (restaurantList?.length || 0) > 1;

    return (
        <SafeAreaView className="bg-[#d32f2f]">
            <View className="px-4 pt-3.5 pb-3">
                {/* Top row: title + reserve button */}
                <View className="flex-row items-center justify-between">
                    <Text className="text-white text-xl font-extrabold tracking-tight">
                        {title}
                    </Text>

                    <TouchableOpacity
                        onPress={onReserveTable}
                        className="flex-row items-center bg-white/10 px-5 py-2.5 rounded-full border border-white/40 active:opacity-80"
                    >
                        <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                        <Text className="text-white font-semibold text-[13px] ml-1.5 tracking-wide">
                            Reserve
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Details row: restaurant + waiter + switch */}
                {(restaurantName || waiterName) && (
                    <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-white/10">
                        <View className="flex-1 mr-3 gap-1">
                            {!!restaurantName && (
                                <View className="flex-row items-center">
                                    <Building2 size={14} color="#FFFFFF" strokeWidth={2} />
                                    <Text
                                        numberOfLines={1}
                                        className="text-white/95 text-[13px] font-semibold ml-2"
                                    >
                                        {restaurantName}
                                    </Text>
                                </View>
                            )}
                            {!!waiterName && (
                                <View className="flex-row items-center">
                                    <User size={13} color="#FFFFFF" strokeWidth={2} />
                                    <Text
                                        numberOfLines={1}
                                        className="text-white/80 text-[12px] ml-2"
                                    >
                                        {waiterName}
                                        {waiterCode ? `  •  ID: ${waiterCode}` : ''}
                                        {userType ? `  •  ${userType === 'W' ? 'Waiter' : 'Captain'}` : ''}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {canSwitch && (
                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/RestaurantPicker')}
                                className="flex-row items-center bg-white/15 px-3.5 py-2 rounded-full border border-white/30 active:opacity-80"
                            >
                                <Repeat size={14} color="#FFFFFF" strokeWidth={2.5} />
                                <Text className="text-white font-medium text-xs ml-1.5">
                                    Switch
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* <TouchableOpacity onPress={logout} className="bg-white/20 px-3 py-1.5 rounded-full border border-white/30">
                            <Text className="text-white text-xs font-medium">Logout</Text>
                        </TouchableOpacity> */}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}