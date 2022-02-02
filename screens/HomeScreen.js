import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Button,
} from "react-native";
import React, { useEffect, useState } from "react";

import * as Location from "expo-location";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import { calculateMapCoords } from "../helpers";

import { Feather } from "@expo/vector-icons";

import Pusher from "pusher-js/react-native";

import {
  CHANNELS_APP_KEY,
  CHANNELS_APP_CLUSTER,
  GOOGLE_MAPS_API_KEY,
  NGROK_URL,
} from "../keys";

const HomeScreen = () => {
  const [hasOrder, setHasOrder] = useState(false);
  const [restaurantLocation, setRestaurantLocation] = useState();
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [customerLocation, setCustomerLocation] = useState();
  const [customerAddress, setCustomerAddress] = useState("");
  const [driverLocation, setDriverLocation] = useState();
  const [customer, setCustomer] = useState();
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);

  const pusher = new Pusher(CHANNELS_APP_KEY, {
    authEndpoint: `${NGROK_URL}/pusher/auth`,
    cluster: CHANNELS_APP_CLUSTER,
    encrypted: true,
  });

  useEffect(() => {
    const available_drivers_channel = pusher.subscribe(
      "private-available-drivers"
    );

    available_drivers_channel.bind("pusher:subscription_error", (error) => {
      console.log(error);
    });

    available_drivers_channel.bind("pusher:subscription_succeeded", () => {
      console.log(
        "[driver app] available drivers channel subscription success"
      );
      available_drivers_channel.bind("client-request-driver", (data) => {
        console.log("[driver app] client request driver");
        if (!hasOrder) {
          setIsOrderModalVisible(true);
          setCustomer(data.customer);
          setRestaurantLocation({
            latitude: data.restaurantLocation[0],
            longitude: data.restaurantLocation[1],
          });
          setCustomerLocation(data.customerLocation);
          setRestaurantAddress(data.restaurantAddress);
          setCustomerAddress(data.customerAddress);
        }
      });
    });
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission denied");
        }
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: 3,
      });

      setDriverLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();
  }, []);

  const acceptOrder = () => {};

  const declineOrder = () => {};

  return (
    <View>
      <Button title="Open" onPress={() => setIsOrderModalVisible(true)} />
      {driverLocation && (
        <MapView
          style={styles.mapView}
          provider={PROVIDER_GOOGLE}
          region={calculateMapCoords(driverLocation)}
        >
          {driverLocation && (
            <Marker
              title="Your Location"
              coordinate={driverLocation}
              pinColor="#fcbf49"
            />
          )}
        </MapView>
      )}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isOrderModalVisible}
        onRequestClose={() => {
          setIsOrderModalVisible(!isOrderModalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity
              onPress={() => setIsOrderModalVisible(false)}
              style={styles.close}
            >
              <Feather name="x" size={28} color="#fcbf49" />
            </TouchableOpacity>
            <View style={styles.orderDetails}>
              <View style={styles.orderDetailsAddressContainer}>
                <Text style={styles.orderHeading}>Pick Up</Text>
                <Text style={styles.orderDetailsAddress}>
                  {restaurantAddress}
                </Text>
              </View>
              <View style={styles.orderDetailsAddressContainer}>
                <Text style={styles.orderHeading}>Drop Off</Text>
                <Text style={styles.orderDetailsAddress}>
                  {customerAddress}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={acceptOrder}
              style={[styles.button, styles.buttonAccept]}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={declineOrder}
              style={[styles.button, styles.buttonDecline]}
            >
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  mapView: {
    width: "100%",
    height: "100%",
  },
  modalContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  close: {
    alignSelf: "flex-end",
  },
  orderDetails: {
    alignSelf: "flex-start",
  },
  orderDetailsAddressContainer: {
    margin: 10,
  },
  orderDetailsAddress: {
    fontSize: 16,
    paddingVertical: 10,
  },
  orderHeading: {
    fontSize: 22,
    fontWeight: "bold",
  },
  button: {
    width: "80%",
    height: 60,
    margin: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDecline: {
    backgroundColor: "red",
  },
  buttonAccept: {
    backgroundColor: "green",
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    textTransform: "uppercase",
  },
});
