import { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User as UserIcon, Settings, LogOut, Hop as Home, Building2 } from 'lucide-react-native';
import { SellerOnboardingModal } from '../../components/SellerOnboardingModal';
import { CustomAlert } from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut, user } = useAuth();
  const [isLandlord, setIsLandlord] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

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
    setIsLandlord(false);
  }, [profile]);

  const handleToggleMode = async (value: boolean) => {
    if (switching) return;

    setSwitching(true);
    setIsLandlord(value);

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
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message,
      });
    } finally {
      setSwitching(false);
    }
  };

  const handleSignOut = () => {
    showAlert({
      type: 'warning',
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ],
    });
  };

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
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <UserIcon size={40} color={Colors.primary} />
              </View>
            )}
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
              Switch to Landlord Mode to rent out properties
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
          setIsLandlord(false);
        }}
        onComplete={() => {
          setShowOnboarding(false);
          router.push('/(landlord)' as any);
        }}
        userId={user?.id || ''}
      />

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
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
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
