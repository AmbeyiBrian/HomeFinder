import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { propertyApi } from '../api/propertyApi';

const EditPropertyScreen = ({ route, navigation }) => {
  const { propertyId } = route.params; // Receive property ID as a parameter
  const [propertyTypes, setPropertyTypes] = useState([]);
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
    latitude: '',
    longitude: '',
  });

  // Fetch property types
  const fetchPropertyTypes = async () => {
    try {
      const response = await propertyApi.getPropertyTypes();
      setPropertyTypes(response); // Assuming response is an array of property types
    } catch (error) {
      console.error('Error fetching property types:', error);
    }
  };

  // Fetch existing property details
  const fetchPropertyDetails = async () => {
    try {
      const response = await propertyApi.getPropertyById(propertyId);
      setFormData({
        listing_type: response.listing_type || '',
        title: response.title || '',
        description: response.description || '',
        price: response.price ? response.price.toString() : '', // Ensure price is not undefined
        property_type_id: response.property_type.id ? response.property_type.id.toString() : '', // Ensure property_type_id is set
        bedrooms: response.bedrooms ? response.bedrooms.toString() : '',
        bathrooms: response.bathrooms ? response.bathrooms.toString() : '',
        square_feet: response.square_feet ? response.square_feet.toString() : '',
        address: response.address || '',
        city: response.city || '',
        state: response.state || '',
        zip_code: response.zip_code || '',
        latitude: response.latitude ? response.latitude.toString() : '',
        longitude: response.longitude ? response.longitude.toString() : '',
      });
    } catch (error) {
      console.error('Error fetching property details:', error);
    }
  };

  useEffect(() => {
    fetchPropertyTypes();
    fetchPropertyDetails();
  }, []);

  useEffect(() => {
    // You can add additional logic here if necessary when propertyTypes is updated
  }, [propertyTypes]);

  const handleChange = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async () => {
  // Validate if property_type_id is selected
  if (!formData.property_type_id) {
    Alert.alert('Error', 'Please select a property type.');
    return;
  }

  try {
    // Send the updated property data to the API
    await propertyApi.updateProperty(propertyId, formData);
    Alert.alert('Success', 'Property updated successfully!');
    navigation.goBack();
  } catch (error) {
    Alert.alert('Error', 'Failed to update property. Please try again.');
    console.error('Error updating property:', error);
  }
};


  return (
    <ScrollView style={styles.container}>
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

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={formData.title}
        onChangeText={(value) => handleChange('title', value)}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={formData.description}
        onChangeText={(value) => handleChange('description', value)}
      />

      <Text style={styles.label}>Price</Text>
      <TextInput
        style={styles.input}
        value={formData.price}
        keyboardType="numeric"
        onChangeText={(value) => handleChange('price', value)}
      />

      <Text style={styles.label}>Property Type</Text>
      <Picker
        selectedValue={formData.property_type_id}
        onValueChange={(value) => handleChange('property_type_id', value)}
        style={styles.picker}
      >
        <Picker.Item label="Select Property Type" value="" />
        {propertyTypes.map((type) => (
          <Picker.Item key={type.id} label={type.name} value={type.id.toString()} />
        ))}
      </Picker>

      <Text style={styles.label}>Bedrooms</Text>
      <TextInput
        style={styles.input}
        value={formData.bedrooms}
        keyboardType="numeric"
        onChangeText={(value) => handleChange('bedrooms', value)}
      />

      <Text style={styles.label}>Bathrooms</Text>
      <TextInput
        style={styles.input}
        value={formData.bathrooms}
        keyboardType="numeric"
        onChangeText={(value) => handleChange('bathrooms', value)}
      />

      <Text style={styles.label}>Square Feet</Text>
      <TextInput
        style={styles.input}
        value={formData.square_feet}
        keyboardType="numeric"
        onChangeText={(value) => handleChange('square_feet', value)}
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={formData.address}
        onChangeText={(value) => handleChange('address', value)}
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={formData.city}
        onChangeText={(value) => handleChange('city', value)}
      />

      <Text style={styles.label}>State</Text>
      <TextInput
        style={styles.input}
        value={formData.state}
        onChangeText={(value) => handleChange('state', value)}
      />

      <Text style={styles.label}>Zip Code</Text>
      <TextInput
        style={styles.input}
        value={formData.zip_code}
        keyboardType="numeric"
        onChangeText={(value) => handleChange('zip_code', value)}
      />

      <Button title="Update Property" onPress={handleSubmit} color="#4CAF50" />
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
  picker: {},
});

export default EditPropertyScreen;
