"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Code, Flag, ExternalLink } from "lucide-react"
import { getActiveChallenges, getUserTeams, type Challenge, type Team } from "@/lib/firestore"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const [challengeData, teamData] = await Promise.all([getActiveChallenges(), getUserTeams(user.uid)])

        setChallenges(challengeData)
        setTeams(teamData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your challenges and teams.</p>
          </div>

          
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{challenges.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teams.length}</div>
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
                <CardTitle className="text-sm font-medium">Buildathon Unlocked</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teams.filter((t) => t.buildathonUnlocked).length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Active Challenges
                </CardTitle>
                <CardDescription>Solve algorithmic challenges to unlock buildathon tasks.</CardDescription>
              </CardHeader>
              <CardContent>
                {challenges.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No active challenges at the moment.</p>
                ) : (
                  <div className="space-y-4">
                    {challenges.slice(0, 3).map((challenge) => (
                      <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{challenge.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{challenge.description}</p>
                        </div>
                        <Link href={`/challenges/${challenge.id}`}>
                          <Button size="sm">
                            <Code className="h-4 w-4 mr-1" />
                            Solve
                          </Button>
                        </Link>
                      </div>
                    ))}
                    {challenges.length > 3 && (
                      <Link href="/challenges">
                        <Button variant="outline" className="w-full bg-transparent">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View All Challenges
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

           
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  My Teams
                </CardTitle>
                <CardDescription>Teams you're leading or participating in.</CardDescription>
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">You haven't joined any teams yet.</p>
                    <Link href="/teams/create">
                      <Button>Create Team</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teams.slice(0, 3).map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{team.name}</h4>
                            <Badge variant={team.leaderId === user?.uid ? "default" : "secondary"}>
                              {team.leaderId === user?.uid ? "Leader" : "Member"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{team.members.length + 1} members</span>
                            {team.flagSubmitted && (
                              <Badge variant="outline" className="text-green-600">
                                <Flag className="h-3 w-3 mr-1" />
                                Flag Submitted
                              </Badge>
                            )}
                            {team.buildathonUnlocked && (
                              <Badge variant="outline" className="text-blue-600">
                                <Code className="h-3 w-3 mr-1" />
                                Buildathon Unlocked
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Link href={`/teams/${team.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                    {teams.length > 3 && (
                      <Link href="/teams">
                        <Button variant="outline" className="w-full bg-transparent">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View All Teams
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
