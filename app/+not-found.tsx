import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>Page not found</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go back home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 72,
    fontFamily: 'Poppins-Bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 24,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  link: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  linkText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textLight,
  },
});
