// app/(tabs)/SettingsScreen.tsx - aktualizovaný s upravenými importmi
import React, { useState, useContext, useEffect } from "react";
import {
    View,
    Text,
    Switch,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import AppHeader from "../header/AppHeader";
import { ThemeContext, ThemeMode } from "../../contexts/ThemeContext";
import { Theme } from "../../theme";

import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as Location from "expo-location";

export default function SettingsScreen() {
    const { theme, themeMode, setThemeMode } = useContext(ThemeContext);
    const [appearanceOpen, setAppearanceOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [permissionsOpen, setPermissionsOpen] = useState(false);
    const [currencyOpen, setCurrencyOpen] = useState(false);

    const [notifUpcoming, setNotifUpcoming] = useState(false);
    const [notifSubscription, setNotifSubscription] = useState(false);
    const [notifBudgetReset, setNotifBudgetReset] = useState(false);

    const [permCamera, setPermCamera] = useState(false);
    const [permStorage, setPermStorage] = useState(false);
    const [permLocation, setPermLocation] = useState(false);

    const [currency, setCurrency] = useState<string>("EUR");
    const [currencyDropdownVisible, setCurrencyDropdownVisible] =
        useState(false);
  const currencyOptions = [
    "BGN","BRL","CAD","CHF","CNY","CZK","DKK","EUR","GBP",
    "HKD","HRK","HUF","IDR","ILS","INR","ISK","JPY","KRW",
    "MXN","MYR","NOK","NZD","PHP","PLN","RON","RUB","SEK",
    "SGD","THB","TRY","USD","ZAR",
  ];
    useEffect(() => {
        if (!permissionsOpen) return;
        (async () => {
            const cam = await Camera.getCameraPermissionsAsync();
            setPermCamera(cam.status === "granted");

            const lib = await MediaLibrary.getPermissionsAsync();
            setPermStorage(lib.granted);

            const loc = await Location.getForegroundPermissionsAsync();
            setPermLocation(loc.status === "granted");
        })();
    }, [permissionsOpen]);

    // Handlers remain the same as before
    const handleCameraToggle = async (value: boolean) => {
        if (value) {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setPermCamera(status === "granted");
            if (status !== "granted") Alert.alert("Camera permission denied");
        } else {
            setPermCamera(false);
            Alert.alert(
                "Revoke Camera Permission",
                "To revoke camera permission, go to your device settings.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open Settings", onPress: () => Linking.openSettings() },
                ]
            );
        }
    };

    const handleStorageToggle = async (value: boolean) => {
        if (value) {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setPermStorage(status === "granted");
            if (status !== "granted") Alert.alert("Storage permission denied");
        } else {
            setPermStorage(false);
            Alert.alert(
                "Revoke Storage Permission",
                "To revoke storage permission, go to your device settings.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open Settings", onPress: () => Linking.openSettings() },
                ]
            );
        }
    };

    const handleLocationToggle = async (value: boolean) => {
        if (value) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermLocation(status === "granted");
            if (status !== "granted") Alert.alert("Location permission denied");
        } else {
            setPermLocation(false);
            Alert.alert(
                "Revoke Location Permission",
                "To revoke location permission, go to your device settings.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open Settings", onPress: () => Linking.openSettings() },
                ]
            );
        }
    };

    const renderSection = (
        title: string,
        isOpen: boolean,
        onToggle: () => void,
        children: React.ReactNode
    ) => (
        <View style={styles.section}>
            <TouchableOpacity style={styles.header} onPress={onToggle}>
                <Text style={[styles.headerText, { fontSize: theme.fontSize?.large || 16 }]}>{title}</Text>
                <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.highContrast ? theme.colors.text : "#000"}
                />
            </TouchableOpacity>
            {isOpen && (
                <View style={[styles.body, { backgroundColor: theme.colors.background }]}>
                    {children}
                </View>
            )}
        </View>
    );

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: "Settings",
                    headerRight: () => <AppHeader />,
                    headerTitleAlign: "center",
                    headerStyle: { backgroundColor: theme.colors.card },
                    headerTitleStyle: { color: theme.colors.text, fontSize: theme.fontSize?.large || 16 },
                }}
            />
            <ScrollView
                contentContainerStyle={[
                    styles.container,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                {renderSection(
                    "Appearance",
                    appearanceOpen,
                    () => setAppearanceOpen(!appearanceOpen),
                    <>
                        <View style={styles.row}>
                            <Text style={[
                                styles.label, 
                                { 
                                    color: theme.colors.text,
                                    fontSize: theme.fontSize?.medium || 14 
                                }
                            ]}>
                                Dark mode
                            </Text>
                            <Switch
                                value={themeMode === 'dark'}
                                onValueChange={(val) => {
                                    // Ak je zapnutý high contrast, necháme ho zapnutý
                                    if (themeMode === 'highContrast') return;
                                    
                                    setThemeMode(val ? 'dark' : 'light');
                                }}
                                thumbColor={theme.colors.primary}
                                trackColor={{ false: "#d0d0d0", true: "#d0d0d0" }}
                                disabled={themeMode === 'highContrast'}
                            />
                        </View>
                        
                        <View style={styles.row}>
                            <Text style={[
                                styles.label, 
                                { 
                                    color: theme.colors.text,
                                    fontSize: theme.fontSize?.medium || 14 
                                }
                            ]}>
                                High contrast mode (Accessibility)
                            </Text>
                            <Switch
                                value={themeMode === 'highContrast'}
                                onValueChange={(val) => {
                                    setThemeMode(val ? 'highContrast' : 'light');
                                }}
                                thumbColor={theme.colors.primary}
                                trackColor={{ false: "#d0d0d0", true: "#d0d0d0" }}
                            />
                        </View>
                    </>
                )}

                {renderSection(
                    "Notifications",
                    notificationsOpen,
                    () => setNotificationsOpen(!notificationsOpen),
                    <>
                        <View style={styles.row}>
                            <Text style={[
                                styles.label, 
                                { 
                                    color: theme.colors.text,
                                    fontSize: theme.fontSize?.medium || 14 
                                }
                            ]}>
                                Upcoming transactions
                            </Text>
                            <Switch
                                value={notifUpcoming}
                                onValueChange={setNotifUpcoming}
                                thumbColor={theme.colors.primary}
                                trackColor={{ false: "#fff", true: theme.colors.primary }}
                            />
                        </View>
                        <View style={styles.row}>
                            <Text style={[
                                styles.label, 
                                { 
                                    color: theme.colors.text,
                                    fontSize: theme.fontSize?.medium || 14 
                                }
                            ]}>
                                Subscription reminder
                            </Text>
                            <Switch
                                value={notifSubscription}
                                onValueChange={setNotifSubscription}
                                thumbColor={theme.colors.primary}
                                trackColor={{ false: "#fff", true: theme.colors.primary }}
                            />
                        </View>
                        <View style={styles.row}>
                            <Text style={[
                                styles.label, 
                                { 
                                    color: theme.colors.text,
                                    fontSize: theme.fontSize?.medium || 14 
                                }
                            ]}>
                                Budget reset notifications
                            </Text>
                            <Switch
                                value={notifBudgetReset}
                                onValueChange={setNotifBudgetReset}
                                thumbColor={theme.colors.primary}
                                trackColor={{ false: "#fff", true: theme.colors.primary }}
                            />
                        </View>
                    </>
                )}

                {renderSection(
                    "Permissions",
                    permissionsOpen,
                    () => setPermissionsOpen(!permissionsOpen),
                    <>
                        <View style={styles.row}>
                            <Text style={[
                                styles.label, 
                                { 
                                    color: theme.colors.text,
                                    fontSize: theme.fontSize?.medium || 14 
                                }
                            ]}>
                                Camera
                            </Text>
                            <Switch
                                value={permCamera}
                                onValueChange={handleCameraToggle}
                                thumbColor={theme.colors.primary}
                                trackColor={{ false: "#fff", true: theme.colors.primary }}
                            />
                        </View>
                        <View style={styles.row}>
                            <Text style={[
                                styles.label, 
                                { 
                                    color: theme.colors.text,
                                    fontSize: theme.fontSize?.medium || 14 
                                }
                            ]}>
                                Storage
                            </Text>
                            <Switch
                                value={permStorage}
                                onValueChange={handleStorageToggle}
                                thumbColor={theme.colors.primary}
                                trackColor={{ false: "#fff", true: theme.colors.primary }}
                            />
                        </View>
                        <View style={styles.row}>
                            <Text style={[
                                styles.label, 
                                { 
                                    color: theme.colors.text,
                                    fontSize: theme.fontSize?.medium || 14 
                                }
                            ]}>
                                Location
                            </Text>
                            <Switch
                                value={permLocation}
                                onValueChange={handleLocationToggle}
                                thumbColor={theme.colors.primary}
                                trackColor={{ false: "#fff", true: theme.colors.primary }}
                            />
                        </View>
                    </>
                )}

                {renderSection(
                    "Currency",
                    currencyOpen,
                    () => setCurrencyOpen(!currencyOpen),
                    <View>
                        <View style={styles.row}>
                            <Text style={[
                                styles.label, 
                                { 
                                    color: theme.colors.text,
                                    fontSize: theme.fontSize?.medium || 14 
                                }
                            ]}>
                                Currency
                            </Text>
                            <TouchableOpacity
                                style={styles.dropdownToggle}
                                onPress={() =>
                                    setCurrencyDropdownVisible(!currencyDropdownVisible)
                                }
                            >
                                <Text style={[
                                    styles.label, 
                                    { 
                                        color: theme.colors.text,
                                        fontSize: theme.fontSize?.medium || 14 
                                    }
                                ]}>
                                    {currency}
                                </Text>
                                <Ionicons
                                    name={
                                        currencyDropdownVisible ? "chevron-up" : "chevron-down"
                                    }
                                    size={20}
                                    color={theme.colors.text}
                                />
                            </TouchableOpacity>
                        </View>
                        {currencyDropdownVisible && (
                            <View style={[
                                styles.optionList,
                                { backgroundColor: theme.colors.card }
                            ]}>
                                {currencyOptions.map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={styles.optionItem}
                                        onPress={() => {
                                            setCurrency(opt);
                                            setCurrencyDropdownVisible(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.optionText, 
                                            { 
                                                color: theme.colors.text,
                                                fontSize: theme.fontSize?.medium || 14 
                                            }
                                        ]}>
                                            {opt}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, flexGrow: 1 },
    section: {
        marginBottom: 12,
        backgroundColor: "#f0f0f0",
        borderRadius: 8,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#d0d0d0",
    },
    headerText: { fontSize: 16, fontWeight: "600", color: "#000" },
    body: { padding: 12 },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    label: { fontSize: 14, color: "#000" },
    dropdownToggle: { flexDirection: "row", alignItems: "center" },
    optionList: {
        backgroundColor: "#e0e0e0",
        borderRadius: 6,
        paddingVertical: 4,
        marginTop: 4,
    },
    optionItem: { paddingVertical: 8, paddingHorizontal: 12 },
    optionText: { fontSize: 14, color: "#000" },
});