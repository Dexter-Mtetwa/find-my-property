import { Animated } from 'react-native';

export const Animations = {
  spring: {
    default: {
      tension: 50,
      friction: 8,
    },
    bouncy: {
      tension: 100,
      friction: 5,
    },
    gentle: {
      tension: 30,
      friction: 10,
    },
  },
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

export const animatePress = (animValue: Animated.Value, callback?: () => void) => {
  Animated.sequence([
    Animated.timing(animValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.spring(animValue, {
      toValue: 1,
      tension: 100,
      friction: 3,
      useNativeDriver: true,
    }),
  ]).start(callback);
};

export const animateBounce = (animValue: Animated.Value) => {
  Animated.sequence([
    Animated.spring(animValue, {
      toValue: 0.7,
      tension: 200,
      friction: 3,
      useNativeDriver: true,
    }),
    Animated.spring(animValue, {
      toValue: 1.2,
      tension: 100,
      friction: 3,
      useNativeDriver: true,
    }),
    Animated.spring(animValue, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }),
  ]).start();
};

export const animateShake = (animValue: Animated.Value) => {
  Animated.sequence([
    Animated.timing(animValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]).start();
};

export const animateFadeIn = (animValue: Animated.Value, delay: number = 0) => {
  Animated.timing(animValue, {
    toValue: 1,
    duration: 400,
    delay,
    useNativeDriver: true,
  }).start();
};

export const animateSlideUp = (animValue: Animated.Value, delay: number = 0) => {
  Animated.spring(animValue, {
    toValue: 0,
    tension: 40,
    friction: 8,
    delay,
    useNativeDriver: true,
  }).start();
};
