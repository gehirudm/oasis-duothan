"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  type UserCredential,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  getIdToken,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { doc, setDoc, getDoc, getFirestore } from "firebase/firestore"
import { useRouter } from "next/navigation"

interface UserData {
  uid: string;
  username: string;
  email: string;
  createdAt: string;
  role: string;
  evomi?: {
    username: string;
    email: string;
    created_at: string;
    updated_at: string;
    products: Record<string, any>;
  };
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  evomiUsername: string | null;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (username: string, email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  fetchUserData: () => Promise<UserData | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const db = getFirestore();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [evomiUsername, setEvomiUsername] = useState<string | null>(null)

  const router = useRouter();

  // Function to create a session cookie on the server
  const createSession = async (user: User) => {
    try {
      const idToken = await getIdToken(user)

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  // Function to fetch user data from Firestore
  const fetchUserData = async (): Promise<UserData | null> => {
    if (!user) return null;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);

        // Also update Evomi username if available
        if (data.evomi?.username) {
          setEvomiUsername(data.evomi.username);
        }

        return data;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  // Function to fetch Evomi username from Firestore
  const fetchEvomiUsername = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (userData.evomi && userData.evomi.username) {
          setEvomiUsername(userData.evomi.username)
        }
      }
    } catch (error) {
      console.error("Error fetching Evomi username:", error)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        // Create a session when user logs in
        await createSession(user)
        // Fetch Evomi username
        await fetchEvomiUsername(user.uid)
      } else {
        // Clear Evomi username when user logs out
        setEvomiUsername(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    await createSession(userCredential.user)
    await fetchEvomiUsername(userCredential.user.uid)
    return userCredential
  }

  const signUp = async (username: string, email: string, password: string) => {
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with username
      await updateProfile(user, {
        displayName: username
      })

      const newUserData: UserData = {
        uid: user.uid,
        username,
        email,
        createdAt: new Date().toISOString(),
        role: "user",
      };

      // Store additional user data in Firestore, including Evomi subuser information
      await setDoc(doc(db, "users", user.uid), newUserData)

      // Set the user data and Evomi username in state
      setUserData(newUserData)

      // Create a session
      await createSession(user)

      return userCredential
    } catch (error) {
      console.error("Error during sign up:", error)
      throw error
    }
  }

  const logout = async () => {
    // Clear the session cookie
    await fetch('/api/auth/session', {
      method: 'DELETE',
    })

    // Clear Evomi username
    setEvomiUsername(null)

    await signOut(auth)

    router.replace('/auth');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        evomiUsername,
        signIn,
        signUp,
        logout,
        fetchUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}