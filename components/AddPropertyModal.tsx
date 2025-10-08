import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { propertyAPI } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/Colors';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface AddPropertyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AMENITIES = [
  'WiFi',
  'Parking',
  'Pool',
  'Gym',
  'Garden',
  'Balcony',
  'Air Conditioning',
  'Heating',
  'Fireplace',
  'Security',
  'Elevator',
  'Pet Friendly',
];

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Room' },
];

export function AddPropertyModal({ visible, onClose, onSuccess }: AddPropertyModalProps) {
  const { user } = useAuth();
  const { showError, showSuccess, showInfo, AlertComponent } = useCustomAlert();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [listingType, setListingType] = useState('rent'); // 'rent' or 'buy'
  const [location, setLocation] = useState('');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [squareMeters, setSquareMeters] = useState('');
  const [propertyType, setPropertyType] = useState('apartment');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

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
    }).start(() => {
      onClose();
      resetForm();
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setLocation('');
    setRooms('');
    setBathrooms('');
    setSquareMeters('');
    setPropertyType('apartment');
    setSelectedAmenities([]);
    setImageUrls([]);
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleAddImage = () => {
    showInfo(
      'Add Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showError('Permission Required', 'Camera permission is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUrls([...imageUrls, result.assets[0].uri]);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Permission Required', 'Gallery permission is needed to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUrls([...imageUrls, result.assets[0].uri]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim() || !price || !rooms) {
      showError('Required Fields', 'Please fill in title, location, price, and rooms');
      return;
    }

    if (imageUrls.length === 0) {
      showError('Images Required', 'Please add at least one image of the property');
      return;
    }

    const priceNum = parseFloat(price);
    const roomsNum = parseInt(rooms);
    const bathroomsNum = bathrooms ? parseInt(bathrooms) : 1;
    const sqmNum = squareMeters ? parseInt(squareMeters) : null;

    if (isNaN(priceNum) || isNaN(roomsNum)) {
      showError('Invalid Input', 'Price and rooms must be valid numbers');
      return;
    }

    setLoading(true);
    try {
      const propertyData = {
        seller_id: user?.id,
        title,
        description: description || null,
        listing_type: listingType,
        price: priceNum,
        location,
        rooms: roomsNum,
        bathrooms: bathroomsNum,
        square_meters: sqmNum,
        property_type: propertyType,
        amenities: selectedAmenities,
        status: 'available',
      };

      const property = await propertyAPI.createProperty(propertyData);

      if (imageUrls.length > 0) {
        const imageInserts = imageUrls.map((url, index) => ({
          property_id: property.id,
          image_url: url,
          storage_path: url.startsWith('file://') ? 'local' : 'external',
          is_primary: index === 0,
          order_index: index + 1,
        }));

        const { error: imageError } = await supabase
          .from('property_images')
          .insert(imageInserts);

        if (imageError) throw imageError;
      }

      showSuccess('Success', 'Property added successfully!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add Property</Text>
              <Text style={styles.subtitle}>List your property</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.form}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Modern 2BR Apartment"
                placeholderTextColor={Colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your property..."
                placeholderTextColor={Colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 123 Main St, City"
                placeholderTextColor={Colors.textSecondary}
                value={location}
                onChangeText={setLocation}
                editable={!loading}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Listing Type *</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      listingType === 'rent' && styles.typeButtonActive
                    ]}
                    onPress={() => setListingType('rent')}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      listingType === 'rent' && styles.typeButtonTextActive
                    ]}>For Rent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      listingType === 'buy' && styles.typeButtonActive
                    ]}
                    onPress={() => setListingType('buy')}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      listingType === 'buy' && styles.typeButtonTextActive
                    ]}>For Sale</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Price *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={listingType === 'rent' ? '1500' : '250000'}
                  placeholderTextColor={Colors.textSecondary}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  editable={!loading}
                />
                <Text style={styles.priceUnit}>
                  {listingType === 'rent' ? '$/month' : '$'}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Rooms *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2"
                  placeholderTextColor={Colors.textSecondary}
                  value={rooms}
                  onChangeText={setRooms}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Bathrooms</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={Colors.textSecondary}
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Size (sqm) - Optional</Text>
                <TextInput
                  style={styles.input}
                  placeholder="80"
                  placeholderTextColor={Colors.textSecondary}
                  value={squareMeters}
                  onChangeText={setSquareMeters}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Property Type</Text>
              <View style={styles.typeButtons}>
                {PROPERTY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      propertyType === type.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setPropertyType(type.value)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        propertyType === type.value && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {AMENITIES.map((amenity) => (
                  <TouchableOpacity
                    key={amenity}
                    style={[
                      styles.amenityChip,
                      selectedAmenities.includes(amenity) && styles.amenityChipActive,
                    ]}
                    onPress={() => toggleAmenity(amenity)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.amenityText,
                        selectedAmenities.includes(amenity) && styles.amenityTextActive,
                      ]}
                    >
                      {amenity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Images *</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleAddImage}
                disabled={loading}
              >
                <Camera size={20} color={Colors.primary} />
                <Text style={styles.uploadButtonText}>Add Image</Text>
              </TouchableOpacity>

              {imageUrls.length > 0 && (
                <View style={styles.imagesGrid}>
                  {imageUrls.map((url, index) => (
                    <View key={index} style={styles.imagePreview}>
                      <Image
                        source={{ uri: url }}
                        style={styles.imagePreviewImg}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <Trash2 size={16} color={Colors.textLight} />
                      </TouchableOpacity>
                      {index === 0 && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding Property...' : 'Add Property'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
      <AlertComponent />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.textLight,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  amenityChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  amenityText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  amenityTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Colors.primary,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreviewImg: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.error,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  primaryBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: Colors.textLight,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.textLight,
  },
  priceUnit: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textLight,
  },
});
