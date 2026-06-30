import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function VolunteerPortalScreen({ navigation }) {
  const [taskType, setTaskType] = useState('groceries');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [locationZone, setLocationZone] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePostRequest = async () => {
    // Validate that fields are not empty
    if (!clientName.trim() || !description.trim() || !locationZone.trim() || !scheduledTime.trim()) {
      Alert.alert('Missing Info', 'Please fill out all the form fields to post your availability.');
      return;
    }

    setLoading(true);

    try {
      // 🚀 Saves directly to your 'volunteer_submissions' collection in Firestore
      await addDoc(collection(db, 'volunteer_submissions'), {
        type: taskType,
        volunteerName: clientName.trim(),
        restrictions: description.trim(),
        locationZone: locationZone.trim(),
        availableTime: scheduledTime.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      Alert.alert(
        "Information Submitted!",
        "Your availability has been logged successfully. A coordinator will match you with a senior shortly.",
        [{ text: "Great", onPress: () => navigation.navigate('Home') }]
      );

      // Reset form fields
      setClientName('');
      setDescription('');
      setLocationZone('');
      setScheduledTime('');
    } catch (error) {
      console.error("Firestore Write Error:", error);
      Alert.alert('Submission Error', 'Could not save your details to the database. Please check your permissions or connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Volunteer Request Manager</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBox}>
          <Text style={styles.heroTitle}>Volunteer Information Form:</Text>
          <Text style={styles.heroDesc}>
            Fill out the details below to submit your information to help out a senior with anything they might need.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.fieldLabel}>Resource Category Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeTab, taskType === 'groceries' && styles.activeTypeTab]}
              onPress={() => setTaskType('groceries')}
            >
              <Text style={[styles.typeTabText, taskType === 'groceries' && styles.activeText]}>🛒 Groceries</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeTab, taskType === 'transport' && styles.activeTypeTab]}
              onPress={() => setTaskType('transport')}
            >
              <Text style={[styles.typeTabText, taskType === 'transport' && styles.activeText]}>🚗 Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeTab, taskType === 'social' && styles.activeTypeTab]}
              onPress={() => setTaskType('social')}
            >
              <Text style={[styles.typeTabText, taskType === 'social' && styles.activeText]}>☕ Visit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeTab, taskType === 'other' && styles.activeTypeTab]}
              onPress={() => setTaskType('other')}
            >
              <Text style={[styles.typeTabText, taskType === 'other' && styles.activeText]}>💬 Other</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Volunteer Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., John Smith"
            placeholderTextColor="#707A74"
            value={clientName}
            onChangeText={setClientName}
          />

          <Text style={styles.fieldLabel}>Available Date & Time</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Tomorrow at 10:00 AM"
            placeholderTextColor="#707A74"
            value={scheduledTime}
            onChangeText={setScheduledTime}
          />

          <Text style={styles.fieldLabel}>Neighborhood Location / Region</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Central Austin, TX"
            placeholderTextColor="#707A74"
            value={locationZone}
            onChangeText={setLocationZone}
          />

          <Text style={styles.fieldLabel}>Any Restrictions?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide explicit restrictions (e.g., Don't have access to car, need something easily accessed with public transportation)."
            placeholderTextColor="#707A74"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handlePostRequest} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Volunteer Information</Text>
            )}
          </TouchableOpacity>
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
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A2E26' },

  scrollContent: { padding: 20, maxWidth: 480, alignSelf: 'center', width: '100%', paddingBottom: 50 },
  heroBox: { backgroundColor: '#2B6A4F', padding: 24, borderRadius: 20, marginBottom: 24 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  heroDesc: { fontSize: 14, color: '#E4F2EC', lineHeight: 20, fontWeight: '500' },

  formContainer: { width: '100%' },
  fieldLabel: { fontSize: 14, fontWeight: '800', color: '#1A2E26', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { width: '100%', height: 56, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAE8E0', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: '#1A2E26', marginBottom: 18 },
  textArea: { height: 110, paddingVertical: 14, paddingTop: 14, textAlignVertical: 'top' }, // 💡 Fixed paddingKey typo here

  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeTab: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1.5, borderColor: '#EAE8E0' },
  activeTypeTab: { backgroundColor: '#1A2E26', borderColor: '#1A2E26' },
  typeTabText: { fontWeight: '700', color: '#505A54', fontSize: 13 },
  activeText: { color: '#FFFFFF' },

  submitBtn: { width: '100%', height: 56, backgroundColor: '#2B6A4F', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#1A2E26', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
});