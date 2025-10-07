import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { requestAPI } from '../../lib/api';
import { Colors } from '../../constants/Colors';
import { PropertyRequest } from '../../types/database';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    backgroundColor: Colors.warningLight,
    textColor: Colors.warning,
  },
  accepted: {
    label: 'Accepted',
    backgroundColor: Colors.successLight,
    textColor: Colors.success,
  },
  declined: {
    label: 'Declined',
    backgroundColor: Colors.errorLight,
    textColor: Colors.error,
  },
  cancelled: {
    label: 'Cancelled',
    backgroundColor: Colors.gray100,
    textColor: Colors.textSecondary,
  },
};

export default function RequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRequests();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchRequests = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await requestAPI.getUserRequests(user.id);
      setRequests(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string, propertyId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await requestAPI.cancelRequest(requestId, propertyId);
              fetchRequests();
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
          <TouchableOpacity style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Requests</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No requests yet</Text>
              <Text style={styles.emptySubtext}>
                Start exploring properties and submit requests
              </Text>
            </View>
          ) : (
            requests.map((request, index) => (
              <RequestCard
                key={request.id}
                request={request}
                index={index}
                onCancel={() => handleCancelRequest(request.id, request.property_id)}
              />
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function RequestCard({
  request,
  index,
  onCancel,
}: {
  request: PropertyRequest;
  index: number;
  onCancel: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG];
  const property = request.property;
  const primaryImage = property?.images?.find(img => img.is_primary) || property?.images?.[0];

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.backgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
              {statusConfig.label}
            </Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={1}>
            {property?.location || 'Unknown Address'}
          </Text>
          <Text style={styles.cardSpecs}>
            {property?.rooms || 0} beds • {property?.bathrooms || 0} baths • {property?.square_meters?.toLocaleString() || 0} sqft
          </Text>

          {request.status === 'pending' && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>

        {primaryImage?.image_url && (
          <View style={styles.cardRight}>
            <Image
              source={{ uri: primaryImage.image_url }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>
    </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  },
  cardLeft: {
    flex: 1,
    paddingRight: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
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
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: Colors.errorLight,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.error,
  },
  cardRight: {
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
});
