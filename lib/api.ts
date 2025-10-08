import { supabase } from './supabase';
import { Property, PropertyRequest } from '../types/database';

export const propertyAPI = {
  async getAvailableProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        images:property_images(*),
        seller:profiles(*)
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPropertyById(id: string) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        images:property_images(*),
        seller:profiles(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async incrementViewCount(propertyId: string, viewerId?: string) {
    await supabase.from('property_views').insert({
      property_id: propertyId,
      viewer_id: viewerId,
    });

    await supabase.rpc('increment_view_count', { property_id: propertyId });
  },

  async createProperty(property: any) {
    const { data, error } = await supabase
      .from('properties')
      .insert(property)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProperty(id: string, updates: any) {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProperty(id: string) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const likeAPI = {
  async getUserLikes(userId: string) {
    const { data, error } = await supabase
      .from('likes')
      .select('property_id')
      .eq('user_id', userId);

    if (error) throw error;
    return new Set((data || []).map(like => like.property_id));
  },

  async toggleLike(userId: string, propertyId: string, isLiked: boolean) {
    if (isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: userId, property_id: propertyId });

      if (error) throw error;
    }
  },

  async getLikedProperties(userId: string) {
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('property_id')
      .eq('user_id', userId);

    if (likesError) throw likesError;

    const propertyIds = (likes || []).map(like => like.property_id);
    if (propertyIds.length === 0) return [];

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        images:property_images(*),
        seller:profiles(*)
      `)
      .in('id', propertyIds);

    if (error) throw error;
    return data || [];
  },
};

export const requestAPI = {
  async createRequest(buyerId: string, propertyId: string, message?: string) {
    const { data, error } = await supabase.rpc('create_property_request', {
      p_buyer_id: buyerId,
      p_property_id: propertyId,
      p_message: message,
    });

    if (error) throw error;
    return data;
  },

  async getUserRequests(userId: string) {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        property:properties(*,images:property_images(*)),
        seller:seller_id(*)
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBuyerRequests(userId: string) {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        property:properties(*,images:property_images(*)),
        seller:seller_id(*)
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSellerRequests(sellerId: string) {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        property:properties(*,images:property_images(*)),
        buyer:buyer_id(*)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async cancelRequest(requestId: string, propertyId: string) {
    const { error: requestError } = await supabase
      .from('requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    if (requestError) throw requestError;

    const { error: propertyError } = await supabase
      .from('properties')
      .update({ status: 'available' })
      .eq('id', propertyId);

    if (propertyError) throw propertyError;
  },

  async updateRequestStatus(requestId: string, status: 'accepted' | 'declined', propertyId?: string) {
    const { error: requestError } = await supabase
      .from('requests')
      .update({
        status,
        resolved_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (requestError) throw requestError;

    if (propertyId) {
      const newStatus = status === 'accepted' ? 'rented' : 'available';
      const { error: propertyError } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (propertyError) throw propertyError;
    }
  },

  async hasPendingRequest(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('requests')
      .select('id')
      .eq('buyer_id', userId)
      .eq('status', 'pending')
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  },
};
