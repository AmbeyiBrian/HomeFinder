import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Animated,
  PanResponder,
  Platform,
  SafeAreaView
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { propertyApi } from '../api/propertyApi';
import PropertyReviews from '../components/PropertyReviews';

const { width, height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = height * 0.5; // Set to 50% of screen height
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const MAX_LINES = 3;


const PropertyImage = ({ image, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.imageWrapper}>
    <Image
      source={{ uri: image || 'https://via.placeholder.com/400x300.png?text=No+Image' }}
      style={styles.detailImage}
      resizeMode="cover"
      defaultSource={{ uri: 'https://via.placeholder.com/400x300.png?text=Loading' }}
    />
  </TouchableOpacity>
);

const PropertyFeature = ({ icon, value, label }) => (
  <View style={styles.featureItem}>
    <FontAwesome5 name={icon} size={24} color="#4A90E2" />
    <Text style={styles.featureValue}>{value}</Text>
    <Text style={styles.featureLabel}>{label}</Text>
  </View>
);

const SectionHeader = ({ icon, title, IconComponent = MaterialIcons }) => (
  <View style={styles.sectionTitleContainer}>
    <IconComponent name={icon} size={24} color="#4A90E2" />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const ActionButton = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
    <Ionicons name={icon} size={20} color="white" />
    <Text style={styles.actionButtonText}>{label}</Text>
  </TouchableOpacity>
);

const PropertyDetailScreen = ({ route, navigation }) => {
  const { propertyId } = route.params;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [token, setToken] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const scrollY = new Animated.Value(0);
  const [isSwipeEnabled, setIsSwipeEnabled] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);


  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.9, 0.8],
    extrapolate: 'clamp',
  });

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const { dy } = gestureState;
      return Math.abs(dy) > 5;
    },
    onPanResponderMove: (evt, gestureState) => {
      const { dy } = gestureState;
      if (scrollY._value === 0 && dy > 50) {
        setIsImageViewVisible(true);
      }
    },
    onPanResponderRelease: () => {
      setIsSwipeEnabled(true);
    },
  });

  const fetchPropertyDetails = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    setToken(token);

    try {
      setLoading(true);
      const propertyData = await propertyApi.getPropertyById(propertyId);

      const ownerData = propertyData.owner
        ? {
            id: propertyData.owner.id ?? 'N/A',
            name: propertyData.owner.username ?? 'Unknown Owner',
            email: propertyData.owner.email ?? 'No email available',
            phone: propertyData.owner.phone_number ?? 'No phone available',
            profilePicture: propertyData.owner.profile_picture ?? 'https://via.placeholder.com/100.png?text=No+Image',
          }
        : {
            id: 'N/A',
            name: 'Unknown Owner',
            email: 'No email available',
            phone: 'No phone available',
            profilePicture: 'https://via.placeholder.com/100.png?text=No+Image',
          };

      setProperty({
        id: propertyData.id ?? propertyId,
        name: propertyData.title ?? 'Unnamed Property',
        price: propertyData.price ?? 0,
        location: propertyData.city ?? 'Unknown Location',
        bedrooms: propertyData.bedrooms ?? 0,
        bathrooms: propertyData.bathrooms ?? 0,
        area: propertyData.square_feet ?? 0,
        images: propertyData.images.length ? propertyData.images : [{ image: 'https://via.placeholder.com/400x300.png?text=No+Image' }],
        description: propertyData.description ?? 'No description available.',
        availability: propertyData.status ?? 'Available',
        owner: ownerData,
        agent: propertyData.agent ?? { name: 'Unknown', contact: 'N/A' },
        latitude: propertyData.latitude,
        longitude: propertyData.longitude,
        reviews: propertyData.reviews ?? [],
        rating: propertyData.rating ?? 0,
        listing_type: propertyData.listing_type ?? 0,
        is_verified:propertyData.is_verified ?? '',
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching property details:', err);
      setError(err.message || 'Failed to fetch property details');
      setLoading(false);
      Alert.alert(
        'Error',
        'Unable to load property details. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
    return;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use MediaTypeOptions.Images for older versions
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) { // Ensure proper check for cancellation
      const selectedImageUri = result.assets[0].uri;
      setSelectedImage(selectedImageUri);

      const token = await SecureStore.getItemAsync('userToken');
      const formData = new FormData();

      // Ensure propertyId is defined
      formData.append('property', propertyId);
      formData.append('is_primary', 'false');

      // Check for the correct image data format
      formData.append('image', {
        uri: selectedImageUri, // The URI provided by ImagePicker
        type: 'image/jpeg', // Adjust if needed based on file type
        name: `property_image_${propertyId}_${Date.now()}.jpg`, // Unique name with propertyId and timestamp
      });

      // Ensure headers are set correctly
      await propertyApi.createPropertyImage(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        }
      });

      Alert.alert('Success', 'Image uploaded successfully');
      await fetchPropertyDetails(); // Refetch property details
    }
  } catch (error) {
    console.error('Image upload error:', error);
    Alert.alert('Error', 'Failed to upload image. Please try again.');
  }
};


  const handleDeleteImage = (index) => {
    Alert.alert(
      "Delete Image",
      "Are you sure you want to delete this image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const imageToDelete = property.images[index];
              await propertyApi.deletePropertyImage(imageToDelete.id, token);
              const updatedImages = property.images.filter((_, i) => i !== index);
              setProperty((prev) => ({ ...prev, images: updatedImages }));
              Alert.alert("Success", "Image deleted successfully");
            } catch (err) {
              Alert.alert("Error", "Failed to delete image");
            }
          },
        },
      ]
    );
  };

    const checkIfFavorited = async () => {
        if(validToken){
            try {
              const response = await propertyApi.getFavorites();
              const isFav = response.some(fav => fav.property.id === propertyId);
              setIsFavorited(isFav);
            } catch (error) {
              console.error('Error checking favorites:', error);
            }
        }else{

        }


  };

  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);


    const handleFavoritePress = async () => {
      if (validToken) {
        try {
          if (isFavorited) {
            // Find the favorite ID first
            const favorites = await propertyApi.getFavorites();
            const favorite = favorites.find(fav => fav.property.id === propertyId);
            if (favorite) {
              await propertyApi.removeFavorite(favorite.id);
              setIsFavorited(false);
            }
          } else {
            await propertyApi.addFavorite(propertyId);
            setIsFavorited(true);
          }
        } catch (error) {
          console.error('Error managing favorite:', error);
          Alert.alert('Error', 'Failed to update favorites');
        }
      } else {
        Alert.alert(
        'Sign In Required',
        'Please sign in to favorite this property.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('UserManagement')
          }
        ]
      );
      }
    };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const isTokenValid = await propertyApi.validateToken();
        setValidToken(isTokenValid);

        const userInfoString = await SecureStore.getItemAsync('userInfo');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          setUserInfo(userInfo);
        }

        await fetchPropertyDetails();
        await checkIfFavorited(); // Add this line
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchData();
  }, [propertyId]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const isTokenValid = await propertyApi.validateToken();
        setValidToken(isTokenValid);

        const userInfoString = await SecureStore.getItemAsync('userInfo');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          setUserInfo(userInfo);
        }

        await fetchPropertyDetails();
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchData();
  }, [propertyId]);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading Property Details...</Text>
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialIcons name="error-outline" size={80} color="#FF6B6B" />
        <Text style={styles.errorText}>{error || 'No property found'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const zoomImages = property.images.map(img => ({
    url: img.image || 'https://via.placeholder.com/400x300.png?text=No+Image'
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerTranslateY }],
          }
        ]}
      >
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: imageOpacity,
            }
          ]}
          {...panResponder.panHandlers}
        >
          <FlatList
            data={property.images}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={isSwipeEnabled}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems.length > 0) {
                setCurrentImageIndex(viewableItems[0].index || 0);
              }
            }}
            renderItem={({ item }) => (
              <PropertyImage
                image={item.image}
                onPress={() => setIsImageViewVisible(true)}
              />
            )}
          />

          <View style={styles.imageOverlay}>
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {property.images.length}
              </Text>
            </View>
          </View>
        </Animated.View>

        {validToken === true && property.owner.name === userInfo?.username && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickImage}
            >
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Upload Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProperty', { propertyId: property.id })}
            >
              <Ionicons name="create" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Edit Property</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingTop: HEADER_MAX_HEIGHT }
        ]}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.detailContent}>
          <View style={styles.headerContainer}>
            <Animated.Text
              style={[
                styles.detailTitle,
                { transform: [{ scale: titleScale }] }
              ]}
            >
              {property.name}
            </Animated.Text>
            <View style={styles.priceTagContainer}>
              <FontAwesome5 name="tag" size={20} color="#4A90E2" />
              <Text style={styles.detailPrice}>Ksh {property.price.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <Ionicons name="location-sharp" size={20} color="#FF6B6B" />
            <Text style={styles.detailLocation}>
              {property.location} • {property.listing_type}
            </Text>
          </View>

          <View style={styles.badgeContainer}>
              <View style={[styles.badge, styles.statusBadge]}>
                <View style={styles.dot} />
                <Text style={styles.badgeText}>{property.availability}</Text>
              </View>
              {property.is_verified && (
                <View style={[styles.badge, styles.verifiedBadge]}>
                  <View style={[styles.dot, styles.verifiedDot]} />
                  <Text style={styles.badgeText}>Verified</Text>
                </View>
              )}
            </View>

          <View style={styles.propertyFeatures}>
            <PropertyFeature icon="bed" value={property.bedrooms} label="Bedrooms" />
            <PropertyFeature icon="bath" value={property.bathrooms} label="Bathrooms" />
            <PropertyFeature icon="ruler-combined" value={`${property.area} sq.ft`} label="Area" />
          </View>

          <View style={styles.card}>
            <SectionHeader icon="person" title="Agent Information" />
            <View style={styles.agentInfo}>
              <Image
                source={{ uri: property.owner.profilePicture }}
                style={styles.agentImage}
              />
              <View style={styles.agentDetails}>
                <Text style={styles.agentName}>{property.owner.name}</Text>
                <TouchableOpacity
                  style={styles.contactInfo}
                  onPress={() => Linking.openURL(`tel:${property.owner.phone}`)}
                >
                  <Ionicons name="call" size={18} color="#4A90E2" />
                  <Text style={styles.agentContact}>{property.owner.phone}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.card}>
              <SectionHeader icon="star" title="Reviews" IconComponent={Ionicons} />
              <PropertyReviews
                propertyId={property.id.toString()}
                onReviewAdded={() => fetchPropertyDetails()}
                navigation={navigation}
              />
            </View>

          <View style={styles.card}>
              <SectionHeader icon="description" title="Description" />
              <View>
                <Text
                  style={styles.description}
                  numberOfLines={isDescriptionExpanded ? undefined : MAX_LINES}
                >
                  {property.description}
                </Text>
                {property.description.length > 120 && (
                  <TouchableOpacity
                    onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    style={styles.seeMoreButton}
                  >
                    <Text style={styles.seeMoreText}>
                      {isDescriptionExpanded ? 'See less' : 'See more...'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

          <View style={styles.buttonsContainer}>
            <ActionButton
              icon="chatbubble"
              label="Contact"
              color="#4A90E2"
              onPress={() => Linking.openURL(`tel:${property.owner.phone}`)}
            />
            <ActionButton
              icon={isFavorited ? "heart" : "heart-outline"}
              label={isFavorited ? "Favorited" : "Favorite"}
              color={isFavorited ? "#e74c3c" : "#95a5a6"}
              onPress={handleFavoritePress}
            />
            <ActionButton
              icon="share-social"
              label="Share"
              color="#2ECC71"
              onPress={() => {
                const shareMessage = `Check out this property: ${property.name} - ${property.location}`;
                Linking.openURL(`whatsapp://send?text=${shareMessage}`);
              }}
            />
            <ActionButton
              icon="map"
              label="Map"
              color="#FF6B6B"
              onPress={() => {
                const url = `https://www.google.com/maps?q=${property.latitude},${property.longitude}`;
                Linking.openURL(url);
              }}
            />
          </View>

        </View>
      </Animated.ScrollView>

      <Modal
        isVisible={isImageViewVisible}
        style={styles.zoomModal}
        onBackdropPress={() => setIsImageViewVisible(false)}
        onSwipeComplete={() => setIsImageViewVisible(false)}
        swipeDirection={['down']}
        propagateSwipe
      >
        <View style={styles.zoomModalContent}>
          <TouchableOpacity
            style={styles.closeZoomButton}
            onPress={() => setIsImageViewVisible(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          {validToken === true && property.owner.name === userInfo?.username && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteImage(currentImageIndex)}
            >
              <Ionicons name="trash" size={30} color="red" />
            </TouchableOpacity>
          )}

          <ImageViewer
            imageUrls={zoomImages}
            index={currentImageIndex}
            onChange={(index) => setCurrentImageIndex(index)}
            enableSwipeDown
            onSwipeDown={() => setIsImageViewVisible(false)}
            saveToLocalByLongPress={false}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MAX_HEIGHT,
    backgroundColor: '#FFF',
    zIndex: 1000,
    elevation: 4,
  },
  headerContent: {
    height: HEADER_MAX_HEIGHT,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: HEADER_MAX_HEIGHT,
    backgroundColor: '#f5f5f5',
  },
  imageWrapper: {
    width: width,
    height: HEADER_MAX_HEIGHT,
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  imageCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  imageCounterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  detailContent: {
    padding: 15,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 20, // Add spacing
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10, // Add top margin
  },
  detailTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  priceTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  detailPrice: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLocation: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  availability: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  available: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  sold: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  propertyFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  featureLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#333',
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  agentImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentContact: {
    fontSize: 16,
    color: '#4A90E2',
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  rating: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  noReviewsText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  seeMoreButton: {
    marginTop: 8,
  },
  seeMoreText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 8,
    elevation: 2,
    marginLeft: 10,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  zoomModal: {
    margin: 0,
  },
  zoomModalContent: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeZoomButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 20,
  },
  deleteButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#4A90E2',
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 15,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
   buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
    gap: 8, // Reduced gap to fit four buttons
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10, // Reduced padding to fit four buttons
    borderRadius: 10,
    elevation: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
    marginRight: 6,
  },
  verifiedDot: {
    backgroundColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default PropertyDetailScreen;