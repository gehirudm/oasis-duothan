"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Trophy, Users } from "lucide-react"
import { getUserProfile, updateUserProfile, getUserTeams, type UserProfile, type Team } from "@/lib/firestore"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    skills: "",
    github: "",
    linkedin: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Fetch user profile
        const userProfile = await getUserProfile(user.uid)
        if (userProfile) {
          setProfile(userProfile)
          setFormData({
            displayName: userProfile.displayName || "",
            bio: userProfile.bio || "",
            skills: userProfile.skills?.join(", ") || "",
            github: userProfile.github || "",
            linkedin: userProfile.linkedin || "",
          })
        } else {
          // Initialize with user data from auth
          setFormData({
            displayName: user.displayName || "",
            bio: "",
            skills: "",
            github: "",
            linkedin: "",
          })
        }

        // Fetch user teams
        const userTeams = await getUserTeams(user.uid)
        setTeams(userTeams)
      } catch (error) {
        console.error("Error fetching profile data:", error)
        toast.error("Failed to load profile data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      const profileData: Partial<UserProfile> = {
        displayName: formData.displayName,
        bio: formData.bio,
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        github: formData.github,
        linkedin: formData.linkedin,
      }

      await updateUserProfile(user.uid, profileData)
      toast.success("Profile updated successfully!")

      // Refresh profile data
      const updatedProfile = await getUserProfile(user.uid)
      setProfile(updatedProfile)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
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
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your profile information and view your hackathon history.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your profile details and skills.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                        <AvatarFallback className="text-lg">
                          {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{user?.displayName || "Anonymous User"}</h3>
                        <p className="text-gray-600">{user?.email}</p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Your display name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="skills">Skills</Label>
                      <Input
                        id="skills"
                        value={formData.skills}
                        onChange={(e) => setFormData((prev) => ({ ...prev, skills: e.target.value }))}
                        placeholder="JavaScript, React, Python, etc. (comma separated)"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="github">GitHub Username</Label>
                        <Input
                          id="github"
                          value={formData.github}
                          onChange={(e) => setFormData((prev) => ({ ...prev, github: e.target.value }))}
                          placeholder="your-github-username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn Profile</Label>
                        <Input
                          id="linkedin"
                          value={formData.linkedin}
                          onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value }))}
                          placeholder="linkedin.com/in/your-profile"
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Profile Summary & Teams */}
            <div className="space-y-6">
              {/* Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Profile Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Joined {profile?.createdAt?.toDate().toLocaleDateString() || "Recently"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Trophy className="h-4 w-4 mr-2" />
                    <span>
                      {teams.length} hackathon{teams.length !== 1 ? "s" : ""} participated
                    </span>
                  </div>

                  {profile?.skills && profile.skills.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Skills</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* My Teams */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    My Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teams.length === 0 ? (
                    <p className="text-gray-600 text-sm">No teams yet. Join a hackathon to get started!</p>
                  ) : (
                    <div className="space-y-3">
                      {teams.map((team) => (
                        <div key={team.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm">{team.name}</h4>
                            <Badge variant={team.leaderId === user?.uid ? "default" : "secondary"} className="text-xs">
                              {team.leaderId === user?.uid ? "Leader" : "Member"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            {team.members.length + 1} member{team.members.length !== 0 ? "s" : ""}
                          </p>
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
