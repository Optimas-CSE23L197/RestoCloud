// components/Button.jsx
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * variant: 'primary' | 'outline' | 'ghost'
 * size: 'sm' | 'md' | 'lg'
 */
export default function Button({
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    icon,
    loading = false,
    disabled = false,
    fullWidth = false,
}) {
    const handlePress = () => {
        if (disabled || loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    const sizeClasses = {
        sm: 'px-3 py-2',
        md: 'px-4 py-2.5',
        lg: 'px-5 py-3.5',
    }[size];

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    }[size];

    const variantClasses = {
        primary: 'bg-red-600 border border-red-600',
        outline: 'bg-white border border-red-600',
        ghost: 'bg-transparent border border-transparent',
    }[variant];

    const textColorClasses = {
        primary: 'text-white',
        outline: 'text-red-600',
        ghost: 'text-red-600',
    }[variant];

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled || loading}
            className={`flex-row items-center justify-center rounded-xl ${sizeClasses} ${variantClasses} ${fullWidth ? 'w-full' : ''
                } ${disabled ? 'opacity-40' : 'active:opacity-70'}`}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' ? '#FFFFFF' : '#DC2626'}
                />
            ) : (
                <View className="flex-row items-center gap-1.5">
                    {icon}
                    <Text className={`font-semibold ${textSizeClasses} ${textColorClasses}`}>
                        {label}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}