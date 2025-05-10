import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Stack, router, useLocalSearchParams } from "expo-router";

import { api } from "@/service/apiClient";

const pad2 = (n: number) => String(n).padStart(2, "0");
const formatDateTime = (d: Date) =>
    `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

export default function EditBudgetScreen() {
    const params = useLocalSearchParams<{
        id: string;
        label: string;
        amount: string;
        initialAmount: string;
        startDate: string;
        intervalValue: string;
        intervalEnum: string;
        lastResetDate: string;
    }>();
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [intervalValue, setIntervalValue] = useState("1");
    const [intervalEnum, setIntervalEnum] = useState<"DAY" | "WEEK" | "MONTH" | "YEAR" | "NEVER">("MONTH");
    const [intervalEnumDropdownVisible, setIntervalEnumDropdownVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // inicializácia jednorazovo
        setTitle(params.label || "");
        setAmount(params.initialAmount || "");
        if (params.startDate) setDate(new Date(params.startDate));
        setIntervalValue(params.intervalValue || "1");
        setIntervalEnum((params.intervalEnum as any) || "MONTH");
        setLoading(false);
    }, []);

    const formattedDateTime = formatDateTime(date);
    const isValid = title.trim().length > 0 && /^[0-9]+([.,][0-9]{1,2})?$/.test(amount.trim());

    const onSave = async () => {
        if (!isValid) return Alert.alert("Vyplň všetky polia správne.");
        setSaving(true);

        const payload = {
            user_id: 2, // dynamicky podľa potreby
            label: title.trim(),
            amount: parseFloat(amount.replace(",", ".")),
            start_date: date.toISOString(),
            interval_value: Number(intervalValue),
            interval_enum: intervalEnum,
        };

        try {
            await api.put(`/budgets/${params.id}`, payload);
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Nepodarilo sa upraviť rozpočet");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#2B2B2B" />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: "Edit Budget",
                    headerTitleAlign: "center",
                }}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView contentContainerStyle={styles.container}>
                    <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput
                        placeholder="Budget title"
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.fieldLabel}>Start Date & Time</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.dateInput]}
                        onPress={() => setDatePickerVisible(true)}
                    >
                        <Ionicons name="calendar-outline" size={16} style={{ marginRight: 6 }} />
                        <Text style={styles.dateText}>{formattedDateTime}</Text>
                    </TouchableOpacity>

                    <Text style={styles.fieldLabel}>Amount</Text>
                    <TextInput
                        placeholder="0,00"
                        keyboardType="decimal-pad"
                        style={styles.input}
                        value={amount}
                        onChangeText={setAmount}
                    />

                    <Text style={styles.fieldLabel}>Reset Period Length</Text>
                    <TextInput
                        placeholder="1"
                        keyboardType="numeric"
                        style={styles.input}
                        value={intervalValue}
                        onChangeText={setIntervalValue}
                    />

                    <Text style={styles.fieldLabel}>Period Type</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.dropdownToggle]}
                        onPress={() => setIntervalEnumDropdownVisible(prev => !prev)}
                    >
                        <Text>{intervalEnum.charAt(0) + intervalEnum.slice(1).toLowerCase()}</Text>
                        <Ionicons name="chevron-down" size={18} />
                    </TouchableOpacity>
                    {intervalEnumDropdownVisible && (
                        <View style={styles.dropdown}>
                            {(["DAY", "WEEK", "MONTH", "YEAR", "NEVER"] as const).map(period => (
                                <TouchableOpacity
                                    key={period}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setIntervalEnum(period);
                                        setIntervalEnumDropdownVisible(false);
                                    }}
                                >
                                    <Text style={period === intervalEnum ? styles.dropdownTextActive : undefined}>
                                        {period.charAt(0) + period.slice(1).toLowerCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.saveBtn, (!isValid || saving) && { opacity: 0.4 }]}
                        disabled={!isValid || saving}
                        onPress={onSave}
                    >
                        {saving
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.saveTxt}>Update</Text>
                        }
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <DateTimePickerModal
                isVisible={datePickerVisible}
                mode="datetime"
                onConfirm={d => {
                    setDate(d);
                    setDatePickerVisible(false);
                }}
                onCancel={() => setDatePickerVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    container: { padding: 20, paddingBottom: 40 },
    fieldLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#000" },
    input: {
        backgroundColor: "#F0F0F0",
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 14,
        outlineColor: "#000",
        outlineWidth: 1,
    },
    dateInput: { flexDirection: "row", alignItems: "center" },
    dateText: { color: "#000" },
    dropdownToggle: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dropdown: {
        backgroundColor: "#F0F0F0",
        borderRadius: 8,
        paddingVertical: 4,
        marginBottom: 14,
    },
    dropdownItem: { padding: 10 },
    dropdownTextActive: { fontWeight: "600" },
    saveBtn: {
        backgroundColor: "#2B2B2B",
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 10,
    },
    saveTxt: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
