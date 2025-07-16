"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Calendar, Trophy } from "lucide-react"
import { getHackathons, getTeamsByHackathon, type Hackathon } from "@/lib/firestore"
import Link from "next/link"

export default function AdminPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hackathonData = await getHackathons()
        setHackathons(hackathonData)

        // Fetch team counts for each hackathon
        const counts: Record<string, number> = {}
        for (const hackathon of hackathonData) {
          if (hackathon.id) {
            const teams = await getTeamsByHackathon(hackathon.id)
            counts[hackathon.id] = teams.length
          }
        }
        setTeamCounts(counts)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage hackathons and view registrations.</p>
            </div>
            <Link href="/admin/create-hackathon">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Hackathon
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hackathons</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hackathons.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Hackathons</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hackathons.filter((h) => h.isActive).length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(teamCounts).reduce((sum, count) => sum + count, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hackathons List */}
          <Card>
            <CardHeader>
              <CardTitle>All Hackathons</CardTitle>
              <CardDescription>Manage your hackathons and view team registrations.</CardDescription>
            </CardHeader>
            <CardContent>
              {hackathons.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No hackathons created yet.</p>
                  <Link href="/admin/create-hackathon">
                    <Button>Create Your First Hackathon</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {hackathons.map((hackathon) => (
                    <div key={hackathon.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{hackathon.title}</h3>
                          <Badge variant={hackathon.isActive ? "default" : "secondary"}>
                            {hackathon.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{hackathon.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            {hackathon.startDate.toDate().toLocaleDateString()} -{" "}
                            {hackathon.endDate.toDate().toLocaleDateString()}
                          </span>
                          <span>{teamCounts[hackathon.id!] || 0} teams registered</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/hackathons/${hackathon.id}/teams`}>
                          <Button variant="outline" size="sm">
                            View Teams
                          </Button>
                        </Link>
                        <Link href={`/admin/hackathons/${hackathon.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
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
