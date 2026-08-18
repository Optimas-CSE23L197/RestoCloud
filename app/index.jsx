import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ImageBackground, Pressable, StatusBar, Text, View, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
    const router = useRouter();

    const handleGetStarted = () => {
        router.replace("/(auth)/CompanyLogin");
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background Image */}
            <ImageBackground
                source={require("../assets/splash-screen_v3.png")}
                resizeMode="cover"
                style={styles.imageBackground}
            >
                {/* Button Container (Absolute Position) */}
                <View style={styles.buttonContainer}>
                    <Pressable
                        onPress={handleGetStarted}
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.buttonPressed,
                        ]}
                    >
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonText}>
                                Get Started
                            </Text>
                            <Ionicons name="arrow-forward" size={22} color="#d32f2f" style={styles.icon} />
                        </View>
                    </Pressable>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    imageBackground: {
        flex: 1,
        justifyContent: "center", // Center content vertically
        alignItems: "center",     // Center content horizontally
    },
    buttonContainer: {
        position: "absolute",     // <-- BUTTON KO IMAGE KE UPAR FIX KARO
        bottom: height * 0.1,     // Screen ke bottom se 10% upar
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 10,               // Button ko sabse upar rakho
    },
    button: {
        backgroundColor: "#d32f2f", // Bright Red (Image par clearly dikhega)
        borderRadius: 50,
        paddingHorizontal: 50,
        paddingVertical: 18,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 12,            // Android shadow
        minWidth: width * 0.6,    // Button ki minimum width
        alignItems: "center",
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.96 }],
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "#d32f2f",
        fontWeight: "bold",
        fontSize: 20,
        letterSpacing: 1,
        marginRight: 10,
    },
    icon: {
        marginTop: 2,
    },
});