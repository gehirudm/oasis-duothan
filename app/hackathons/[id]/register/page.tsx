"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus } from "lucide-react"
import { getDoc, doc } from "firebase/firestore"
import { db, createTeam, getUserTeam, type Hackathon, type TeamMember } from "@/lib/firestore"
import { toast } from "sonner"

export default function RegisterPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const hackathonId = params.id as string

  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [existingTeam, setExistingTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [teamName, setTeamName] = useState("")
  const [members, setMembers] = useState<TeamMember[]>([{ id: "", name: "", email: "", role: "" }])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hackathon details
        const hackathonDoc = await getDoc(doc(db, "hackathons", hackathonId))
        if (hackathonDoc.exists()) {
          setHackathon({ id: hackathonDoc.id, ...hackathonDoc.data() } as Hackathon)
        }

        // Check if user already has a team for this hackathon
        if (user) {
          const team = await getUserTeam(hackathonId, user.uid)
          setExistingTeam(team)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [hackathonId, user])

  const addMember = () => {
    if (members.length < (hackathon?.maxTeamSize || 4) - 1) {
      setMembers([...members, { id: "", name: "", email: "", role: "" }])
    }
  }

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const updatedMembers = [...members]
    updatedMembers[index] = { ...updatedMembers[index], [field]: value }
    setMembers(updatedMembers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !hackathon) return

    setSubmitting(true)
    try {
      const validMembers = members.filter((member) => member.name.trim() && member.email.trim())

      await createTeam({
        name: teamName,
        hackathonId,
        leaderId: user.uid,
        leaderName: user.displayName || "",
        leaderEmail: user.email || "",
        members: validMembers,
      })

      toast.success("Team registered successfully!")
      router.push("/hackathons")
    } catch (error) {
      console.error("Error creating team:", error)
      toast.error("Failed to register team. Please try again.")
    } finally {
      setSubmitting(false)
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

  if (!hackathon) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Hackathon Not Found</h3>
                <p className="text-gray-600">The hackathon you're looking for doesn't exist.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (existingTeam) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle>Already Registered</CardTitle>
                <CardDescription>You have already registered a team for this hackathon.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Team Name</Label>
                    <p className="font-semibold">{existingTeam.name}</p>
                  </div>
                  <div>
                    <Label>Team Members</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{existingTeam.leaderName} (Leader)</span>
                        <Badge>Leader</Badge>
                      </div>
                      {existingTeam.members.map((member, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>{member.name}</span>
                          <Badge variant="secondary">{member.role || "Member"}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>Register Team for {hackathon.title}</CardTitle>
              <CardDescription>Create your team and add members to participate in this hackathon.</CardDescription>
            </CardHeader>
            <CardContent>
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
                  <div className="flex items-center justify-between mb-3">
                    <Label>Team Members</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMember}
                      disabled={members.length >= hackathon.maxTeamSize - 1}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Member
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {members.map((member, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-md">
                        <Input
                          placeholder="Name"
                          value={member.name}
                          onChange={(e) => updateMember(index, "name", e.target.value)}
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={member.email}
                          onChange={(e) => updateMember(index, "email", e.target.value)}
                        />
                        <Input
                          placeholder="Role (optional)"
                          value={member.role}
                          onChange={(e) => updateMember(index, "role", e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMember(index)}
                          disabled={members.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-gray-600 mt-2">
                    Maximum team size: {hackathon.maxTeamSize} (including leader)
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Registering..." : "Register Team"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
