import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import * as SecureStore from 'expo-secure-store';
import { useFilters } from '../context/FilterContext';

const FILTER_STORAGE_KEY = 'property_search_filters';

const SearchFilterScreen = ({ navigation, route }) => {
  const { filters: existingFilters, setFilters } = useFilters();

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [bedrooms, setBedrooms] = useState(null);
  const [bathrooms, setBathrooms] = useState(null);
  const [propertyType, setPropertyType] = useState('');
  const [listingType, setListingType] = useState('');

  // Load saved filters from SecureStore on component mount
  useEffect(() => {
    loadSavedFilters();
  }, []);

  const loadSavedFilters = async () => {
    try {
      const savedFilters = await SecureStore.getItemAsync(FILTER_STORAGE_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        setMinPrice(parsedFilters.minPrice ?? 0);
        setMaxPrice(parsedFilters.maxPrice ?? 1000000);
        setBedrooms(parsedFilters.bedrooms ?? null);
        setBathrooms(parsedFilters.bathrooms ?? null);
        setPropertyType(parsedFilters.propertyType ?? '');
        setListingType(parsedFilters.listingType ?? '');
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  const saveFilters = async (filters) => {
    try {
      await SecureStore.setItemAsync(FILTER_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  };

  const applyFilters = async () => {
    const newFilters = {
      ...(minPrice > 0 && { minPrice }),
      ...(maxPrice < 1000000 && { maxPrice }),
      ...(bedrooms > 0 && { bedrooms }),
      ...(bathrooms > 0 && { bathrooms }),
      ...(propertyType && { propertyType }),
      ...(listingType && { listingType }),
    };

    // Save filters to SecureStore
    await saveFilters(newFilters);

    // Update filters in context
    setFilters(newFilters);

    // Navigate back
    navigation.goBack();
  };

  const resetFilters = async () => {
    // Reset local state
    setMinPrice(0);
    setMaxPrice(1000000);
    setBedrooms(null);
    setBathrooms(null);
    setPropertyType('');
    setListingType('');

    // Clear saved filters
    await SecureStore.deleteItemAsync(FILTER_STORAGE_KEY);

    // Clear filters in context
    setFilters({});
  };

  return (
    <ScrollView style={styles.container}>
      {/* Price Range Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.label}>Price Range</Text>
        <View style={styles.sliderContainer}>
          <Text>Ksh. {minPrice.toLocaleString()}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1000000}
            step={10000}
            minimumTrackTintColor="#007bff"
            maximumTrackTintColor="#000000"
            value={minPrice}
            onValueChange={setMinPrice}
          />
        </View>
        <View style={styles.sliderContainer}>
          <Text>Ksh. {maxPrice.toLocaleString()}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1000000}
            step={10000}
            minimumTrackTintColor="#007bff"
            maximumTrackTintColor="#000000"
            value={maxPrice}
            onValueChange={setMaxPrice}
          />
        </View>
      </View>

      {/* Bedrooms Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.label}>Bedrooms</Text>
        <Picker
          selectedValue={bedrooms}
          onValueChange={(itemValue) => setBedrooms(itemValue)}
        >
          <Picker.Item label="Any" value={null} />
          {[1, 2, 3, 4, 5].map(num => (
            <Picker.Item
              key={num}
              label={num.toString()}
              value={num}
            />
          ))}
        </Picker>
      </View>

      {/* Bathrooms Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.label}>Bathrooms</Text>
        <Picker
          selectedValue={bathrooms}
          onValueChange={(itemValue) => setBathrooms(itemValue)}
        >
          <Picker.Item label="Any" value={null} />
          {[1, 2, 3, 4, 5].map(num => (
            <Picker.Item
              key={num}
              label={num.toString()}
              value={num}
            />
          ))}
        </Picker>
      </View>

      {/* Property Type Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.label}>Property Type</Text>
        <Picker
          selectedValue={propertyType}
          onValueChange={(itemValue) => setPropertyType(itemValue)}
        >
          <Picker.Item label="Any" value="" />
          <Picker.Item label="Apartment" value="Apartment" />
          <Picker.Item label="House" value="House" />
          <Picker.Item label="Office" value="Office" />
          <Picker.Item label="Land" value="Land" />
        </Picker>
      </View>

      {/* Listing Type Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.label}>Listing Type</Text>
        <Picker
          selectedValue={listingType}
          onValueChange={(itemValue) => setListingType(itemValue)}
        >
          <Picker.Item label="Any" value="" />
          <Picker.Item label="On sale" value="sale" />
          <Picker.Item label="For renting" value="rent" />
        </Picker>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetFilters}
        >
          <Text style={styles.resetButtonText}>Reset Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={applyFilters}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  slider: {
    flex: 1,
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    backgroundColor: 'grey',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SearchFilterScreen;