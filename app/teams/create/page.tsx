"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Copy, Plus, Trash2, Users } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { v4 as uuidv4 } from "uuid"

export default function CreateTeamPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [teamName, setTeamName] = useState("")
  const [members, setMembers] = useState<string[]>([])
  const [memberInput, setMemberInput] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createdTeam, setCreatedTeam] = useState<{id: string, secret: string} | null>(null)
  const [joinUrl, setJoinUrl] = useState("")

  const addMember = () => {
    if (!memberInput.trim()) return
    
    if (!members.includes(memberInput.trim())) {
      setMembers([...members, memberInput.trim()])
      setMemberInput("")
    } else {
      toast.error("This username is already added")
    }
  }

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!teamName.trim()) {
      toast.error("Please enter a team name")
      return
    }

    setIsCreating(true)
    try {
      // Generate a unique secret for team invitations
      const teamSecret = uuidv4()
      
      // Create the team document
      const teamRef = await addDoc(collection(db, "teams"), {
        name: teamName.trim(),
        leaderId: user.uid,
        leaderName: user.displayName || "",
        leaderEmail: user.email || "",
        members: [], // Will be populated when members join
        invitedMembers: members,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        secret: teamSecret
      })

      // Add the current user to the team members collection
      await setDoc(doc(db, "teams", teamRef.id, "members", user.uid), {
        userId: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        role: "leader",
        joinedAt: serverTimestamp()
      })

      // Generate join URL
      const baseUrl = window.location.origin
      const generatedJoinUrl = `${baseUrl}/teams/${teamRef.id}/join?secret=${teamSecret}`
      
      setCreatedTeam({
        id: teamRef.id,
        secret: teamSecret
      })
      setJoinUrl(generatedJoinUrl)
      
      toast.success("Team created successfully!")
    } catch (error) {
      console.error("Error creating team:", error)
      toast.error("Failed to create team. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const copyJoinUrl = () => {
    navigator.clipboard.writeText(joinUrl)
    toast.success("Join URL copied to clipboard!")
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Create a New Team
              </CardTitle>
              <CardDescription>
                Create your team and invite members to join your hackathon adventures
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!createdTeam ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="teamName">Team Name *</Label>
                    <Input
                      id="teamName"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter your team name"
                      required
                    />
                  </div>

                  <div>
                    <Label>Team Leader (You)</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="font-semibold">{user?.displayName}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="members">Invite Members (Optional)</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        id="members"
                        value={memberInput}
                        onChange={(e) => setMemberInput(e.target.value)}
                        placeholder="Enter username"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addMember()
                          }
                        }}
                      />
                      <Button type="button" onClick={addMember} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Enter usernames of people you want to invite to your team
                    </p>

                    {members.length > 0 && (
                      <div className="space-y-2">
                        {members.map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>{member}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(index)}
                            >
                              <Trash2 className="h-4 w-4 text-gray-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isCreating}>
                    {isCreating ? "Creating Team..." : "Create Team"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-green-800 font-medium mb-2">Team Created Successfully!</h3>
                    <p className="text-green-700 text-sm">
                      Your team has been created. Share the join URL with your team members so they can join.
                    </p>
                  </div>

                  <div>
                    <Label>Team Join URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={joinUrl} readOnly className="font-mono text-sm" />
                      <Button type="button" onClick={copyJoinUrl} variant="outline">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      This URL contains a secret key that allows others to join your team. 
                      Share it only with people you want in your team.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={() => router.push(`/teams/${createdTeam.id}`)} 
                      className="flex-1"
                    >
                      Go to Team Page
                    </Button>
                    <Button 
                      onClick={() => router.push("/teams")} 
                      variant="outline" 
                      className="flex-1"
                    >
                      View All Teams
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}