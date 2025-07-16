"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Crown, Mail, Calendar, ExternalLink, Plus, Eye } from "lucide-react"
import {
  getUserTeams,
  getTeamInvitations,
  acceptTeamInvitation,
  declineTeamInvitation,
  type Team,
  type TeamInvitation,
} from "@/lib/firestore"
import { toast } from "sonner"
import Link from "next/link"

export default function TeamsPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processingInvite, setProcessingInvite] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const [userTeams, userInvitations] = await Promise.all([
          getUserTeams(user.uid),
          getTeamInvitations(user.email!),
        ])

        setTeams(userTeams)
        setInvitations(userInvitations)
      } catch (error) {
        console.error("Error fetching teams data:", error)
        toast.error("Failed to load teams data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user) return

    setProcessingInvite(invitationId)
    try {
      await acceptTeamInvitation(invitationId, user.uid, user.displayName || "", user.email!)
      toast.success("Invitation accepted successfully!")

      // Refresh data
      const [userTeams, userInvitations] = await Promise.all([getUserTeams(user.uid), getTeamInvitations(user.email!)])
      setTeams(userTeams)
      setInvitations(userInvitations)
    } catch (error) {
      console.error("Error accepting invitation:", error)
      toast.error("Failed to accept invitation")
    } finally {
      setProcessingInvite(null)
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    setProcessingInvite(invitationId)
    try {
      await declineTeamInvitation(invitationId)
      toast.success("Invitation declined")

      // Refresh invitations
      const userInvitations = await getTeamInvitations(user?.email!)
      setInvitations(userInvitations)
    } catch (error) {
      console.error("Error declining invitation:", error)
      toast.error("Failed to decline invitation")
    } finally {
      setProcessingInvite(null)
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Teams</h1>
              <p className="text-gray-600">Manage your hackathon teams and invitations.</p>
            </div>
            <Link href="/teams/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </Link>
          </div>

          {/* Team Invitations */}
          {invitations.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Team Invitations ({invitations.length})
                </CardTitle>
                <CardDescription>You have pending team invitations.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-blue-50"
                    >
                      <div>
                        <h4 className="font-semibold">{invitation.teamName}</h4>
                        <p className="text-sm text-gray-600">
                          Invited by {invitation.inviterName} • {invitation.hackathonTitle || "Hackathon"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Invited {invitation.createdAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(invitation.id!)}
                          disabled={processingInvite === invitation.id}
                        >
                          {processingInvite === invitation.id ? "Accepting..." : "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineInvitation(invitation.id!)}
                          disabled={processingInvite === invitation.id}
                        >
                          {processingInvite === invitation.id ? "Declining..." : "Decline"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* My Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                My Teams ({teams.length})
              </CardTitle>
              <CardDescription>Teams you're leading or participating in.</CardDescription>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
                  <p className="text-gray-600 mb-4">Join a hackathon to create or join a team.</p>
                  <div className="flex justify-center gap-4">
                    <Link href="/hackathons">
                      <Button>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Browse Hackathons
                      </Button>
                    </Link>
                    <Link href="/teams/create">
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Team
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {teams.map((team) => (
                    <Card key={team.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <Badge variant={team.leaderId === user?.uid ? "default" : "secondary"}>
                            {team.leaderId === user?.uid ? "Leader" : "Member"}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Created {team.createdAt.toDate().toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Team Leader */}
                          <div>
                            <h4 className="font-semibold text-sm mb-2 flex items-center">
                              <Crown className="h-4 w-4 mr-1 text-yellow-500" />
                              Team Leader
                            </h4>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="/placeholder.svg" alt={team.leaderName} />
                                <AvatarFallback className="text-xs">{team.leaderName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{team.leaderName}</p>
                                <p className="text-xs text-gray-600">{team.leaderEmail}</p>
                              </div>
                            </div>
                          </div>

                          {/* Team Members */}
                          {team.members.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Team Members ({team.members.length})</h4>
                              <div className="space-y-2">
                                {team.members.slice(0, 3).map((member, index) => (
                                  <div key={index} className="flex items-center space-x-3">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm">{member.name}</p>
                                      {member.role && (
                                        <Badge variant="outline" className="text-xs">
                                          {member.role}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {team.members.length > 3 && (
                                  <p className="text-xs text-gray-600">
                                    +{team.members.length - 3} more member{team.members.length - 3 !== 1 ? "s" : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-600">Total members: {team.members.length + 1}</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Link href={`/teams/${team.id}`} className="w-full">
                          <Button variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View Team
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            {teams.length > 0 && (
              <CardFooter className="flex justify-center pt-4 pb-6">
                <Link href="/teams/create">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Another Team
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}