import { colors, spacing, typography } from "@/constants/theme";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export const LiveClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const hours = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).split(" ")[0];
    const ampm = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).split(" ")[1];

    return (
        <View style={styles.clockContainer}>
            <Text style={styles.clockTime}>{hours}</Text>
            <Text style={styles.clockAmPm}>{ampm}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    clockContainer: { flexDirection: "row", alignItems: "baseline", marginBottom: spacing.sm },
    clockTime: { fontSize: 48, fontFamily: typography.bold, color: colors.black, letterSpacing: -1.5 },
    clockAmPm: { fontSize: 16, fontFamily: typography.bold, color: colors.primary, marginLeft: 4 },
})
