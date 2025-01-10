import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { format } from 'date-fns';

const PropertyCard = ({ property, onPress }) => {
  const propertyImage = property.images.find(img => img.is_primary)?.image ||
                       property.images[0]?.image;
  const formattedListingType = property.listing_type === 'sale' ? 'For Sale' : 'For Rent';
  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
  const listedDate = format(new Date(property.created_at), 'MMM dd, yyyy');

  return (
    <View style={styles.card}>
      <View style={styles.badgeContainer}>
        <View style={[styles.badge, styles.statusBadge]}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>{property.status}</Text>
        </View>
        {property.is_verified && (
          <View style={[styles.badge, styles.verifiedBadge]}>
            <View style={[styles.dot, styles.verifiedDot]} />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        )}
      </View>

      {propertyImage ? (
        <Image
          source={{ uri: propertyImage }}
          style={styles.propertyImage}
          resizeMode="cover"
          accessibilityLabel={`Image of ${property.title}`}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>No Image Available</Text>
        </View>
      )}

      <View style={styles.detailsContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.propertyPrice}>
            Ksh. {parseFloat(property.price).toLocaleString()}
          </Text>
          <Text style={styles.listingType}>{formattedListingType}</Text>
        </View>

        <Text style={styles.propertyTitle} numberOfLines={2}>
          {property.title}
        </Text>

        <Text style={styles.propertyLocation} numberOfLines={2}>
          {fullAddress}
        </Text>

        <View style={styles.featuresContainer}>
          <Text style={styles.propertyFeature}>
            {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
          </Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.propertyFeature}>
            {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
          </Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.propertyFeature}>
            {property.square_feet.toLocaleString()} sq.ft
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.propertyType}>
            {property.property_type.name}
          </Text>
          <Text style={styles.listedDate}>Listed {listedDate}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholderText: {
    color: '#999',
    fontSize: 14,
  },
  detailsContainer: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  listingType: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  propertyLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyFeature: {
    fontSize: 14,
    color: '#444',
  },
  dotSeparator: {
    marginHorizontal: 8,
    color: '#666',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  propertyType: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  listedDate: {
    fontSize: 13,
    color: '#888',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    marginHorizontal: 4,
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
  }
});

export default PropertyCard;
