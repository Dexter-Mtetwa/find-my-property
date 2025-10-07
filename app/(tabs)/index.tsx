import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Search, SlidersHorizontal, ArrowUpDown, X, Check, Wifi, Wind, Zap, Car, DoorOpen, Dumbbell, TreePine, Hop as HomeIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { propertyAPI, likeAPI } from '../../lib/api';
import { PropertyCard } from '../../components/PropertyCard';
import { Colors } from '../../constants/Colors';
import { Property } from '../../types/database';

type SortOption = 'newest' | 'price_low' | 'price_high' | 'popular';

const AMENITIES = [
  { id: 'WiFi', label: 'WiFi', icon: Wifi },
  { id: 'Air Conditioning', label: 'AC', icon: Wind },
  { id: 'Heating', label: 'Heating', icon: Zap },
  { id: 'Parking', label: 'Parking', icon: Car },
  { id: 'Balcony', label: 'Balcony', icon: DoorOpen },
  { id: 'Gym', label: 'Gym', icon: Dumbbell },
  { id: 'Garden', label: 'Garden', icon: TreePine },
  { id: 'Furnished', label: 'Furnished', icon: HomeIcon },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProperties();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (user) {
      loadLikes();
    }
  }, [user]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [properties, searchQuery, sortBy, priceRange, selectedRooms, selectedAmenities, selectedPropertyTypes]);

  const loadLikes = async () => {
    if (!user) return;
    try {
      const likes = await likeAPI.getUserLikes(user.id);
      setLikedIds(likes);
    } catch (error: any) {
      console.error('Error loading likes:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const data = await propertyAPI.getAvailableProperties();
      const propertiesWithLikes = data.map(prop => ({
        ...prop,
        is_liked: likedIds.has(prop.id),
      }));
      setProperties(propertiesWithLikes);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...properties];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        prop =>
          prop.title.toLowerCase().includes(query) ||
          prop.location.toLowerCase().includes(query)
      );
    }

    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(prop => {
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return prop.price >= min && prop.price <= max;
      });
    }

    if (selectedRooms.length > 0) {
      filtered = filtered.filter(prop => selectedRooms.includes(prop.rooms));
    }

    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(prop => {
        const propAmenities = prop.amenities || [];
        return selectedAmenities.every(amenity =>
          propAmenities.some(a => a.includes(amenity))
        );
      });
    }

    if (selectedPropertyTypes.length > 0) {
      filtered = filtered.filter(prop =>
        selectedPropertyTypes.includes(prop.property_type)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'popular':
          return (b.like_count + b.view_count) - (a.like_count + a.view_count);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredProperties(filtered);
  };

  const handleLike = async (propertyId: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to save properties');
      return;
    }

    const isLiked = likedIds.has(propertyId);
    const newLikedIds = new Set(likedIds);

    if (isLiked) {
      newLikedIds.delete(propertyId);
    } else {
      newLikedIds.add(propertyId);
    }

    setLikedIds(newLikedIds);
    setProperties(prev =>
      prev.map(p => (p.id === propertyId ? { ...p, is_liked: !isLiked } : p))
    );

    try {
      await likeAPI.toggleLike(user.id, propertyId, isLiked);
    } catch (error: any) {
      setLikedIds(likedIds);
      setProperties(prev =>
        prev.map(p => (p.id === propertyId ? { ...p, is_liked: isLiked } : p))
      );
      Alert.alert('Error', error.message);
    }
  };

  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedRooms([]);
    setSelectedAmenities([]);
    setSelectedPropertyTypes([]);
  };

  const hasActiveFilters = () => {
    return (
      priceRange.min ||
      priceRange.max ||
      selectedRooms.length > 0 ||
      selectedAmenities.length > 0 ||
      selectedPropertyTypes.length > 0
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Finding perfect homes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Discover</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilter(true)}
            >
              <SlidersHorizontal size={22} color={Colors.textPrimary} />
              {hasActiveFilters() && <View style={styles.badge} />}
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Search size={20} color={Colors.textSecondary} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search by city, address..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={filteredProperties}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item, index }) => (
            <PropertyCard
              property={item}
              onPress={() => router.push(`/property/${item.id}` as any)}
              onLike={() => handleLike(item.id)}
              index={index}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No properties found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <FilterModal
          visible={showFilter}
          onClose={() => setShowFilter(false)}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          selectedRooms={selectedRooms}
          setSelectedRooms={setSelectedRooms}
          selectedAmenities={selectedAmenities}
          setSelectedAmenities={setSelectedAmenities}
          selectedPropertyTypes={selectedPropertyTypes}
          setSelectedPropertyTypes={setSelectedPropertyTypes}
          onClear={clearFilters}
        />

        <SortModal
          visible={showSort}
          onClose={() => setShowSort(false)}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

function FilterModal({
  visible,
  onClose,
  priceRange,
  setPriceRange,
  selectedRooms,
  setSelectedRooms,
  selectedAmenities,
  setSelectedAmenities,
  selectedPropertyTypes,
  setSelectedPropertyTypes,
  onClear,
}: any) {
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 600,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const toggleRoom = (num: number) => {
    setSelectedRooms((prev: number[]) =>
      prev.includes(num) ? prev.filter(r => r !== num) : [...prev, num]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev: string[]) =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const togglePropertyType = (type: string) => {
    setSelectedPropertyTypes((prev: string[]) =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <BlurView intensity={100} style={styles.modalBlur}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Price Range</Text>
                <View style={styles.priceInputs}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    keyboardType="numeric"
                    value={priceRange.min}
                    onChangeText={(text) => setPriceRange({ ...priceRange, min: text })}
                  />
                  <Text style={styles.priceSeparator}>—</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    keyboardType="numeric"
                    value={priceRange.max}
                    onChangeText={(text) => setPriceRange({ ...priceRange, max: text })}
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Rooms</Text>
                <View style={styles.chipContainer}>
                  {[1, 2, 3, 4, 5].map(num => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.chip,
                        selectedRooms.includes(num) && styles.chipActive,
                      ]}
                      onPress={() => toggleRoom(num)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedRooms.includes(num) && styles.chipTextActive,
                        ]}
                      >
                        {num}+ BR
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Property Type</Text>
                <View style={styles.chipContainer}>
                  {['studio', 'apartment', 'house', 'room'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chip,
                        selectedPropertyTypes.includes(type) && styles.chipActive,
                      ]}
                      onPress={() => togglePropertyType(type)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedPropertyTypes.includes(type) && styles.chipTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Amenities</Text>
                <View style={styles.amenityGrid}>
                  {AMENITIES.map(({ id, label, icon: Icon }) => (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.amenityItem,
                        selectedAmenities.includes(id) && styles.amenityItemActive,
                      ]}
                      onPress={() => toggleAmenity(id)}
                    >
                      <Icon
                        size={20}
                        color={
                          selectedAmenities.includes(id)
                            ? Colors.primary
                            : Colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.amenityLabel,
                          selectedAmenities.includes(id) && styles.amenityLabelActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearButton} onPress={onClear}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleClose}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyButtonGradient}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function SortModal({ visible, onClose, sortBy, setSortBy }: any) {
  const options = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sortModalContent}>
          <BlurView intensity={100} style={styles.sortModalBlur}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {options.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.sortOption}
                onPress={() => {
                  setSortBy(option.value);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Check size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: Colors.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 20,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalBlur: {
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  modalScroll: {
    maxHeight: 500,
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  filterLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  priceSeparator: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: Colors.textSecondary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.background,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textLight,
  },
  amenityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.background,
  },
  amenityItemActive: {
    backgroundColor: `${Colors.primary}15`,
    borderColor: Colors.primary,
  },
  amenityLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  amenityLabelActive: {
    color: Colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    alignItems: 'center',
  },
  clearButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  applyButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textLight,
  },
  sortModalContent: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sortModalBlur: {
    backgroundColor: Colors.surface,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  sortOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  sortOptionTextActive: {
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
});
