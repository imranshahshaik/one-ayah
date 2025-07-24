import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabaseService } from '../services/SupabaseService';

const ReviewScreen = ({ navigation }) => {
  const [dueReviews, setDueReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDueReviews = async () => {
      try {
        setLoading(true);
        const reviews = await supabaseService.getDueReviews();
        setDueReviews(reviews);
      } catch (error) {
        console.error('Error fetching due reviews:', error);
        Alert.alert('Error', 'Failed to fetch due reviews. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDueReviews();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  const handleStartReview = (item) => {
    navigation.navigate('Memorization', { surah: item.surah_number, ayah: item.ayah_number });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Due for Review</Text>
      {dueReviews.length === 0 ? (
        <Text style={styles.noReviewsText}>No reviews due today. Great job!</Text>
      ) : (
        <FlatList
          data={dueReviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.reviewItem} onPress={() => handleStartReview(item)}>
              <Text style={styles.reviewText}>
                Surah {item.surah_number}, Ayah {item.ayah_number}
              </Text>
              <Text style={styles.overdueText}>{item.days_overdue} days overdue</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  noReviewsText: {
    fontSize: 18,
    color: 'gray',
    textAlign: 'center',
    marginTop: 50,
  },
  reviewItem: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewText: {
    color: 'white',
    fontSize: 18,
  },
  overdueText: {
    color: '#ff6b35',
    fontSize: 14,
  },
});

export default ReviewScreen;
