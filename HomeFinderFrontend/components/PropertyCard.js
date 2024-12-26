import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const PropertyCard = ({ property }) => {
  return (
    <View style={styles.card}>
      {/* Property Image */}
      {property.image ? (
        <Image
          source={{ uri: property.image }}
          style={styles.propertyImage}
          resizeMode="cover"
          accessibilityLabel={`Image of ${property.name}`}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>No Image</Text>
        </View>
      )}

      {/* Property Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.propertyName}>{property.name}</Text>
        <Text style={styles.propertyPrice}>$ {property.price.toLocaleString()}</Text>
        <Text style={styles.propertyLocation}>{property.location}</Text>
        <Text style={styles.propertyDetails}>
          {`${property.bedrooms} bd | ${property.bathrooms} ba | ${property.area} sq.ft`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 150,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholderText: {
    color: '#aaa',
    fontSize: 14,
  },
  detailsContainer: {
    padding: 16,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  propertyPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  propertyLocation: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 5,
  },
  propertyDetails: {
    fontSize: 13,
    color: 'gray',
  },
});

export default PropertyCard;
