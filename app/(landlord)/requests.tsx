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
import { Check, X } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { requestAPI } from '../../lib/api';
import { Colors } from '../../constants/Colors';
import { PropertyRequest } from '../../types/database';

export default function LandlordRequestsScreen() {
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
    try {
      const data = await requestAPI.getSellerRequests(user?.id || '');
      setRequests(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (request: PropertyRequest) => {
    const buyer = request.buyer;
    Alert.alert(
      'Accept Request',
      `Accept request from ${buyer?.full_name}? The property will be marked as rented.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              await requestAPI.updateRequestStatus(
                request.id,
                'accepted',
                request.property_id
              );
              Alert.alert('Success', 'Request accepted! Property marked as rented.');
              fetchRequests();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleDecline = (request: PropertyRequest) => {
    Alert.alert(
      'Decline Request',
      'Decline this request? The property will return to available status.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await requestAPI.updateRequestStatus(
                request.id,
                'declined',
                request.property_id
              );
              Alert.alert('Success', 'Request declined. Property is available again.');
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

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Requests</Text>
          <Text style={styles.headerSubtitle}>
            {pendingRequests.length} pending
          </Text>
        </View>

        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const buyer = item.buyer;
            const property = item.property;
            const isPending = item.status === 'pending';

            return (
              <Animated.View
                style={[
                  styles.card,
                  { opacity: isPending ? 1 : 0.6 },
                ]}
              >
                <View style={styles.statusBadge}>
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'pending' && styles.statusPending,
                      item.status === 'accepted' && styles.statusAccepted,
                      item.status === 'declined' && styles.statusDeclined,
                    ]}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.propertyTitle} numberOfLines={1}>
                  {property?.location || 'Property'}
                </Text>

                <View style={styles.divider} />

                <View style={styles.buyerInfo}>
                  <Text style={styles.buyerLabel}>Requester Details:</Text>
                  <Text style={styles.buyerName}>{buyer?.full_name || 'Unknown'}</Text>
                  {buyer?.phone && (
                    <Text style={styles.buyerDetail}>📞 {buyer.phone}</Text>
                  )}
                  {buyer?.age && (
                    <Text style={styles.buyerDetail}>Age: {buyer.age}</Text>
                  )}
                  {buyer?.gender && (
                    <Text style={styles.buyerDetail}>
                      Gender: {buyer.gender.charAt(0).toUpperCase() + buyer.gender.slice(1)}
                    </Text>
                  )}
                  {item.message && (
                    <>
                      <Text style={styles.messageLabel}>Message:</Text>
                      <Text style={styles.message}>{item.message}</Text>
                    </>
                  )}
                </View>

                {isPending && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => handleDecline(item)}
                    >
                      <X size={20} color={Colors.error} />
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAccept(item)}
                    >
                      <Check size={20} color={Colors.textLight} />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={styles.emptyText}>No requests yet</Text>
              <Text style={styles.emptySubtext}>
                Requests from interested buyers will appear here
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
    padding: 20,
    marginBottom: 16,
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: Colors.gray100,
  },
  statusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  statusPending: {
    color: Colors.warning,
  },
  statusAccepted: {
    color: Colors.success,
  },
  statusDeclined: {
    color: Colors.error,
  },
  propertyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  buyerInfo: {
    marginBottom: 16,
  },
  buyerLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  buyerName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  buyerDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  messageLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorLight,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  declineButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: Colors.error,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  acceptButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: Colors.textLight,
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
