import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface ProfilePictureProps {
  userId: string;
  avatarUrl?: string | null;
  size?: number;
  editable?: boolean;
  onUpdate?: (url: string) => void;
  onError?: (message: string) => void;
}

export function ProfilePicture({
  userId,
  avatarUrl,
  size = 100,
  editable = false,
  onUpdate,
  onError,
}: ProfilePictureProps) {
  const { showError, AlertComponent } = useCustomAlert();
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(avatarUrl);

  const pickImage = async () => {
    if (!editable) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Permission Required', 'Permission to access photos is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setLoading(true);
    try {
      setCurrentUrl(uri);

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: uri })
        .eq('id', userId);

      if (error) throw error;

      onUpdate?.(uri);
    } catch (error: any) {
      setCurrentUrl(avatarUrl || null);
      showError('Error', error.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { width: size, height: size }]}
        onPress={pickImage}
        disabled={!editable || loading}
        activeOpacity={editable ? 0.7 : 1}
      >
        {currentUrl ? (
          <Image source={{ uri: currentUrl }} style={styles.image} />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size }]}>
            <User size={size * 0.5} color={Colors.textSecondary} />
          </View>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.textLight} />
          </View>
        )}

        {editable && !loading && (
          <View style={styles.editBadge}>
            <Camera size={16} color={Colors.textLight} />
          </View>
        )}
      </TouchableOpacity>
      <AlertComponent />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
});
