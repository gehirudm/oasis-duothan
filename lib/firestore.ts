import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
} from "firebase/firestore"
import { db } from "./firebase"

export interface Challenge {
  id?: string
  title: string
  description: string
  constraints: string
  flag: string
  buildathonTask: string
  isActive: boolean
  createdAt: Timestamp
}

export interface Team {
  id?: string
  name: string
  hackathonId: string // Add this back for hackathon association
  leaderId: string
  leaderName: string
  leaderEmail: string
  members: TeamMember[]
  flagSubmitted: boolean
  buildathonUnlocked: boolean
  githubLink?: string
  completedChallenges: string[] // Array of completed challenge IDs
  totalScore: number
  createdAt: Timestamp
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

export interface UserProfile {
  id?: string
  uid: string
  username: string
  displayName: string
  email: string
  bio?: string
  skills?: string[]
  github?: string
  linkedin?: string
  profileCompleted: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface TeamInvitation {
  id?: string
  teamId: string
  teamName: string
  inviterName: string
  inviterEmail: string
  inviteeEmail: string
  role?: string
  status: "pending" | "accepted" | "declined"
  createdAt: Timestamp
}

export interface CodeSubmission {
  id?: string
  teamId: string
  challengeId: string
  code: string
  language: string
  output?: string
  status?: string
  executionTime?: number
  memory?: number
  createdAt: Timestamp
}

export interface FlagSubmission {
  id?: string
  teamId: string
  challengeId: string
  flag: string
  isCorrect: boolean
  createdAt: Timestamp
}

export interface Hackathon {
  id?: string
  title: string
  description: string
  startDate: Timestamp
  endDate: Timestamp
  registrationDeadline: Timestamp
  maxTeamSize: number
  isActive: boolean
  challengeIds: string[] // Array of challenge IDs assigned to this hackathon
  createdAt: Timestamp
}

// Challenge operations
export const createChallenge = async (challenge: Omit<Challenge, "id" | "createdAt">) => {
  const docRef = await addDoc(collection(db, "challenges"), {
    ...challenge,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export const getChallenges = async () => {
  const querySnapshot = await getDocs(query(collection(db, "challenges"), orderBy("createdAt", "desc")))
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Challenge)
}

export const getActiveChallenges = async () => {
  const querySnapshot = await getDocs(query(collection(db, "challenges"), where("isActive", "==", true)))
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Challenge)
}

export const getChallengeById = async (challengeId: string) => {
  const docRef = doc(db, "challenges", challengeId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Challenge) : null
}

export const updateChallenge = async (id: string, updates: Partial<Challenge>) => {
  await updateDoc(doc(db, "challenges", id), updates)
}

export const deleteChallenge = async (id: string) => {
  await deleteDoc(doc(db, "challenges", id))
}

// Team operations
export const createTeam = async (
  team: Omit<Team, "id" | "createdAt" | "flagSubmitted" | "buildathonUnlocked" | "completedChallenges" | "totalScore">,
) => {
  const docRef = await addDoc(collection(db, "teams"), {
    ...team,
    flagSubmitted: false,
    buildathonUnlocked: false,
    completedChallenges: [],
    totalScore: 0,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export const getTeams = async () => {
  const querySnapshot = await getDocs(query(collection(db, "teams"), orderBy("createdAt", "desc")))
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Team)
}

export const getUserTeams = async (userId: string) => {
  const leaderTeams = await getDocs(query(collection(db, "teams"), where("leaderId", "==", userId)))
  const allTeams = await getDocs(collection(db, "teams"))
  const memberTeams = allTeams.docs.filter((doc) => {
    const team = doc.data() as Team
    return team.members.some((member) => member.id === userId)
  })

  const teams = [...leaderTeams.docs, ...memberTeams].map((doc) => ({ id: doc.id, ...doc.data() }) as Team)
  const uniqueTeams = teams.filter((team, index, self) => index === self.findIndex((t) => t.id === team.id))
  return uniqueTeams
}

export const getTeamById = async (teamId: string) => {
  const docRef = doc(db, "teams", teamId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Team) : null
}

export const getUserTeam = async (hackathonId: string, userId: string) => {
  // First check if user is a team leader for this hackathon
  const leaderTeamsQuery = query(
    collection(db, "teams"), 
    where("hackathonId", "==", hackathonId),
    where("leaderId", "==", userId)
  )
  const leaderTeamsSnapshot = await getDocs(leaderTeamsQuery)
  
  if (!leaderTeamsSnapshot.empty) {
    // User is a leader of a team in this hackathon
    const teamDoc = leaderTeamsSnapshot.docs[0]
    return { id: teamDoc.id, ...teamDoc.data() } as Team
  }
  
  // If not a leader, check if user is a member of any team in this hackathon
  const teamsQuery = query(
    collection(db, "teams"),
    where("hackathonId", "==", hackathonId)
  )
  const teamsSnapshot = await getDocs(teamsQuery)
  
  for (const teamDoc of teamsSnapshot.docs) {
    const team = teamDoc.data() as Team
    if (team.members.some(member => member.id === userId || member.email === userId)) {
      return { id: teamDoc.id, ...teamDoc.data() } as Team
    }
  }
  
  // User is not part of any team for this hackathon
  return null
}

// User Profile operations
export const getUserProfile = async (uid: string) => {
  const querySnapshot = await getDocs(query(collection(db, "users"), where("uid", "==", uid)))
  return querySnapshot.docs.length > 0
    ? ({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as UserProfile)
    : null
}

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  const querySnapshot = await getDocs(query(collection(db, "users"), where("uid", "==", uid)))

  if (querySnapshot.docs.length > 0) {
    await updateDoc(querySnapshot.docs[0].ref, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } else {
    await addDoc(collection(db, "users"), {
      uid,
      ...updates,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  }
}

export const checkUsernameAvailability = async (username: string, currentUid?: string) => {
  const querySnapshot = await getDocs(query(collection(db, "users"), where("username", "==", username)))

  if (querySnapshot.docs.length === 0) return true

  // If current user is checking their own username, it's available
  if (currentUid && querySnapshot.docs[0].data().uid === currentUid) return true

  return false
}

// Team invitation operations
export const inviteTeamMember = async (invitation: Omit<TeamInvitation, "id" | "status" | "createdAt">) => {
  await addDoc(collection(db, "teamInvitations"), {
    ...invitation,
    status: "pending",
    createdAt: Timestamp.now(),
  })
}

export const getTeamInvitations = async (email: string) => {
  const querySnapshot = await getDocs(
    query(collection(db, "teamInvitations"), where("inviteeEmail", "==", email), where("status", "==", "pending")),
  )
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TeamInvitation)
}

export const acceptTeamInvitation = async (
  invitationId: string,
  userId: string,
  userName: string,
  userEmail: string,
) => {
  const invitationRef = doc(db, "teamInvitations", invitationId)
  const invitationSnap = await getDoc(invitationRef)

  if (!invitationSnap.exists()) {
    throw new Error("Invitation not found")
  }

  const invitation = invitationSnap.data() as TeamInvitation
  const teamRef = doc(db, "teams", invitation.teamId)
  const teamSnap = await getDoc(teamRef)

  if (teamSnap.exists()) {
    const team = teamSnap.data() as Team
    const newMember: TeamMember = {
      id: userId,
      name: userName,
      email: userEmail,
      role: invitation.role || "",
    }

    await updateDoc(teamRef, {
      members: [...team.members, newMember],
    })
  }

  await updateDoc(invitationRef, {
    status: "accepted",
  })
}

export const declineTeamInvitation = async (invitationId: string) => {
  await updateDoc(doc(db, "teamInvitations", invitationId), {
    status: "declined",
  })
}

// Code submission operations
export const submitCode = async (submission: Omit<CodeSubmission, "id" | "createdAt">) => {
  const docRef = await addDoc(collection(db, "codeSubmissions"), {
    ...submission,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export const getTeamSubmissions = async (teamId: string, challengeId: string) => {
  const querySnapshot = await getDocs(
    query(
      collection(db, "codeSubmissions"),
      where("teamId", "==", teamId),
      where("challengeId", "==", challengeId),
      orderBy("createdAt", "desc"),
    ),
  )
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as CodeSubmission)
}

// Flag submission operations
export const submitFlag = async (teamId: string, challengeId: string, flag: string) => {
  const challenge = await getChallengeById(challengeId)
  if (!challenge) throw new Error("Challenge not found")

  const isCorrect = challenge.flag === flag

  const docRef = await addDoc(collection(db, "flagSubmissions"), {
    teamId,
    challengeId,
    flag,
    isCorrect,
    createdAt: Timestamp.now(),
  })

  // If flag is correct, unlock buildathon for the team
  if (isCorrect) {
    const teamRef = doc(db, "teams", teamId)
    await updateDoc(teamRef, {
      flagSubmitted: true,
      buildathonUnlocked: true,
    })
  }

  return { id: docRef.id, isCorrect }
}

export const getTeamFlagSubmissions = async (teamId: string, challengeId: string) => {
  const querySnapshot = await getDocs(
    query(
      collection(db, "flagSubmissions"),
      where("teamId", "==", teamId),
      where("challengeId", "==", challengeId),
      orderBy("createdAt", "desc"),
    ),
  )
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FlagSubmission)
}

// Buildathon submission
export const submitBuildathon = async (teamId: string, githubLink: string) => {
  const teamRef = doc(db, "teams", teamId)
  await updateDoc(teamRef, {
    githubLink,
  })
}

// Hackathon operations
export const createHackathon = async (hackathon: Omit<Hackathon, "id" | "createdAt" | "challengeIds">) => {
  const docRef = await addDoc(collection(db, "hackathons"), {
    ...hackathon,
    challengeIds: [],
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export const getHackathons = async () => {
  const querySnapshot = await getDocs(query(collection(db, "hackathons"), orderBy("createdAt", "desc")))
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Hackathon)
}

export const getActiveHackathons = async () => {
  const querySnapshot = await getDocs(query(collection(db, "hackathons"), where("isActive", "==", true)))
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Hackathon)
}

export const getHackathonById = async (hackathonId: string) => {
  const docRef = doc(db, "hackathons", hackathonId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Hackathon) : null
}

export const updateHackathon = async (id: string, updates: Partial<Hackathon>) => {
  await updateDoc(doc(db, "hackathons", id), updates)
}

export const deleteHackathon = async (id: string) => {
  await deleteDoc(doc(db, "hackathons", id))
}

// Challenge assignment to hackathon
export const addChallengeToHackathon = async (hackathonId: string, challengeId: string) => {
  const hackathonRef = doc(db, "hackathons", hackathonId)
  const hackathonSnap = await getDoc(hackathonRef)

  if (hackathonSnap.exists()) {
    const hackathon = hackathonSnap.data() as Hackathon
    const updatedChallengeIds = [...(hackathon.challengeIds || []), challengeId]

    await updateDoc(hackathonRef, {
      challengeIds: updatedChallengeIds,
    })
  }
}

export const removeChallengeFromHackathon = async (hackathonId: string, challengeId: string) => {
  const hackathonRef = doc(db, "hackathons", hackathonId)
  const hackathonSnap = await getDoc(hackathonRef)

  if (hackathonSnap.exists()) {
    const hackathon = hackathonSnap.data() as Hackathon
    const updatedChallengeIds = (hackathon.challengeIds || []).filter((id) => id !== challengeId)

    await updateDoc(hackathonRef, {
      challengeIds: updatedChallengeIds,
    })
  }
}

// Get challenges for a specific hackathon
export const getHackathonChallenges = async (hackathonId: string) => {
  const hackathon = await getHackathonById(hackathonId)
  if (!hackathon || !hackathon.challengeIds) return []

  const challenges = []
  for (const challengeId of hackathon.challengeIds) {
    const challenge = await getChallengeById(challengeId)
    if (challenge) challenges.push(challenge)
  }

  return challenges
}

// Get teams for a specific hackathon
export const getTeamsByHackathon = async (hackathonId: string) => {
  const querySnapshot = await getDocs(query(collection(db, "teams"), where("hackathonId", "==", hackathonId)))
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Team)
}

// Update team score and completed challenges
export const updateTeamProgress = async (teamId: string, challengeId: string, score: number) => {
  const teamRef = doc(db, "teams", teamId)
  const teamSnap = await getDoc(teamRef)

  if (teamSnap.exists()) {
    const team = teamSnap.data() as Team
    const completedChallenges = [...(team.completedChallenges || []), challengeId]
    const totalScore = (team.totalScore || 0) + score

    await updateDoc(teamRef, {
      completedChallenges,
      totalScore,
      flagSubmitted: true,
      buildathonUnlocked: true,
    })
  }
}

// Get leaderboard for hackathon
export const getHackathonLeaderboard = async (hackathonId: string) => {
  const teams = await getTeamsByHackathon(hackathonId)
  return teams.sort((a, b) => {
    // Sort by total score descending, then by completed challenges count, then by creation time
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    if (b.completedChallenges.length !== a.completedChallenges.length) {
      return b.completedChallenges.length - a.completedChallenges.length
    }
    return a.createdAt.toMillis() - b.createdAt.toMillis()
  })
}