import { useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Heart, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import { Property } from '../types/database';

const { width } = Dimensions.get('window');

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  onLike?: () => void;
  index?: number;
  hideLike?: boolean;
  isOwnProperty?: boolean;
  currentUserId?: string;
}

export const PropertyCard = memo(function PropertyCard({ property, onPress, onLike, index = 0, hideLike = false, isOwnProperty = false, currentUserId }: PropertyCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;

  const primaryImage = property.images?.find(img => img.is_primary) || property.images?.[0];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
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

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(wiggleAnim, {
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnim, {
            toValue: -1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnim, {
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => onPress());
  };

  const handleLike = () => {
    // Instant visual feedback
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 0.6,
        tension: 300,
        friction: 2,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1.3,
        tension: 200,
        friction: 2,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        tension: 150,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Call the like handler immediately for instant UI update
    onLike();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
            {
              rotate: wiggleAnim.interpolate({
                inputRange: [-1, 1],
                outputRange: ['-2deg', '2deg'],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.95}
      >
        {/* Glassy Card Background */}
        <BlurView intensity={20} style={styles.glassBackground}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)']}
            style={styles.gradientOverlay}
          >
            <View style={styles.imageContainer}>
              {primaryImage?.image_url ? (
                <Image
                  source={{ uri: primaryImage.image_url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.placeholderImage}
                >
                  <Text style={styles.placeholderText}>🏠</Text>
                </LinearGradient>
              )}

              {/* Gradient Overlay on Image */}
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                style={styles.imageGradient}
              />

              {/* Guest Favorite Badge */}
              {property.like_count > 5 && (
                <BlurView intensity={80} style={styles.guestFavoriteBadge}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                    style={styles.badgeGradient}
                  >
                    <Text style={styles.guestFavoriteText}>✨ Guest favorite</Text>
                  </LinearGradient>
                </BlurView>
              )}

              {/* Like Button */}
              {!hideLike && onLike && !isOwnProperty && (
                <TouchableOpacity
                  style={styles.likeButton}
                  onPress={handleLike}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={80} style={styles.likeButtonBlur}>
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                      <Heart
                        size={22}
                        color={property.is_liked ? '#ff4757' : '#ffffff'}
                        fill={property.is_liked ? '#ff4757' : 'transparent'}
                        strokeWidth={2.5}
                      />
                    </Animated.View>
                  </BlurView>
                </TouchableOpacity>
              )}

              {/* Own Property Badge */}
              {isOwnProperty && (
                <BlurView intensity={80} style={styles.ownPropertyBadge}>
                  <LinearGradient
                    colors={['rgba(52, 152, 219, 0.9)', 'rgba(41, 128, 185, 0.9)']}
                    style={styles.ownPropertyGradient}
                  >
                    <Text style={styles.ownPropertyText}>🏠 Your Property</Text>
                  </LinearGradient>
                </BlurView>
              )}

              {/* Price Overlay */}
              <View style={styles.priceOverlay}>
                <BlurView intensity={60} style={styles.priceBlur}>
                  <LinearGradient
                    colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.5)']}
                    style={styles.priceGradient}
                  >
                    <Text style={styles.priceOverlayText}>
                      ${property.price.toLocaleString()}
                    </Text>
                    <Text style={styles.priceOverlayPeriod}>
                      {property.listing_type === 'rent' ? '/month' : ''}
                    </Text>
                  </LinearGradient>
                </BlurView>
              </View>

              {/* Rent/Sale Tag */}
              <View style={styles.tagContainer}>
                <View style={[
                  styles.propertyTag,
                  { backgroundColor: property.listing_type === 'rent' ? '#4CAF50' : '#FF6B35' }
                ]}>
                  <Text style={styles.tagText}>
                    {property.listing_type === 'rent' ? 'FOR RENT' : 'FOR SALE'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Property Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {property.title}
                </Text>
                <View style={styles.locationContainer}>
                  <Text style={styles.location} numberOfLines={1}>
                    📍 {property.location}
                  </Text>
                </View>
              </View>
              
              <View style={styles.specsRow}>
                {property.rooms > 0 && (
                  <>
                    <View style={styles.specItem}>
                      <Text style={styles.specText}>{property.rooms} BR</Text>
                    </View>
                    {property.bathrooms > 0 && <View style={styles.specDivider} />}
                  </>
                )}
                {property.bathrooms > 0 && (
                  <View style={styles.specItem}>
                    <Text style={styles.specText}>{property.bathrooms} BA</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    alignSelf: 'center',
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  glassBackground: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gradientOverlay: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 60,
    color: '#ffffff',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  guestFavoriteBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  badgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  guestFavoriteText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: '#2c3e50',
  },
  likeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  likeButtonBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownPropertyBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  ownPropertyGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ownPropertyText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: '#ffffff',
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  priceBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  priceGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  priceOverlayText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#ffffff',
  },
  priceOverlayPeriod: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tagContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  propertyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tagText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleRow: {
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#7f8c8d',
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#34495e',
  },
  specDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(52, 73, 94, 0.2)',
    marginHorizontal: 8,
  },
});
