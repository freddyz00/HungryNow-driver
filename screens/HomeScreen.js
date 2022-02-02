import { View, Text, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";

import * as Location from "expo-location";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";

import { calculateMapCoords } from "../helpers";

const HomeScreen = () => {
  const [driverLocation, setDriverLocation] = useState();

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
