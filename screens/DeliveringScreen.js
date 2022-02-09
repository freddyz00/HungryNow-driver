import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
} from "react-native";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";

import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { calculateMapCoords } from "../helpers";

import { Feather } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";

import Pusher from "pusher-js/react-native";
import { useOrderTracker } from "../context/OrderTrackerContext";

import {
  CHANNELS_APP_KEY,
  CHANNELS_APP_CLUSTER,
  GOOGLE_MAPS_API_KEY,
  NGROK_URL,
} from "../keys";

const DeliveringScreen = ({ navigation }) => {
  const [hasOrder, setHasOrder] = useState(false);
  const [restaurantLocation, setRestaurantLocation] = useState();
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [customerLocation, setCustomerLocation] = useState();
  const [customerAddress, setCustomerAddress] = useState("");
  const [driverLocation, setDriverLocation] = useState();
  const [customer, setCustomer] = useState();
  const [statusButton, setStatusButton] = useState();
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);

  const { pusher, setPusher, setMessagesWithCustomer } = useOrderTracker();

  let user_rider_channel;

  useEffect(() => {
    setPusher(
      new Pusher(CHANNELS_APP_KEY, {
        authEndpoint: `${NGROK_URL}/pusher/auth`,
        cluster: CHANNELS_APP_CLUSTER,
        encrypted: true,
      })
    );
  }, []);

  useEffect(() => {
    if (pusher) {
      const available_drivers_channel = pusher.subscribe(
        "private-available-drivers"
      );

      available_drivers_channel.bind("pusher:subscription_error", (error) => {
        console.log(error);
      });

      available_drivers_channel.bind("pusher:subscription_succeeded", () => {
        available_drivers_channel.bind("client-request-driver", (data) => {
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
      return () => pusher.disconnect();
    }
  }, [pusher]);

  useEffect(() => {
    let watch_position;
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

      watch_position = await Location.watchPositionAsync({}, (position) => {
        setDriverLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      });
    })();
    return watch_position;
  }, []);

  useEffect(() => {
    if (hasOrder && customer) {
      user_rider_channel = pusher.subscribe(
        `private-user-rider-${customer.username}`
      );
      user_rider_channel.trigger("client-driver-location", {
        location: driverLocation,
      });
    }
  }, [driverLocation, customer]);

  const acceptOrder = () => {
    setIsOrderModalVisible(false);
    user_rider_channel = pusher.subscribe(
      `private-user-rider-${customer.username}`
    );
    user_rider_channel.bind("pusher:subscription_succeeded", () => {
      user_rider_channel.trigger("client-driver-response", { response: "yes" });
      user_rider_channel.bind("client-driver-response", (customer_response) => {
        if (customer_response.response === "yes") {
          setHasOrder(true);
          user_rider_channel.trigger("client-found-driver", {
            location: driverLocation,
          });
          user_rider_channel.trigger("client-order-update", { orderStep: 1 });

          setStatusButton("Picked Up Order");
        }
      });
    });
  };

  const declineOrder = () => {
    setIsOrderModalVisible(false);
    setStatusButton(null);
    setHasOrder(false);
    setCustomer(null);
    setCustomerAddress("");
    setCustomerLocation(null);
    setRestaurantAddress("");
    setRestaurantLocation(null);
  };

  const pickedOrder = () => {
    setStatusButton("Delivered Order");
    user_rider_channel = pusher.subscribe(
      `private-user-rider-${customer.username}`
    );
    user_rider_channel.trigger("client-order-update", { orderStep: 2 });
    user_rider_channel.trigger("client-order-picked-up", {});
  };

  const deliveredOrder = () => {
    setStatusButton(null);
    setHasOrder(false);
    setCustomer(null);
    setCustomerAddress("");
    setCustomerLocation(null);
    setRestaurantAddress("");
    setRestaurantLocation(null);
    setMessagesWithCustomer([]);
    user_rider_channel = pusher.subscribe(
      `private-user-rider-${customer.username}`
    );
    user_rider_channel.trigger("client-order-update", { orderStep: 3 });
    user_rider_channel.trigger("client-order-delivered", {});
    user_rider_channel.unbind("client-driver-response");
    pusher.unsubscribe(`private-user-rider-${customer.username}`);
  };

  return (
    <View>
      <StatusBar style="auto" />
      <View style={styles.backIcon}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Entypo name="chevron-left" size={30} color="#fcbf49" />
        </TouchableOpacity>
      </View>
      {hasOrder && (
        <TouchableOpacity
          onPress={() => navigation.navigate("Chat", { customer })}
          style={styles.contactButton}
        >
          <Text style={[styles.buttonText, { fontSize: 18 }]}>Contact</Text>
        </TouchableOpacity>
      )}
      {driverLocation && (
        <MapView
          style={styles.mapView}
          provider={PROVIDER_GOOGLE}
          region={
            customerLocation
              ? calculateMapCoords(driverLocation, customerLocation)
              : calculateMapCoords(driverLocation)
          }
        >
          {restaurantLocation && (
            <Marker
              title="Restaurant"
              coordinate={restaurantLocation}
              pinColor="blue"
            />
          )}
          {customerLocation && (
            <Marker
              title="Customer"
              coordinate={customerLocation}
              pinColor="red"
            />
          )}
          {driverLocation && (
            <Marker
              title="Your Location"
              coordinate={driverLocation}
              pinColor="#fcbf49"
            />
          )}

          {statusButton === "Picked Up Order" && (
            <MapViewDirections
              origin={driverLocation}
              destination={restaurantLocation}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={4}
              strokeColor="#fcbf49"
            />
          )}

          {statusButton === "Picked Up Order" && (
            <MapViewDirections
              origin={restaurantLocation}
              destination={customerLocation}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={4}
              strokeColor="hotpink"
            />
          )}

          {statusButton === "Delivered Order" && (
            <MapViewDirections
              origin={driverLocation}
              destination={customerLocation}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={4}
              strokeColor="#fcbf49"
            />
          )}
        </MapView>
      )}

      {statusButton && (
        <TouchableOpacity
          style={styles.statusButton}
          onPress={
            statusButton === "Picked Up Order" ? pickedOrder : deliveredOrder
          }
        >
          <Text style={styles.buttonText}>{statusButton}</Text>
        </TouchableOpacity>
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
            <TouchableOpacity onPress={declineOrder} style={styles.close}>
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

export default DeliveringScreen;

const styles = StyleSheet.create({
  mapView: {
    width: "100%",
    height: "100%",
  },
  backIcon: {
    position: "absolute",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 0,
    width: 36,
    height: 36,
    borderRadius: 25,
    justifyContent: "center",
    left: 20,
    top: 50,
    zIndex: 100,
  },
  contactButton: {
    backgroundColor: "#fcbf49",
    position: "absolute",
    top: 45,
    right: 10,
    alignItems: "center",
    width: "40%",
    alignSelf: "center",
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 1,
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
  statusButton: {
    backgroundColor: "#fcbf49",
    position: "absolute",
    bottom: 30,
    alignItems: "center",
    width: "80%",
    alignSelf: "center",
    paddingVertical: 15,
    borderRadius: 10,
  },
});
