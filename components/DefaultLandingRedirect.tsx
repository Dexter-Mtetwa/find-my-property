import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export function DefaultLandingRedirect() {
  const router = useRouter();
  const { user, hasProperties, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // If user has properties, redirect to property owner dashboard
      if (hasProperties) {
        router.replace('/(landlord)' as any);
      } else {
        // Otherwise, redirect to buyer side
        router.replace('/(tabs)' as any);
      }
    }
  }, [user, hasProperties, loading, router]);

  return null;
}
