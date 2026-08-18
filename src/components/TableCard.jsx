// components/TableCard.jsx
import { Pressable, View, Text } from 'react-native';
import { Users, Clock, Receipt, UserCheck2 } from 'lucide-react-native';
import { getStatusConfig, TABLE_STATUS } from '../constants/tableStatus';
import StatusBadge from './StatusBadge';

/**
 * TableCard
 *
 * Props:
 *  - tableNo: string ("T-01")
 *  - status: 'occupied' | 'billed' | 'reserved' | 'vacant'
 *  - pax: number (seating capacity)
 *  - guests: number (current guest count) — shown when occupied
 *  - amount: number — shown when occupied/billed (₹)
 *  - billStatus: string — e.g. "Printed" (shown when billed)
 *  - reservedTime: string — e.g. "8:00 PM" (shown when reserved)
 *  - reservedBy: string — e.g. "Rahul Sharma" (shown when reserved)
 *  - onPress: () => void
 */
export default function TableCard({
    tableNo,
    status = TABLE_STATUS.VACANT,
    pax,
    guests,
    amount,
    billStatus,
    reservedTime,
    reservedBy,
    onPress,
}) {
    const config = getStatusConfig(status);

    const renderMeta = () => {
        switch (status) {
            case TABLE_STATUS.OCCUPIED:
                return (
                    <View className="flex-row items-center gap-1.5">
                        <Users size={14} color="#6B7280" />
                        <Text className="text-[13px] text-gray-500">{guests} Guests</Text>
                    </View>
                );
            case TABLE_STATUS.BILLED:
                return (
                    <View className="flex-row items-center gap-1.5">
                        <Receipt size={14} color="#6B7280" />
                        <Text className="text-[13px] text-gray-500">{billStatus ?? 'Printed'}</Text>
                    </View>
                );
            case TABLE_STATUS.RESERVED:
                return (
                    <View className="flex-row items-center gap-1.5">
                        <Clock size={14} color={config.textColor} />
                        <Text style={{ color: config.textColor }} className="text-[13px] font-semibold">
                            {reservedTime}
                        </Text>
                    </View>
                );
            case TABLE_STATUS.VACANT:
            default:
                return (
                    <View className="flex-row items-center gap-1.5">
                        <UserCheck2 size={14} color="#16A34A" />
                        <Text className="text-[13px] text-green-600 font-medium">Available</Text>
                    </View>
                );
        }
    };

    const renderFooter = () => {
        if ((status === TABLE_STATUS.OCCUPIED || status === TABLE_STATUS.BILLED) && amount !== undefined) {
            return (
                <Text style={{ color: config.textColor }} className="text-base font-bold mt-1.5">
                    ₹{amount.toLocaleString('en-IN')}
                </Text>
            );
        }
        if (status === TABLE_STATUS.RESERVED && reservedBy) {
            return <Text className="text-[13px] text-gray-500 mt-1.5">{reservedBy}</Text>;
        }
        if (status === TABLE_STATUS.VACANT && pax !== undefined) {
            return <Text className="text-[13px] text-gray-500 mt-1.5">{pax} Pax</Text>;
        }
        return null;
    };

    return (
        <Pressable
            onPress={onPress}
            style={{ borderLeftColor: config.accent }}
            className="w-full bg-white rounded-2xl border border-gray-100 border-l-4 p-3.5 shadow-sm active:opacity-70"
        >
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[15px] font-bold text-gray-900">{tableNo}</Text>
                <StatusBadge status={status} />
            </View>

            {renderMeta()}
            {renderFooter()}
        </Pressable>
    );
}