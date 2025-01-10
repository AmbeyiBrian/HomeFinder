import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location'; // Import expo-location
import { propertyApi } from '../api/propertyApi';

const AddPropertyScreen = ({ navigation }) => {
  const [propertyTypes, setPropertyTypes] = useState([]); // State for dropdown options
  const [formData, setFormData] = useState({
    listing_type: '',
    title: '',
    description: '',
    price: '',
    property_type_id: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: 0, // Add latitude
    longitude: 0, // Add longitude
  });

  const fetchPropertyTypes = async () => {
    try {
      const response = await propertyApi.getPropertyTypes();
      const data = await response;
      setPropertyTypes(data);
    } catch (error) {
      console.error('Error fetching property types:', error);
    }
  };

  useEffect(() => {
    fetchPropertyTypes();
    getLocation();
  }, []);

  const handleChange = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to fetch your current location.');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      setFormData((prevData) => ({
        ...prevData,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      }));
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const handleSubmit = async () => {
    try {
      // Make POST request via your API handler
      const response = await propertyApi.createProperty(formData);
      Alert.alert('Success', 'Property created successfully!');
      navigation.goBack(); // Navigate back to previous screen
    } catch (error) {
      Alert.alert('Error', 'Failed to create property. Please try again.');
      console.error('Error submitting property:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Listing Type */}
      <Text style={styles.label}>Listing Type</Text>
      <Picker
        selectedValue={formData.listing_type}
        onValueChange={(value) => handleChange('listing_type', value)}
        style={styles.picker}
      >
        <Picker.Item label="Select Listing Type" value="" />
        <Picker.Item label="Rent" value="rent" />
        <Picker.Item label="Sale" value="sale" />
      </Picker>

      {/* Title */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Property Title"
        value={formData.title}
        onChangeText={(value) => handleChange('title', value)}
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={formData.description}
        onChangeText={(value) => handleChange('description', value)}
        multiline
      />

      {/* Price */}
      <Text style={styles.label}>Price</Text>
      <TextInput
        style={styles.input}
        placeholder="Price (Ksh)"
        value={formData.price}
        onChangeText={(value) => handleChange('price', value)}
        keyboardType="numeric"
      />

      {/* Property Type */}
      <Text style={styles.label}>Property Type</Text>
      <Picker
        selectedValue={formData.property_type_id}
        onValueChange={(value) => handleChange('property_type_id', value)}
        style={styles.picker}
      >
        <Picker.Item label="Select Property Type" value="" />
        {propertyTypes.map((type) => (
          <Picker.Item key={type.id} label={type.name} value={type.id} />
        ))}
      </Picker>

      {/* Bedrooms */}
      <Text style={styles.label}>Bedrooms</Text>
      <TextInput
        style={styles.input}
        placeholder="Number of Bedrooms"
        value={formData.bedrooms}
        onChangeText={(value) => handleChange('bedrooms', value)}
        keyboardType="numeric"
      />

      {/* Bathrooms */}
      <Text style={styles.label}>Bathrooms</Text>
      <TextInput
        style={styles.input}
        placeholder="Number of Bathrooms"
        value={formData.bathrooms}
        onChangeText={(value) => handleChange('bathrooms', value)}
        keyboardType="numeric"
      />

      {/* Square Feet */}
      <Text style={styles.label}>Square Feet</Text>
      <TextInput
        style={styles.input}
        placeholder="Square Feet"
        value={formData.square_feet}
        onChangeText={(value) => handleChange('square_feet', value)}
        keyboardType="numeric"
      />

      {/* Address */}
      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={formData.address}
        onChangeText={(value) => handleChange('address', value)}
      />

      {/* State */}
      <Text style={styles.label}>County/Province/State</Text>
      <TextInput
        style={styles.input}
        placeholder="State"
        value={formData.state}
        onChangeText={(value) => handleChange('state', value)}
      />

      {/* ZIP Code */}
      <Text style={styles.label}>Postal Code</Text>
      <TextInput
        style={styles.input}
        placeholder="ZIP Code"
        value={formData.zip_code}
        onChangeText={(value) => handleChange('zip_code', value)}
      />

      {/* City */}
      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        placeholder="City"
        value={formData.city}
        onChangeText={(value) => handleChange('city', value)}
      />

      {/* Longitude */}
      <Text style={styles.label}>Longitude</Text>
      <TextInput
        style={styles.input}
        placeholder="Longitude"
        value={formData.longitude}
        onChangeText={(value) => handleChange('longitude', value)}
        keyboardType="numeric"
      />

      {/* Latitude */}
      <Text style={styles.label}>Latitude</Text>
      <TextInput
        style={styles.input}
        placeholder="Latitude"
        value={formData.latitude}
        onChangeText={(value) => handleChange('latitude', value)}
        keyboardType="numeric"
      />

      <Button title="Submit" onPress={handleSubmit} style={styles.saveButton} />

      <Text></Text>
      <Text></Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 15,
    paddingLeft: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius:15,
  },
});

export default AddPropertyScreen;
