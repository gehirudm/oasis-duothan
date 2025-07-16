"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, Settings, Trophy, Calendar, Users, Save } from "lucide-react"
import {
  getHackathonById,
  updateHackathon,
  getChallenges,
  getHackathonChallenges,
  addChallengeToHackathon,
  removeChallengeFromHackathon,
  getTeamsByHackathon,
  type Hackathon,
  type Challenge,
  type Team,
} from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"
import { toast } from "sonner"
import Link from "next/link"

export default function ManageHackathonPage() {
  const params = useParams()
  const router = useRouter()
  const hackathonId = params.id as string

  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([])
  const [hackathonChallenges, setHackathonChallenges] = useState<Challenge[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxTeamSize: 4,
    isActive: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hackathonData, challengesData, teamsData] = await Promise.all([
          getHackathonById(hackathonId),
          getChallenges(),
          getTeamsByHackathon(hackathonId),
        ])

        if (hackathonData) {
          setHackathon(hackathonData)
          setFormData({
            title: hackathonData.title,
            description: hackathonData.description,
            startDate: hackathonData.startDate.toDate().toISOString().slice(0, 16),
            endDate: hackathonData.endDate.toDate().toISOString().slice(0, 16),
            registrationDeadline: hackathonData.registrationDeadline.toDate().toISOString().slice(0, 16),
            maxTeamSize: hackathonData.maxTeamSize,
            isActive: hackathonData.isActive,
          })

          // Get hackathon-specific challenges
          const hackathonChallengesData = await getHackathonChallenges(hackathonId)
          setHackathonChallenges(hackathonChallengesData)
        }

        setAllChallenges(challengesData)
        setTeams(teamsData)
      } catch (error) {
        console.error("Error fetching hackathon data:", error)
        toast.error("Failed to load hackathon data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [hackathonId])

  const handleUpdateHackathon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hackathon) return

    setSaving(true)
    try {
      const updates: Partial<Hackathon> = {
        title: formData.title,
        description: formData.description,
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate)),
        registrationDeadline: Timestamp.fromDate(new Date(formData.registrationDeadline)),
        maxTeamSize: formData.maxTeamSize,
        isActive: formData.isActive,
      }

      await updateHackathon(hackathon.id!, updates)
      toast.success("Hackathon updated successfully!")

      // Refresh hackathon data
      const updatedHackathon = await getHackathonById(hackathonId)
      setHackathon(updatedHackathon)
    } catch (error) {
      console.error("Error updating hackathon:", error)
      toast.error("Failed to update hackathon")
    } finally {
      setSaving(false)
    }
  }

  const handleAddChallenge = async (challengeId: string) => {
    try {
      await addChallengeToHackathon(hackathonId, challengeId)
      toast.success("Challenge added to hackathon!")

      // Refresh challenges
      const updatedChallenges = await getHackathonChallenges(hackathonId)
      setHackathonChallenges(updatedChallenges)
    } catch (error) {
      console.error("Error adding challenge:", error)
      toast.error("Failed to add challenge")
    }
  }

  const handleRemoveChallenge = async (challengeId: string) => {
    try {
      await removeChallengeFromHackathon(hackathonId, challengeId)
      toast.success("Challenge removed from hackathon!")

      // Refresh challenges
      const updatedChallenges = await getHackathonChallenges(hackathonId)
      setHackathonChallenges(updatedChallenges)
    } catch (error) {
      console.error("Error removing challenge:", error)
      toast.error("Failed to remove challenge")
    }
  }

  const availableChallenges = allChallenges.filter(
    (challenge) => !hackathonChallenges.some((hc) => hc.id === challenge.id),
  )

  if (loading) {
    return (
      <AuthGuard adminOnly>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    )
  }

  if (!hackathon) {
    return (
      <AuthGuard adminOnly>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Hackathon Not Found</h3>
                <p className="text-gray-600 mb-4">The hackathon you're looking for doesn't exist.</p>
                <Link href="/admin">
                  <Button>Back to Admin Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard adminOnly>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Hackathon</h1>
              <p className="text-gray-600">{hackathon.title}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registered Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teams.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Challenges</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hackathonChallenges.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant={hackathon.isActive ? "default" : "secondary"}>
                  {hackathon.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Team Size</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hackathon.maxTeamSize}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Hackathon Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Hackathon Details
                  </CardTitle>
                  <CardDescription>Update hackathon information and settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateHackathon} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                          id="startDate"
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date *</Label>
                        <Input
                          id="endDate"
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="registrationDeadline">Registration Deadline *</Label>
                      <Input
                        id="registrationDeadline"
                        type="datetime-local"
                        value={formData.registrationDeadline}
                        onChange={(e) => setFormData((prev) => ({ ...prev, registrationDeadline: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxTeamSize">Maximum Team Size</Label>
                      <Input
                        id="maxTeamSize"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.maxTeamSize}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, maxTeamSize: Number.parseInt(e.target.value) }))
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>

                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/admin/hackathons/${hackathonId}`}>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Trophy className="h-4 w-4 mr-2" />
                      View Hackathon Overview
                    </Button>
                  </Link>
                  <Link href={`/admin/hackathons/${hackathonId}/teams`}>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Teams
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Challenge Management */}
            <div className="space-y-6">
              {/* Assigned Challenges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Assigned Challenges ({hackathonChallenges.length})
                  </CardTitle>
                  <CardDescription>Challenges currently assigned to this hackathon</CardDescription>
                </CardHeader>
                <CardContent>
                  {hackathonChallenges.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No challenges assigned yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {hackathonChallenges.map((challenge) => (
                        <div key={challenge.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{challenge.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">{challenge.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={challenge.isActive ? "default" : "secondary"}>
                                {challenge.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleRemoveChallenge(challenge.id!)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Challenges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    Available Challenges ({availableChallenges.length})
                  </CardTitle>
                  <CardDescription>Add challenges to this hackathon</CardDescription>
                </CardHeader>
                <CardContent>
                  {availableChallenges.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      All available challenges have been assigned to this hackathon.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {availableChallenges.map((challenge) => (
                        <div key={challenge.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{challenge.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">{challenge.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={challenge.isActive ? "default" : "secondary"}>
                                {challenge.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleAddChallenge(challenge.id!)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}