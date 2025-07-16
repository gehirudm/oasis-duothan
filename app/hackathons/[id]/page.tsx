import { getHackathonById, getHackathonChallenges, getHackathonLeaderboard } from "@/lib/firestore"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, Trophy, Users, Clock, Flag, Code } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface HackathonPageProps {
  params: {
    id: string
  }
}

export default async function HackathonDetailsPage({ params }: HackathonPageProps) {
  const hackathon = await getHackathonById(params.id)

  if (!hackathon) {
    notFound()
  }

  // Fetch challenges and leaderboard data
  const challenges = await getHackathonChallenges(params.id)
  const leaderboard = await getHackathonLeaderboard(params.id)

  // Sort leaderboard by total score (descending)
  const sortedLeaderboard = [...leaderboard].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))

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

  const isRegistrationOpen = new Date() < hackathon.registrationDeadline.toDate()
  const isHackathonActive = 
    new Date() >= hackathon.startDate.toDate() && 
    new Date() <= hackathon.endDate.toDate()

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hackathon Header */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-3xl font-bold">{hackathon.title}</CardTitle>
                <p className="text-gray-600 mt-2">{hackathon.description}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {isRegistrationOpen && (
                  <Link href={`/hackathons/${params.id}/register`}>
                    <Button>Register Team</Button>
                  </Link>
                )}
                <Link href={`/hackathons/${params.id}/leaderboard`}>
                  <Button variant="outline">
                    <Trophy className="h-4 w-4 mr-2" />
                    Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-gray-600">
                    {hackathon.startDate.toDate().toLocaleDateString()} - {hackathon.endDate.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Registration Deadline</p>
                  <p className="text-sm text-gray-600">
                    {hackathon.registrationDeadline.toDate().toLocaleDateString()} at{" "}
                    {hackathon.registrationDeadline.toDate().toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Team Size</p>
                  <p className="text-sm text-gray-600">Up to {hackathon.maxTeamSize} members</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant={isHackathonActive ? "default" : "outline"}>
                {isHackathonActive ? "Active" : "Upcoming"}
              </Badge>
              <Badge variant={isRegistrationOpen ? "default" : "secondary"}>
                {isRegistrationOpen ? "Registration Open" : "Registration Closed"}
              </Badge>
              <Badge variant="outline">{challenges.length} Challenges</Badge>
              <Badge variant="outline">{leaderboard.length} Teams</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Challenges and Leaderboard */}
        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="challenges">
              <Flag className="h-4 w-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Top Teams
            </TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Flag className="h-5 w-5 mr-2" />
                  Available Challenges
                </CardTitle>
                <CardDescription>
                  {isHackathonActive 
                    ? "Solve these challenges to earn points and unlock the buildathon phase"
                    : "Challenges will be available when the hackathon starts"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {challenges.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No challenges available yet.</p>
                    <p className="text-sm mt-2">Check back when the hackathon starts!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {challenges.map((challenge) => (
                      <div key={challenge.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{challenge.title}</h3>
                            <p className="text-gray-600 line-clamp-2 mt-1">{challenge.description}</p>
                          </div>
                          <Badge variant={challenge.isActive ? "default" : "secondary"}>
                            {challenge.isActive ? "Active" : "Locked"}
                          </Badge>
                        </div>
                        
                        {isHackathonActive && challenge.isActive && (
                          <div className="mt-4">
                            <Link href={`/challenges/${challenge.id}`}>
                              <Button size="sm">
                                <Code className="h-4 w-4 mr-2" />
                                View Challenge
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Top Teams
                </CardTitle>
                <CardDescription>Current standings based on challenge completions and scores</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedLeaderboard.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No teams have registered yet.</p>
                    <p className="text-sm mt-2">Be the first to join!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedLeaderboard.slice(0, 10).map((team, index) => (
                      <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{team.name}</h4>
                              {index < 3 && getRankBadge(index + 1)}
                            </div>
                            <p className="text-sm text-gray-600">
                              {team.members.length + 1} members • {team.completedChallenges?.length || 0} challenges completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{team.totalScore || 0}</div>
                          <div className="text-xs text-gray-500">points</div>
                        </div>
                      </div>
                    ))}

                    {sortedLeaderboard.length > 10 && (
                      <div className="text-center mt-4">
                        <Link href={`/hackathons/${params.id}/leaderboard`}>
                          <Button variant="outline">View Full Leaderboard</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Registration CTA */}
        {isRegistrationOpen && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
              <div>
                <h3 className="text-xl font-semibold">Ready to participate?</h3>
                <p className="text-gray-600">Register your team now and start preparing for the challenges!</p>
              </div>
              <Link href={`/hackathons/${params.id}/register`}>
                <Button size="lg">Register Your Team</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}