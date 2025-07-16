'use server'

import { 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  doc, 
  Timestamp, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from "firebase/firestore"
import { executeCode, formatExecutionResult, validateOutput } from "@/lib/judge0"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/firebase"

/**
 * Submit code for execution and store in database
 */
export async function submitCodeAction(
  teamId: string,
  challengeId: string,
  code: string,
  language: string
) {
  try {
    // Get the challenge to check for input/output validation
    const challengeRef = doc(db, "challenges", challengeId)
    const challengeSnap = await getDoc(challengeRef)
    
    if (!challengeSnap.exists()) {
      throw new Error("Challenge not found")
    }
    
    const challenge = challengeSnap.data()
    
    // Create a submission record with pending status
    const submissionRef = await addDoc(collection(db, "codeSubmissions"), {
      teamId,
      challengeId,
      code,
      language,
      status: "Pending",
      createdAt: Timestamp.now(),
    })
    
    // Execute the code
    const result = await executeCode(
      code, 
      language, 
      challenge.input, 
      challenge.output
    )
    
    // Format the execution result
    const { output, status } = formatExecutionResult(result)
    
    // Check if output matches expected output (if provided)
    let isCorrect = false
    if (challenge.output && result.stdout) {
      isCorrect = validateOutput(result, challenge.output)
    }
    
    // Update the submission with results
    await updateDoc(doc(db, "codeSubmissions", submissionRef.id), {
      output,
      status,
      executionTime: result.time,
      memory: result.memory,
      isCorrect,
      updatedAt: Timestamp.now(),
    })
    
    // If this is the first correct submission, update team progress
    if (isCorrect) {
      const previousCorrectSubmissions = await getDocs(
        query(
          collection(db, "codeSubmissions"),
          where("teamId", "==", teamId),
          where("challengeId", "==", challengeId),
          where("isCorrect", "==", true)
        )
      )
      
      if (previousCorrectSubmissions.docs.length <= 1) {
        await updateTeamProgress(teamId, challengeId)
      }
    }
    
    // Revalidate the page to show updated data
    revalidatePath(`/challenges/${challengeId}`)
    
    return {
      id: submissionRef.id,
      output,
      status,
      executionTime: result.time,
      memory: result.memory,
      isCorrect,
    }
  } catch (error) {
    console.error("Error submitting code:", error)
    throw new Error("Failed to submit code. Please try again.")
  }
}

/**
 * Update team progress when a challenge is completed
 */
async function updateTeamProgress(teamId: string, challengeId: string) {
  try {
    const teamRef = doc(db, "teams", teamId)
    const teamSnap = await getDoc(teamRef)
    
    if (!teamSnap.exists()) {
      throw new Error("Team not found")
    }
    
    const team = teamSnap.data()
    
    // Update completed challenges
    const completedChallenges = team.completedChallenges || []
    if (!completedChallenges.includes(challengeId)) {
      completedChallenges.push(challengeId)
    }
    
    // Update team score
    const totalScore = (team.totalScore || 0) + 10 // Award 10 points for completing a challenge
    
    await updateDoc(teamRef, {
      completedChallenges,
      totalScore,
      updatedAt: Timestamp.now(),
    })
    
    // Revalidate leaderboard
    revalidatePath('/leaderboard')
  } catch (error) {
    console.error("Error updating team progress:", error)
  }
}

/**
 * Get code submission by ID
 */
export async function getSubmissionById(submissionId: string) {
  try {
    const submissionRef = doc(db, "codeSubmissions", submissionId)
    const submissionSnap = await getDoc(submissionRef)
    
    if (!submissionSnap.exists()) {
      return null
    }
    
    return {
      id: submissionSnap.id,
      ...submissionSnap.data(),
    }
  } catch (error) {
    console.error("Error getting submission:", error)
    throw new Error("Failed to get submission")
  }
}

/**
 * Get team submissions for a challenge
 */
export async function getTeamSubmissions(teamId: string, challengeId: string) {
  try {
    const submissionsQuery = query(
      collection(db, "codeSubmissions"),
      where("teamId", "==", teamId),
      where("challengeId", "==", challengeId),
      orderBy("createdAt", "desc")
    )
    
    const submissionsSnap = await getDocs(submissionsQuery)
    
    return submissionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting team submissions:", error)
    throw new Error("Failed to get team submissions")
  }
}

/**
 * Submit flag for a challenge
 */
export async function submitFlagAction(
  teamId: string,
  challengeId: string,
  flag: string
) {
  try {
    // Get the challenge to check the flag
    const challengeRef = doc(db, "challenges", challengeId)
    const challengeSnap = await getDoc(challengeRef)
    
    if (!challengeSnap.exists()) {
      throw new Error("Challenge not found")
    }
    
    const challenge = challengeSnap.data()
    const isCorrect = challenge.flag === flag
    
    // Create a flag submission record
    const submissionRef = await addDoc(collection(db, "flagSubmissions"), {
      teamId,
      challengeId,
      flag,
      isCorrect,
      createdAt: Timestamp.now(),
    })
    
    // If flag is correct, update team progress
    if (isCorrect) {
      const teamRef = doc(db, "teams", teamId)
      const teamSnap = await getDoc(teamRef)
      
      if (teamSnap.exists()) {
        const team = teamSnap.data()
        const solvedFlags = team.solvedFlags || []
        
        if (!solvedFlags.includes(challengeId)) {
          solvedFlags.push(challengeId)
          
          await updateDoc(teamRef, {
            solvedFlags,
            totalScore: (team.totalScore || 0) + 20, // Award 20 points for solving a flag
            updatedAt: Timestamp.now(),
          })
        }
      }
    }
    
    // Revalidate the page to show updated data
    revalidatePath(`/challenges/${challengeId}`)
    
    return {
      id: submissionRef.id,
      isCorrect,
    }
  } catch (error) {
    console.error("Error submitting flag:", error)
    throw new Error("Failed to submit flag. Please try again.")
  }
}

/**
 * Get team flag submissions for a challenge
 */
export async function getTeamFlagSubmissions(teamId: string, challengeId: string) {
  try {
    const submissionsQuery = query(
      collection(db, "flagSubmissions"),
      where("teamId", "==", teamId),
      where("challengeId", "==", challengeId),
      orderBy("createdAt", "desc")
    )
    
    const submissionsSnap = await getDocs(submissionsQuery)
    
    return submissionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting flag submissions:", error)
    throw new Error("Failed to get flag submissions")
  }
}

/**
 * Check if a team has solved a challenge
 */
export async function hasTeamSolvedChallenge(teamId: string, challengeId: string) {
  try {
    const teamRef = doc(db, "teams", teamId)
    const teamSnap = await getDoc(teamRef)
    
    if (!teamSnap.exists()) {
      return false
    }
    
    const team = teamSnap.data()
    const completedChallenges = team.completedChallenges || []
    
    return completedChallenges.includes(challengeId)
  } catch (error) {
    console.error("Error checking if team solved challenge:", error)
    return false
  }
}

/**
 * Check if a team has solved a flag
 */
export async function hasTeamSolvedFlag(teamId: string, challengeId: string) {
  try {
    const teamRef = doc(db, "teams", teamId)
    const teamSnap = await getDoc(teamRef)
    
    if (!teamSnap.exists()) {
      return false
    }
    
    const team = teamSnap.data()
    const solvedFlags = team.solvedFlags || []
    
    return solvedFlags.includes(challengeId)
  } catch (error) {
    console.error("Error checking if team solved flag:", error)
    return false
  }
}