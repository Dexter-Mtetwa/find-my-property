import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PropertyCard } from '../../components/PropertyCard';
import { AddPropertyModal } from '../../components/AddPropertyModal';
import { OwnerTutorialModal } from '../../components/OwnerTutorialModal';
import { Colors } from '../../constants/Colors';
import { Property } from '../../types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LandlordHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOwnerTutorial, setShowOwnerTutorial] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchMyProperties();
    checkOwnerTutorialStatus();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Check for tutorial when screen comes into focus (e.g., after pressing "Watch Tutorial")
  useFocusEffect(
    useCallback(() => {
      checkOwnerTutorialStatus();
    }, [])
  );

  const checkOwnerTutorialStatus = async () => {
    try {
      const hasSeenOwnerTutorial = await AsyncStorage.getItem('hasSeenOwnerTutorial');
      if (!hasSeenOwnerTutorial) {
        setShowOwnerTutorial(true);
      }
    } catch (error) {
      console.error('Error checking owner tutorial status:', error);
    }
  };

  const handleOwnerTutorialComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOwnerTutorial', 'true');
      setShowOwnerTutorial(false);
    } catch (error) {
      console.error('Error saving owner tutorial status:', error);
    }
  };

  const fetchMyProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          images:property_images(*)
        `)
        .eq('seller_id', user?.id)
        .in('status', ['available', 'requested'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePropertyPress = (property: Property) => {
    router.push(`/landlord-property/${property.id}` as any);
  };

  const handleAddProperty = () => {
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Properties</Text>
          <Text style={styles.headerSubtitle}>
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </Text>
        </View>

        <FlatList
          data={properties}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchMyProperties();
          }}
          renderItem={({ item, index }) => (
            <PropertyCard
              property={item}
              onPress={() => handlePropertyPress(item)}
              index={index}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyText}>No properties yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first property
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <Animated.View
          style={[
            styles.fab,
            { transform: [{ scale: fabScale }] },
          ]}
        >
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleAddProperty}
            activeOpacity={0.8}
          >
            <Plus size={28} color={Colors.textLight} />
          </TouchableOpacity>
        </Animated.View>

        <AddPropertyModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchMyProperties();
          }}
        />
        
        <OwnerTutorialModal
          visible={showOwnerTutorial}
          onComplete={handleOwnerTutorialComplete}
        />
      </Animated.View>
    </SafeAreaView>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 100,
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
