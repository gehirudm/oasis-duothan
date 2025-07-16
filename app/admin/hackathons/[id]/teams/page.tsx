"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Users, Search, Crown, Mail, Flag, Code, ExternalLink, Calendar, Trophy } from "lucide-react"
import { getHackathonById, getTeamsByHackathon, type Hackathon, type Team } from "@/lib/firestore"
import Link from "next/link"

export default function HackathonTeamsPage() {
  const params = useParams()
  const hackathonId = params.id as string

  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hackathonData, teamsData] = await Promise.all([
          getHackathonById(hackathonId),
          getTeamsByHackathon(hackathonId),
        ])

        setHackathon(hackathonData)
        setTeams(teamsData)
        setFilteredTeams(teamsData)
      } catch (error) {
        console.error("Error fetching teams data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [hackathonId])

  useEffect(() => {
    if (!searchQuery) {
      setFilteredTeams(teams)
    } else {
      const filtered = teams.filter(
        (team) =>
          team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.leaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.leaderEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.members.some(
            (member) =>
              member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              member.email.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
      setFilteredTeams(filtered)
    }
  }, [searchQuery, teams])

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
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/admin/hackathons/${hackathonId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Overview
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Registered Teams</h1>
              <p className="text-gray-600">{hackathon.title}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/hackathons/${hackathonId}/manage`}>
                <Button variant="outline">Manage Hackathon</Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teams.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teams.reduce((total, team) => total + team.members.length + 1, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flags Submitted</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teams.filter((t) => t.flagSubmitted).length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buildathon Submissions</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teams.filter((t) => t.githubLink).length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Teams List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    All Teams ({filteredTeams.length})
                  </CardTitle>
                  <CardDescription>Complete list of registered teams and their members</CardDescription>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search teams, leaders, or members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTeams.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? "No teams found" : "No teams registered"}
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Teams will appear here once they register for the hackathon"}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredTeams.map((team) => (
                    <Card key={team.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl">{team.name}</CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Registered {team.createdAt.toDate().toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {team.members.length + 1} member{team.members.length !== 0 ? "s" : ""}
                              </span>
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {team.totalScore > 0 && (
                              <Badge variant="outline" className="text-blue-600">
                                <Trophy className="h-3 w-3 mr-1" />
                                {team.totalScore} points
                              </Badge>
                            )}
                            {team.flagSubmitted && (
                              <Badge variant="outline" className="text-green-600">
                                <Flag className="h-3 w-3 mr-1" />
                                Flag Submitted
                              </Badge>
                            )}
                            {team.buildathonUnlocked && (
                              <Badge variant="outline" className="text-purple-600">
                                <Code className="h-3 w-3 mr-1" />
                                Buildathon Unlocked
                              </Badge>
                            )}
                            {team.githubLink && (
                              <Badge variant="outline" className="text-orange-600">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Submitted
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Team Leader */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center">
                              <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                              Team Leader
                            </h4>
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

                          {/* Team Members */}
                          {team.members.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3">Team Members ({team.members.length})</h4>
                              <div className="grid md:grid-cols-2 gap-3">
                                {team.members.map((member, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-sm">{member.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-sm">{member.name}</p>
                                        <div className="flex items-center text-xs text-gray-600">
                                          <Mail className="h-3 w-3 mr-1" />
                                          {member.email}
                                        </div>
                                      </div>
                                    </div>
                                    {member.role && (
                                      <Badge variant="outline" className="text-xs">
                                        {member.role}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* GitHub Submission */}
                          {team.githubLink && (
                            <div>
                              <h4 className="font-semibold mb-3">Buildathon Submission</h4>
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <ExternalLink className="h-4 w-4 mr-2 text-blue-600" />
                                    <span className="text-sm font-medium">GitHub Repository</span>
                                  </div>
                                  <a
                                    href={team.githubLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    View Repository →
                                  </a>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 break-all">{team.githubLink}</p>
                              </div>
                            </div>
                          )}

                          {/* Progress Summary */}
                          <div className="pt-4 border-t">
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Challenges Completed:</span>
                                <span className="ml-2">{team.completedChallenges?.length || 0}</span>
                              </div>
                              <div>
                                <span className="font-medium">Total Score:</span>
                                <span className="ml-2">{team.totalScore || 0} points</span>
                              </div>
                              <div>
                                <span className="font-medium">Status:</span>
                                <span className="ml-2">
                                  {team.githubLink
                                    ? "Submitted"
                                    : team.buildathonUnlocked
                                      ? "Buildathon Phase"
                                      : team.flagSubmitted
                                        ? "Flag Submitted"
                                        : "In Progress"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}