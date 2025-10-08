import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { X, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

interface RequestConstraintsModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function RequestConstraintsModal({ visible, onClose, onAccept }: RequestConstraintsModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={styles.blurContainer}>
          <Animated.View
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
              style={styles.content}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <AlertCircle size={32} color={Colors.primary} />
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.contentSection}>
                <Text style={styles.title}>Important: Request Policy</Text>
                <Text style={styles.subtitle}>
                  Before you send your first property request, please understand our business rules:
                </Text>

                <View style={styles.rulesContainer}>
                  <View style={styles.ruleItem}>
                    <View style={styles.ruleIcon}>
                      <CheckCircle size={20} color="#4CAF50" />
                    </View>
                    <View style={styles.ruleContent}>
                      <Text style={styles.ruleTitle}>One Active Request</Text>
                      <Text style={styles.ruleDescription}>
                        You can only have one pending request at a time
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ruleItem}>
                    <View style={styles.ruleIcon}>
                      <Clock size={20} color="#FF6B35" />
                    </View>
                    <View style={styles.ruleContent}>
                      <Text style={styles.ruleTitle}>Wait for Response</Text>
                      <Text style={styles.ruleDescription}>
                        You must wait for the property owner to respond before requesting other properties
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ruleItem}>
                    <View style={styles.ruleIcon}>
                      <X size={20} color="#E91E63" />
                    </View>
                    <View style={styles.ruleContent}>
                      <Text style={styles.ruleTitle}>Cancel to Request Others</Text>
                      <Text style={styles.ruleDescription}>
                        If you want to request a different property, cancel your current request first
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.noteContainer}>
                  <Text style={styles.noteText}>
                    💡 This policy ensures fair opportunities for all users and prevents spam requests.
                  </Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={onAccept || onClose}
                  style={styles.understandButton}
                >
                  <Text style={styles.understandButtonText}>I Understand</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    width: width * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    padding: 24,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  contentSection: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  rulesContainer: {
    gap: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ruleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  ruleDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  noteContainer: {
    backgroundColor: 'rgba(100, 150, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  noteText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
  },
  understandButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  understandButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
