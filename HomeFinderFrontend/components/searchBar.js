import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const SearchBar = ({ onSearch }) => {
  return (
    <View style={styles.searchContainer}>
      <Icon name="search" size={20} color="#666" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search properties..."
        onChangeText={onSearch}
        placeholderTextColor="#999"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    height: 40,
  },
});

export default SearchBar;