import { ScrollView, Pressable, Text, View } from 'react-native';
import {
    Users,
    CheckCircle2,
    ShieldCheck,
    Grid3x3,
    FileText,
} from 'lucide-react-native';
import { TABLE_STATUS } from '../constants/tableStatus';

export default function StatBar({
    counts,
    activeFilter = 'all',
    onFilterChange,
}) {
    const items = [
        {
            key: 'all',
            label: 'Total',
            count: counts.total,
            color: '#374151',
            icon: Grid3x3,
        },
        {
            key: TABLE_STATUS.OCCUPIED,
            label: 'Occupied',
            count: counts.occupied,
            color: '#DC2626',
            icon: Users,
        },
        {
            key: TABLE_STATUS.VACANT,
            label: 'Available',
            count: counts.available,
            color: '#16A34A',
            icon: CheckCircle2,
        },
        {
            key: TABLE_STATUS.RESERVED,
            label: 'Reserved',
            count: counts.reserved,
            color: '#2563EB',
            icon: ShieldCheck,
        },
        {
            key: TABLE_STATUS.BILLED,
            label: 'Billed',
            count: counts.billed,
            color: '#374151',
            icon: FileText,
        },
    ];

    return (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB',
            }}
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingLeft: 0,
                    paddingRight: 4,
                    paddingVertical: 10,
                }}
            >
                {items.map((item) => {
                    const active = activeFilter === item.key;
                    const Icon = item.icon;

                    return (
                        <Pressable
                            key={item.key}
                            onPress={() => onFilterChange?.(item.key)}
                            style={{
                                marginRight: 8,
                            }}
                        >
                            <View
                                style={{
                                    height: 44,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 12,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: active
                                        ? item.color
                                        : '#E5E7EB',
                                    backgroundColor: active
                                        ? `${item.color}12`
                                        : '#fff',
                                }}
                            >
                                <Icon
                                    size={16}
                                    color={
                                        active
                                            ? item.color
                                            : '#6B7280'
                                    }
                                />

                                <Text
                                    style={{
                                        marginLeft: 6,
                                        fontSize: 13,
                                        fontWeight: '600',
                                        color: active
                                            ? item.color
                                            : '#4B5563',
                                    }}
                                >
                                    {item.label}
                                </Text>

                                <View
                                    style={{
                                        marginLeft: 7,
                                        minWidth: 22,
                                        height: 22,
                                        paddingHorizontal: 5,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 11,
                                        backgroundColor: active
                                            ? `${item.color}20`
                                            : '#F3F4F6',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '700',
                                            color: active
                                                ? item.color
                                                : '#6B7280',
                                        }}
                                    >
                                        {item.count}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}