import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { likeAPI } from '../../lib/api';
import { PropertyCard } from '../../components/PropertyCard';
import { Colors } from '../../constants/Colors';
import { Property } from '../../types/database';
import { CustomAlert } from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function LikesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  useEffect(() => {
    fetchLikedProperties();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchLikedProperties = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await likeAPI.getLikedProperties(user.id);
      setProperties(data.map(prop => ({ ...prop, is_liked: true })));
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = useCallback(async (propertyId: string) => {
    if (!user) return;

    setProperties(prev => prev.filter(p => p.id !== propertyId));

    try {
      await likeAPI.toggleLike(user.id, propertyId, true);
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message,
      });
      fetchLikedProperties();
    }
  }, [user]);

  const handlePropertyPress = useCallback((id: string) => {
    router.push(`/property/${id}` as any);
  }, [router]);

  const renderItem = useCallback(({ item, index }: { item: Property; index: number }) => (
    <PropertyCard
      property={item}
      onPress={() => handlePropertyPress(item.id)}
      onLike={() => handleUnlike(item.id)}
      index={index}
    />
  ), [handlePropertyPress, handleUnlike]);

  const keyExtractor = useCallback((item: Property) => item.id, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Properties</Text>
          <Text style={styles.headerSubtitle}>
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved
          </Text>
        </View>

        <FlatList
          data={properties}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={6}
          windowSize={11}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💙</Text>
              <Text style={styles.emptyText}>No saved properties yet</Text>
              <Text style={styles.emptySubtext}>
                Start exploring and save your favorites
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

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
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
