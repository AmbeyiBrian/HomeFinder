import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { propertyApi } from '../api/propertyApi';


const UserManagement = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePhoneNumber = (phone_number) => {
      const re = /^(07|01)\d{8}$/; // Validates phone numbers starting with 07 or 01
      return re.test(String(phone_number)); // Test the phone number against the regex
    };


  const handleAuthentication = async () => {
    // Validate inputs
    if (!isLogin) {
      if (!validateEmail(email)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }

      if (!validatePhoneNumber(phone_number)) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid phone number.');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match.');
        return;
      }

      if (!first_name || !last_name) {
        Alert.alert('Missing Information', 'Please provide first and last name.');
        return;
      }
    }

    if (username.length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = isLogin
        ? { username, password }
        : {
            email,
            phone_number,
            username,
            password,
            first_name,
            last_name
          };

      const response = await (isLogin
        ? propertyApi.loginUser(payload)
        : propertyApi.registerUser(payload));
      Alert.alert(
        isLogin ? 'Login Successful' : 'Registration Successful',
        isLogin ? 'Welcome back!' : 'Your account has been created.'
      );

      // Navigate to main app or home screen
      navigation.goBack();
    } catch (error) {
      // Handle authentication errors
      const errorMsg = error.response?.data?.message || 'Authentication failed';
      Alert.alert(isLogin ? 'Login Error' : 'Registration Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

      {!isLogin && (
        <View style={styles.nameContainer}>
          <TextInput
            placeholder="First Name"
            style={[styles.input, styles.halfInput]}
            value={first_name}
            onChangeText={setFirstName}
          />
          <TextInput
            placeholder="Last Name"
            style={[styles.input, styles.halfInput]}
            value={last_name}
            onChangeText={setLastName}
          />
        </View>
      )}

      {!isLogin && (
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      )}

      {!isLogin && (
        <TextInput
          placeholder="Phone Number"
          style={styles.input}
          value={phone_number}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
      )}

      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {!isLogin && (
        <TextInput
          placeholder="Confirm Password"
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      )}

      {!isLogin && (
        <View>
            <Text style={styles.termsConditionsButtonText}>By registering, you imply that have agreed to terms & conditions</Text>
            <TouchableOpacity
            style={styles.termsConditions}
            onPress={()=>navigation.navigate("TermsAndConditions")}
            disabled={isLoading}
          >
            <Text style={styles.authButtonText}>Terms & Conditions </Text>
          </TouchableOpacity>
      </View>
      )}

      <TouchableOpacity
        style={styles.authButton}
        onPress={handleAuthentication}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.authButtonText}>{isLogin ? 'Login' : 'Register'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsLogin(!isLogin)}
        style={styles.switchAuthMode}
      >
        <Text style={styles.switchAuthText}>
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>

      <Text></Text>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={()=>navigation.navigate("Main")}
        disabled={isLoading}
      >
          <Text style={styles.authButtonText}>Continue as Guest</Text>
      </TouchableOpacity>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({

    container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  halfInput: {
    width: '48%'
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: 'white'
  },
  authButton: {
    backgroundColor: '#2089dc',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  switchAuthMode: {
    marginTop: 15,
    alignItems: 'center'
  },
  switchAuthText: {
    color: '#2089dc',
    fontSize: 14
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5
    },
  termsConditions:{
    backgroundColor: '#2089dc',
    height: 20,
    marginVertical:20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  termsConditionsButtonText:{
    fontSize: 13,
    textAlign: 'center',
  }
});

export default UserManagement;
