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
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import { Property } from '../../types/database';

export default function LandlordHistoryScreen() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchClosedProperties();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchClosedProperties = async () => {
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
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRelist = async (propertyId: string) => {
    Alert.alert(
      'Relist Property',
      'Make this property available again?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Relist',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('properties')
                .update({ status: 'available' })
                .eq('id', propertyId);

              if (error) throw error;

              Alert.alert('Success', 'Property relisted successfully');
              fetchClosedProperties();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
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
          <Text style={styles.headerSubtitle}>Past properties</Text>
        </View>

        <FlatList
          data={properties}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>
                  {item.status === 'rented' ? 'Rented' : 'Removed'}
                </Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.location}
                  </Text>
                  <Text style={styles.cardSpecs}>
                    {item.rooms} beds • {item.bathrooms} baths
                  </Text>
                  <Text style={styles.cardPrice}>${item.price.toLocaleString()}/mo</Text>

                  {item.status === 'removed' && (
                    <TouchableOpacity
                      style={styles.relistButton}
                      onPress={() => handleRelist(item.id)}
                    >
                      <RefreshCw size={16} color={Colors.primary} />
                      <Text style={styles.relistButtonText}>Relist</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {item.images?.[0]?.image_url && (
                  <Image
                    source={{ uri: item.images[0].image_url }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
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
  cardBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  cardBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: Colors.error,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 20,
  },
  cardLeft: {
    flex: 1,
    paddingRight: 16,
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
    marginBottom: 8,
  },
  cardPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.primary,
    marginBottom: 12,
  },
  relistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  relistButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.primary,
  },
  cardImage: {
    width: 110,
    height: 110,
    borderRadius: 16,
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
