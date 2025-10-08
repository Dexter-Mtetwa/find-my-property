import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import { Property } from '../../types/database';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function LandlordHistoryScreen() {
  const { user } = useAuth();
  const { showError, showSuccess, showConfirm, AlertComponent } = useCustomAlert();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchClosedProperties = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          images:property_images(*)
        `)
        .eq('seller_id', user?.id)
        .in('status', ['rented', 'removed'])
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    fetchClosedProperties();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fetchClosedProperties]);

  // Set up real-time subscription for property changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('properties_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `seller_id=eq.${user.id}`,
        },
        () => {
          // Refetch properties when there are changes
          fetchClosedProperties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchClosedProperties]);

  const handleRelist = async (propertyId: string) => {
    showConfirm(
      'Relist Property',
      'Make this property available again?',
      async () => {
        try {
          const { error } = await supabase
            .from('properties')
            .update({ status: 'available' })
            .eq('id', propertyId);

          if (error) throw error;

          showSuccess('Success', 'Property relisted successfully');
          fetchClosedProperties();
        } catch (error: any) {
          showError('Error', error.message);
        }
      }
    );
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
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Closed Properties</Text>
        </View>

        <FlatList
          data={properties}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Image
                    source={{ uri: item.images?.[0]?.image_url || '' }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.cardRight}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title || item.location}
                  </Text>
                  <Text style={styles.cardSpecs}>
                    {item.rooms} beds • {item.bathrooms} baths
                  </Text>
                </View>

                {item.status === 'removed' && (
                  <TouchableOpacity
                    style={styles.relistButton}
                    onPress={() => handleRelist(item.id)}
                  >
                    <Text style={styles.relistButtonText}>Relist</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📜</Text>
              <Text style={styles.emptyText}>No history yet</Text>
              <Text style={styles.emptySubtext}>
                Closed properties will appear here
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
      <AlertComponent />
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
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginBottom: 16,
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
  cardContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  cardLeft: {
    marginRight: 16,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  cardRight: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSpecs: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  relistButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  relistButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
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
});
