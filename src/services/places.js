export async function getNearbyPlaces(lat, lng, category) {
  const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const url = `https://places.googleapis.com/v1/places:searchNearby`;

  let includedTypes = [];
  if (category === 'medical') {
    includedTypes = ['medical_clinic'];
  } else if (category === 'social') {
    includedTypes = ['community_center'];
  } else if (category === 'transport') {
    includedTypes = ['transit_station'];
  } else if (category === 'groceries') {
    includedTypes = ['grocery_store', 'supermarket'];
  } else {
    includedTypes = ['medical_clinic'];
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber'
      },
      body: JSON.stringify({
        includedTypes,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 50000
          }
        }
      })
    });

    const data = await res.json();
    let fetchedPlaces = data.places || [];

    if (category === 'transport') {
      fetchedPlaces = [
        {
          displayName: { text: "Drive a Senior - Central Texas" },
          formattedAddress: "2601 Exposition Blvd, Austin, TX 78703",
          location: { latitude: 30.3016, longitude: -97.7618 },
          internationalPhoneNumber: "+1 512-472-6339"
        },
        ...fetchedPlaces
      ];
    }

    return fetchedPlaces;
  } catch (error) {
    console.error("Error fetching places:", error);
    return [];
  }
}