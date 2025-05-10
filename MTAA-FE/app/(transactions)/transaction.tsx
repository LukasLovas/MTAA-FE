import { useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, router } from "expo-router";

export interface transaction{
    id: number;
    label: string;
    amount: number;
    creationDate: string;
    transactionTypeEnum: string;
    category: category;
    budget: budget;
    location: location | null;
    frequencyEnum: string;
    note: string;
    filename: string;
    currency: string;
}

interface category{
    id: number;
    label: string;
}

interface budget{
    id: number;
    label: string;
    amount: number;
    initialAmount: number;
    startDate: string;
    intervalValue: number;
    intervalEnum: string;
    lastResetDate: string;
}

interface location{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return (
        `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
};


const TransactionScreen = () => {
    const params = useLocalSearchParams<{
        id: string;
        label: string;
        amount: string; 
        creationDate: string;
        transactionTypeEnum: string;
        category: string; 
        budget: string;
        location: string;
        frequencyEnum: string;
        note: string;
        filename: string;
        currency: string;
    }>();

    const amount = Number(params.amount);

    const formattedAmount = useMemo(
        () =>
            `${amount >= 0 ? "+" : "-"}${Math.abs(amount).toFixed(0)}${
            params.currency ?? "€"
            }`,
        [amount, params.currency]
    );
    
    const dateStr = useMemo(
        () => formatDate(params.creationDate),
        [params.creationDate]
    );

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: "Transaction",
                    headerTitleAlign: "center",
                }}
            />
            
            <ScrollView
                contentContainerStyle={{ padding: 20, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.row}>
                    <View style={styles.avatar}>
                        <Ionicons name="receipt-outline" size={24} color="black" />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.title}>{params.label}</Text>
                        {params.category ? (
                            <View style={styles.catRow}>
                                <MaterialCommunityIcons
                                name="silverware-fork-knife"
                                size={14}
                                style={{ marginRight: 4 }}
                                />
                                <Text style={styles.catText}>{params.category}</Text>
                            </View>
                        ) : null}
                    </View>

                    <Text style={styles.amount}>{formattedAmount}</Text>
                </View>

                <View style={styles.pillRow}>
                    {params.location ? (
                        <Pill text={params.location} />
                    ) : (
                        <Pill text="Default" />
                    )}
                    {params.budget ? <Pill text={params.budget} /> : null}
                </View>

                <Pill
                    text={dateStr}
                    icon={<Ionicons name="calendar-outline" size={14} />}
                    style={{ alignSelf: "flex-start", marginTop: 6 }}
                />

                {params.note ? (
                    <Text style={styles.note}>
                        <Text style={{ fontWeight: "600" }}>Note:</Text> {params.note}
                    </Text>
                ) : null}

                <View style={{ flex: 1 }} />

                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => router.push({
                        pathname: "/(transactions)/[id]",
                        params: {
                            id: params.id,
                            label: params.label,
                            amount: params.amount,
                            creationDate: params.creationDate,
                            transactionTypeEnum: params.transactionTypeEnum,
                            category: params.category,
                            budget: params.budget,
                            location: params.location,
                            frequencyEnum: params.frequencyEnum,
                            note: params.note,
                            filename: params.filename,
                            currency: params.currency,
                        },
                    })}
                >
                    <Text style={styles.btnTxt}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.btn, { marginTop: 10, backgroundColor: "#FF4D4D" }]}
                    onPress={() => console.warn("Delete pressed")}
                >
                    <Text style={styles.btnTxt}>Delete</Text>
                </TouchableOpacity>
            </ScrollView>
    </>
  );
};

export default TransactionScreen;

const Pill = ({
    text,
    icon,
    style,
}: {
    text: string;
    icon?: React.ReactNode;
    style?: object;
}) => (
    <View style={[styles.pill, style]}>
        {icon}
        <Text style={styles.pillTxt}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#E5E5E5",
        alignItems: "center",
        justifyContent: "center",
    },
    title: { fontSize: 20, fontWeight: "600" },
    catRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
    catText: { fontSize: 14, color: "#444" },
    amount: { fontSize: 20, fontWeight: "600" },
    pillRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#000",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    pillTxt: { marginLeft: 4, fontSize: 13 },
    note: { marginTop: 16, fontSize: 15 },
    btn: {
        backgroundColor: "#2B2B2B",
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
    },
    btnTxt: { color: "#FFF", fontWeight: "600", fontSize: 16 },
});