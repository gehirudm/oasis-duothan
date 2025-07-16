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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Crown, Mail, UserPlus, UserMinus, ArrowLeft, Send } from "lucide-react"
import {
  getTeamById,
  inviteTeamMember,
  removeTeamMember,
  leaveTeam,
  getHackathonById,
  type Team,
  type Hackathon,
} from "@/lib/firestore"
import { toast } from "sonner"
import Link from "next/link"

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("")
  const [inviting, setInviting] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const isLeader = team?.leaderId === user?.uid
  const isMember = team?.members.some((member) => member.email === user?.email) || isLeader

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamData = await getTeamById(teamId)
        if (teamData) {
          setTeam(teamData)

          // Fetch hackathon details
          const hackathonData = await getHackathonById(teamData.hackathonId)
          setHackathon(hackathonData)
        }
      } catch (error) {
        console.error("Error fetching team data:", error)
        toast.error("Failed to load team data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [teamId])

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!team || !user || !hackathon) return

    setInviting(true)
    try {
      await inviteTeamMember({
        teamId: team.id!,
        teamName: team.name,
        hackathonId: team.hackathonId,
        hackathonTitle: hackathon.title,
        inviterName: user.displayName || "",
        inviterEmail: user.email!,
        inviteeEmail: inviteEmail,
        role: inviteRole,
      })

      toast.success("Invitation sent successfully!")
      setInviteEmail("")
      setInviteRole("")
    } catch (error) {
      console.error("Error inviting member:", error)
      toast.error("Failed to send invitation")
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberEmail: string) => {
    if (!team) return

    setRemoving(memberEmail)
    try {
      await removeTeamMember(team.id!, memberEmail)
      toast.success("Member removed successfully!")

      // Refresh team data
      const updatedTeam = await getTeamById(teamId)
      setTeam(updatedTeam)
    } catch (error) {
      console.error("Error removing member:", error)
      toast.error("Failed to remove member")
    } finally {
      setRemoving(null)
    }
  }

  const handleLeaveTeam = async () => {
    if (!team || !user) return

    try {
      await leaveTeam(team.id!, user.email!)
      toast.success("Left team successfully!")
      router.push("/teams")
    } catch (error) {
      console.error("Error leaving team:", error)
      toast.error("Failed to leave team")
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

  if (!team) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Team Not Found</h3>
                <p className="text-gray-600 mb-4">The team you're looking for doesn't exist.</p>
                <Link href="/teams">
                  <Button>Back to Teams</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!isMember) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-gray-600 mb-4">You don't have permission to view this team.</p>
                <Link href="/teams">
                  <Button>Back to Teams</Button>
                </Link>
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
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/teams">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Teams
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600">
                {hackathon?.title} • Created {team.createdAt.toDate().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Team Members */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members ({team.members.length + 1})</CardTitle>
                  <CardDescription>Manage your team composition and roles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Team Leader */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold flex items-center">
                        <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                        Team Leader
                      </h4>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg" alt={team.leaderName} />
                          <AvatarFallback>{team.leaderName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{team.leaderName}</p>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {team.leaderEmail}
                          </div>
                        </div>
                      </div>
                      <Badge>Leader</Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Team Members */}
                  <div>
                    <h4 className="font-semibold mb-4">Members</h4>
                    {team.members.length === 0 ? (
                      <p className="text-gray-600 text-center py-8">
                        No team members yet. Invite some members to get started!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {team.members.map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {member.email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {member.role && <Badge variant="outline">{member.role}</Badge>}
                              {isLeader && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveMember(member.email)}
                                  disabled={removing === member.email}
                                >
                                  <UserMinus className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Actions */}
            <div className="space-y-6">
              {/* Invite Member (Leader Only) */}
              {isLeader && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </CardTitle>
                    <CardDescription>Add new members to your team.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInviteMember} className="space-y-4">
                      <div>
                        <Label htmlFor="inviteEmail">Email Address</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="member@example.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="inviteRole">Role (Optional)</Label>
                        <Input
                          id="inviteRole"
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          placeholder="Developer, Designer, etc."
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={inviting}>
                        <Send className="h-4 w-4 mr-2" />
                        {inviting ? "Sending..." : "Send Invitation"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Team Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Hackathon</Label>
                    <p className="text-sm text-gray-600">{hackathon?.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Team Size</Label>
                    <p className="text-sm text-gray-600">
                      {team.members.length + 1} / {hackathon?.maxTeamSize} members
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-gray-600">{team.createdAt.toDate().toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Team (Non-leaders only) */}
              {!isLeader && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>Leave this team permanently.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" onClick={handleLeaveTeam} className="w-full">
                      Leave Team
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
