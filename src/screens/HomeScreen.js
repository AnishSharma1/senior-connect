import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import BrandLogo from '../assets/logo.png';

export default function HomeScreen({ navigation }) {
  const isFocused = useIsFocused();
  const [favorites, setFavorites] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const services = [
    { id: 'medical', label: 'Medical Care', icon: '🏥', desc: 'Find nearby clinics, centers, and hospitals' },
    { id: 'groceries', label: 'Grocery Stores', icon: '🛒', desc: 'Locate supermarkets and local food pantries' },
    { id: 'transport', label: 'Senior Transport', icon: '🚗', desc: 'Access transit options and rideshare assistance' },
    { id: 'social', label: 'Social & Religion', icon: '☕', desc: 'Discover senior centers, local activities, and religious centers' },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data());
          } else {
            setCurrentUser(user);
          }
        } catch (err) {
          console.log("Error checking user schema:", err);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadFavorites();
    }
  }, [isFocused]);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem('care_compass_favorites');
      if (stored) setFavorites(JSON.parse(stored));
      else setFavorites([]);
    } catch (err) {
      console.log("Error reading favorites:", err);
    }
  };

  const clearFavoritesFromStorage = async () => {
    try {
      await AsyncStorage.removeItem('care_compass_favorites');
      setFavorites([]);
    } catch (err) {
      console.log("Error clearing favorites:", err);
    }
  };

  const handleClearAllFavorites = () => {
    const message = "Are you sure you want to remove your saved locations?";
    if (Platform.OS === 'web') {
      if (window.confirm(message)) clearFavoritesFromStorage();
    } else {
      Alert.alert("Clear Favorites", message, [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: clearFavoritesFromStorage }
      ]);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandHeaderContainer}>
          <View style={{ width: 44 }} />
          <View style={styles.brandHeaderCenter}>
            <Image
              source={BrandLogo}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoTitle}>SeniorConnect</Text>
            <Text style={styles.logoSubtitle}>Care & Community Within Your Reach</Text>
          </View>

          <TouchableOpacity
            style={styles.settingsIconButton}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Open application settings"
          >
            <Text style={styles.settingsIconEmoji}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.accountBar}>
          {currentUser ? (
            <>
              <Text style={styles.welcomeText}>Welcome back, <Text style={styles.userName}>{currentUser.name || 'User'}</Text></Text>
              <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut(auth)}>
                <Text style={styles.signOutText}>Log Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.guestText}>Using application as Guest</Text>
              <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.navigate('Authentication')}>
                <Text style={styles.signInLinkText}>Sign In / Register →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {favorites.length > 0 && (
          <View style={styles.favoritesSection}>
            <View style={styles.favoritesHeaderRow}>
              <Text style={styles.sectionHeader}>⭐ Favorites</Text>
              <TouchableOpacity onPress={handleClearAllFavorites} style={styles.clearAllBtn}>
                <Text style={styles.clearAllText}>Clear List</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.favScroll}>
              {favorites.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.favCard}
                  onPress={() => navigation.navigate('ServicePortal', {
                    category: item.savedUnderCategory || 'medical',
                    label: item.displayName?.text,
                    initialItem: item
                  })}
                >
                  <Text style={styles.favCardName} numberOfLines={1}>{item.displayName?.text}</Text>
                  <Text style={styles.favCardAddress} numberOfLines={1}>📍 {item.formattedAddress}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Explore Nearby Services</Text>
          <View style={styles.gridContainer}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => navigation.navigate('ServicePortal', { category: service.id, label: service.label })}
              >
                <Text style={styles.cardIcon}>{service.icon}</Text>
                <View style={styles.cardTextContent}>
                  <Text style={styles.cardLabel}>{service.label}</Text>
                  <Text style={styles.cardDesc}>{service.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.volunteerSection}>
          <TouchableOpacity
            style={styles.volunteerCard}
            onPress={() => navigation.navigate('VolunteerPortal')}
          >
            <View style={styles.volunteerHeaderRow}>
              <Text style={styles.volunteerText}>Join as a Volunteer 🙋‍♀️</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>Active</Text></View>
            </View>
            <Text style={styles.volunteerDesc}>
              Support local older adults by offering ride assistance, delivering fresh groceries, or helping out with community events.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAF9F5',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 60,
    maxWidth: 650,
    alignSelf: 'center',
    width: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1A2E26',
    letterSpacing: -0.5
  },
  compassEmoji: {
    color: '#D97706'
  },
  logoSubtitle: {
    fontSize: 16,
    color: '#606A64',
    marginTop: 6,
    fontWeight: '500'
  },
  accountBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#EAE8E0',
    shadowColor: '#1A2E26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  welcomeText: { fontSize: 15, color: '#404A44', fontWeight: '500' },
  userName: { fontWeight: '700', color: '#1A2E26' },
  guestText: { fontSize: 15, color: '#606A64', fontStyle: 'italic', fontWeight: '500' },
  signInBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#EBF2EE', borderRadius: 6 },
  signInLinkText: { color: '#2B6A4F', fontWeight: '700', fontSize: 14 },
  signOutBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#FEE2E2', borderRadius: 8 },
  signOutText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },

  section: { width: '100%', marginBottom: 32 },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#1A2E26', letterSpacing: 0.2, marginBottom: 16 },

  gridContainer: {
    gap: 14,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    shadowColor: '#1A2E26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 18,
  },
  cardTextContent: {
    flex: 1,
  },
  cardLabel: { fontSize: 18, fontWeight: '800', color: '#1A2E26', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#505A54', lineHeight: 19 },

  volunteerSection: { width: '100%', marginTop: 8 },
  volunteerCard: {
    backgroundColor: '#2B6A4F',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#2B6A4F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3
  },
  volunteerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  volunteerText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '750',
    textTransform: 'uppercase'
  },
  volunteerDesc: { fontSize: 14, color: '#E4F2EC', lineHeight: 21, fontWeight: '500' },

  favoritesSection: { marginBottom: 32 },
  favoritesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  clearAllBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#FFF1F2', borderRadius: 8 },
  clearAllText: { color: '#E11D48', fontWeight: '705', fontSize: 13 },
  favScroll: { flexDirection: 'row', paddingVertical: 4 },
  favCard: {
    backgroundColor: '#FFFFFF',
    width: 220,
    padding: 16,
    borderRadius: 16,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  brandHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 28,
    paddingTop: Platform.OS === 'ios' ? 24 : 0
  },
  brandHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logoImage: {
    width: 90,
    height: 90,
    marginBottom: 8,
  },
  logoTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1A2E26',
    letterSpacing: -0.5,
    textAlign: 'center'
  },
  logoSubtitle: {
    fontSize: 15,
    color: '#606A64',
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center'
  },
  settingsIconButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE8E0',
    shadowColor: '#1A2E26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  settingsIconEmoji: {
    fontSize: 20,
    color: '#1A2E26',
  },
  favCardName: { fontSize: 15, fontWeight: '800', color: '#1A2E26', marginBottom: 4 },
  favCardAddress: { fontSize: 13, color: '#606A64' }
});