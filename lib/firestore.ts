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
} from "firebase/firestore"
import { db } from "./firebase"

export interface Hackathon {
  id?: string
  title: string
  description: string
  startDate: Timestamp
  endDate: Timestamp
  registrationDeadline: Timestamp
  maxTeamSize: number
  isActive: boolean
  createdAt: Timestamp
}

export interface Team {
  id?: string
  name: string
  hackathonId: string
  leaderId: string
  leaderName: string
  leaderEmail: string
  members: TeamMember[]
  createdAt: Timestamp
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

// Hackathon operations
export const createHackathon = async (hackathon: Omit<Hackathon, "id" | "createdAt">) => {
  const docRef = await addDoc(collection(db, "hackathons"), {
    ...hackathon,
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

export const updateHackathon = async (id: string, updates: Partial<Hackathon>) => {
  await updateDoc(doc(db, "hackathons", id), updates)
}

export const deleteHackathon = async (id: string) => {
  await deleteDoc(doc(db, "hackathons", id))
}

// Team operations
export const createTeam = async (team: Omit<Team, "id" | "createdAt">) => {
  const docRef = await addDoc(collection(db, "teams"), {
    ...team,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export const getTeamsByHackathon = async (hackathonId: string) => {
  const querySnapshot = await getDocs(query(collection(db, "teams"), where("hackathonId", "==", hackathonId)))
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Team)
}

export const getUserTeam = async (hackathonId: string, userId: string) => {
  const querySnapshot = await getDocs(
    query(collection(db, "teams"), where("hackathonId", "==", hackathonId), where("leaderId", "==", userId)),
  )
  return querySnapshot.docs.length > 0
    ? ({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Team)
    : null
}
