import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CreditCard as Edit, Trash2, Hop as HomeIcon, Bath, Maximize, Eye } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { propertyAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Property } from '../../types/database';
import { EditPropertyModal } from '../../components/EditPropertyModal';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');
const CAROUSEL_HEIGHT = height * 0.45;

export default function LandlordPropertyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showError, showSuccess, showConfirm, AlertComponent } = useCustomAlert();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchProperty();
    }, [id])
  );

  const fetchProperty = async () => {
    try {
      const data = await propertyAPI.getPropertyById(id as string);

      if (data.seller_id !== user?.id) {
        showError('Unauthorized', 'You do not own this property');
        router.back();
        return;
      }

      setProperty(data);

      const { data: requests, error } = await supabase
        .from('requests')
        .select('id')
        .eq('property_id', id)
        .eq('status', 'pending');

      if (!error && requests) {
        setRequestCount(requests.length);
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      showError('Error', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    fetchProperty(); // Refresh the property data
    showSuccess('Success', 'Property updated successfully!');
  };

  const handleEditError = (message: string) => {
    showError('Error', message);
  };

  const handleRemove = () => {
    showConfirm(
      'Remove Property',
      'Are you sure you want to remove this property? This action cannot be undone.',
      async () => {
        try {
          // First delete related records to avoid foreign key constraints
          await supabase
            .from('property_images')
            .delete()
            .eq('property_id', id);

          await supabase
            .from('likes')
            .delete()
            .eq('property_id', id);

          await supabase
            .from('requests')
            .delete()
            .eq('property_id', id);

          await supabase
            .from('property_views')
            .delete()
            .eq('property_id', id);

          // Finally delete the property
          const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id)
            .eq('seller_id', user?.id);

          if (error) throw error;

          showSuccess('Success', 'Property removed successfully');
          router.back();
        } catch (error: any) {
          showError('Error', error.message || 'Failed to remove property');
        }
      }
    );
  };

  if (loading || !property) {
    return <View style={styles.container} />;
  }

  const images = property.images && property.images.length > 0
    ? property.images
    : [{ image_url: '', is_primary: true, display_order: 0 }];

  const getStatusColor = () => {
    switch (property.status) {
      case 'available':
        return Colors.success;
      case 'requested':
        return Colors.warning;
      case 'rented':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (property.status) {
      case 'available':
        return 'Available';
      case 'requested':
        return 'Requested';
      case 'rented':
        return 'Rented';
      default:
        return property.status;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
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
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusText}>{getStatusText()}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.contentInner}>
            {/* Price and Stats */}
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.price}>${property.price.toLocaleString()}</Text>
                <Text style={styles.location}>{property.location}</Text>
              </View>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Eye size={20} color={Colors.textSecondary} />
                  <Text style={styles.statValue}>{property.view_count || 0}</Text>
                  <Text style={styles.statLabel}>Views</Text>
                </View>
                {requestCount > 0 && (
                  <View style={[styles.statItem, styles.requestStat]}>
                    <Text style={styles.requestCount}>{requestCount}</Text>
                    <Text style={styles.requestLabel}>Requests</Text>
                  </View>
                )}
              </View>
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
                <Text style={styles.sectionTitle}>Amenities</Text>
                <View style={styles.amenitiesContainer}>
                  {property.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityChip}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEdit}
              >
                <Edit size={20} color={Colors.primary} />
                <Text style={styles.editButtonText}>Edit Property</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemove}
              >
                <Trash2 size={20} color={Colors.error} />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </Animated.View>

      <EditPropertyModal
        visible={showEditModal}
        property={property}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        onError={handleEditError}
      />

      <AlertComponent />
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
    alignItems: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.textLight,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 70,
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  requestStat: {
    backgroundColor: Colors.warningLight,
  },
  requestCount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: Colors.warning,
  },
  requestLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.warning,
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 18,
    borderRadius: 16,
  },
  editButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    paddingVertical: 18,
    borderRadius: 16,
  },
  removeButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.error,
  },
});
