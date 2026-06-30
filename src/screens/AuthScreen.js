import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import BrandLogo from '../assets/logo.png';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('elder');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAuthAction = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill out your Email and Password fields.');
      return;
    }
    if (!isLogin && !name.trim()) {
      Alert.alert('Missing Field', 'Please provide your Full Name.');
      return;
    }
    if (!isLogin && password.length < 6) {
      Alert.alert('Weak Security Pin', 'For security, your password pin must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;
        await getDoc(doc(db, 'users', uid));

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigation.navigate('Home');
        }, 2000);

      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;

        await setDoc(doc(db, 'users', uid), {
          uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          phone: phone.trim(),
          createdAt: new Date().toISOString()
        });

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigation.navigate('Home');
        }, 2500);
      }
    } catch (error) {
      console.error("Firebase Auth Error Details:", error);
      let friendlyMessage = 'Please check your network connection and try again.';

      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account is already registered with this email address. Try logging in securely instead, or use a different email.';
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = 'The email format you typed doesn\'t look quite right. Please double-check it.';
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = 'For your safety, passwords pins must be at least 6 characters or numbers long.';
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        friendlyMessage = 'The email address or secure login pin you entered doesn\'t match our records.';
      }
      if (Platform.OS === 'web') {
        window.alert(`Account Notice: \n\n${friendlyMessage}`);
      } else {
        Alert.alert('Account Notice', friendlyMessage, [{ text: 'Understood' }]);
      }

    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>
            {isLogin ? 'Welcome Back!' : 'Account Ready!'}
          </Text>
          <Text style={styles.successMessage}>
            {isLogin
              ? `Logging you safely into SeniorConnect...`
              : `Thank you for joining, ${name}! Your profile is fully active.`
            }
          </Text>
          <ActivityIndicator size="small" color="#2B6A4F" style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.topNavigationRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandHeader}>
          <Text style={styles.logoTitle}>Welcome to SeniorConnect!</Text>
          <Image
            source={BrandLogo}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoSubtitle}>Care & Community Within Your Reach</Text>
        </View>

        {!isLogin && (
          <View style={styles.roleWrapper}>
            <Text style={styles.fieldLabel}>I am a:</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleTab, role === 'elder' && styles.activeElderTab]}
                onPress={() => setRole('elder')}
              >
                <Text style={[styles.roleTabText, role === 'elder' && styles.activeTabText]}>👴 Senior / Elder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleTab, role === 'volunteer' && styles.activeVolunteerTab]}
                onPress={() => setRole('volunteer')}
              >
                <Text style={[styles.roleTabText, role === 'volunteer' && styles.activeTabText]}>🙋‍♀️ Volunteer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.formContainer}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Your Full Name"
              placeholderTextColor="#707A74"
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#707A74"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Phone Number (Optional)"
              placeholderTextColor="#707A74"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Password Secure Pin"
            placeholderTextColor="#707A74"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.mainSubmitBtn} onPress={handleAuthAction} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isLogin ? 'Log In Securely' : 'Complete Registration'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleContextModeBtn} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin ? "New to SeniorConnect? Create an account here" : "Already have an active account? Log in"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F5' },
  topNavigationRow: { width: '100%', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 20, backgroundColor: '#FAF9F5', flexDirection: 'row' },
  backButton: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#EAE8E0', borderRadius: 8 },
  backButtonText: { color: '#1A2E26', fontWeight: '700', fontSize: 14 },
  scrollContent: { padding: 24, paddingTop: 30, alignItems: 'center', maxWidth: 450, alignSelf: 'center', width: '100%' },
  logoTitle: { fontSize: 32, fontWeight: '900', color: '#1A2E26', marginBottom: 4 },
  logoSubtitle: { fontSize: 15, color: '#505A54', textAlign: 'center', marginBottom: 35, fontWeight: '500' },
  formContainer: { width: '100%' },
  input: { width: '100%', height: 58, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE8E0', borderRadius: 14, paddingHorizontal: 16, fontSize: 16, color: '#1A2E26', marginBottom: 14 },
  roleWrapper: { width: '100%', marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '800', color: '#1A2E26', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleTab: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#EAE8E0' },
  activeElderTab: { backgroundColor: '#1A2E26', borderColor: '#1A2E26' },
  activeVolunteerTab: { backgroundColor: '#2B6A4F', borderColor: '#2B6A4F' },
  roleTabText: { fontWeight: '700', color: '#505A54', fontSize: 14 },
  activeTabText: { color: '#fff' },
  mainSubmitBtn: { width: '100%', height: 56, backgroundColor: '#2B6A4F', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#1A2E26', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  toggleContextModeBtn: { marginTop: 24, padding: 10, width: '100%', alignItems: 'center' },
  toggleText: { color: '#2B6A4F', fontWeight: '700', fontSize: 14, textAlign: 'center', textDecorationLine: 'underline' },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 8,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A2E26',
    letterSpacing: -0.5,
    alignContent: 'center'
  },
  successContainer: { flex: 1, backgroundColor: '#1A2E26', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: { backgroundColor: '#FFFFFF', padding: 32, borderRadius: 24, width: '100%', maxWidth: 380, alignItems: 'center' },
  successIcon: { fontSize: 54, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#1A2E26', marginBottom: 8 },
  successMessage: { fontSize: 15, color: '#505A54', textAlign: 'center', lineHeight: 22, fontWeight: '500' }
});