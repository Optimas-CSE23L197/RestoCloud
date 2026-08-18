import "./global.css";

import { StyleSheet, Text, View } from "react-native";
import CaptainDashboardScreen from "./src/components/CaptainDashboardScreen";

export default function App() {
  return (
    <View style={styles.container}>
      <CaptainDashboardScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
