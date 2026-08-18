// components/StatusBadge.jsx
import { View, Text } from 'react-native';
import { getStatusConfig } from '../constants/tableStatus';

export default function StatusBadge({ status, size = 'sm' }) {
    const config = getStatusConfig(status);
    const isSmall = size === 'sm';

    return (
        <View
            style={{ backgroundColor: config.accent }}
            className={`rounded-full ${isSmall ? 'px-2.5 py-1' : 'px-3 py-1.5'}`}
        >
            <Text
                style={{ color: config.badgeText }}
                className={`font-semibold ${isSmall ? 'text-[11px]' : 'text-xs'}`}
            >
                {config.label}
            </Text>
        </View>
    );
}