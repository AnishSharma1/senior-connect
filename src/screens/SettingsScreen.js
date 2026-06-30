import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function SettingsScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePolicySection, setActivePolicySection] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  // Sign out functionality 
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      if (Platform.OS === 'web') {
        window.alert("Logged Out: You have been safely signed out of your account.");
      } else {
        Alert.alert("Logged Out", "You have been safely signed out of your account.");
      }
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

  const togglePolicy = (section) => {
    setActivePolicySection(activePolicySection === section ? null : section);
  };

  const handleDeleteAccount = () => {
    const message = "Are you absolutely sure you want to permanently delete your account? This action cannot be undone, and all your profile records will be wiped.";

    const executeDeletion = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // deletes from the database
        await deleteDoc(doc(db, 'users', user.uid));

        // deletes from the users 
        await deleteUser(user);

        if (Platform.OS === 'web') {
          window.alert("Account Deleted. Your profile data has been deleted from our system.");
        } else {
          Alert.alert("Account Removed", "Your profile data has been deleted from our system.");
        }
        navigation.navigate('Home');
      } catch (err) {
        console.error("Account deletion failed:", err);

        if (err.code === 'auth/requires-recent-login') {
          const loginMessage = "For your security, please log out and sign back in before attempting to close your account profile.";
          if (Platform.OS === 'web') window.alert(loginMessage);
          else Alert.alert("Security Timeout", loginMessage);
        } else {
          const generalErr = "Could not delete profile data right now. Please check your network connection.";
          if (Platform.OS === 'web') window.alert(generalErr);
          else Alert.alert("Error", generalErr);
        }
      }
    };

    // Platform target alert configurations
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        executeDeletion();
      }
    } else {
      Alert.alert(
        "Delete Profile Permanent",
        message,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete Permanently", style: "destructive", onPress: executeDeletion }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Guidelines</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* SECTION 1: ACCOUNT PREFERENCES */}
        <Text style={styles.sectionLabel}>Account Profile</Text>
        <View style={styles.settingsGroupCard}>
          {currentUser ? (
            <View style={styles.accountWrapper}>
              <View style={styles.accountRow}>
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>
                    {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View style={styles.accountMeta}>
                  <Text style={styles.accountEmail} numberOfLines={1}>{currentUser.email}</Text>
                  <Text style={styles.accountStatusTag}>Verified Account</Text>
                </View>
              </View>
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.logOutActionBtn} onPress={handleSignOut}>
                  <Text style={styles.logOutActionText}>Log Out</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteActionBtn} onPress={handleDeleteAccount}>
                  <Text style={styles.deleteActionText}>Delete Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.accountRow}>
              <Text style={styles.guestStatusText}>Browsing Securely as Guest</Text>
              <TouchableOpacity style={styles.signInActionBtn} onPress={() => navigation.navigate('Authentication')}>
                <Text style={styles.signInActionText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SECTION 2: APP PREFERENCES */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.settingsGroupCard}>
          <TouchableOpacity style={styles.settingRow} onPress={() => Alert.alert("Location Status", "SeniorConnect pings local device GPS variables natively context-to-context. No location data history is compiled.")}>
            <View>
              <Text style={styles.rowMainText}>Location Framework</Text>
              <Text style={styles.rowSubText}>Configured to immediate tracking zone</Text>
            </View>
            <Text style={styles.chevronIcon}>&gt;</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 3: APP INFO */}
        <Text style={styles.sectionLabel}>App Documentation</Text>

        {/* Accordion Element 1: Manual */}
        <View style={styles.accordionGroupItem}>
          <TouchableOpacity style={styles.accordionTrigger} onPress={() => togglePolicy('useGuide')}>
            <Text style={styles.accordionLabelText}>📖 How to Use the Platform</Text>
            <Text style={styles.accordionToggleIndicator}>{activePolicySection === 'useGuide' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {activePolicySection === 'useGuide' && (
            <View style={styles.accordionInnerPayload}>
              <Text style={styles.payloadTitle}>👴 For Seniors</Text>
              <Text style={styles.payloadText}>Tap any category to populate resources. Select "Open Options" to fetch navigational details, share the details with anyone through text, or to call the service.</Text>
              <Text style={styles.payloadTitle}>🙋‍♀️ For Volunteers</Text>
              <Text style={styles.payloadText}>Navigate to the volunteer page to fill out the form where a coordinator will be with you about how you can help within 1-2 business days.</Text>
            </View>
          )}
        </View>

        {/* Accordion Element 2: Privacy */}
        <View style={styles.accordionGroupItem}>
          <TouchableOpacity style={styles.accordionTrigger} onPress={() => togglePolicy('privacyDoc')}>
            <Text style={styles.accordionLabelText}>📜 Privacy Regulations</Text>
            <Text style={styles.accordionToggleIndicator}>{activePolicySection === 'privacyDoc' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {activePolicySection === 'privacyDoc' && (
            <View style={styles.accordionInnerPayload}>
              <Text style={styles.payloadText}>Your exact geo-location tracking data is processed directly inside your browser or device hardware layers. SeniorConnect logs zero telemetry histories or long-term spatial trails on database servers.</Text>
            </View>
          )}
        </View>

        {/* 3: Terms */}
        <View style={styles.accordionGroupItem}>
          <TouchableOpacity style={styles.accordionTrigger} onPress={() => togglePolicy('safetyTerms')}>
            <Text style={styles.accordionLabelText}>🤝 Safety Terms & Conditions</Text>
            <Text style={styles.accordionToggleIndicator}>{activePolicySection === 'safetyTerms' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {activePolicySection === 'safetyTerms' && (
            <View style={styles.accordionInnerPayload}>
              <Text style={styles.payloadText}>All task coordinators and community dispatchers are expected to operate with complete transparency, respectful conduct, and honest neighborly support frameworks.</Text>
            </View>
          )}
        </View>

        {/* SECTION 4: SUPPORT / CONTACT */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.contactCard}>
          <Text style={styles.contactText}>
            If you have any questions, please contact us at{' '}
            <Text style={styles.contactEmailLink}>seniorconnect65@gmail.com</Text>
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footerStamp}>
          <Text style={styles.stampMain}>SeniorConnect</Text>
          <Text style={styles.stampSub}>Care & Community Within Your Reach</Text>
          <Text style={styles.stampVersion}>v1.0.0 • 2026</Text>
        </View>

      </ScrollView>
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
  headerTitle: { fontSize: 21, fontWeight: '900', color: '#1A2E26' },

  scrollContent: { padding: 18, maxWidth: 520, alignSelf: 'center', width: '100%', paddingBottom: 60 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#606A64', textTransform: 'uppercase', letterSpacing: 0.6, marginLeft: 6, marginBottom: 8, marginTop: 22 },

  settingsGroupCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAE8E0', overflow: 'hidden', paddingHorizontal: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  rowMainText: { fontSize: 16, fontWeight: '700', color: '#1A2E26' },
  rowSubText: { fontSize: 13, color: '#606A64', marginTop: 2, fontWeight: '500' },
  chevronIcon: { fontSize: 16, color: '#707A74', fontWeight: '700', marginRight: 4 },

  accountWrapper: { paddingVertical: 16 },
  accountRow: { flexDirection: 'row', alignItems: 'center' },
  profileBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EBF2EE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  profileBadgeText: { fontSize: 18, fontWeight: '800', color: '#2B6A4F' },
  accountMeta: { flex: 1, marginRight: 8 },
  accountEmail: { fontSize: 15, fontWeight: '700', color: '#1A2E26' },
  accountStatusTag: { fontSize: 12, color: '#2B6A4F', fontWeight: '700', marginTop: 2 },

  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    ...Platform.select({
      web: { gap: 10 },
      default: { gap: 10 }
    })
  },
  logOutActionBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logOutActionText: { color: '#4B5563', fontWeight: '700', fontSize: 14 },
  deleteActionBtn: {
    flex: 1,
    backgroundColor: '#FFF1F2',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteActionText: { color: '#E11D48', fontWeight: '700', fontSize: 14 },

  guestStatusText: { flex: 1, fontSize: 15, color: '#606A64', fontStyle: 'italic', fontWeight: '500' },
  signInActionBtn: { backgroundColor: '#2B6A4F', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  signInActionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  accordionGroupItem: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAE8E0', marginBottom: 10, overflow: 'hidden' },
  accordionTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  accordionLabelText: { fontSize: 15, fontWeight: '700', color: '#1A2E26' },
  accordionToggleIndicator: { fontSize: 12, color: '#707A74', fontWeight: '700' },
  accordionInnerPayload: { padding: 18, paddingTop: 2, borderTopWidth: 1, borderTopColor: '#FAF9F5', backgroundColor: '#FCFBFA' },
  payloadTitle: { fontSize: 14, fontWeight: '800', color: '#2B6A4F', marginTop: 10, marginBottom: 4 },
  payloadText: { fontSize: 14, color: '#404A44', lineHeight: 20, fontWeight: '500' },

  contactCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAE8E0', padding: 18 },
  contactText: { fontSize: 14, color: '#404A44', lineHeight: 20, fontWeight: '500' },
  contactEmailLink: { color: '#2B6A4F', fontWeight: '700' },

  footerStamp: { alignItems: 'center', marginTop: 44, marginBottom: 10 },
  stampMain: { fontSize: 18, fontWeight: '900', color: '#1A2E26' },
  stampSub: { fontSize: 13, color: '#606A64', fontWeight: '500', marginTop: 2 },
  stampVersion: { fontSize: 12, color: '#707A74', fontWeight: '600', marginTop: 6 }
});