// src/components/CustomMap.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function CustomMap({ location, places, onSelect }) {
  if (!location) return null;

  const initialRegion = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
      >
        {places && places.map((place, index) => {
          const lat = place.location?.latitude;
          const lng = place.location?.longitude;

          if (!lat || !lng) return null;

          return (
            <Marker
              key={index}
              coordinate={{ latitude: lat, longitude: lng }}
              title={place.displayName?.text}
              description={place.formattedAddress}
              onPress={() => onSelect(place)}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});