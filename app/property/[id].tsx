import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Share2, Heart, Hop as HomeIcon, Bath, Maximize, Phone, Mail, User as UserIcon } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { propertyAPI, likeAPI, requestAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Property } from '../../types/database';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { RequestConstraintsModal } from '../../components/RequestConstraintsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const CAROUSEL_HEIGHT = height * 0.55;

const PropertyDetailsScreen = memo(() => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showError, showSuccess, showInfo, showConfirm, renderAlert } = useCustomAlert();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [hasRequest, setHasRequest] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [showRequestConstraints, setShowRequestConstraints] = useState(false);

  const fetchProperty = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
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

        // Check for any pending request by this user
        const hasAnyPendingRequest = requests.some(r => r.status === 'pending');
        setHasPendingRequest(hasAnyPendingRequest);
      }
    } catch (error: any) {
      showError('Error', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, user, showError, router]);

  useFocusEffect(
    useCallback(() => {
      fetchProperty();
    }, [fetchProperty])
  );

  const handleLike = useCallback(async () => {
    if (!user) {
      showInfo('Sign In Required', 'Please sign in to save properties');
      return;
    }

    setIsLiked(!isLiked);

    try {
      await likeAPI.toggleLike(user.id, id as string, isLiked);
    } catch (error: any) {
      setIsLiked(isLiked);
      showError('Error', error.message);
    }
  }, [user, id, isLiked, showInfo, showError]);

  const handleShare = useCallback(async () => {
    if (!property) return;
    
    try {
      const shareContent = {
        message: `Check out this ${property.property_type} in ${property.location} - $${property.price.toLocaleString()}/month\n\n${property.description || 'Beautiful property available now!'}\n\nView on FindMyProperty`,
        title: `${property.title || property.property_type} in ${property.location}`,
      };
      
      await Share.share(shareContent);
    } catch (error: any) {
      showError('Error', 'Unable to share property');
    }
  }, [property, showError]);

  const handleRequest = useCallback(async () => {
    if (!user || !property) return;

    if (!user) {
      showInfo('Sign In Required', 'Please sign in to request properties');
      return;
    }

    // Check if this is the user's first time requesting a property
    const hasRequestedBefore = await AsyncStorage.getItem('hasRequestedProperty');
    if (!hasRequestedBefore) {
      setShowRequestConstraints(true);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, age, gender, full_name, email, avatar_url')
      .eq('id', user.id)
      .single();

    if (!profile?.phone || !profile?.age) {
      showConfirm(
        'Complete Profile',
        'Please complete your profile (phone and age) before requesting properties',
        () => router.push('/settings' as any)
      );
      return;
    }

    if (property.status !== 'available') {
      showError('Property Unavailable', 'This property is no longer available for requests');
      return;
    }

    showConfirm(
      'Request Property',
      'Send a request to the Property Owner? Your contact information will be shared.',
      async () => {
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
          showSuccess('Success', 'Request sent! Property Owner contact info is now visible.');
            } catch (error: any) {
          showError('Error', error.message || 'Failed to send request');
            } finally {
              setRequesting(false);
            }
      }
    );
  }, [user, property, showInfo, showConfirm, showError, showSuccess, router]);

  const handleConstraintsAccepted = useCallback(async () => {
    try {
      await AsyncStorage.setItem('hasRequestedProperty', 'true');
      setShowRequestConstraints(false);
      // Now proceed with the actual request
      handleRequest();
    } catch (error) {
      console.error('Error saving request status:', error);
    }
  }, [handleRequest]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading property...</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Property not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = property.images && property.images.length > 0
    ? property.images
    : [{ image_url: '', is_primary: true, display_order: 0 }];


  return (
    <View style={styles.container}>
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(index);
          }}
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
        {images.length > 1 && (
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
        )}

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
                <Heart
                  size={32}
                  color={isLiked ? Colors.error : Colors.error}
                  fill={isLiked ? Colors.error : 'transparent'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>

            {/* Property Details Card */}
            <View style={styles.propertyCard}>
              <Text style={styles.propertyTitle}>{property.title || 'Property Details'}</Text>
              
              {/* Specifications */}
              <View style={styles.specsRow}>
                <Text style={styles.specText}>{property.rooms} bedrooms</Text>
                <Text style={styles.specDivider}>|</Text>
                <Text style={styles.specText}>{property.bathrooms} bathrooms</Text>
              </View>

              {/* Description */}
              {property.description && (
                <Text style={styles.description}>{property.description}</Text>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <View style={styles.amenitiesRow}>
                  {property.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityPill}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Property Owner Contact */}
            {(showContact || hasRequest) && property.seller && (
              <View style={styles.section}>
                <View style={styles.contactContainer}>
                  <View style={styles.contactHeader}>
                    <View style={styles.contactAvatar}>
                      {property.seller.avatar_url ? (
                        <Image
                          source={{ uri: property.seller.avatar_url }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <UserIcon size={20} color={Colors.primary} />
                      )}
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{property.seller.full_name}</Text>
                      <Text style={styles.contactRole}>Property Owner</Text>
                    </View>
                  </View>
                  
                  <View style={styles.contactDetails}>
                    {property.seller.phone && (
                      <View style={styles.contactRow}>
                        <Phone size={14} color={Colors.primary} />
                        <Text style={styles.contactDetail}>{property.seller.phone}</Text>
                      </View>
                    )}
                    {property.seller.email && (
                      <View style={styles.contactRow}>
                        <Mail size={14} color={Colors.primary} />
                        <Text style={styles.contactDetail}>{property.seller.email}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Action Button */}
            {!hasRequest && !showContact && (
              <View style={styles.actionSection}>
                {user && property.seller_id === user.id ? (
                  <View style={styles.ownPropertySection}>
                    <View style={styles.ownPropertyBadge}>
                      <HomeIcon size={24} color={Colors.primary} />
                      <Text style={styles.ownPropertyText}>This is your property</Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.requestButton}
                    onPress={handleRequest}
                    disabled={hasPendingRequest}
                  >
                    <LinearGradient
                      colors={hasPendingRequest ? ['#95a5a6', '#7f8c8d'] : [Colors.primary, Colors.primaryDark]}
                      style={styles.requestButtonGradient}
                    >
                      <Text style={styles.requestButtonText}>
                        {hasPendingRequest ? 'Request Pending' : 'Request Property'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {hasRequest && (
            <View style={styles.requestedSection}>
              <View style={styles.requestedBadge}>
                <Text style={styles.requestedText}>✓ Request Sent Successfully</Text>
                <Text style={styles.requestedSubtext}>Property Owner contact info is now visible</Text>
              </View>
              </View>
            )}

            {hasPendingRequest && !hasRequest && (
              <View style={styles.pendingRequestSection}>
                <View style={styles.pendingRequestBadge}>
                  <Text style={styles.pendingRequestText}>⚠️ You have a pending request</Text>
                </View>
                <Text style={styles.pendingRequestSubtext}>
                  Cancel your existing request first to request another property.
                </Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      {renderAlert()}
      
      <RequestConstraintsModal
        visible={showRequestConstraints}
        onClose={() => setShowRequestConstraints(false)}
        onAccept={handleConstraintsAccepted}
      />
    </View>
  );
});

PropertyDetailsScreen.displayName = 'PropertyDetailsScreen';

export default PropertyDetailsScreen;

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textLight,
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
    marginTop: 30,
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
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  propertyTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  specText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  specDivider: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.textSecondary,
    marginHorizontal: 8,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityPill: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  amenityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textPrimary,
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
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  amenityChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: '30%',
    alignItems: 'center',
  },
  amenityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.primary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
  },
  specText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
  contactDetails: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
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
  actionSection: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  requestButton: {
    borderRadius: 16,
    overflow: 'hidden',
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
  requestButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  requestButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.textLight,
  },
  ownPropertySection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  ownPropertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  ownPropertyText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  ownPropertySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pendingRequestSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  pendingRequestBadge: {
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingRequestText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#f59e0b',
  },
  pendingRequestSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  requestedSection: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  requestedBadge: {
    backgroundColor: Colors.successLight,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  requestedText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.success,
    marginBottom: 4,
  },
  requestedSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.success,
    textAlign: 'center',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
  },
  priceSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  priceText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  propertyTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  specsSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  specDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.textSecondary,
    opacity: 0.3,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  amenitiesSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityPill: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  amenityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  requestButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  requestButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  requestButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#ffffff',
  },
});