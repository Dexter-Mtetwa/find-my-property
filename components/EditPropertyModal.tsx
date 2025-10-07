import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Hop as Home, DollarSign, MapPin, Bed, Bath, Maximize, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/Colors';
import { Property } from '../types/database';
import { propertyAPI } from '../lib/api';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface EditPropertyModalProps {
  visible: boolean;
  property: Property | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function EditPropertyModal({
  visible,
  property,
  onClose,
  onSuccess,
  onError,
}: EditPropertyModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [squareMeters, setSquareMeters] = useState('');
  const [propertyType, setPropertyType] = useState('apartment');
  const [amenities, setAmenities] = useState('');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (property) {
      setTitle(property.title || '');
      setDescription(property.description || '');
      setPrice(property.price?.toString() || '');
      setLocation(property.location || '');
      setRooms(property.rooms?.toString() || '');
      setBathrooms(property.bathrooms?.toString() || '');
      setSquareMeters(property.square_meters?.toString() || '');
      setPropertyType(property.property_type || 'apartment');
      setAmenities((property.amenities || []).join(', '));
      setImages((property.images || []).map(img => img.image_url));
    }
  }, [property]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!property) return;

    if (!title.trim() || !price.trim() || !location.trim()) {
      onError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const updates: any = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        location: location.trim(),
        rooms: parseInt(rooms) || 1,
        bathrooms: parseInt(bathrooms) || 1,
        square_meters: parseFloat(squareMeters) || null,
        property_type: propertyType,
        amenities: amenities.split(',').map(a => a.trim()).filter(Boolean),
      };

      await propertyAPI.updateProperty(property.id, updates);

      if (images.length > 0) {
        await supabase
          .from('property_images')
          .delete()
          .eq('property_id', property.id);

        const imageInserts = images.map((uri, index) => ({
          property_id: property.id,
          image_url: uri,
          is_primary: index === 0,
          display_order: index,
        }));

        await supabase.from('property_images').insert(imageInserts);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      onError(error.message || 'Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={20} style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Property</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <Text style={styles.label}>Title *</Text>
              <View style={styles.inputContainer}>
                <Home size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Property title"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Property description"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Price *</Text>
                <View style={styles.inputContainer}>
                  <DollarSign size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Bedrooms *</Text>
                <View style={styles.inputContainer}>
                  <Bed size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={rooms}
                    onChangeText={setRooms}
                    placeholder="0"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Bathrooms *</Text>
                <View style={styles.inputContainer}>
                  <Bath size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={bathrooms}
                    onChangeText={setBathrooms}
                    placeholder="0"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Size (m²)</Text>
                <View style={styles.inputContainer}>
                  <Maximize size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={squareMeters}
                    onChangeText={setSquareMeters}
                    placeholder="0"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Location *</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, State"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Amenities</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={amenities}
                onChangeText={setAmenities}
                placeholder="WiFi, Parking, Pool (comma-separated)"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imagePreview}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <X size={16} color={Colors.textLight} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                  <ImageIcon size={24} color={Colors.primary} />
                  <Text style={styles.addImageText}>Add</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButtonFooter]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonTextFooter}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textLight} />
              ) : (
                <Text style={styles.submitButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  halfField: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  textArea: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 100,
  },
  imagesScroll: {
    flexDirection: 'row',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  addImageText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonFooter: {
    backgroundColor: Colors.background,
  },
  cancelButtonTextFooter: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textLight,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
