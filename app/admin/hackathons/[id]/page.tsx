"use client"

import { Label } from "@/components/ui/label"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy, Users, Calendar, Settings, Medal, Flag, Code, Crown, ExternalLink } from "lucide-react"
import {
  getHackathonById,
  getHackathonLeaderboard,
  getHackathonChallenges,
  type Hackathon,
  type Team,
  type Challenge,
} from "@/lib/firestore"
import Link from "next/link"

export default function HackathonOverviewPage() {
  const params = useParams()
  const hackathonId = params.id as string

  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [leaderboard, setLeaderboard] = useState<Team[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hackathonData, leaderboardData, challengesData] = await Promise.all([
          getHackathonById(hackathonId),
          getHackathonLeaderboard(hackathonId),
          getHackathonChallenges(hackathonId),
        ])

        setHackathon(hackathonData)
        setLeaderboard(leaderboardData)
        setChallenges(challengesData)
      } catch (error) {
        console.error("Error fetching hackathon overview:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [hackathonId])

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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500">1st Place</Badge>
      case 2:
        return <Badge className="bg-gray-400">2nd Place</Badge>
      case 3:
        return <Badge className="bg-amber-600">3rd Place</Badge>
      default:
        return <Badge variant="outline">#{rank}</Badge>
    }
  }

  return (
    <AuthGuard adminOnly>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{hackathon.title}</h1>
                <Badge variant={hackathon.isActive ? "default" : "secondary"}>
                  {hackathon.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-gray-600">{hackathon.description}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/hackathons/${hackathonId}/manage`}>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </Link>
              <Link href={`/admin/hackathons/${hackathonId}/teams`}>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Teams
                </Button>
              </Link>
            </div>
          </div>

          
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaderboard.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{challenges.filter((c) => c.isActive).length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flags Submitted</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaderboard.filter((t) => t.flagSubmitted).length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buildathon Unlocked</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaderboard.filter((t) => t.buildathonUnlocked).length}</div>
              </CardContent>
            </Card>
          </div>

          
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Event Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Registration Deadline</Label>
                  <p className="text-sm text-gray-600">
                    {hackathon.registrationDeadline.toDate().toLocaleDateString()} at{" "}
                    {hackathon.registrationDeadline.toDate().toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <p className="text-sm text-gray-600">
                    {hackathon.startDate.toDate().toLocaleDateString()} at{" "}
                    {hackathon.startDate.toDate().toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <p className="text-sm text-gray-600">
                    {hackathon.endDate.toDate().toLocaleDateString()} at{" "}
                    {hackathon.endDate.toDate().toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Maximum Team Size</Label>
                  <p className="text-sm text-gray-600">{hackathon.maxTeamSize} members</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant={hackathon.isActive ? "default" : "secondary"}>
                      {hackathon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-gray-600">{hackathon.createdAt.toDate().toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Challenges Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Total Challenges</Label>
                  <p className="text-sm text-gray-600">{challenges.length}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Active Challenges</Label>
                  <p className="text-sm text-gray-600">{challenges.filter((c) => c.isActive).length}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Completion Rate</Label>
                  <p className="text-sm text-gray-600">
                    {leaderboard.length > 0
                      ? Math.round((leaderboard.filter((t) => t.flagSubmitted).length / leaderboard.length) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          
          <Tabs defaultValue="leaderboard" className="space-y-6">
            <TabsList>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Team Leaderboard
                  </CardTitle>
                  <CardDescription>Teams ranked by total score and challenge completion</CardDescription>
                </CardHeader>
                <CardContent>
                  {leaderboard.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No teams registered yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {leaderboard.map((team, index) => (
                        <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                              {getRankIcon(index + 1)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{team.name}</h4>
                                {getRankBadge(index + 1)}
                              </div>
                              <p className="text-sm text-gray-600">
                                Led by {team.leaderName} • {team.members.length + 1} members
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1 text-sm">
                                  <Trophy className="h-3 w-3" />
                                  <span>{team.totalScore || 0} points</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <Flag className="h-3 w-3" />
                                  <span>{team.completedChallenges?.length || 0} challenges</span>
                                </div>
                                {team.buildathonUnlocked && (
                                  <Badge variant="outline" className="text-green-600">
                                    <Code className="h-3 w-3 mr-1" />
                                    Buildathon Unlocked
                                  </Badge>
                                )}
                                {team.githubLink && (
                                  <Badge variant="outline" className="text-blue-600">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Submitted
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Registered {team.createdAt.toDate().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="challenges">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Hackathon Challenges
                  </CardTitle>
                  <CardDescription>Challenges assigned to this hackathon</CardDescription>
                </CardHeader>
                <CardContent>
                  {challenges.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">No challenges assigned to this hackathon yet.</p>
                      <Link href={`/admin/hackathons/${hackathonId}/manage`}>
                        <Button>Add Challenges</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {challenges.map((challenge) => (
                        <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                              <CardTitle className="text-lg">{challenge.title}</CardTitle>
                              <Badge variant={challenge.isActive ? "default" : "secondary"}>
                                {challenge.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <CardDescription className="line-clamp-3">{challenge.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">
                                Created {challenge.createdAt.toDate().toLocaleDateString()}
                              </div>
                              <Link href={`/challenges/${challenge.id}`}>
                                <Button size="sm" variant="outline">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}