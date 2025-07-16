// app/challenges/[id]/page.tsx
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
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
import { runJudge0Code } from "@/lib/judge0"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Play, Flag, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

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
        const [challengeData, teamData] = await Promise.all([
          getChallengeById(challengeId),
          getUserTeams(user.uid),
        ])
        setChallenge(challengeData)
        setTeams(teamData)

        if (teamData.length > 0) {
          setSelectedTeam(teamData[0])
          const [codeSubs, flagSubs] = await Promise.all([
            getTeamSubmissions(teamData[0].id!, challengeId),
            getTeamFlagSubmissions(teamData[0].id!, challengeId),
          ])
          setSubmissions(codeSubs)
          setFlagSubmissions(flagSubs)
        }
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
      const languageId = LANGUAGES.find((l) => l.value === language)?.id || 71
      const result = await runJudge0Code({ source_code: code, language_id: languageId })
      console.log("Judge0 result:", result)

      const outputText = result.stdout || result.stderr || result.compile_output || "No output"
      const status = result.status?.description || "Unknown"

      if (status && result.status.id > 2) {
        setOutput(outputText)
        setExecutionStatus(status)

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

        const updatedSubs = await getTeamSubmissions(selectedTeam.id!, challengeId)
        setSubmissions(updatedSubs)

        if (status === "Accepted" && outputText.trim()) {
          const generatedFlag = `duothan{correct_submission}`
          setFlag(generatedFlag)
          toast.success("Code passed! Flag generated.")
        }
      } else {
        setExecutionStatus("Execution failed")
        setOutput("Something went wrong during execution")
      }
    } catch (error) {
      console.error("Code execution failed:", error)
      toast.error("Execution error occurred")
      if (!output) {
        setOutput("Execution failed")
      }
      setExecutionStatus("Error")
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
      if (result.isCorrect) toast.success("Correct flag! Buildathon unlocked!")
      else toast.error("Incorrect flag. Try again!")

      const updatedFlags = await getTeamFlagSubmissions(selectedTeam.id!, challengeId)
      setFlagSubmissions(updatedFlags)
      setFlag("")
    } finally {
      setSubmittingFlag(false)
    }
  }

  if (loading) return <div className="min-h-screen flex justify-center items-center">Loading...</div>
  if (!challenge) return <div className="min-h-screen flex justify-center items-center">Challenge not found</div>
  if (teams.length === 0) return <div className="min-h-screen flex justify-center items-center">No teams found</div>

  const hasCorrectFlag = flagSubmissions.some((sub) => sub.isCorrect)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/challenges">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{challenge.title}</h1>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                <CardContent><p>{challenge.description}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Constraints</CardTitle></CardHeader>
                <CardContent><p>{challenge.constraints}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Flag Submission</CardTitle></CardHeader>
                <CardContent>
                  {hasCorrectFlag ? (
                    <p className="text-green-600">Buildathon Unlocked!</p>
                  ) : (
                    <form onSubmit={handleFlagSubmission} className="space-y-4">
                      <Input value={flag} onChange={(e) => setFlag(e.target.value)} placeholder="Enter flag..." />
                      <Button type="submit" disabled={submittingFlag}>Submit Flag</Button>
                    </form>
                  )}
                </CardContent>
              </Card>
              {hasCorrectFlag && (
                <Card>
                  <CardHeader><CardTitle>Buildathon Task</CardTitle></CardHeader>
                  <CardContent>
                    <p>{challenge.buildathonTask}</p>
                    <Link href={`/teams/${selectedTeam?.id}`}><Button className="mt-4">Submit GitHub Link</Button></Link>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Code Editor</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea rows={10} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Write code..." />
                  <Button onClick={executeCode} disabled={executing}>Run Code</Button>
                  {executionStatus && <p>Status: {executionStatus}</p>}
                  {output && <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">{output}</pre>}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}