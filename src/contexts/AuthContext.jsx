import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContextDef'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        console.log('Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setError(error.message)
        } else {
          console.log('Session retrieved:', session ? 'User logged in' : 'No user')
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'User logged in' : 'No user')
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, userData = {}, username = null) => {
    try {
      console.log('Attempting sign up for:', email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (error) {
        console.error('Sign up error:', error)
        throw error
      }
      
      // If username is provided, create user profile
      if (username && data.user) {
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: data.user.id,
              username: username,
              full_name: userData.full_name || 'Anonymous User',
              user_type: userData.user_type || 'individual'
            });
          
          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Don't fail signup if profile creation fails, but log it
          }
        } catch (profileErr) {
          console.error('Unexpected error creating profile:', profileErr);
        }
      }
      
      console.log('Sign up successful:', data)
      return { data, error: null }
    } catch (error) {
      console.error('Sign up failed:', error)
      return { data: null, error: error.message }
    }
  }

  const signIn = async (email, password) => {
    try {
      console.log('Attempting sign in for:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
      
      console.log('Sign in successful:', data)
      return { data, error: null }
    } catch (error) {
      console.error('Sign in failed:', error)
      return { data: null, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      console.log('Attempting sign out')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        throw error
      }
      
      console.log('Sign out successful')
      return { error: null }
    } catch (error) {
      console.error('Sign out failed:', error)
      return { error: error.message }
    }
  }

  const resetPassword = async (email) => {
    try {
      console.log('Attempting password reset for:', email)
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) {
        console.error('Password reset error:', error)
        throw error
      }
      
      console.log('Password reset email sent')
      return { error: null }
    } catch (error) {
      console.error('Password reset failed:', error)
      return { error: error.message }
    }
  }

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 