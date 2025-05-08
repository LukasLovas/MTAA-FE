import { Stack } from "expo-router";
import { View, Text } from "react-native";

import AppHeader from "../header/AppHeader";

const DashboardScreen = () => {
    

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: "Dashboard",
                    headerRight: () => ( <AppHeader /> ),
                    headerTitleAlign: "center",
                }}
            />
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>Dashboard</Text>
            </View>
        </>
    );
}
export default DashboardScreen;

