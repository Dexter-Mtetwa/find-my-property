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
import { X, ArrowRight, Home, Heart, Search, SlidersHorizontal } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FindMyProperty!',
    description: 'Your gateway to finding the perfect property. Let\'s take a quick tour to get you started.',
    icon: Home,
    color: Colors.primary,
  },
  {
    id: 'browse',
    title: 'Browse Properties',
    description: 'Discover amazing properties for rent or sale. Use the search bar to find specific locations.',
    icon: Search,
    color: '#4CAF50',
  },
  {
    id: 'filter',
    title: 'Filter & Sort',
    description: 'Use filters to narrow down by price, rooms, amenities, and listing type (rent/sale).',
    icon: SlidersHorizontal,
    color: '#FF6B35',
  },
  {
    id: 'like',
    title: 'Save Favorites',
    description: 'Tap the heart icon to save properties you love. View them later in your Likes tab.',
    icon: Heart,
    color: '#E91E63',
  },
  {
    id: 'request',
    title: 'Request Properties',
    description: 'Found your dream property? Tap "Request Property" to contact the owner directly.',
    icon: ArrowRight,
    color: Colors.primary,
  },
  {
    id: 'owner',
    title: 'Want to List Properties?',
    description: 'Switch to Property Owner mode in your Profile to list your own properties for rent or sale.',
    icon: Home,
    color: '#9C27B0',
  },
];

interface TutorialModalProps {
  visible: boolean;
  onComplete: () => void;
}

export function TutorialModal({ visible, onComplete }: TutorialModalProps) {
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
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentStepData = tutorialSteps[currentStep];
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
                  {tutorialSteps.map((_, index) => (
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
                    {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
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
