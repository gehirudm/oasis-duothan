"use server"

import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

export async function getAdminEmails(): Promise<string[]> {
  try {
    const adminsCollection = collection(db, "admins")
    const snapshot = await getDocs(adminsCollection)
    
    if (snapshot.empty) {
      // Fallback to default admins if no admins are found in the database
      return ["malikanishnatha4@gmail.com", "gehirudm@pm.me", "nimsith.xyz@gmail.com"]
    }
    
    const adminEmails: string[] = []
    snapshot.forEach(doc => {
      const data = doc.data()
      if (data.email && typeof data.email === 'string') {
        adminEmails.push(data.email)
      }
    })
    
    return adminEmails
  } catch (error) {
    console.error("Error fetching admin emails:", error)
    // Return default admins as fallback in case of error
    return ["malikanishnatha4@gmail.com", "gehirudm@pm.me", "nimsith.xyz@gmail.com"]
  }
}