import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';

import { propertyApi } from '../api/propertyApi';
import PropertyCard from '../components/PropertyCard';
import { useFilters } from '../context/FilterContext';

const PropertyListScreen = ({ navigation }) => {
  const { filters } = useFilters();
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  // Network connectivity check
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Memoized and filtered properties
  const filteredProperties = useMemo(() => {
    let result = properties;

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

    // Search filter
    if (searchQuery) {
      result = result.filter(property => {
        const nameMatch = property.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
        const locationMatch = property.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
        return nameMatch || locationMatch;
      });
    }

    return result;
  }, [searchQuery, properties, filters]);

  // Fetch properties with improved error handling
  const fetchProperties = useCallback(async (showLoading = true) => {
    if (!isConnected) {
      setError('No internet connection');
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);

      const data = await propertyApi.getAllProperties(filters);

      const safeProperties = data.map(property => ({
          id: property.id ?? Math.random().toString(),
          name: property.title ?? 'Unnamed Property',
          location: property.city ?? 'Unknown Location',
          price: property.price ?? 0,
          bedrooms: property.bedrooms ?? 0,
          bathrooms: property.bathrooms ?? 0,
          area: property.square_feet ?? 0,
          image: (property.images?.find(img => img.is_primary) || property.images?.[0])?.image ?? null,
          type: property.property_type?.name ?? 'Unknown',
        }));

      setProperties(safeProperties);
      setError(null);
    } catch (err) {
      console.error('Fetch properties error:', err);
      setError(err.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isConnected, filters]);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProperties(false);
  }, [fetchProperties]);

  // Initial fetch and re-fetch when filters change
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties, filters]);

  // Debounced search input handler
  const debouncedSetSearchQuery = useCallback(
    debounce((text) => setSearchQuery(text), 300),
    []
  );

  // Render loading state
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Properties...</Text>
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
      {/* Search and Filter Container */}
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
          <Ionicons name="filter" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Properties List */}
      <FlatList
        data={filteredProperties}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })}>
              <PropertyCard
                property={item}
              />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centeredContainer}>
            <Text style={styles.noPropertiesText}>
              {filteredProperties.length === 0 && searchQuery
                ? `No properties found for "${searchQuery}"`
                : 'No properties found'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
            tintColor="#007bff"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    marginRight: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 8,
  },
  filterButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 10,
  },
  listContainer: {
    padding: 16,
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
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  noPropertiesText: {
    color: 'gray',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PropertyListScreen;