import { Stack } from "expo-router";
import { Text, View } from "react-native";

const TransactionScreen = () => {
    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: "Transaction",
                    headerTitleAlign: "center",
                }}
            />
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>Transaction</Text>
            </View>
        </>
    );
}
export default TransactionScreen;