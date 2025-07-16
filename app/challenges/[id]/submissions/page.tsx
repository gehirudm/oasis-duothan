import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getChallengeById, getBuildathonSubmissions } from "@/lib/firestore"
import Link from "next/link"
import { ArrowLeft, Code, ExternalLink, Github, Search, Star, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface BuildathonSubmission {
  id: string
  teamId: string
  teamName: string
  challengeId: string
  githubLink: string
  description: string
  createdAt: any
  leaderName: string
  leaderEmail: string
  score?: number
  feedback?: string
  reviewed?: boolean
}

export default function BuildathonSubmissionsPage({ params }: { params: { id: string } }) {
  const challengeId = params.id
  
  const [challenge, setChallenge] = useState<any>(null)
  const [submissions, setSubmissions] = useState<BuildathonSubmission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<BuildathonSubmission[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [challengeData, submissionsData] = await Promise.all([
          getChallengeById(challengeId),
          getBuildathonSubmissions(challengeId)
        ])
        
        setChallenge(challengeData)
        setSubmissions(submissionsData)
        setFilteredSubmissions(submissionsData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [challengeId])

  useEffect(() => {
    let filtered = [...submissions]
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (submission) =>
          submission.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          submission.leaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          submission.githubLink.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Filter by tab
    if (activeTab === "reviewed") {
      filtered = filtered.filter((submission) => submission.reviewed)
    } else if (activeTab === "unreviewed") {
      filtered = filtered.filter((submission) => !submission.reviewed)
    }
    
    setFilteredSubmissions(filtered)
  }, [searchQuery, submissions, activeTab])

  const handleScoreSubmission = async (submissionId: string, score: number, feedback: string) => {
    try {
      // Update the submission with score and feedback
      await updateBuildathonSubmission(submissionId, {
        score,
        feedback,
        reviewed: true
      })
      
      // Update local state
      setSubmissions(submissions.map(sub => 
        sub.id === submissionId 
          ? { ...sub, score, feedback, reviewed: true } 
          : sub
      ))
      
      // Show success message
      toast.success("Submission scored successfully")
    } catch (error) {
      console.error("Error scoring submission:", error)
      toast.error("Failed to score submission")
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

  if (!challenge) {
    return (
      <AuthGuard adminOnly>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Challenge Not Found</h3>
                <p className="text-gray-600 mb-4">The challenge you're looking for doesn't exist.</p>
                <Link href="/admin/challenges">
                  <Button>Back to Challenges</Button>
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/admin/challenges`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Challenges
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Buildathon Submissions</h1>
              <p className="text-gray-600">{challenge.title}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissions.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {submissions.filter(s => s.reviewed).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {submissions.filter(s => !s.reviewed).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submissions List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Github className="h-5 w-5 mr-2" />
                    Buildathon Submissions
                  </CardTitle>
                  <CardDescription>Review and score team submissions for this challenge</CardDescription>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search teams or repositories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                  <TabsTrigger value="all">All Submissions ({submissions.length})</TabsTrigger>
                  <TabsTrigger value="reviewed">
                    Reviewed ({submissions.filter(s => s.reviewed).length})
                  </TabsTrigger>
                  <TabsTrigger value="unreviewed">
                    Pending Review ({submissions.filter(s => !s.reviewed).length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? "No submissions found" : "No submissions yet"}
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Teams haven't submitted their buildathon projects yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredSubmissions.map((submission) => (
                    <SubmissionCard 
                      key={submission.id} 
                      submission={submission} 
                      onScore={handleScoreSubmission} 
                    />
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

// Submission Card Component
function SubmissionCard({ 
  submission, 
  onScore 
}: { 
  submission: BuildathonSubmission, 
  onScore: (id: string, score: number, feedback: string) => Promise<void> 
}) {
  const [isScoring, setIsScoring] = useState(false)
  const [score, setScore] = useState(submission.score || 0)
  const [feedback, setFeedback] = useState(submission.feedback || "")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitScore = async () => {
    setSubmitting(true)
    try {
      await onScore(submission.id, score, feedback)
      setIsScoring(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card key={submission.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{submission.teamName}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>Submitted {new Date(submission.createdAt.toDate()).toLocaleDateString()}</span>
              {submission.reviewed && (
                <Badge variant={submission.score && submission.score >= 7 ? "default" : "secondary"}>
                  Score: {submission.score}/10
                </Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Team Leader */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Avatar>
                <AvatarImage src="/placeholder.svg" alt={submission.leaderName} />
              <AvatarFallback>{submission.leaderName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{submission.leaderName}</p>
              <p className="text-sm text-gray-600">{submission.leaderEmail}</p>
            </div>
          </div>

          {/* GitHub Repository */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Github className="h-5 w-5 mr-2 text-blue-600" />
                <span className="font-medium">GitHub Repository</span>
              </div>
              <a
                href={submission.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                View Repository <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
            <p className="text-sm break-all">{submission.githubLink}</p>
          </div>

          {/* Submission Description */}
          {submission.description && (
            <div>
              <h4 className="font-medium mb-2">Project Description</h4>
              <div className="p-4 bg-gray-50 rounded-lg text-sm">
                {submission.description}
              </div>
            </div>
          )}

          {/* Review Section */}
          {isScoring ? (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Score Submission</h4>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Score (0-10)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-bold text-lg w-8 text-center">{score}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={4}
                  placeholder="Provide feedback for the team..."
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleSubmitScore} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
                <Button variant="outline" onClick={() => setIsScoring(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t pt-4">
              {submission.reviewed ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Review</h4>
                    <Button variant="outline" size="sm" onClick={() => setIsScoring(true)}>
                      Edit Review
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Score:</span>
                    <div className="flex items-center">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < submission.score! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-bold">{submission.score}/10</span>
                    </div>
                  </div>
                  
                  {submission.feedback && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Feedback:</span>
                      <p className="text-sm p-3 bg-gray-50 rounded-md">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              ) : (
                <Button onClick={() => setIsScoring(true)}>
                  Score Submission
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}