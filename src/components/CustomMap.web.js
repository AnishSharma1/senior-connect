import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

export default function CustomMap({ location, places, onSelect }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
  });

  if (!location) return null;

  if (loadError) {
    return <div style={{ padding: 20, color: 'red' }}>Error loading maps API window layer.</div>;
  }

  if (!isLoaded) {
    return <div style={{ padding: 20, color: '#666' }}>Loading Map Canvas...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={{ lat: location.coords.latitude, lng: location.coords.longitude }}
      zoom={13}
    >
      <Marker
        position={{ lat: location.coords.latitude, lng: location.coords.longitude }}
        options={{ label: "⭐" }}
      />

      {places.map((p, i) => {
        const lat = p.location?.latitude;
        const lng = p.location?.longitude;
        if (!lat || !lng) return null;

        return (
          <Marker
            key={i}
            position={{ lat, lng }}
            title={p.displayName?.text}
            onClick={() => onSelect(p)}
          />
        );
      })}
    </GoogleMap>
  );
}