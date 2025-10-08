import { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Switch,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User as UserIcon, Settings, LogOut, Hop as Home, Building2, Camera } from 'lucide-react-native';
import { SellerOnboardingModal } from '../../components/SellerOnboardingModal';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut, user } = useAuth();
  const { showError, showSuccess, showConfirm, AlertComponent } = useCustomAlert();
  const [isPropertyOwner, setIsPropertyOwner] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    setIsPropertyOwner(false);
  }, [profile]);

  const handleToggleMode = async (value: boolean) => {
    if (switching) return;

    setSwitching(true);
    setIsPropertyOwner(value);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: value })
        .eq('id', user?.id);

      if (error) throw error;

      if (value) {
        if (!profile?.phone || !profile?.age) {
          setShowOnboarding(true);
        } else {
          router.push('/(landlord)' as any);
        }
      }
    } catch (error: any) {
      setIsLandlord(!value);
      Alert.alert('Error', error.message);
    } finally {
      setSwitching(false);
    }
  };

  const handleSignOut = useCallback(() => {
    showConfirm(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        await signOut();
        router.replace('/auth');
      }
    );
  }, [showConfirm, signOut, router]);

  // Tutorial function - directly shows tutorial
  const showTutorial = useCallback(async () => {
    try {
      if (isPropertyOwner) {
        // Show owner tutorial - navigate to landlord home
        await AsyncStorage.removeItem('hasSeenOwnerTutorial');
        router.replace('/(landlord)/' as any);
      } else {
        // Show buyer tutorial - navigate to buyer home
        await AsyncStorage.removeItem('hasSeenTutorial');
        router.replace('/(tabs)/' as any);
      }
    } catch (error) {
      showError('Error', 'Failed to show tutorial');
    }
  }, [isPropertyOwner, router, showError]);

  const handleProfilePictureUpdate = useCallback(async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      // Show action sheet
      Alert.alert(
        'Update Profile Picture',
        'Choose an option',
        [
          { text: 'Camera', onPress: () => openCamera() },
          { text: 'Photo Library', onPress: () => openImagePicker() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error: any) {
      showError('Error', error.message);
    }
  }, [showError]);

  const openCamera = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission Required', 'Please grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error: any) {
      showError('Error', error.message);
    }
  }, [showError]);

  const openImagePicker = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error: any) {
      showError('Error', error.message);
    }
  }, [showError]);

  const uploadProfilePicture = useCallback(async (imageUri: string) => {
    if (!user) return;

    try {
      // Create a unique filename
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, {
          uri: imageUri,
          type: `image/${fileExt}`,
          name: fileName,
        } as any);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      showSuccess('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update profile picture');
    }
  }, [user, showSuccess, showError]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <Animated.View
          style={[
            styles.profileCard,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.avatarContainer}>
            <TouchableOpacity style={styles.avatar} onPress={handleProfilePictureUpdate}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <UserIcon size={40} color={Colors.primary} />
              )}
              <View style={styles.cameraIcon}>
                <Camera size={16} color={Colors.textLight} />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </Animated.View>

        {/* Mode Switcher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Mode</Text>

          <View style={styles.currentModeCard}>
            <View style={styles.currentModeIcon}>
              <Home size={28} color={Colors.primary} />
            </View>
            <View style={styles.currentModeInfo}>
              <Text style={styles.currentModeTitle}>Tenant Mode</Text>
              <Text style={styles.currentModeSubtitle}>Browse and rent properties</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => handleToggleMode(true)}
            disabled={switching}
          >
            <Building2 size={20} color={Colors.primary} />
            <Text style={styles.switchModeText}>
              Switch to Property Owner Mode to list properties
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/settings' as any)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Settings size={20} color={Colors.textSecondary} />
                </View>
                <Text style={styles.menuItemText}>Account Settings</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tutorial Button */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tutorials</Text>
          
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={showTutorial}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  {isPropertyOwner ? (
                    <Building2 size={20} color={Colors.textSecondary} />
                  ) : (
                    <Home size={20} color={Colors.textSecondary} />
                  )}
                </View>
                <Text style={styles.menuItemText}>Watch Tutorial</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      <SellerOnboardingModal
        visible={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          setIsPropertyOwner(false);
        }}
        onComplete={() => {
          setShowOnboarding(false);
          router.push('/(landlord)' as any);
        }}
        userId={user?.id || ''}
      />
      {AlertComponent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: Colors.textPrimary,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
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
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
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
  currentModeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currentModeInfo: {
    flex: 1,
  },
  currentModeTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  currentModeSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  switchModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 10,
  },
  switchModeText: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Colors.primary,
  },
  modeSwitcher: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  modeOption: {
    flex: 1,
    alignItems: 'center',
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeIconActive: {
    backgroundColor: Colors.primaryLight,
  },
  modeLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  modeLabelActive: {
    color: Colors.primary,
  },
  modeDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  switchContainer: {
    marginHorizontal: 16,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorLight,
    padding: 18,
    borderRadius: 16,
    gap: 8,
  },
  signOutText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.error,
  },
});
