"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Clock } from "lucide-react"
import { getActiveHackathons, type Hackathon } from "@/lib/firestore"
import Link from "next/link"

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const data = await getActiveHackathons()
        setHackathons(data)
      } catch (error) {
        console.error("Error fetching hackathons:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHackathons()
  }, [])

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Hackathons</h1>
            <p className="text-gray-600">Join exciting hackathons and build amazing projects with your team.</p>
          </div>

          {hackathons.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No Active Hackathons</h3>
                <p className="text-gray-600">Check back later for upcoming events!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hackathons.map((hackathon) => (
                <Card key={hackathon.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl">{hackathon.title}</CardTitle>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <CardDescription className="line-clamp-3">{hackathon.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {hackathon.startDate.toDate().toLocaleDateString()} -{" "}
                          {hackathon.endDate.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Max team size: {hackathon.maxTeamSize}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          Registration deadline: {hackathon.registrationDeadline.toDate().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/hackathons/${hackathon.id}`}>
                        <Button variant="secondary" className="w-full">Details</Button>
                      </Link>
                      <Link href={`/hackathons/${hackathon.id}/register`}>
                        <Button className="w-full">Register</Button>
                      </Link>
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
