import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from "react-native";
import { Ionicons, EvilIcons } from "@expo/vector-icons";
import type { StackHeaderProps } from "@react-navigation/stack";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";

import { useAuth } from "@/contexts/AuthContext";

type Props = (StackHeaderProps | BottomTabHeaderProps) & {
    title: string;  
    backButton?: boolean; 
};

const AppHeader: React.FC<Props> = ({ navigation, backButton, title }) => {
    const { signOut } = useAuth();
    const [open, setOpen] = useState(false);

    const handleAccountPress = () => { setOpen(true); }

    const close = () => { setOpen(false); }

    return (
        <View style={styles.container}>
            {(backButton && (
                <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.sideBtn}
                >
                <Ionicons name="chevron-back" size={24} />
                </TouchableOpacity>
            )) || <View style={styles.sideBtn} />}

            <Text style={styles.title}>{title}</Text>

            <TouchableOpacity
                onPress={handleAccountPress}
                style={styles.sideBtn}
            >
                <EvilIcons name="user" size={40} color="white" />
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
                            // navigation.navigate("MyAccount"); 
                        }} 
                    />
                    <MenuItem 
                        label="Settings"   
                        onPress={() => { 
                            close(); 
                            navigation.navigate("Settings");   
                        }} 
                    />
                    <MenuItem 
                        label="Help"       
                        onPress={() => { 
                            close(); 
                            // navigation.navigate("Help");      
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
        </View>
    );
};

const MenuItem = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.menuItem}>
        <Text style={styles.menuText}>{label}</Text>
    </TouchableOpacity>
);  

export default AppHeader;

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