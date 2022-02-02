import { View, Text, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";

import * as Location from "expo-location";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import { calculateMapCoords } from "../helpers";

import Pusher from "pusher-js/react-native";

import {
  CHANNELS_APP_KEY,
  CHANNELS_APP_CLUSTER,
  GOOGLE_MAPS_API_KEY,
  NGROK_URL,
} from "../keys";

const HomeScreen = () => {
  const [driverLocation, setDriverLocation] = useState();

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

  return (
    <View>
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
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  mapView: {
    width: "100%",
    height: "100%",
  },
});
