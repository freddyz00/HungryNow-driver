import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import React from "react";

import { MaterialIcons } from "@expo/vector-icons";

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Hungry Now</Text>

      <MaterialIcons
        name="delivery-dining"
        size={128}
        color="black"
        style={styles.icon}
      />

      <View>
        <Text style={styles.welcomeText}>Welcome Back</Text>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate("Delivering")}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Start Delivering</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fcbf49",
    position: "absolute",
    top: 60,
  },
  icon: {
    marginVertical: 25,
    opacity: 0.6,
  },
  welcomeText: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 50,
  },
  button: {
    width: "80%",
    backgroundColor: "#fcbf49",
    alignItems: "center",
    paddingVertical: 25,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 3,
  },
});
