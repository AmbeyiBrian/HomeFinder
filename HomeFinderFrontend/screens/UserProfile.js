import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFilters } from '../context/FilterContext';
import { propertyApi } from '../api/propertyApi';

const UserProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const navigation = useNavigation();
  const { minPrice, maxPrice, bedrooms, bathrooms, propertyType, listingType } = useFilters();

  // Edit Profile States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

    useFocusEffect(
      React.useCallback(() => {
        checkAuthStatus();
      }, [])
    );

  const checkAuthStatus = async () => {
    try {
      const userInfoString = await SecureStore.getItemAsync('userInfo');
      const accessToken = await SecureStore.getItemAsync('accessToken');
      console.log(accessToken)
      if (accessToken) {
        const parsedUserInfo = JSON.parse(userInfoString);
        setUserInfo(parsedUserInfo);
        // Initialize edit states
        setUsername(parsedUserInfo.username || '');
        setEmail(parsedUserInfo.email || '');
        setPhoneNumber(parsedUserInfo.phone_number || '');
        setBio(parsedUserInfo.bio || '');
        setFirstName(parsedUserInfo.firstname || '');
        setLastName(parsedUserInfo.lastname || '');
      } else {
        navigation.navigate('UserManagement');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      navigation.navigate('UserManagement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePick = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (permissionResult.granted === false) {
    Alert.alert('Permission Required', 'You need to enable photo library access');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled) {
    // Update the state and make API call to update profile picture
    const updatedUserInfo = {
      ...userInfo,
      profile_picture: result.assets[0].uri
    };
    await SecureStore.setItemAsync('userInfo', JSON.stringify(updatedUserInfo));
    setUserInfo(updatedUserInfo);
  }
};

  const handleUpdateProfile = async () => {
    try {
      // Here you would typically make an API call to update the profile
      const updatedUserInfo = {
        ...userInfo,
        username,
        email,
        phone_number: phoneNumber,
        bio,
        firstname: firstName,
        lastname: lastName
      };

      // Update SecureStore with new user info
      await SecureStore.setItemAsync('userInfo', JSON.stringify(updatedUserInfo));
      setUserInfo(updatedUserInfo);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match!');
      return;
    }

    try {
      // Here you would typically make an API call to change the password

      // Reset password fields and close the form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      propertyApi.logoutUser()
      navigation.navigate('Map')

    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!userInfo) {
    return null;
  }

  const renderEditProfile = () => (
    <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Edit Profile</Text>

        <TouchableOpacity onPress={handleImagePick} style={styles.imagePickerButton}>
          <Image
            source={{ uri: userInfo.profile_picture || 'https://via.placeholder.com/150' }}
            style={styles.editProfileImage}
          />
          <View style={styles.imageOverlay}>
            <Ionicons name="camera" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => setIsEditing(false)}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleUpdateProfile}
        >
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChangePassword = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Change Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Current Password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => setIsChangingPassword(false)}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleChangePassword}
        >
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: userInfo.profile_picture || 'https://via.placeholder.com/150' }}
                style={styles.profileImage}
              />
              {userInfo.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                </View>
              )}
            </View>
            {!isEditing && !isChangingPassword && (
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{userInfo.username || 'User Name'}</Text>
                <Text style={styles.userRole}>{userInfo.role || 'User'}</Text>
                <Text style={styles.userEmail}>{userInfo.email || 'email@example.com'}</Text>
                {userInfo.phone_number && (
                  <Text style={styles.userPhone}>{userInfo.phone_number}</Text>
                )}
              </View>
            )}
          </View>
          {!isEditing && !isChangingPassword && userInfo.bio && (
            <Text style={styles.userBio}>{userInfo.bio}</Text>
          )}
        </View>

        {/* Forms */}
        {isEditing && renderEditProfile()}
        {isChangingPassword && renderChangePassword()}

        {/* Menu Section */}
        {!isEditing && !isChangingPassword && (
          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsEditing(true)}
            >
              <View style={styles.menuButtonContent}>
                <Ionicons name="person-outline" size={24} color="#007AFF" />
                <Text style={styles.menuButtonText}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsChangingPassword(true)}
            >
              <View style={styles.menuButtonContent}>
                <Ionicons name="key-outline" size={24} color="#007AFF" />
                <Text style={styles.menuButtonText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate('Favorites')}
            >
              <View style={styles.menuButtonContent}>
                <Ionicons name="heart-outline" size={24} color="#007AFF" />
                <Text style={styles.menuButtonText}>Saved Properties</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate('SearchFilter')}
            >
              <View style={styles.menuButtonContent}>
                <Ionicons name="options-outline" size={24} color="#007AFF" />
                <Text style={styles.menuButtonText}>Search Preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleLogout}
            >
              <View style={styles.menuButtonContent}>
                <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                <Text style={[styles.menuButtonText, { color: '#FF3B30' }]}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
  },
  userBio: {
    fontSize: 14,
    color: '#444',
    marginTop: 10,
    lineHeight: 20,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerButton: {
  alignSelf: 'center',
  marginBottom: 20,
  position: 'relative',
},
editProfileImage: {
  width: 100,
  height: 100,
  borderRadius: 50,
},
imageOverlay: {
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  borderRadius: 15,
  padding: 8,
},
});

export default UserProfile;