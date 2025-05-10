import { useState, useEffect } from "react";
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

type Mode = "create" | "edit";
const pad = (n: number) => String(n).padStart(2, "0");
const formatDate = (d: Date) =>
    `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;

const BudgetFormScreen = () => {
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
    
    const mode: Mode = params.id && params.id !== "new" ? "edit" : "create";

    const intervalOptions = [
        "DAY",
        "WEEK",
        "MONTH",
        "YEAR",
    ];

    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [intervalValue, setIntervalValue] = useState("1");
    const [intervalEnum, setIntervalEnum] = useState<string>("MONTH");
    const [intervalDropDownVisible, setIntervalDropDownVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (mode === "edit") {
            setTitle(params.label ?? "");
            setAmount(params.initialAmount ?? "");
            setStartDate(params.startDate ? new Date(params.startDate) : new Date());
            setIntervalValue(params.intervalValue ?? "1");
            setIntervalEnum(params.intervalEnum ?? "MONTH");
        } else {
            // Default values for create mode
            setStartDate(new Date());
        }
    }, [mode, params]);

    const isValid = ( 
        title.trim().length 
        && amount.trim().length 
        && amount.trim() !== "0"
        && !isNaN(Number(amount)) 
        && startDate !== null 
        && startDate !== undefined
        && intervalValue.trim().length > 0
        && intervalEnum.trim().length > 0
    );

    const formattedDate = startDate ? formatDate(startDate) : "Start Date";

    const intervalDropDown = (items: string[]) => {
        return (
            <View style={{ backgroundColor: grey, borderRadius: 12, marginBottom: 14 }}>
                {items.map((item) => (
                    <TouchableOpacity 
                        key={item} 
                        onPress={() => { 
                            setIntervalEnum(item); 
                            setIntervalDropDownVisible(false); 
                        }}
                    >
                        <Text style={{ padding: 10 }}>{item.charAt(0) + item.slice(1).toLowerCase()}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        )
    }

    const onSave = async () => {
        if (!isValid) return Alert.alert("Please fill all fields.");
        setSaving(true);

        const payload = {
            user_id: 2, // This should be dynamic based on logged-in user
            label: title,
            amount: Number(amount),
            start_date: (startDate ?? new Date()).toISOString().split('T')[0],
            interval_value: Number(intervalValue),
            interval_enum: intervalEnum,
        }

        try {
            if (mode === "create") {
                await api.post("/budgets", payload);
            } else {
                await api.put(`/budgets/${params.id}`, payload);
            }
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Failed to save budget");
        } finally {
            setSaving(false);
        }
    };

  return (
    <>
        <Stack.Screen
            options={{
            headerTitle: mode === "create" ? "New Budget" : "Edit Budget",
            headerTitleAlign: "center",
            }}
        />

        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>

                <TextInput
                    placeholder="Title"
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                />

                <View style={styles.row}>
                    <TouchableOpacity
                        style={[styles.input, { flexDirection: "row", alignItems: "center", flex: 1 }]}
                        onPress={() => setDatePickerVisible(true)}
                    >
                        <Ionicons name="calendar-outline" size={16} style={{ marginRight: 6 }} />
                        <Text style={{ color: startDate ? "#000" : "#777" }}>{formattedDate}</Text>
                    </TouchableOpacity>

                    <TextInput
                        placeholder="€0"
                        keyboardType="numeric"
                        style={[styles.input, { marginLeft: 10, flex: 1 }]}
                        value={amount}
                        onChangeText={setAmount}
                    />
                </View>

                <View style={styles.row}>
                    <TextInput
                        placeholder="Interval Value"
                        keyboardType="numeric"
                        style={[styles.input, { flex: 1 }]}
                        value={intervalValue}
                        onChangeText={setIntervalValue}
                    />

                    <TouchableOpacity 
                        style={[styles.input, { marginLeft: 10, flex: 1 }]} 
                        onPress={() => setIntervalDropDownVisible(!intervalDropDownVisible)}
                    >
                        <Text style={{ color: intervalEnum ? "#000" : "#777" }}>
                            {intervalEnum ? intervalEnum.charAt(0) + intervalEnum.slice(1).toLowerCase() : "Interval Type"}
                        </Text>
                        <Ionicons
                            name="chevron-down"
                            size={18}
                            style={{ position: "absolute", right: 12, top: 16 }}
                        />
                    </TouchableOpacity>
                </View>

                {intervalDropDownVisible && intervalDropDown(intervalOptions)}

                <TouchableOpacity
                    style={[styles.saveBtn, !isValid && { opacity: 0.4 }]}
                    disabled={!isValid || saving}
                    onPress={onSave}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveTxt}>{mode === "create" ? "Create" : "Update"} Budget</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>

        <DateTimePickerModal
            isVisible={datePickerVisible}
            mode="date"
            onConfirm={(d) => {
                setStartDate(d);
                setDatePickerVisible(false);
            }}
            onCancel={() => setDatePickerVisible(false)}
        />
    </>
  );
};

export default BudgetFormScreen;

const grey = "#D9D9D9";
const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 40 },
    input: {
        backgroundColor: grey,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 14,
    },
    row: { flexDirection: "row" },
    saveBtn: {
        backgroundColor: "#2B2B2B",
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 10,
    },
    saveTxt: { color: "#fff", fontSize: 16, fontWeight: "600" },
});