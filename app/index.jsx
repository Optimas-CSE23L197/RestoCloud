import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ImageBackground, Pressable, StatusBar, Text, View, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
    const router = useRouter();

    const handleGetStarted = () => {
        router.replace("/(auth)/CompanyLogin");
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {/* Background Image */}
            <ImageBackground
                source={require("../assets/splash-screen_v4.png")}
                resizeMode="cover"
                className="flex-1 justify-center items-center"
            >
                {/* Button Container (Absolute Position) */}
                <View
                    className="absolute left-0 right-0 items-center z-10"
                    style={{ bottom: height * 0.1 }}
                >
                    <Pressable
                        onPress={handleGetStarted}
                        className="bg-[#d32f2f] rounded-full px-12 py-4 shadow-lg shadow-black/40 active:opacity-95 active:scale-95 min-w-[60%] items-center justify-center"
                        style={{ elevation: 12 }}
                    >
                        <View className="flex-row items-center justify-center">
                            <Text className="text-white font-bold text-[20px] tracking-wider mr-2.5">
                                Get Started
                            </Text>
                            <Ionicons name="arrow-forward" size={22} color="#ffffff" className="mt-0.5" />
                        </View>
                    </Pressable>
                </View>
            </ImageBackground>
        </View>
    );
}