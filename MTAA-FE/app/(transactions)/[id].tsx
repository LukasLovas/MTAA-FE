import { useState, useMemo, useEffect } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as ImagePicker from 'expo-image-picker';
import { Stack, router, useLocalSearchParams } from "expo-router";

import { api } from "@/service/apiClient";

type Mode = "create" | "edit";
const pad = (n: number) => String(n).padStart(2, "0");
const formatDate = (d: Date) =>
    `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;

const TransactionFormScreen = () => {
    const params = useLocalSearchParams<{ 
        pageId: string 
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
    const mode: Mode = params.id && params.id !== "new" ? "edit" : "create";

    const categories = [
        "Food",
        "Transport",
        "Entertainment",
        "Health",
        "Shopping",
        "Other",
    ];
    const budgets = [
        "Budget 1",
        "Budget 2",
        "Budget 3",
        "Budget 4",
        "Budget 5",
    ];

    const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState<Date | null>(null);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");
    const [budget, setBudget] = useState("");
    const [frequency, setFrequency] = useState<"DEFAULT" | "UPCOMING" | "SUBSCRIPTION">("DEFAULT");
    const [note, setNote] = useState("");
    const [attachment, setAttachment] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (mode === "edit") {
            setTitle(params.label ?? "");
            setAmount(params.amount ?? "");
            setType(params.transactionTypeEnum as "EXPENSE" | "INCOME");
            setDate(new Date(params.creationDate ?? ""));
            setCategory(params.category ?? "");
            setBudget(params.budget ?? "");
            setLocation(params.location ?? "");
            setFrequency((params.frequencyEnum as any) ?? "DEFAULT");
            setNote(params.note ?? "");
            setAttachment(params.filename ? { uri: params.filename } as ImagePicker.ImagePickerAsset : null);
        }
    }, []);

    const isValid = ( 
        title.trim().length 
        && amount.trim().length 
        && amount.trim() !== "0"
        && !isNaN(Number(amount)) 
        && date !== null 
        && date !== undefined
        && category.trim().length > 0
        && budget.trim().length > 0
    );

    const formattedDate = useMemo(() => (date ? formatDate(date) : "Date"), [date]);

    const [categoryDropDownVisible, setCategoryDropDownVisible] = useState(false);
    const [budgetDropDownVisible, setBudgetDropDownVisible] = useState(false);

    const categoryDropDown = (items:string[]) => {
        return (
            <View style={{ backgroundColor: grey, borderRadius: 12, marginBottom: 14 }}>
                {items.map((item) => (
                    <TouchableOpacity key={item} onPress={() => { setCategory(item); setCategoryDropDownVisible(false); }}>
                        <Text style={{ padding: 10 }}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        )
    }

    const budgetDropDown = (items:string[]) => {
        return (
            <View style={{ backgroundColor: grey, borderRadius: 12, marginBottom: 14 }}>
                {items.map((item) => (
                    <TouchableOpacity key={item} onPress={() => { setBudget(item); setBudgetDropDownVisible(false); }}>
                        <Text style={{ padding: 10 }}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        )
    }

    const pickAttachment = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
        });
        if (!res.canceled) setAttachment(res.assets[0]);
    };

    const onSave = async () => {
        if (!isValid) return Alert.alert("Please fill Title and Amount.");
        setSaving(true);

        const payload = {
            user_id: 2,
            label: title,
            amount: Number(amount) * (type === "EXPENSE" ? -1 : 1),
            time: (date ?? new Date()).toISOString(),
            "transaction_type": type,
            category_id: 2,
            budget_id: 1,
            location_id: 1,
            frequency: frequency,
            note: note,
            filename: "string",
            currency_code: "EUR", 
        }

        try {
            // mode === "create"
            //     ? await api.post("/transactions", payload)
            //     : await api.put(`/transactions/${params.id}`, payload);
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Failed to save transaction");
        } finally {
            setSaving(false);
        }
    };

  return (
    <>
        <Stack.Screen
            options={{
            headerTitle: mode === "create" ? "New Transaction" : "Edit Transaction",
            headerTitleAlign: "center",
            }}
        />

        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>

                <View style={styles.segment}>
                    {(["EXPENSE", "INCOME"] as const).map((t) => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setType(t)}
                            style={[
                                styles.segmentItem,
                                type === t && styles.segmentItemActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.segmentText,
                                    type === t && styles.segmentTextActive,
                                ]}
                                >
                                {t === "EXPENSE" ? "Expense" : "Income"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

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
                        <Text style={{ color: date ? "#000" : "#777" }}>{formattedDate}</Text>
                    </TouchableOpacity>

                    <TextInput
                        placeholder="€0"
                        keyboardType="numeric"
                        style={[styles.input, { marginLeft: 10, flex: 1 }]}
                        value={amount}
                        onChangeText={setAmount}
                    />
                </View>

                <TextInput
                    placeholder="Choose location"
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                />

                <TouchableOpacity style={styles.input} onPress={() => setCategoryDropDownVisible(!categoryDropDownVisible)}>
                    <Text style={{ color: category ? "#000" : "#777" }}>
                        {category || "Category"}
                    </Text>
                    <Ionicons
                        name="chevron-down"
                        size={18}
                        style={{ position: "absolute", right: 12, top: 16 }}
                    />
                </TouchableOpacity>

                {categoryDropDownVisible && categoryDropDown(categories)}

                <TouchableOpacity style={styles.input} onPress={() => setBudgetDropDownVisible(!budgetDropDownVisible)}>
                    <Text style={{ color: budget ? "#000" : "#777" }}>
                        {budget || "Budget"}
                    </Text>
                    <Ionicons
                        name="chevron-down"
                        size={18}
                        style={{ position: "absolute", right: 12, top: 16 }}
                    />
                </TouchableOpacity>

                {budgetDropDownVisible && budgetDropDown(budgets)}

                <View style={styles.freqRow}>
                    {(["DEFAULT", "UPCOMING", "SUBSCRIPTION"] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFrequency(f)}
                            style={[
                                styles.freqPill,
                                frequency === f && styles.freqPillActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.freqText,
                                    frequency === f && styles.freqTextActive,
                                ]}
                            >
                                {f === "DEFAULT" ? "Default" : f[0] + f.slice(1).toLowerCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    placeholder="Notes"
                    style={[styles.input, { height: 100, textAlignVertical: "top" }]}
                    multiline
                    value={note}
                    onChangeText={setNote}
                />

                <TouchableOpacity style={styles.attachRow} onPress={pickAttachment}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <MaterialCommunityIcons name="paperclip" size={16} />
                        <Text style={{ marginLeft: 6 }}>
                            {attachment ? attachment.fileName : "Add attachment"}
                        </Text>
                        { attachment ? (
                            <MaterialCommunityIcons
                                name="delete-outline"
                                size={16}
                                style={{ marginLeft: 12 }}
                                onPress={() => setAttachment(null)}
                            /> )
                            : null
                        }
                    </View>
                    <Ionicons name="add" size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.saveBtn, !isValid && { opacity: 0.4 }]}
                    disabled={!isValid || saving}
                    onPress={onSave}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveTxt}>Save</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>

        <DateTimePickerModal
            isVisible={datePickerVisible}
            mode="date"
            onConfirm={(d) => {
                setDate(d);
                setDatePickerVisible(false);
            }}
            onCancel={() => setDatePickerVisible(false)}
        />
    </>
  );
};

export default TransactionFormScreen;

const grey = "#D9D9D9";
const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 40 },
    segment: {
        flexDirection: "row",
        backgroundColor: grey,
        borderRadius: 999,
        marginBottom: 18,
    },
    segmentItem: { flex: 1, paddingVertical: 10, alignItems: "center" },
    segmentItemActive: {
        backgroundColor: "#A0A0A0",
        borderRadius: 999,
    },
    segmentText: { fontWeight: "500" },
    segmentTextActive: { color: "#fff" },

    input: {
        backgroundColor: grey,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 14,
    },

    row: { flexDirection: "row" },

    freqRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
    freqPill: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#000",
        alignItems: "center",
        marginHorizontal: 4,
    },
    freqPillActive: { backgroundColor: grey },
    freqText: { fontSize: 13 },
    freqTextActive: { fontWeight: "600" },

    attachRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: "#000",
        paddingVertical: 16,
        marginBottom: 24,
    },

    saveBtn: {
        backgroundColor: "#2B2B2B",
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: "center",
    },
    saveTxt: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
