import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle, XCircle } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function JoinTeamPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const teamId = params.id as string
  const secret = searchParams.get("secret")
  
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const verifyTeam = async () => {
      if (!teamId || !secret || !user) return

      try {
        const teamDoc = await getDoc(doc(db, "teams", teamId))
        
        if (!teamDoc.exists()) {
          setError("Team not found")
          return
        }
        
        const teamData = teamDoc.data()
        
        // Verify the secret matches
        if (teamData.secret !== secret) {
          setError("Invalid team invitation link")
          return
        }
        
        // Check if user is already a member
        const memberDoc = await getDoc(doc(db, "teams", teamId, "members", user.uid))
        if (memberDoc.exists()) {
          setError("You are already a member of this team")
          return
        }
        
        setTeam(teamData)
      } catch (error) {
        console.error("Error verifying team:", error)
        setError("Failed to verify team invitation")
      } finally {
        setLoading(false)
      }
    }

    verifyTeam()
  }, [teamId, secret, user])

  const handleJoinTeam = async () => {
    if (!user || !team) return
    
    setJoining(true)
    try {
      // Add user to team members collection
      await setDoc(doc(db, "teams", teamId, "members", user.uid), {
        userId: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        role: "member",
        joinedAt: serverTimestamp()
      })
      
      // Update the team document
      await updateDoc(doc(db, "teams", teamId), {
        updatedAt: serverTimestamp()
      })
      
      setSuccess(true)
      toast.success("You have successfully joined the team!")
    } catch (error) {
      console.error("Error joining team:", error)
      toast.error("Failed to join team. Please try again.")
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>Join Team</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800 font-medium">{error}</span>
                  </div>
                  <Button onClick={() => router.push("/teams")} className="w-full">
                    View Available Teams
                  </Button>
                </div>
              ) : success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      You have successfully joined the team!
                    </span>
                  </div>
                  <Button onClick={() => router.push(`/teams/${teamId}`)} className="w-full">
                    Go to Team Page
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-blue-800 font-medium mb-2">Team Invitation</h3>
                    <p className="text-blue-700">
                      You've been invited to join <span className="font-semibold">{team?.name}</span>
                    </p>
                    <p className="text-blue-700 text-sm mt-2">
                      Team Leader: {team?.leaderName}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleJoinTeam} 
                    className="w-full" 
                    disabled={joining}
                  >
                    {joining ? "Joining..." : "Join Team"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}