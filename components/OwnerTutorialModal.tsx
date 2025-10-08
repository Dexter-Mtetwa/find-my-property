import React, { useState, useRef, useEffect } from 'react';
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
import { X, ArrowRight, Home, History, MessageSquare, Plus } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

interface OwnerTutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const ownerTutorialSteps: OwnerTutorialStep[] = [
  {
    id: 'welcome',
    title: 'Property Owner Dashboard',
    description: 'Welcome to your property management dashboard! Here you can manage all your property listings.',
    icon: Home,
    color: Colors.primary,
  },
  {
    id: 'home',
    title: 'Home Tab',
    description: 'View all your active property listings. Tap the + button to add new properties for rent or sale.',
    icon: Plus,
    color: '#4CAF50',
  },
  {
    id: 'history',
    title: 'History Tab',
    description: 'Track your property performance. View sold/rented properties and their transaction history.',
    icon: History,
    color: '#FF6B35',
  },
  {
    id: 'requests',
    title: 'Requests Tab',
    description: 'Manage incoming requests from potential buyers/tenants. Accept or decline requests here.',
    icon: MessageSquare,
    color: '#9C27B0',
  },
];

interface OwnerTutorialModalProps {
  visible: boolean;
  onComplete: () => void;
}

export function OwnerTutorialModal({ visible, onComplete }: OwnerTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
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
  }, [visible, currentStep]);

  const handleNext = () => {
    if (currentStep < ownerTutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentStepData = ownerTutorialSteps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
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
                <View style={styles.stepIndicator}>
                  {ownerTutorialSteps.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor: index <= currentStep ? currentStepData.color : '#E0E0E0',
                        },
                      ]}
                    />
                  ))}
                </View>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                  <X size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.stepContent}>
                <View style={[styles.iconContainer, { backgroundColor: currentStepData.color }]}>
                  <IconComponent size={40} color="#FFFFFF" />
                </View>

                <Text style={styles.title}>{currentStepData.title}</Text>
                <Text style={styles.description}>{currentStepData.description}</Text>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity onPress={handleSkip} style={styles.skipTextButton}>
                  <Text style={styles.skipText}>Skip Tutorial</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleNext}
                  style={[styles.nextButton, { backgroundColor: currentStepData.color }]}
                >
                  <Text style={styles.nextButtonText}>
                    {currentStep === ownerTutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                  <ArrowRight size={20} color="#FFFFFF" />
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
    marginBottom: 32,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skipButton: {
    padding: 8,
  },
  stepContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipTextButton: {
    padding: 12,
  },
  skipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
