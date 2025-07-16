"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Mail } from "lucide-react"
import { getDoc, doc } from "firebase/firestore"
import { db, getTeamsByHackathon, type Hackathon, type Team } from "@/lib/firestore"
import Link from "next/link"

export default function TeamsPage() {
  const params = useParams()
  const hackathonId = params.id as string

  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hackathon details
        const hackathonDoc = await getDoc(doc(db, "hackathons", hackathonId))
        if (hackathonDoc.exists()) {
          setHackathon({ id: hackathonDoc.id, ...hackathonDoc.data() } as Hackathon)
        }

        // Fetch teams
        const teamsData = await getTeamsByHackathon(hackathonId)
        setTeams(teamsData)
      } catch (error) {
        console.error("Error fetching data:", error)
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

  return (
    <AuthGuard adminOnly>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{hackathon?.title} - Registered Teams</h1>
              <p className="text-gray-600">{teams.length} teams registered</p>
            </div>
          </div>

          {teams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Teams Registered</h3>
                <p className="text-gray-600">No teams have registered for this hackathon yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{team.name}</CardTitle>
                        <CardDescription>Registered on {team.createdAt.toDate().toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {team.members.length + 1} member{team.members.length !== 0 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Team Leader */}
                      <div>
                        <h4 className="font-semibold mb-2">Team Leader</h4>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium">{team.leaderName}</p>
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              {team.leaderEmail}
                            </div>
                          </div>
                          <Badge>Leader</Badge>
                        </div>
                      </div>

                      {/* Team Members */}
                      {team.members.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Team Members</h4>
                          <div className="space-y-2">
                            {team.members.map((member, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium">{member.name}</p>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {member.email}
                                  </div>
                                </div>
                                {member.role && <Badge variant="outline">{member.role}</Badge>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
