"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Play, Flag, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react"
import {
  getChallengeById,
  getUserTeams,
  submitCode,
  submitFlag,
  getTeamSubmissions,
  getTeamFlagSubmissions,
  type Challenge,
  type Team,
  type CodeSubmission,
  type FlagSubmission,
} from "@/lib/firestore"
import { toast } from "sonner"
import Link from "next/link"

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com"
const JUDGE0_API_KEY = "your-rapidapi-key" // Replace with actual key

const LANGUAGES = [
  { id: 71, name: "Python", value: "python" },
  { id: 62, name: "Java", value: "java" },
  { id: 54, name: "C++", value: "cpp" },
  { id: 50, name: "C", value: "c" },
  { id: 63, name: "JavaScript", value: "javascript" },
]

export default function ChallengePage() {
  const params = useParams()
  const { user } = useAuth()
  const challengeId = params.id as string

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("python")
  const [flag, setFlag] = useState("")
  const [output, setOutput] = useState("")
  const [executionStatus, setExecutionStatus] = useState("")
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([])
  const [flagSubmissions, setFlagSubmissions] = useState<FlagSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [submittingFlag, setSubmittingFlag] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const [challengeData, teamData] = await Promise.all([getChallengeById(challengeId), getUserTeams(user.uid)])

        setChallenge(challengeData)
        setTeams(teamData)

        if (teamData.length > 0) {
          setSelectedTeam(teamData[0])

          // Fetch submissions for the first team
          const [codeSubmissions, flagSubs] = await Promise.all([
            getTeamSubmissions(teamData[0].id!, challengeId),
            getTeamFlagSubmissions(teamData[0].id!, challengeId),
          ])

          setSubmissions(codeSubmissions)
          setFlagSubmissions(flagSubs)
        }
      } catch (error) {
        console.error("Error fetching challenge data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [challengeId, user])

  const executeCode = async () => {
    if (!code.trim() || !selectedTeam) {
      toast.error("Please write some code and select a team")
      return
    }

    setExecuting(true)
    setOutput("")
    setExecutionStatus("Executing...")

    try {
      const languageId = LANGUAGES.find((lang) => lang.value === language)?.id || 71

      // Submit code to Judge0
      const submitResponse = await fetch(`${JUDGE0_API_URL}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
        }),
      })

      const submitResult = await submitResponse.json()
      const token = submitResult.token

      // Poll for result
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const resultResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
          headers: {
            "X-RapidAPI-Key": JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        })

        const result = await resultResponse.json()

        if (result.status.id <= 2) {
          attempts++
          continue
        }

        // Execution completed
        const outputText = result.stdout || result.stderr || "No output"
        const status = result.status.description

        setOutput(outputText)
        setExecutionStatus(status)

        // Save submission to database
        await submitCode({
          teamId: selectedTeam.id!,
          challengeId,
          code,
          language,
          output: outputText,
          status,
          executionTime: result.time,
          memory: result.memory,
        })

        // Refresh submissions
        const updatedSubmissions = await getTeamSubmissions(selectedTeam.id!, challengeId)
        setSubmissions(updatedSubmissions)

        break
      }

      if (attempts >= maxAttempts) {
        setExecutionStatus("Execution timeout")
        setOutput("Code execution took too long")
      }
    } catch (error) {
      console.error("Error executing code:", error)
      setExecutionStatus("Error")
      setOutput("Failed to execute code. Please try again.")
      toast.error("Failed to execute code")
    } finally {
      setExecuting(false)
    }
  }

  const handleFlagSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!flag.trim() || !selectedTeam) {
      toast.error("Please enter a flag and select a team")
      return
    }

    setSubmittingFlag(true)
    try {
      const result = await submitFlag(selectedTeam.id!, challengeId, flag)

      if (result.isCorrect) {
        toast.success("Correct flag! Buildathon phase unlocked!")

        // Refresh team data
        const updatedTeams = await getUserTeams(user!.uid)
        setTeams(updatedTeams)
        const updatedSelectedTeam = updatedTeams.find((t) => t.id === selectedTeam.id)
        if (updatedSelectedTeam) {
          setSelectedTeam(updatedSelectedTeam)
        }
      } else {
        toast.error("Incorrect flag. Try again!")
      }

      // Refresh flag submissions
      const updatedFlagSubmissions = await getTeamFlagSubmissions(selectedTeam.id!, challengeId)
      setFlagSubmissions(updatedFlagSubmissions)
      setFlag("")
    } catch (error) {
      console.error("Error submitting flag:", error)
      toast.error("Failed to submit flag")
    } finally {
      setSubmittingFlag(false)
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

  if (!challenge) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Challenge Not Found</h3>
                <p className="text-gray-600 mb-4">The challenge you're looking for doesn't exist.</p>
                <Link href="/challenges">
                  <Button>Back to Challenges</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (teams.length === 0) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No Teams Found</h3>
                <p className="text-gray-600 mb-4">You need to be part of a team to participate in challenges.</p>
                <Link href="/teams/create">
                  <Button>Create Team</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const hasCorrectFlag = flagSubmissions.some((sub) => sub.isCorrect)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/challenges">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Challenges
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{challenge.title}</h1>
              <p className="text-gray-600">Solve the algorithmic challenge to unlock the buildathon phase</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Problem Description */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Problem Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{challenge.description}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Constraints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{challenge.constraints}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Flag Submission */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Flag className="h-5 w-5 mr-2" />
                    Flag Submission
                  </CardTitle>
                  <CardDescription>Submit the correct flag to unlock the buildathon phase</CardDescription>
                </CardHeader>
                <CardContent>
                  {hasCorrectFlag ? (
                    <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">
                        Flag submitted successfully! Buildathon unlocked.
                      </span>
                    </div>
                  ) : (
                    <form onSubmit={handleFlagSubmission} className="space-y-4">
                      <div>
                        <Label htmlFor="flag">Flag</Label>
                        <Input
                          id="flag"
                          value={flag}
                          onChange={(e) => setFlag(e.target.value)}
                          placeholder="Enter the flag here..."
                          required
                        />
                      </div>
                      <Button type="submit" disabled={submittingFlag}>
                        <Flag className="h-4 w-4 mr-2" />
                        {submittingFlag ? "Submitting..." : "Submit Flag"}
                      </Button>
                    </form>
                  )}

                  {/* Flag Submission History */}
                  {flagSubmissions.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Submission History</h4>
                      <div className="space-y-2">
                        {flagSubmissions.map((submission, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              {submission.isCorrect ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="font-mono text-sm">{submission.flag}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              {submission.createdAt.toDate().toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Buildathon Task (only show if flag is correct) */}
              {hasCorrectFlag && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Buildathon Challenge Unlocked!
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{challenge.buildathonTask}</p>
                    </div>
                    <Separator className="my-4" />
                    <div className="text-sm text-gray-600">
                      <p className="font-semibold mb-2">Submission Requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Upload your source code to GitHub</li>
                        <li>Submit the GitHub repository link via your team page</li>
                        <li>Ensure your repository is public or accessible</li>
                      </ul>
                    </div>
                    <Link href={`/teams/${selectedTeam?.id}`} className="inline-block mt-4">
                      <Button>Go to Team Page to Submit</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Code Editor and Execution */}
            <div className="space-y-6">
              {/* Team Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedTeam?.id || ""}
                    onValueChange={(value) => {
                      const team = teams.find((t) => t.id === value)
                      setSelectedTeam(team || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id!}>
                          <div className="flex items-center gap-2">
                            <span>{team.name}</span>
                            <Badge variant={team.leaderId === user?.uid ? "default" : "secondary"}>
                              {team.leaderId === user?.uid ? "Leader" : "Member"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Code Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Code Editor</CardTitle>
                  <CardDescription>Write and test your solution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="language">Programming Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="code">Code</Label>
                    <Textarea
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Write your code here..."
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Button onClick={executeCode} disabled={executing || !selectedTeam}>
                    <Play className="h-4 w-4 mr-2" />
                    {executing ? "Executing..." : "Run Code"}
                  </Button>
                </CardContent>
              </Card>

              {/* Output */}
              {(output || executionStatus) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Output</CardTitle>
                    <CardDescription>
                      Status: <Badge variant="outline">{executionStatus}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                      {output || "No output"}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Submission History */}
              {submissions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {submissions.slice(0, 5).map((submission, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{submission.language}</Badge>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              {submission.createdAt.toDate().toLocaleString()}
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Status:</span> {submission.status}
                          </div>
                          {submission.executionTime && (
                            <div className="text-sm">
                              <span className="font-medium">Time:</span> {submission.executionTime}s
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
