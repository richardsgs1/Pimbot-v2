import { supabase } from './supabase'
import type { OnboardingData } from '../types'

export const saveUserData = async (userData: OnboardingData): Promise<void> => {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      skill_level: userData.skillLevel,
      methodologies: userData.methodologies,
      tools: userData.tools,
      updated_at: new Date().toISOString()
    })
    .select()

  if (error) {
    console.error('Error saving user data:', error)
    throw error
  }
}

export const loadUserData = async (userId: string): Promise<OnboardingData | null> => {
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
}

export const createUser = async (userData: Omit<OnboardingData, 'id'>): Promise<string> => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      name: userData.name,
      email: userData.email,
      skill_level: userData.skillLevel,
      methodologies: userData.methodologies,
      tools: userData.tools
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating user:', error)
    throw error
  }

  return data.id
}