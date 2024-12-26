import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from "@react-native-community/netinfo";
import haversine from 'haversine';
import debounce from 'lodash.debounce';
import Slider from '@react-native-community/slider';
import * as SecureStore from 'expo-secure-store';

import { propertyApi } from '../api/propertyApi';
import { useFilters } from '../context/FilterContext';
import { usePropertyContext } from '../context/PropertyContext';

const HomeScreen = ({ navigation, route }) => {
  // Context hooks
  const { filters } = useFilters();
  const {
    properties,
    setProperties,
    loading,
    setLoading,
    error,
    setError
  } = usePropertyContext();

  // Local state
  const [region, setRegion] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(500); // Default radius 500 meters
  const [circleCenter, setCircleCenter] = useState(null);

  // Hooks and references
  const insets = useSafeAreaInsets();
  const mapRef = React.useRef(null);

  // Network connectivity check
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Navigation focus and filters
  useEffect(() => {
  const handleFocus = () => {
    // Always fetch properties when screen gains focus
    fetchProperties(true, route.params?.filters || {});
  };

  const unsubscribe = navigation.addListener('focus', handleFocus);
  return unsubscribe;
}, [navigation, route.params, fetchProperties]);

  // Memoized property processing
  const processedProperties = useMemo(() => {
    return properties.map(property => ({
      id: property.id ?? Math.random().toString(),
      name: property.title ?? 'Unnamed Property',
      location: property.city ?? 'Unknown Location',
      latitude: property.latitude ?? 0,
      longitude: property.longitude ?? 0,
      description: property.description ?? 'No description',
      price: property.price ?? 0,
      bedrooms: property.bedrooms ?? 0,
      bathrooms: property.bathrooms ?? 0,
      type: property.type ?? 'Unknown'
    }));
  }, [properties]);

  // Filtered properties based on search, map interaction, and context filters
  const displayProperties = useMemo(() => {
    let result = processedProperties;

    // Context filters
    if (Object.keys(filters).length > 0) {
      result = result.filter(property => {
        return (
          (!filters.minPrice || property.price >= filters.minPrice) &&
          (!filters.maxPrice || property.price <= filters.maxPrice) &&
          (!filters.bedrooms || property.bedrooms === filters.bedrooms) &&
          (!filters.bathrooms || property.bathrooms === filters.bathrooms) &&
          (!filters.propertyType || property.type === filters.propertyType)
        );
      });
    }

    // Text search filter
    if (searchQuery) {
      result = result.filter(property =>
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Radius filter
    if (circleCenter) {
      result = result.filter(property => {
        const start = {
          latitude: circleCenter.latitude,
          longitude: circleCenter.longitude
        };
        const end = {
          latitude: property.latitude,
          longitude: property.longitude
        };
        const distance = haversine(start, end, { unit: 'meter' });
        return distance <= radius;
      });
    }

    return result;
  }, [processedProperties, searchQuery, circleCenter, radius, filters]);

  // Fetch properties with improved error handling and filter support
  const fetchProperties = useCallback(async (showLoading = true, contextFilters = {}) => {
    if (!isConnected) {
      setError('No internet connection');
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);

      const data = await propertyApi.getAllProperties(contextFilters);
      setProperties(data);
      setError(null);
    } catch (err) {
      console.error('Fetch properties error:', err);
      setError(err.message || 'Failed to fetch properties');
      Alert.alert('Error', 'Could not fetch properties. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isConnected, setProperties, setLoading, setError]);

  // Location setup and initial data fetch
  useEffect(() => {
    const setupLocationAndProperties = async () => {
      try {
        // Request location permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Permission to access location was denied',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }

        // Fetch user's current location
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // Update region state
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });

        // Fetch properties
        await fetchProperties();
      } catch (error) {
        console.error('Error in location setup:', error);
        Alert.alert(
          'Error',
          'Could not retrieve location or properties',
          [{ text: 'OK' }]
        );
      } finally {
        setLoading(false);
      }
    };

    setupLocationAndProperties();
  }, [fetchProperties]);

  // Debounced search input handler
  const debouncedSetSearchQuery = useCallback(
    debounce((text) => setSearchQuery(text), 300),
    []
  );

  const handleButtonClick = async () => {
    setIsLoading(true);

    try {
      const response = await propertyApi.validateToken();

      if (response) {
        navigation.navigate('newProperty');
      } else {
        Alert.alert('Invalid Token', 'Your session has expired. Please log in again.');
        navigation.navigate('UserManagement');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while validating your session. Please try again.');
      navigation.navigate('UserManagement');
    } finally {
      setIsLoading(false);
    }
  }

  // Render loading state
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Map and Properties...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={() => fetchProperties()}
          style={styles.retryButton}
          accessibilityLabel="Retry fetching properties"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {region && (
        <View style={styles.mapContainer}>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search"
                size={20}
                color="gray"
                style={styles.searchIcon}
                accessibilityLabel="Search icon"
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search properties..."
                onChangeText={debouncedSetSearchQuery}
                accessibilityLabel="Search properties input"
                accessibilityHint="Enter property name or location to filter results"
              />
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => navigation.navigate('SearchFilter')}
              accessibilityLabel="Open search filters"
            >
              <Ionicons name="options-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Map */}
          <MapView
            ref={mapRef}
            style={[
              styles.map,
              {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingLeft: insets.left,
                paddingRight: insets.right
              }
            ]}
             initialRegion={region}
             showsUserLocation={true}
             showsCompass={true}
             showsMyLocationButton={true}
            onPress={(e) => {
              setCircleCenter(e.nativeEvent.coordinate);
              // Optional: Reset search query when map is tapped
              debouncedSetSearchQuery('');
            }}
          >
            {displayProperties.map((property) => (
              <Marker
                key={property.id}
                coordinate={{
                  latitude: property.latitude,
                  longitude: property.longitude
                }}
                title={property.name}
                description={`${property.location} - $${property.price}`}
                onCalloutPress={() => navigation.navigate('PropertyDetail', { propertyId: property.id })}
              />
            ))}

            {/* Circle drawn by user */}
            {circleCenter && (
              <Circle
                center={circleCenter}
                radius={radius}
                strokeWidth={2}
                strokeColor="blue"
                fillColor="rgba(0, 0, 255, 0.1)"
              />
            )}
          </MapView>

          {/* Properties Count and Filter */}
          <View style={styles.bottomContainer}>
              {/* Property Count */}
              <Text style={styles.propertyCountText}>
                {displayProperties.length} Properties Found
              </Text>

              {/* Slider for radius */}
              <Slider
                style={styles.slider}
                minimumValue={100}
                maximumValue={5000}
                step={100}
                minimumTrackTintColor="#007bff"
                maximumTrackTintColor="#000000"
                value={radius}
                onValueChange={setRadius}
              />

              {/* Display selected radius */}
              <Text style={styles.radiusText}>{radius} meters</Text>
            </View>
        </View>
      )}

      <TouchableOpacity
          style={styles.addButton}
          accessibilityLabel="Add new property"
          onPress={handleButtonClick}
          disabled={isLoading}
        >
          {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="add-circle" size={50} color="#007bff" />
            )}
      </TouchableOpacity>
        </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 10,
    right: 10,
    zIndex: 1,
    borderRadius: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 15,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#007bff',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  bottomContainer: {
    flexDirection: 'column', // Stack the elements vertically
    justifyContent: 'center',
    alignItems: 'center',    // Center the content horizontally
    padding: 20,
    backgroundColor: '#f4f4f4',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginTop: 10,
  },
  propertyCountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,       // Add space between property count and slider
  },
  slider: {
    width: '80%',           // Adjust width for better layout
    height: 40,
    marginBottom: 10,       // Space between slider and radius text
  },
  radiusText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  addButton: {
  position: 'absolute',
  bottom: 120,
  left: 5,
  backgroundColor: 'white',
  borderRadius: 50,
  elevation: 5,
  padding: 10,
},

});

export default HomeScreen;