import { supabase } from './supabase'
import type { OnboardingData } from '../types'

export const saveUserData = async (userData: Partial<OnboardingData> & { id?: string }): Promise<string> => {
  try {
    if (!userData.id) {
      // Insert new user - let Supabase generate the ID
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: userData.name || 'Unnamed User',
          email: userData.email || '',
          skill_level: userData.skillLevel || 'Beginner',
          methodologies: userData.methodologies || [],
          tools: userData.tools || []
        })
        .select('id')
        .single()

      if (error) throw error
      
      // Store the Supabase-generated ID in localStorage
      localStorage.setItem('user_id', data.id);
      return data.id
    }

    // Update existing user
    const { data, error } = await supabase
      .from('users')
      .update({
        name: userData.name,
        email: userData.email,
        skill_level: userData.skillLevel,
        methodologies: userData.methodologies,
        tools: userData.tools,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id)
      .select('id')
      .single()

    if (error) throw error
    return data.id
  } catch (error) {
    console.error('Database operation failed:', error)
    throw error
  }
}

export const getUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  let userId = localStorage.getItem('user_id')
  
  // Return the stored ID if it exists, otherwise return null
  // This forces the INSERT path which lets Supabase generate a proper UUID
  return userId;
}
export const loadUserData = async (userId: string): Promise<OnboardingData | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Failed to load user data:', error)
      return null
    }

    // Map database fields to OnboardingData format
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      skillLevel: data.skill_level,
      methodologies: data.methodologies || [],
      tools: data.tools || []
    }
  } catch (error) {
    console.error('Error loading user data:', error)
    return null
  }
}