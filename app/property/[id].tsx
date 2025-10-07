import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Share2, Heart, Hop as HomeIcon, Bath, Maximize, Phone, Mail, User as UserIcon } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { propertyAPI, likeAPI, requestAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Property } from '../../types/database';

const { width, height } = Dimensions.get('window');
const CAROUSEL_HEIGHT = height * 0.45;

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [hasRequest, setHasRequest] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchProperty();
    }, [id])
  );

  const fetchProperty = async () => {
    try {
      const data = await propertyAPI.getPropertyById(id as string);
      setProperty(data);

      if (user) {
        const likes = await likeAPI.getUserLikes(user.id);
        setIsLiked(likes.has(id as string));

        const requests = await requestAPI.getBuyerRequests(user.id);
        const existingRequest = requests.find(
          r => r.property_id === id && r.status === 'pending'
        );
        setHasRequest(!!existingRequest);
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      Alert.alert('Error', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to save properties');
      return;
    }

    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 0.7,
        tension: 200,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1.2,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    setIsLiked(!isLiked);

    try {
      await likeAPI.toggleLike(user.id, id as string, isLiked);
    } catch (error: any) {
      setIsLiked(isLiked);
      Alert.alert('Error', error.message);
    }
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const handleRequest = async () => {
    if (!user || !property) return;

    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to request properties');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, age, gender')
      .eq('id', user.id)
      .single();

    if (!profile?.phone || !profile?.age) {
      Alert.alert(
        'Complete Profile',
        'Please complete your profile (phone and age) before requesting properties',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => router.push('/settings' as any) },
        ]
      );
      return;
    }

    if (property.status !== 'available') {
      Alert.alert('Property Unavailable', 'This property is no longer available for requests');
      return;
    }

    Alert.alert(
      'Request Property',
      'Send a request to the landlord? Your contact information will be shared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            setRequesting(true);
            try {
              const { data, error } = await supabase.rpc(
                'create_property_request_atomic',
                {
                  p_buyer_id: user.id,
                  p_property_id: property.id,
                  p_seller_id: property.seller_id,
                  p_message: null,
                }
              );

              if (error) throw error;

              setHasRequest(true);
              setShowContact(true);
              Alert.alert('Success', 'Request sent! Landlord contact info is now visible.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send request');
            } finally {
              setRequesting(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !property) {
    return <View style={styles.container} />;
  }

  const images = property.images && property.images.length > 0
    ? property.images
    : [{ image_url: '', is_primary: true, display_order: 0 }];

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              {
                useNativeDriver: false,
                listener: (event: any) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(index);
                },
              }
            )}
            scrollEventThrottle={16}
          >
            {images.map((image, index) => (
              <View key={index} style={styles.imageSlide}>
                {image.image_url ? (
                  <Image
                    source={{ uri: image.image_url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.image, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>🏠</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Page Indicators */}
          <View style={styles.indicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentImageIndex === index && styles.indicatorActive,
                ]}
              />
            ))}
          </View>

          {/* Top Buttons */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.topGradient}
          >
            <View style={styles.topButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <ArrowLeft size={24} color={Colors.textLight} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                <Share2 size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.contentInner}>
            {/* Price and Like */}
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.price}>${property.price.toLocaleString()}</Text>
                <Text style={styles.location}>{property.location}</Text>
              </View>
              <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Heart
                    size={32}
                    color={isLiked ? Colors.error : Colors.error}
                    fill={isLiked ? Colors.error : 'transparent'}
                    strokeWidth={2}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Title and Description */}
            <View style={styles.section}>
              <Text style={styles.title}>{property.title || 'Property Details'}</Text>
              {property.description && (
                <Text style={styles.description}>{property.description}</Text>
              )}
            </View>

            {/* Property Specs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Property Details</Text>
              <View style={styles.specsGrid}>
                <View style={styles.specItem}>
                  <View style={styles.specIcon}>
                    <HomeIcon size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.specLabel}>Bedrooms</Text>
                  <Text style={styles.specValue}>{property.rooms}</Text>
                </View>
                <View style={styles.specItem}>
                  <View style={styles.specIcon}>
                    <Bath size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.specLabel}>Bathrooms</Text>
                  <Text style={styles.specValue}>{property.bathrooms}</Text>
                </View>
                {property.square_meters && (
                  <View style={styles.specItem}>
                    <View style={styles.specIcon}>
                      <Maximize size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.specLabel}>Size</Text>
                    <Text style={styles.specValue}>{property.square_meters} m²</Text>
                  </View>
                )}
                <View style={styles.specItem}>
                  <View style={styles.specIcon}>
                    <HomeIcon size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.specLabel}>Type</Text>
                  <Text style={styles.specValue}>
                    {property.property_type?.charAt(0).toUpperCase() + property.property_type?.slice(1)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <View style={styles.section}>
                <View style={styles.amenitiesContainer}>
                  {property.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityChip}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Landlord Contact (only show if request sent or has pending request) */}
            {(showContact || hasRequest) && property.seller && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Landlord Contact</Text>
                <View style={styles.contactCard}>
                  <View style={styles.contactHeader}>
                    <View style={styles.contactAvatar}>
                      <UserIcon size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{property.seller.full_name}</Text>
                      {property.seller.phone && (
                        <View style={styles.contactRow}>
                          <Phone size={16} color={Colors.textSecondary} />
                          <Text style={styles.contactDetail}>{property.seller.phone}</Text>
                        </View>
                      )}
                      {property.seller.email && (
                        <View style={styles.contactRow}>
                          <Mail size={16} color={Colors.textSecondary} />
                          <Text style={styles.contactDetail}>{property.seller.email}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            {!hasRequest && !showContact && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.requestButton,
                    (requesting || property.status !== 'available') && styles.buttonDisabled,
                  ]}
                  onPress={handleRequest}
                  disabled={requesting || property.status !== 'available'}
                >
                  <Text style={styles.requestButtonText}>
                    {requesting
                      ? 'Sending...'
                      : property.status !== 'available'
                      ? 'Not Available'
                      : 'Request Property'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {hasRequest && (
              <View style={styles.requestedBadge}>
                <Text style={styles.requestedText}>✓ Request Sent</Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  carouselContainer: {
    height: CAROUSEL_HEIGHT,
    position: 'relative',
  },
  imageSlide: {
    width,
    height: CAROUSEL_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
  },
  indicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: Colors.textLight,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.surface,
    marginTop: -20,
  },
  contentInner: {
    padding: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  price: {
    fontFamily: 'Poppins-Bold',
    fontSize: 36,
    color: Colors.primary,
    marginBottom: 4,
  },
  location: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  amenityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.primary,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  specIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  specLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  specValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  contactCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  requestButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  requestButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    color: Colors.textLight,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  requestedBadge: {
    backgroundColor: Colors.successLight,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  requestedText: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    color: Colors.success,
  },
});
