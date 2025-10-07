import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
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
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
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

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.gradientOverlay} />

      {/* Logo container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [
              { scale: Animated.multiply(logoScale, pulseAnim) },
              { rotate: spin },
            ],
          },
        ]}
      >
        {/* Hexagonal Logo Background */}
        <View style={styles.hexagon}>
          <View style={styles.hexagonInner}>
            <View style={styles.logoShape1} />
            <View style={styles.logoShape2} />
          </View>
        </View>

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

      {/* Powered by text */}
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
        <Text style={styles.companyName}>PropertyHub</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>Find Your Perfect Property</Text>
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
  logoContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
    overflow: 'hidden',
  },
  hexagon: {
    width: 160,
    height: 160,
    backgroundColor: '#3A4557',
    transform: [{ rotate: '0deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: '#6495FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  hexagonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoShape1: {
    width: 80,
    height: 60,
    backgroundColor: '#8B9CFF',
    position: 'absolute',
    top: 40,
    left: 30,
    borderRadius: 8,
    transform: [{ rotate: '-15deg' }],
  },
  logoShape2: {
    width: 80,
    height: 60,
    backgroundColor: '#64C8DC',
    position: 'absolute',
    top: 60,
    right: 30,
    borderRadius: 8,
    transform: [{ rotate: '15deg' }],
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
    marginBottom: 8,
  },
  companyName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(100, 150, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
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
