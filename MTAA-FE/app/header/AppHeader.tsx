import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from "react-native";
import { router } from "expo-router";

import { EvilIcons } from "@expo/vector-icons";

import { useAuth } from "@/contexts/AuthContext";

const AppHeader = () => {
    const { signOut } = useAuth();
    const [open, setOpen] = useState(false);

    const handleAccountPress = () => { setOpen(true); }

    const close = () => { setOpen(false); }

    return (
        <>
            <TouchableOpacity
                onPress={handleAccountPress}
                style={ styles.sideBtn }
            >
                <EvilIcons name="user" size={40} color="black" />
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
                <Pressable style={styles.backdrop} onPress={close}>
                    <View />
                </Pressable>

                <View style={styles.menu}>
                    <MenuItem 
                        label="My account" 
                        onPress={() => { 
                            close(); 
                            // router.push("/screens/account");
                        }} 
                    />
                    <MenuItem 
                        label="Settings"   
                        onPress={() => { 
                            close(); 
                            router.push("/(tabs)/SettingsScreen"); 
                        }} 
                    />
                    <MenuItem 
                        label="Help"       
                        onPress={() => { 
                            close(); 
                            // router.push("/screens/help");   
                        }} 
                    />
                    <MenuItem 
                        label="Sign out"   
                        onPress={() => { 
                            close(); 
                            signOut();                      
                        }} 
                    />
                </View>
            </Modal>
        </>
    );
};

export default AppHeader;

const MenuItem = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.menuItem}>
        <Text style={styles.menuText}>{label}</Text>
    </TouchableOpacity>
); 

const styles = StyleSheet.create({
    container: {
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#2196F3",
        paddingHorizontal: 4,
        elevation: 0,
        shadowColor: "transparent",
    },
    title: { fontWeight: "600", fontSize: 17, color: "#fff" },
    sideBtn: { width: 48, alignItems: "center" },

    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.2)",
    },
    menu: {
        position: "absolute",
        top: 56,          
        right: 8,
        backgroundColor: "#fff",
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