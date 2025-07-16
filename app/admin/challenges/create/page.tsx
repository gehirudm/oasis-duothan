"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createChallenge } from "@/lib/firestore"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function CreateChallengePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    constraints: "",
    flag: "",
    buildathonTask: "",
    isActive: true,
    input: "",
    output: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (!formData.title || !formData.description || !formData.flag) {
        toast.error("Please fill in all required fields")
        setSubmitting(false)
        return
      }

      await createChallenge({
        title: formData.title,
        description: formData.description,
        constraints: formData.constraints,
        flag: formData.flag,
        buildathonTask: formData.buildathonTask,
        isActive: formData.isActive,
        input: formData.input,
        output: formData.output,
      })

      toast.success("Challenge created successfully!")
      router.push("/admin/challenges")
    } catch (error) {
      console.error("Error creating challenge:", error)
      toast.error("Failed to create challenge. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <AuthGuard adminOnly>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-6">
            <Link href="/admin/challenges">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Challenges
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Create New Challenge</CardTitle>
              <CardDescription>Create a new algorithmic challenge for participants to solve</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">Challenge Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter challenge title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Detailed problem description..."
                    rows={5}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="constraints">Constraints</Label>
                  <Textarea
                    id="constraints"
                    value={formData.constraints}
                    onChange={(e) => handleInputChange("constraints", e.target.value)}
                    placeholder="Input/output constraints..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="input">Sample Input</Label>
                  <Textarea
                    id="input"
                    value={formData.input}
                    onChange={(e) => handleInputChange("input", e.target.value)}
                    placeholder="Sample input for validation..."
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This will be used to validate participant submissions
                  </p>
                </div>

                <div>
                  <Label htmlFor="output">Expected Output</Label>
                  <Textarea
                    id="output"
                    value={formData.output}
                    onChange={(e) => handleInputChange("output", e.target.value)}
                    placeholder="Expected output for validation..."
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    The exact output that should be produced for the sample input
                  </p>
                </div>

                <div>
                  <Label htmlFor="flag">Flag *</Label>
                  <Input
                    id="flag"
                    value={formData.flag}
                    onChange={(e) => handleInputChange("flag", e.target.value)}
                    placeholder="Secret flag (e.g., FLAG{secret_key})"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This is the secret flag participants need to find by solving the challenge
                  </p>
                </div>

                <div>
                  <Label htmlFor="buildathonTask">Buildathon Task</Label>
                  <Textarea
                    id="buildathonTask"
                    value={formData.buildathonTask}
                    onChange={(e) => handleInputChange("buildathonTask", e.target.value)}
                    placeholder="Task description for the buildathon phase..."
                    rows={5}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This will be revealed after participants solve the challenge
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Make challenge active immediately</Label>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? "Creating..." : "Create Challenge"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push("/admin/challenges")} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}