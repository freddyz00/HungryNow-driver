import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./screens/HomeScreen";
import DeliveringScreen from "./screens/DeliveringScreen";
import ChatScreen from "./screens/ChatScreen";

import { OrderTrackerProvider } from "./context/OrderTrackerContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <OrderTrackerProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Delivering" component={DeliveringScreen} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: true,
              title: "Contact",
              headerTintColor: "#fcbf49",
              headerTitleStyle: {
                color: "black",
              },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </OrderTrackerProvider>
  );
}
