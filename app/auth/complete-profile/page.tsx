"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, User } from "lucide-react"
import { getUserProfile, updateUserProfile, checkUsernameAvailability, type UserProfile } from "@/lib/firestore"
import { toast } from "sonner"

export default function CompleteProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    bio: "",
    skills: "",
    github: "",
    linkedin: "",
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const userProfile = await getUserProfile(user.uid)
        if (userProfile) {
          setProfile(userProfile)
          if (userProfile.profileCompleted) {
            router.push("/dashboard")
            return
          }
          setFormData({
            username: userProfile.username || "",
            displayName: userProfile.displayName || user.displayName || "",
            bio: userProfile.bio || "",
            skills: userProfile.skills?.join(", ") || "",
            github: userProfile.github || "",
            linkedin: userProfile.linkedin || "",
          })
        } else {
          setFormData((prev) => ({
            ...prev,
            displayName: user.displayName || "",
          }))
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      }
    }

    if (user && !loading) {
      fetchProfile()
    }
  }, [user, loading, router])

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    try {
      const available = await checkUsernameAvailability(username, user?.uid)
      setUsernameAvailable(available)
    } catch (error) {
      console.error("Error checking username:", error)
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleUsernameChange = (value: string) => {
    
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, "")
    setFormData((prev) => ({ ...prev, username: sanitized }))

    
    const timeoutId = setTimeout(() => checkUsername(sanitized), 500)
    return () => clearTimeout(timeoutId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.username || formData.username.length < 3) {
      toast.error("Username must be at least 3 characters long")
      return
    }

    if (usernameAvailable === false) {
      toast.error("Username is not available")
      return
    }

    setSaving(true)
    try {
      const profileData: Partial<UserProfile> = {
        username: formData.username,
        displayName: formData.displayName,
        email: user.email!,
        bio: formData.bio,
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        github: formData.github,
        linkedin: formData.linkedin,
        profileCompleted: true,
      }

      await updateUserProfile(user.uid, profileData)
      toast.success("Profile completed successfully!")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to complete profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/auth/signin")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                <AvatarFallback className="text-lg">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>Set up your profile to start participating in challenges and join teams</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username">Username *</Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="your_username"
                    required
                    minLength={3}
                    className="pr-10"
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                  {!checkingUsername && usernameAvailable === true && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {!checkingUsername && usernameAvailable === false && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                {usernameAvailable === false && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>This username is already taken</AlertDescription>
                  </Alert>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  Username must be at least 3 characters (letters, numbers, and underscores only)
                </p>
              </div>

              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Your display name"
                  required
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
                  placeholder="JavaScript, Python, React, etc. (comma separated)"
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

              <Button
                type="submit"
                className="w-full"
                disabled={saving || usernameAvailable === false || !formData.username || !formData.displayName}
              >
                {saving ? "Completing Profile..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
