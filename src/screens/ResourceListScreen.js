import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Share,
  Linking,
  Modal,
  Alert,
  Platform
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNearbyPlaces } from '../services/places';
import CustomMap from '../components/CustomMap';

export default function ResourceListScreen({ route, navigation }) {
  const { category, label, initialItem } = route.params || { category: 'medical', label: 'Resources', initialItem: null };

  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  // Triggered instantly if navigating directly from a favorite card selection
  useEffect(() => {
    if (initialItem) {
      setSelectedPlace(initialItem);
    }
  }, [initialItem]);

  useEffect(() => {
    const getUserLocationAndFetch = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location tracking permissions were denied. Please enable them in your device settings to view nearby resources.');
          setLoading(false);
          return;
        }

        const liveLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation(liveLocation);

        const data = await getNearbyPlaces(
          liveLocation.coords.latitude,
          liveLocation.coords.longitude,
          category
        );
        setPlaces(data || []);
      } catch (error) {
        console.error("Error fetching live location:", error.message, error.stack);
        setErrorMsg('Could not fetch your live device location. Please verify your phone GPS status or connection.');
      } finally {
        setLoading(false);
      }
    };

    getUserLocationAndFetch();
  }, [category]);

  const handleSaveFavorite = async (selected) => {
    if (!selected) return;
    try {
      const existingFavorites = await AsyncStorage.getItem('care_compass_favorites');
      let favoritesArray = existingFavorites ? JSON.parse(existingFavorites) : [];
      const exists = favoritesArray.some(item => item.displayName?.text === selected.displayName?.text);

      if (!exists) {
        const itemToSave = { ...selected, savedUnderCategory: category };
        favoritesArray.push(itemToSave);
        await AsyncStorage.setItem('care_compass_favorites', JSON.stringify(favoritesArray));
        Alert.alert('Saved Successfully', '✨ This location has been added to your Bookmarked Places ribbon.');
      } else {
        Alert.alert('Notice', 'This resource is already on your dashboard bookmarks!');
      }
      setSelectedPlace(null);
    } catch (error) {
      console.log("Error saving favorite:", error);
    }
  };

  const handleShare = async (selected) => {
    try {
      const shareMessage = `SeniorConnect Resource Details:\n\n🏷️ Name: ${selected.displayName?.text}\n📍 Address: ${selected.formattedAddress}\nShared via SeniorConnect App.`;
      await Share.share({ message: shareMessage, title: 'Resource Details' });
    } catch (error) {
      console.log("Error sharing details:", error);
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{label}</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorHeading}>Location Required</Text>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{label}</Text>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.activeToggleButton]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>📋 List View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'map' && styles.activeToggleButton]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.activeToggleText]}>🗺️ Map View</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentBody}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2B6A4F" />
            <Text style={styles.loadingText}>Finding nearby resources...</Text>
          </View>
        ) : viewMode === 'map' ? (
          <View style={styles.fullscreenContent}>
            <CustomMap location={location} places={places} onSelect={setSelectedPlace} />
          </View>
        ) : (
          <View style={styles.listContainer}>
            <FlatList
              data={places}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.listScrollContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.cardName}>{item.displayName?.text}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaIcon}>📍</Text>
                    <Text style={styles.cardAddress}>{item.formattedAddress}</Text>
                  </View>

                  {item.internationalPhoneNumber ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaIcon}>📞</Text>
                      <Text style={styles.cardPhone}>{item.internationalPhoneNumber}</Text>
                    </View>
                  ) : null}

                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.inlineActionBtn} onPress={() => setSelectedPlace(item)}>
                      <Text style={styles.inlineActionText}>View Options & Navigation →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Text style={styles.emptyText}>No matching community locations found within your map search radius.</Text>
                </View>
              }
            />
          </View>
        )}
      </View>
      <Modal visible={!!selectedPlace} transparent animationType="slide" onRequestClose={() => setSelectedPlace(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{selectedPlace?.displayName?.text}</Text>
            <Text style={styles.sheetAddress}>📍 {selectedPlace?.formattedAddress}</Text>
            {selectedPlace?.internationalPhoneNumber ? (
              <Text style={styles.sheetPhoneRaw}>📞 {selectedPlace.internationalPhoneNumber}</Text>
            ) : null}

            <View style={styles.sheetActionRow}>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => Linking.openURL(`http://maps.google.com/?q=${encodeURIComponent(selectedPlace?.displayName?.text + " " + selectedPlace?.formattedAddress)}`)}
              >
                <Text style={styles.actionBtnText}>🗺️ Open Navigation</Text>
              </TouchableOpacity>

              {selectedPlace?.internationalPhoneNumber ? (
                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={() => {
                    const cleanPhone = selectedPlace.internationalPhoneNumber.replace(/[^\d+]/g, '');
                    Linking.openURL(`tel:${cleanPhone}`);
                  }}
                >
                  <Text style={styles.actionBtnText}>📞 Call Service</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity style={styles.bookmarkActionBtn} onPress={() => handleSaveFavorite(selectedPlace)}>
              <Text style={styles.bookmarkActionText}>⭐ Save to Favorites</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareActionBtn} onPress={() => handleShare(selectedPlace)}>
              <Text style={styles.shareActionText}>📤 Share Resource Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPlace(null)}>
              <Text style={styles.closeBtnText}>Dismiss Panel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F5' },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE8E0',
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: { marginRight: 16, backgroundColor: '#EBF2EE', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  backText: { color: '#2B6A4F', fontWeight: '700', fontSize: 14 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A2E26' },

  toggleContainer: { flexDirection: 'row', backgroundColor: '#EAE8E0', marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 12, padding: 3, maxWidth: 600, alignSelf: 'center', width: '90%' },
  toggleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 9 },
  activeToggleButton: { backgroundColor: '#FFFFFF', shadowColor: '#1A2E26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  toggleText: { color: '#505A54', fontWeight: '600', fontSize: 14 },
  activeToggleText: { color: '#2B6A4F', fontWeight: '800', fontSize: 14 },

  contentBody: { flex: 1, position: 'relative', width: '100%' },
  fullscreenContent: { flex: 1, position: 'relative' },
  listContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  listScrollContent: { padding: 16, paddingBottom: 40, maxWidth: 630, alignSelf: 'center', width: '100%' },

  card: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: '#EAE8E0', shadowColor: '#1A2E26', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  cardName: { fontSize: 19, fontWeight: '800', color: '#1A2E26', marginBottom: 12, lineHeight: 24 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6, paddingRight: 12 },
  metaIcon: { fontSize: 14, marginRight: 8, marginTop: 2 },
  cardAddress: { color: '#404A44', fontSize: 15, lineHeight: 20, flex: 1 },
  cardPhone: { color: '#1A2E26', fontSize: 15, fontWeight: '600', flex: 1 },
  cardActions: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#FAF9F5' },
  inlineActionBtn: { backgroundColor: '#EBF2EE', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  inlineActionText: { color: '#2B6A4F', fontWeight: '700', fontSize: 14 },

  emptyText: { textAlign: 'center', color: '#606A64', fontSize: 15, paddingHorizontal: 20, lineHeight: 22 },
  loadingText: { marginTop: 12, color: '#505A54', fontWeight: '600', fontSize: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },

  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorHeading: { fontSize: 22, fontWeight: '800', color: '#1A2E26', marginBottom: 8 },
  errorText: { color: '#606A64', textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 24, paddingHorizontal: 20 },
  retryButton: { backgroundColor: '#2B6A4F', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26, 46, 38, 0.45)' },
  sheet: { backgroundColor: '#FFFFFF', padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 44, maxWidth: 550, alignSelf: 'center', width: '100%' },
  sheetHandle: { width: 44, height: 5, backgroundColor: '#EAE8E0', borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 22, fontWeight: '900', color: '#1A2E26', lineHeight: 28 },
  sheetAddress: { marginTop: 10, fontSize: 15, color: '#404A44', lineHeight: 22 },
  sheetPhoneRaw: { marginTop: 6, fontSize: 16, color: '#1A2E26', fontWeight: '700' },
  sheetActionRow: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
  primaryActionBtn: { flex: 1, backgroundColor: '#2B6A4F', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, minHeight: 52 },
  secondaryActionBtn: { flex: 1, backgroundColor: '#1A2E26', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, minHeight: 52 },
  actionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  bookmarkActionBtn: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, width: '100%', marginTop: 12, minHeight: 52 },
  bookmarkActionText: { color: '#D97706', fontWeight: '800', fontSize: 15 },
  shareActionBtn: { backgroundColor: '#FAF9F5', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, width: '100%', marginTop: 12, minHeight: 52 },
  shareActionText: { color: '#505A54', fontWeight: '700', fontSize: 15 },
  closeBtn: { marginTop: 24, padding: 8, alignItems: 'center' },
  closeBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 15 }
});