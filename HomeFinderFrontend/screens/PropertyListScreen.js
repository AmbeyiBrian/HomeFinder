import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Text,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';

import { propertyApi } from '../api/propertyApi';
import PropertyCard from '../components/PropertyCard';
import { advancedSearchProperties } from '../components/searchUtils';
import SearchBar from '../components/searchBar';

import { useFilters } from '../context/FilterContext';

const HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56;
const { width } = Dimensions.get('window');

const PropertyListScreen = ({ navigation }) => {
  const { filters } = useFilters();
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const filteredProperties = useMemo(() => {
    let result = properties;

    if (Object.keys(filters).length > 0) {
      result = result.filter(property => {
        const propertyPrice = Number(property.price);
        const minPrice = Number(filters.minPrice);
        const maxPrice = Number(filters.maxPrice);
        const propertyBedrooms = Number(property.bedrooms);
        const propertyBathrooms = Number(property.bathrooms);

        return (
          (!filters.minPrice || propertyPrice >= minPrice) &&
          (!filters.maxPrice || propertyPrice <= maxPrice) &&
          (!filters.bedrooms || propertyBedrooms === Number(filters.bedrooms)) &&
          (!filters.bathrooms || propertyBathrooms === Number(filters.bathrooms)) &&
          (!filters.propertyType || property.property_type.name === filters.propertyType) &&
          (!filters.listingType || property.listing_type === filters.listingType)
        );
      });
    }

    return searchQuery ? advancedSearchProperties(result, searchQuery) : result;
  }, [searchQuery, properties, filters]);

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
        title: property.title ?? 'Unnamed Property',
        description: property.description ?? '',
        price: property.price ?? '0',
        property_type: {
          id: property.property_type?.id ?? 0,
          name: property.property_type?.name ?? 'Unknown Type'
        },
        listing_type: property.listing_type ?? 'sale',
        bedrooms: property.bedrooms ?? 0,
        bathrooms: property.bathrooms ?? 0,
        square_feet: property.square_feet ?? 0,
        address: property.address ?? '',
        city: property.city ?? '',
        state: property.state ?? '',
        zip_code: property.zip_code ?? '',
        status: property.status ?? 'unknown',
        images: property.images ?? [],
        created_at: property.created_at ?? new Date().toISOString(),
        updated_at: property.updated_at ?? new Date().toISOString(),
        is_verified: property.is_verified ?? '',
        owner: {
          id: property.owner?.id ?? 0,
          username: property.owner?.username ?? '',
          email: property.owner?.email ?? '',
          first_name: property.owner?.first_name ?? '',
          last_name: property.owner?.last_name ?? '',
          phone_number: property.owner?.phone_number ?? '',
          profile_picture: property.owner?.profile_picture ?? '',
        }
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProperties(false);
  }, [fetchProperties]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties, filters]);

  const debouncedSearch = useCallback(
    debounce((text) => setSearchQuery(text), 300),
    []
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Properties...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <SearchBar onSearch={debouncedSearch} />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => navigation.navigate('SearchFilter')}
            accessibilityLabel="Open search filters"
          >
            <Ionicons name="options-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredProperties}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cardContainer}
            onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })}
            activeOpacity={0.7}
          >
            <PropertyCard property={item} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#9CA3AF" />
            <Text style={styles.noPropertiesText}>
              {filteredProperties.length === 0 && searchQuery
                ? `No properties found for "${searchQuery}"`
                : 'No properties available'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: '#EBF5FF',
    padding: 12,
    borderRadius: 12,
    marginLeft: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  noPropertiesText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
});

export default PropertyListScreen;