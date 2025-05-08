import { Stack } from "expo-router";
import { View, Text } from "react-native";

import AppHeader from "../header/AppHeader";

const BudgetsScreen = () => {

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: "Budgets",
                    headerRight: () => ( <AppHeader /> ),
                    headerTitleAlign: "center",
                }}
            />
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>Budgets</Text>
            </View>
        </>
    );
}

export default BudgetsScreen;