import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { propertyApi } from '../api/propertyApi';

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch favorite properties from the backend
  const fetchFavorites = async () => {
    try {
      const response = await propertyApi.getFavorites();
      setFavorites(response); // Assuming response contains the array
    } catch (error) {
      console.error('Error fetching favorites:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Remove a property from favorites
  const handleRemoveFavorite = async (favoriteId) => {
    try {
      await propertyApi.removeFavorite(favoriteId); // Remove via API
      setFavorites(favorites.filter((item) => item.id !== favoriteId)); // Update state
    } catch (error) {
      console.error('Error removing favorite:', error.message);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() =>
        navigation.navigate('PropertyDetail', { propertyId: item.property.id })
      }
    >
      <Image
        source={{
          uri: (
            item.property.images?.find((img) => img.is_primary) ||
            item.property.images?.[0]
          )?.image ?? null,
        }}
        style={styles.favoriteImage}
      />
      <View style={styles.favoriteDetails}>
        <Text style={styles.favoriteName}>{item.property.title}</Text>
        <Text style={styles.favoritePrice}>${item.property.price}</Text>
        <Text style={styles.propertyDetails}>
          {`${item.property.bedrooms} bd | ${item.property.bathrooms} ba | ${item.property.square_feet} sq.ft`}
        </Text>
        <Text
          style={[
            styles.propertyStatus,
            { color: item.property.status ? 'green' : 'red' },
          ]}
        >
          {item.property.status ? 'Available' : 'Sold Out'}
        </Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(item.id)}
        >
          <Ionicons name="trash" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        <Text>Loading your favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="gray" />
            <Text style={styles.emptyText}>No Favorite Properties</Text>
            <Text style={styles.emptySubtext}>
              Start exploring and save your favorite properties!
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('PropertyListScreen')}
            >
              <Text style={styles.exploreButtonText}>Explore Properties</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 15,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  favoriteCard: {
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  favoriteImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  favoriteDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  favoritePrice: {
    color: '#007bff',
    fontSize: 16,
  },
  propertyDetails: {
    fontSize: 13,
    color: 'gray',
  },
  propertyStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeButton: {
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: 'gray',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: 10,
  },
  exploreButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FavoritesScreen;
