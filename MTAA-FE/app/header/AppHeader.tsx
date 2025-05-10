import React, { useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from "react-native";
import { router } from "expo-router";
import { EvilIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeContext } from "@/contexts/ThemeContext";

const AppHeader = () => {
    const { signOut } = useAuth();
    const { theme } = useContext(ThemeContext);
    const [open, setOpen] = useState(false);

    const handleAccountPress = () => { setOpen(true); }
    const close = () => { setOpen(false); }

    return (
        <>
            <TouchableOpacity
                onPress={handleAccountPress}
                style={ styles.sideBtn }
            >
                <EvilIcons name="user" size={40} color={theme.colors.text} />
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
                <Pressable style={styles.backdrop} onPress={close}>
                    <View />
                </Pressable>

                <View style={[styles.menu, { backgroundColor: theme.colors.card }]}>                
                    <MenuItem 
                        label="My account" 
                        onPress={() => { 
                            close(); 
                            // router.push("/screens/account");
                        }} 
                        theme={theme}
                    />
                    <MenuItem 
                        label="Settings"   
                        onPress={() => { 
                            close(); 
                            router.push("/(tabs)/SettingsScreen"); 
                        }} 
                        theme={theme}
                    />
                    <MenuItem 
                        label="Help"       
                        onPress={() => { 
                            close(); 
                            // router.push("/screens/help");   
                        }} 
                        theme={theme}
                    />
                    <MenuItem 
                        label="Sign out"   
                        onPress={() => { 
                            close(); 
                            signOut();                      
                        }} 
                        theme={theme}
                    />
                </View>
            </Modal>
        </>
    );
};

const MenuItem = ({ label, onPress, theme }: { label: string; onPress: () => void; theme: any }) => (
    <TouchableOpacity onPress={onPress} style={styles.menuItem}>
        <Text style={[styles.menuText, { color: theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
);

export default AppHeader;

const styles = StyleSheet.create({
    sideBtn: { width: 48, alignItems: "center" },
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.2)",
    },
    menu: {
        position: "absolute",
        top: 56,          
        right: 8,
        borderRadius: 8,
        minWidth: 160,
        paddingVertical: 4,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
    },
    menuItem: { paddingVertical: 10, paddingHorizontal: 16 },
    menuText: { fontSize: 16 },
});
