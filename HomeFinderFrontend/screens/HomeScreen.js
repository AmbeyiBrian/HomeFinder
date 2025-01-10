import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Circle, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from "@react-native-community/netinfo";
import haversine from 'haversine';
import Slider from '@react-native-community/slider';
import debounce from 'lodash.debounce';
import * as SecureStore from 'expo-secure-store';

import { propertyApi } from '../api/propertyApi';
import { useFilters } from '../context/FilterContext';
import { usePropertyContext } from '../context/PropertyContext';
import SearchBar from '../components/searchBar';
import { advancedSearchProperties } from '../components/searchUtils';

const INITIAL_RADIUS = 500;
const MIN_RADIUS = 100;
const MAX_RADIUS = 5000;
const RADIUS_STEP = 100;

const HomeScreen = ({ navigation, route }) => {
  const { filters } = useFilters();
  const { properties, setProperties, loading, setLoading, error, setError } = usePropertyContext();
  const insets = useSafeAreaInsets();
  const mapRef = React.useRef(null);
  const [userInfo, setUserInfo] = useState(null);
  const [userRole, setUserRole] = useState('')

  const [state, setState] = useState({
    region: null,
    isConnected: true,
    isLoading: false,
    searchQuery: '',
    radius: INITIAL_RADIUS,
    circleCenter: null,
    isRadiusActive: false
  });

  const debouncedSearch = useCallback(
    debounce((text) => {
      setState(prev => ({ ...prev, searchQuery: text }));
    }, 300),
    []
  );

  // ... [All existing useEffects and functions remain the same] ...
  const handleMapPress = useCallback((e) => {
    if (!e.nativeEvent || !e.nativeEvent.coordinate) {
      console.warn('Invalid map press event:', e);
      return;
    }

    const { coordinate } = e.nativeEvent;

    setState(prev => ({
      ...prev,
      circleCenter: coordinate,
      isRadiusActive: true,
      searchQuery: ''
    }));
  }, []);

  // Network connectivity effect
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setState(prev => ({ ...prev, isConnected: state.isConnected }));
    });
    return () => unsubscribe();
  }, []);

  // Screen focus effect
  useEffect(() => {
      const getUserInfo = async () => {
        try {
          const userInfoString = await SecureStore.getItemAsync('userInfo');
          if (userInfoString) {
            const parsedUserInfo = JSON.parse(userInfoString);
            setUserInfo(parsedUserInfo);
            setUserRole(parsedUserInfo?.role || '');
          }
        } catch (error) {
          console.error('Error getting user info:', error);
        }
      };

      getUserInfo();

      const unsubscribe = navigation.addListener('focus', () => {
        fetchProperties(true, route.params?.filters || {});
      });

      return unsubscribe;
    }, [navigation, route.params]);


  // Location and initial properties setup
  useEffect(() => {
    const setupLocationAndProperties = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location Access Required',
            'Please enable location services to use all features of this app.',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setState(prev => ({
          ...prev,
          region: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }
        }));

        await fetchProperties();
      } catch (error) {
        console.error('Location setup error:', error);
        Alert.alert('Error', 'Unable to access location services');
      } finally {
        setLoading(false);
      }
    };

    setupLocationAndProperties();
  }, []);

  const processedProperties = useMemo(() => {
    if (!state.searchQuery) return properties;
    return advancedSearchProperties(properties, state.searchQuery);
  }, [properties, state.searchQuery]);

  const displayProperties = useMemo(() => {
    let result = processedProperties;

    if (Object.keys(filters).length > 0) {
      result = result.filter(property => (
        (!filters.minPrice || property.price >= filters.minPrice) &&
        (!filters.maxPrice || property.price <= filters.maxPrice) &&
        (!filters.bedrooms || property.bedrooms === Number(filters.bedrooms)) &&
        (!filters.bathrooms || property.bathrooms === Number(filters.bathrooms)) &&
        (!filters.propertyType || property.property_type.name === filters.propertyType) &&
        (!filters.listingType || property.listing_type === filters.listingType)
      ));
    }

    if (state.circleCenter && state.isRadiusActive) {
      result = result.filter(property => {
        const distance = haversine(
          { latitude: state.circleCenter.latitude, longitude: state.circleCenter.longitude },
          { latitude: property.latitude, longitude: property.longitude },
          { unit: 'meter' }
        );
        return distance <= state.radius;
      });
    }

    return result;
  }, [processedProperties, filters, state.circleCenter, state.radius, state.isRadiusActive]);

  const fetchProperties = useCallback(async (showLoading = true, contextFilters = {}) => {
    if (!state.isConnected) {
      setError('No internet connection available');
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      const data = await propertyApi.getAllProperties(contextFilters);
      setProperties(data);
      setError(null);
    } catch (err) {
      setError('Unable to fetch properties. Please try again.');
      Alert.alert('Error', 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [state.isConnected]);


  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading Map and Properties...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchProperties()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {state.region && (
        <View style={styles.mapContainer}>
          {/* Keep existing search/filter header */}
          <View style={[styles.searchContainer, { marginTop: insets.top + 10 }]}>
            <SearchBar
              onSearch={debouncedSearch}
            />
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => navigation.navigate('SearchFilter')}
            >
              <Ionicons name="options-outline" size={24} color="#4A90E2" />
            </TouchableOpacity>
          </View>

          {/* Updated MapView */}
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
            initialRegion={state.region}
            showsUserLocation={true}
            showsCompass={true}
            showsMyLocationButton={true}
            onPress={handleMapPress}
          >
            {displayProperties.map((property) => (
              <Marker
                key={property.id}
                coordinate={{
                  latitude: property.latitude,
                  longitude: property.longitude
                }}
                title={property.title}
                description={`${property.listing_type==='rent'?'Rent':property.listing_type==='sale'?'Sale':''} - Ksh. ${property.price}`}
                onCalloutPress={() => navigation.navigate('PropertyDetail', { propertyId: property.id })}
              >
                <View style={styles.markerContainer}>
                  <Ionicons name="home" size={24} color="brown" />
                </View>
              </Marker>
            ))}

            {state.circleCenter && (
              <Circle
                center={state.circleCenter}
                radius={state.radius}
                strokeWidth={2}
                strokeColor="blue"
                fillColor="rgba(0, 0, 255, 0.1)"
              />
            )}
          </MapView>

          {/* Keep existing bottom container but update styling */}
          <View style={styles.bottomContainer}>
            <View style={styles.bottomHeader}>
              <Text style={styles.propertyCount}>
                {displayProperties.length} Properties Found
              </Text>
              {state.isRadiusActive && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setState(prev => ({
                    ...prev,
                    circleCenter: null,
                    isRadiusActive: false
                  }))}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>

            <Slider
              style={styles.slider}
              minimumValue={100}
              maximumValue={5000}
              step={100}
              value={state.radius}
              onValueChange={(radius) => setState(prev => ({ ...prev, radius }))}
              minimumTrackTintColor="#007bff"
              maximumTrackTintColor="#000000"
            />
            <Text style={styles.radiusText}>
              {state.radius} meters
            </Text>
          </View>

        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  mapContainer: {
    flex: 1
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500'
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 24
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA'
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  bottomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  propertyCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'center'
  },
  closeButton: {
    padding: 4
  },
  radiusContainer: {
    marginTop: 8
  },
  slider: {
    width: '80%',
    height: 40,
    marginBottom: 10,
  },
  radiusText: {
    fontSize: 15,
    color: '#48484A',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500'
  },
  instruction: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8
  },
  addButton: {
    position: 'absolute',
    left: 5,
    backgroundColor: 'white',
    borderRadius: 50,
    elevation: 5,
    padding: 10,
  }
});

export default HomeScreen;