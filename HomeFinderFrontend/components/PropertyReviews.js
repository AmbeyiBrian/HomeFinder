import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { propertyApi } from '../api/propertyApi';
import PropTypes from 'prop-types';

const LoadingSpinner = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
);

const PropertyReviews = ({ propertyId, onReviewAdded, navigation }) => {
  const [rating, setRating] = useState(null);
  const [reviews, setReviews] = useState({
    average_rating: 0,
    review_count: 0
  });
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);

  const fetchReviews = async () => {
    try {
      const reviewData = await propertyApi.getReviews(propertyId);
      setReviews({
        average_rating: reviewData.average_rating || 0,
        review_count: reviewData.review_count || 0
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert(
        'Error',
        'Unable to load reviews. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [isTokenValid, hasReview] = await Promise.all([
          propertyApi.validateToken(),
        ]);

        if (isMounted) {
          setValidToken(isTokenValid);
          setHasSubmittedReview(hasReview);
          fetchReviews();
        }
      } catch (error) {
        console.error('Error during initial data fetch:', error);
        if (isMounted) {
          setIsLoading(false);
          Alert.alert(
            'Error',
            'Unable to load review data. Please try again later.'
          );
        }
      }
    };

    fetchData();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [propertyId]);

  const handleStarPress = async (selectedRating) => {
    if (!validToken) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to submit a review.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('UserManagement')
          }
        ]
      );
      return;
    }

    if (hasSubmittedReview) {
      Alert.alert(
        'Already Reviewed',
        'You have already submitted a review for this property'
      );
      return;
    }

    setRating(selectedRating);

    try {
      setIsSubmitting(true);
      await propertyApi.postReview({
        property: propertyId,
        rating: selectedRating
      });

      setHasSubmittedReview(true);
      await fetchReviews();
      if (onReviewAdded) onReviewAdded();

      Alert.alert('Success', 'Thank you for your review!');
    } catch (error) {
      console.error('Error posting review:', error);
      Alert.alert(
        'Error',
        'Unable to submit review. Please try again.'
      );
      setRating(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.ratingContainer}>
        <View style={styles.ratingHeader}>
          <Text style={styles.ratingText}>
            {reviews.average_rating.toFixed(1)}
          </Text>
          <Text style={styles.reviewCount}>
            ({reviews.review_count} {reviews.review_count === 1 ? 'review' : 'reviews'})
          </Text>
        </View>

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleStarPress(star)}
              disabled={isSubmitting || hasSubmittedReview}
              accessible={true}
              accessibilityLabel={`Rate ${star} star${star === 1 ? '' : 's'}`}
              accessibilityRole="button"
            >
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={32}
                color={star <= rating ? "#FFD700" : "#BDC3C7"}
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>

        {!hasSubmittedReview && (
          <Text style={styles.prompt}>
            Tap to rate this property
          </Text>
        )}

        {hasSubmittedReview && (
          <Text style={styles.submitted}>
            Thanks for your review!
          </Text>
        )}
      </View>
    </View>
  );
};

PropertyReviews.propTypes = {
  propertyId: PropTypes.string.isRequired,
  onReviewAdded: PropTypes.func,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: 'white',
  },
  loadingContainer: {
    padding: 15,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  ratingContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  ratingText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  star: {
    marginHorizontal: 4,
  },
  prompt: {
    color: '#7F8C8D',
    fontSize: 14,
    marginTop: 8,
  },
  submitted: {
    color: '#27AE60',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  }
});

export default PropertyReviews;