import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { likeAPI } from '../../lib/api';
import { Colors } from '../../constants/Colors';
import { Property } from '../../types/database';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { supabase } from '../../lib/supabase';

export default function LikesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showError, AlertComponent } = useCustomAlert();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchLikedProperties = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await likeAPI.getLikedProperties(user.id);
      setProperties(data.map(prop => ({ ...prop, is_liked: true })));
    } catch (error: any) {
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    fetchLikedProperties();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fetchLikedProperties]);

  // Real-time updates for likes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('likes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `buyer_id=eq.${user.id}`,
        },
        () => {
          // Refresh liked properties when likes change
          fetchLikedProperties();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchLikedProperties]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchLikedProperties();
      }
    }, [user, fetchLikedProperties])
  );

  const handleUnlike = useCallback(async (propertyId: string) => {
    if (!user) return;

    setProperties(prev => prev.filter(p => p.id !== propertyId));

    try {
      await likeAPI.toggleLike(user.id, propertyId, true);
    } catch (error: any) {
      showError('Error', error.message);
      fetchLikedProperties();
    }
  }, [user, showError, fetchLikedProperties]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Likes</Text>
          <View style={{ width: 44 }} />
        </View>

        <FlatList
          data={properties}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <LikedPropertyCard
              property={item}
              index={index}
              onPress={() => router.push(`/property/${item.id}` as any)}
              onUnlike={() => handleUnlike(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💙</Text>
              <Text style={styles.emptyText}>No saved properties yet</Text>
              <Text style={styles.emptySubtext}>
                Start exploring and save your favorites
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
      <AlertComponent />
    </SafeAreaView>
  );
}

const LikedPropertyCard = memo(function LikedPropertyCard({
  property,
  index,
  onPress,
  onUnlike,
}: {
  property: Property;
  index: number;
  onPress: () => void;
  onUnlike: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const primaryImage = property.images?.find(img => img.is_primary) || property.images?.[0];

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity style={styles.cardContent} onPress={onPress}>
        <View style={styles.cardLeft}>
          {primaryImage?.image_url ? (
            <Image
              source={{ uri: primaryImage.image_url }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cardImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>🏠</Text>
            </View>
          )}
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {property.title || property.location}
          </Text>
          <Text style={styles.cardSpecs}>
            {property.rooms} beds · {property.bathrooms} baths · {property.square_meters?.toLocaleString() || '0'} sqft
          </Text>
          <Text style={styles.cardPrice}>${property.price.toLocaleString()}</Text>
        </View>

        <TouchableOpacity style={styles.likeButton} onPress={onUnlike}>
          <Heart size={20} color={Colors.error} fill={Colors.error} strokeWidth={2} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  cardLeft: {
    marginRight: 16,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  placeholderImage: {
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  cardRight: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSpecs: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  cardPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  likeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
