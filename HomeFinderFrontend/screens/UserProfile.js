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
  Platform,
  SectionList,
  FlatList
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useFilters } from '../context/FilterContext';
import { propertyApi } from '../api/propertyApi';

const UserProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [userProperties, setUserProperties] = useState([]);
  const navigation = useNavigation();
  const { minPrice, maxPrice, bedrooms, bathrooms, propertyType, listingType } = useFilters();

  // Edit Profile States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [id, setID] = useState('');

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const [isPropertiesExpanded, setIsPropertiesExpanded] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      checkAuthStatus();
      fetchUserProperties();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (userInfo && (userInfo.role === 'seller' || userInfo.role === 'agent')) {
        fetchUserProperties();
      }
    }, [userInfo])
  );

  const fetchUserProperties = async () => {
    try {
      const filters = {
        owner: userInfo.id
      };
      const response = await propertyApi.getAllProperties(filters);
      setUserProperties(response);
    } catch (error) {

    }
  };

  const checkAuthStatus = async () => {
    try {
      const userInfoString = await SecureStore.getItemAsync('userInfo');
      const accessToken = await SecureStore.getItemAsync('accessToken');

      if (accessToken) {
        const parsedUserInfo = JSON.parse(userInfoString);
        setUserInfo(parsedUserInfo);
        setUsername(parsedUserInfo?.username || '');
        setEmail(parsedUserInfo?.email || '');
        setPhoneNumber(parsedUserInfo?.phone_number || '');
        setBio(parsedUserInfo?.bio || '');
        setFirstName(parsedUserInfo?.first_name || '');
        setLastName(parsedUserInfo?.last_name || '');
        setID(parsedUserInfo?.id || '');
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
      const formData = new FormData();

      formData.append('username', username);
      formData.append('email', email);
      formData.append('phone_number', phoneNumber);
      formData.append('bio', bio);
      formData.append('first_name', first_name);
      formData.append('last_name', last_name);
      formData.append('id', userInfo.id);

      if (userInfo.profile_picture && userInfo.profile_picture.startsWith('file://')) {
        const imageUri = userInfo.profile_picture;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('profile_picture', {
          uri: imageUri,
          name: filename,
          type
        });
      }

      const updatedData = await propertyApi.updateProfile(formData);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(updatedData));
      setUserInfo(updatedData);
      setIsEditing(false);

    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      console.error('Update profile error:', error);
    }
  };

      const handleAddProperty = async () => {

      setState(prev => ({ ...prev, isLoading: true }));

      try {
        const isAuthenticated = await propertyApi.validateToken();
        navigation.navigate(isAuthenticated ? 'newProperty' : 'UserManagement');
        // Changed 'NewProperty' to 'newProperty' to match the screen name in navigator
      } catch (error) {
        Alert.alert('Session Error', 'Please sign in to continue');
        navigation.navigate('UserManagement');
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }

    };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match!');
      return;
    }

    try {
      const response = await propertyApi.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (response.status === 200) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsChangingPassword(false);
        Alert.alert('Success', 'Password changed successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to change password. Please try again.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'An unexpected error occurred. Please try again.'
      );
    }
  };

  const handleLogout = async () => {
    try {
      await propertyApi.logoutUser();
      navigation.navigate('Map');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderPropertyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })}
    >
      <Image
        source={{
          uri: (
            item.images?.find((img) => img.is_primary) ||
            item.images?.[0]
          )?.image ?? null,
        }}
        style={styles.propertyImage}
      />
      <View style={styles.propertyInfo}>
        <Text>{item.title}</Text>
        <View style={styles.propertyMainInfo}>
          <Text style={styles.propertyPrice}>Ksh. {item.price?.toLocaleString()}</Text>
          <Text style={styles.propertySpecs}>
            {item.bedrooms}b • {item.bathrooms}ba • {item.square_feet}sf
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.propertyAddress}>{item.city}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEditProfile = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={styles.formSection}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
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
          value={first_name}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={last_name}
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
        {/* Add padding at the bottom to ensure all content is accessible when keyboard is shown */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderChangePassword = () => (
  <KeyboardAvoidingView>
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Change Password</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!isCurrentPasswordVisible}
        />
        <TouchableOpacity
          onPress={() => setIsCurrentPasswordVisible((prev) => !prev)}
          style={styles.icon}
        >
          <MaterialIcons
            name={isCurrentPasswordVisible ? 'visibility' : 'visibility-off'}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!isNewPasswordVisible}
        />
        <TouchableOpacity
          onPress={() => setIsNewPasswordVisible((prev) => !prev)}
          style={styles.icon}
        >
          <MaterialIcons
            name={isNewPasswordVisible ? 'visibility' : 'visibility-off'}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!isConfirmPasswordVisible}
        />
        <TouchableOpacity
          onPress={() => setIsConfirmPasswordVisible((prev) => !prev)}
          style={styles.icon}
        >
          <MaterialIcons
            name={isConfirmPasswordVisible ? 'visibility' : 'visibility-off'}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>
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
  </KeyboardAvoidingView>
  );

  const renderAddPropertyButton = () => {
    if (userInfo?.role === 'seller' || userInfo?.role === 'agent') {
      return (
        <TouchableOpacity
          style={styles.addPropertyButton}
          onPress={()=>navigation.navigate("newProperty")}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addPropertyButtonText}>Add Property</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderSections = () => {
    if (isEditing) {
      return [{ title: 'edit', data: [renderEditProfile()] }];
    }
    if (isChangingPassword) {
      return [{ title: 'password', data: [renderChangePassword()] }];
    }

    const sections = [
      {
        title: 'header',
        data: [{
          content: (
            <View style={styles.header}>
              <View style={styles.profileSection}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: userInfo.profile_picture || 'https://via.placeholder.com/150' }}
                    style={styles.profileImage}
                  />
                  {userInfo.is_verified && userInfo.role !== 'buyer' && (
                    <View style={[styles.badge, styles.verifiedBadge]}>
                      <View style={[styles.dot, styles.verifiedDot]} />
                      <Text style={styles.badgeText}>Verified</Text>
                    </View>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>{`${first_name} ${last_name}`}</Text>
                  <Text style={styles.userRole}>{userInfo.role}</Text>
                  <Text style={styles.userEmail}>{email}</Text>
                  {phoneNumber && <Text style={styles.userPhone}>{phoneNumber}</Text>}
                </View>
              </View>
              {bio && <Text style={styles.userBio}>{bio}</Text>}
              {renderAddPropertyButton()}
            </View>
          )
        }]
      }
    ];

    if (userInfo.role === 'seller' || userInfo.role === 'agent') {
      sections.push({
        title: 'properties',
        data: isPropertiesExpanded ? userProperties : []
      });
    }

    sections.push({
      title: 'menu',
      data: [{
        content: (
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

            {userInfo.role === 'buyer' && (
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
            )}

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
        )
      }]
    });

    return sections;
  };

  const renderItem = ({ item, section }) => {
    if (section.title === 'properties') {
      return renderPropertyItem({ item });
    }
    return item.content || item;
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <SectionList
        sections={renderSections()}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => {
          if (section.title === 'properties' && userProperties.length > 0) {
            return (
              <TouchableOpacity
                style={styles.propertiesHeader}
                onPress={() => setIsPropertiesExpanded(!isPropertiesExpanded)}
              >
                <Text style={styles.sectionTitle}>
                  My Properties ({userProperties.length})
                </Text>
                <Ionicons
                  name={isPropertiesExpanded ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#007AFF"
                />
              </TouchableOpacity>
            );
          }
          return null;
        }}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.container}
        stickySectionHeadersEnabled={false}
      />
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
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 12,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
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
    textTransform: 'capitalize',
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
  propertiesSection: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  propertiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },

  propertiesList: {
    paddingHorizontal: 20,
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    height: 80,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  propertyImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  propertyInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  propertyMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  propertySpecs: {
    fontSize: 12,
    color: '#666',
  },
  propertyAddress: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  propertyDetails: {
    fontSize: 14,
    color: '#888',
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
    backgroundColor: '#9e9e9e',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  inputPassword: {
    flex: 1,
    height: 40,
  },
  icon: {
    marginLeft: 10,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
    addPropertyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 15,
  },
  addPropertyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default UserProfile;