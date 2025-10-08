import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(30)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // Pulse effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ),

      // Text entrance
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(textSlide, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // Shimmer effect
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),

      // Hold for a moment
      Animated.delay(500),

      // Fade out
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]);

    sequence.start(() => {
      onFinish();
    });
  }, []);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.gradientOverlay} />

      {/* Main App Logo */}
      <Animated.View
        style={[
          styles.appLogoContainer,
          {
            opacity: logoOpacity,
            transform: [
              { scale: Animated.multiply(logoScale, pulseAnim) },
            ],
          },
        ]}
      >
        {/* House Icon */}
        <View style={styles.houseIcon}>
          <Text style={styles.houseEmoji}>🏠</Text>
        </View>
        
        {/* App Name */}
        <Text style={styles.appName}>FindMyProperty</Text>
        
        {/* Shimmer effect overlay */}
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
      </Animated.View>

      {/* Powered by section */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textSlide }],
          },
        ]}
      >
        <Text style={styles.poweredByText}>Powered by</Text>
        
        {/* Octo-Native Logo */}
        <View style={styles.octoNativeContainer}>
          <Image
            source={require('../assets/octo-native_logo.png')}
            style={styles.octoNativeLogo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.divider} />
        <Text style={styles.tagline}>
          Building The Future,{'\n'}One Line of Code at a Time
        </Text>
      </Animated.View>

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  appLogoContainer: {
    alignItems: 'center',
    marginBottom: 80,
    overflow: 'hidden',
  },
  houseIcon: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#6495FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  houseEmoji: {
    fontSize: 60,
    textShadowColor: 'rgba(100, 150, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  appName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(100, 150, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    textAlign: 'center',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  textContainer: {
    alignItems: 'center',
  },
  poweredByText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  octoNativeContainer: {
    width: 250,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 16,
  },
  octoNativeLogo: {
    width: 220,
    height: 60,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginVertical: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  tagline: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 20,
    marginHorizontal: 40,
    paddingHorizontal: 20,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(100, 150, 255, 0.05)',
    top: -100,
    left: -100,
  },
  circle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(100, 200, 255, 0.05)',
    bottom: -80,
    right: -80,
  },
  circle3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(150, 100, 255, 0.05)',
    top: height * 0.4,
    right: -60,
  },
});
