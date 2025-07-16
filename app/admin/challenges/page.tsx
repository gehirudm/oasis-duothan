"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Code, Edit, Trash2, ArrowLeft } from "lucide-react"
import { getChallenges, deleteChallenge, type Challenge } from "@/lib/firestore"
import Link from "next/link"
import { toast } from "sonner"

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const challengeData = await getChallenges()
        setChallenges(challengeData)
      } catch (error) {
        console.error("Error fetching challenges:", error)
        toast.error("Failed to load challenges")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challenge? This action cannot be undone.")) {
      return
    }

    setDeleting(id)
    try {
      await deleteChallenge(id)
      setChallenges(challenges.filter(challenge => challenge.id !== id))
      toast.success("Challenge deleted successfully")
    } catch (error) {
      console.error("Error deleting challenge:", error)
      toast.error("Failed to delete challenge")
    } finally {
      setDeleting(null)
    }
  }

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
              <div className="flex items-center gap-4 mb-2">
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Admin
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
              </div>
              <p className="text-gray-600">Manage algorithmic challenges for hackathons.</p>
            </div>
            <Link href="/admin/challenges/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </Link>
          </div>

          {/* Challenges List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2" />
                All Challenges
              </CardTitle>
              <CardDescription>View and manage all algorithmic challenges.</CardDescription>
            </CardHeader>
            <CardContent>
              {challenges.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No challenges created yet.</p>
                  <Link href="/admin/challenges/create">
                    <Button>Create Your First Challenge</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {challenges.map((challenge) => (
                    <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{challenge.title}</h3>
                          <Badge variant={challenge.isActive ? "default" : "secondary"}>
                            {challenge.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{challenge.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {challenge.flag && (
                            <span className="flex items-center">
                              <span className="font-medium mr-1">Flag:</span> 
                              {challenge.flag.substring(0, 3)}...{challenge.flag.substring(challenge.flag.length - 3)}
                            </span>
                          )}
                          {challenge.buildathonTask && (
                            <span>Has buildathon task</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/challenges/${challenge.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteChallenge(challenge.id!)}
                          disabled={deleting === challenge.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deleting === challenge.id ? "Deleting..." : "Delete"}
                        </Button>
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