// components/FilterChip.jsx
import { Pressable, Text, View } from 'react-native';

/**
 * Filter pill used in the top stat/filter bar
 * e.g. "Occupied - 4", "Available - 5", "Total - 10"
 *
 * accentColor: hex string used only when `active` (or always, if alwaysTinted)
 */
export default function FilterChip({
    label,
    count,
    icon,
    active = false,
    accentColor = '#DC2626',
    onPress,
}) {
    return (
        <Pressable
            onPress={onPress}
            className={`flex-row items-center gap-1.5 rounded-xl border px-3 py-2 mr-2 ${active ? '' : 'bg-white border-gray-200'
                }`}
            style={
                active
                    ? { backgroundColor: `${accentColor}14`, borderColor: accentColor }
                    : undefined
            }
        >
            {icon}
            <Text
                className="text-[13px] font-semibold"
                style={{ color: active ? accentColor : '#374151' }}
            >
                {label}
                {count !== undefined ? ` - ${count}` : ''}
            </Text>
        </Pressable>
    );
}