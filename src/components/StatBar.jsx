// components/StatBar.jsx
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

    // Hex to RGBA converter for safe opacity
    const hexToRGBA = (hex, opacity) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    return (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                paddingVertical: 4,
            }}
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingVertical: 8,
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
                                    paddingHorizontal: 14,
                                    borderRadius: 12,
                                    borderWidth: 1.5,
                                    borderColor: active
                                        ? item.color
                                        : '#E5E7EB',
                                    backgroundColor: active
                                        ? hexToRGBA(item.color, 0.12)
                                        : '#fff',
                                    gap: 6, // Better spacing between elements
                                }}
                            >
                                <Icon
                                    size={16}
                                    color={
                                        active
                                            ? item.color
                                            : '#6B7280'
                                    }
                                    strokeWidth={2.5}
                                />

                                <Text
                                    style={{
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
                                        minWidth: 22,
                                        height: 22,
                                        paddingHorizontal: 6,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 11,
                                        backgroundColor: active
                                            ? hexToRGBA(item.color, 0.20)
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