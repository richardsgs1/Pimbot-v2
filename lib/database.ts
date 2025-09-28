// lib/database.ts
import { supabase } from './supabase'
import type { OnboardingData } from '../types'

// Enhanced user data type with required id
interface UserData extends OnboardingData {
  id: string; // Make sure id is always present
}

export const saveUserData = async (userData: Partial<OnboardingData> & { id?: string }): Promise<string> => {
  try {
    // If no ID provided, this is a new user - insert
    if (!userData.id) {
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

      if (error) {
        console.error('Error creating user:', error)
        throw error
      }

      return data.id
    }

    // If ID exists, update existing user
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

    if (error) {
      console.error('Error updating user:', error)
      throw error
    }

    return data.id
  } catch (error) {
    console.error('Database operation failed:', error)
    throw error
  }
}

export const loadUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error loading user data:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      skillLevel: data.skill_level,
      methodologies: data.methodologies || [],
      tools: data.tools || []
    }
  } catch (error) {
    console.error('Failed to load user data:', error)
    return null
  }
}

// Helper function to get or create user ID from localStorage
export const getUserId = (): string => {
  let userId = localStorage.getItem('user_id')
  
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('user_id', userId)
  }
  
  return userId
}