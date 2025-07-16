import { getHackathonById } from "@/lib/firestore"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{hackathon.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p><strong>Description:</strong> {hackathon.description}</p>
            <p><strong>Start Date:</strong> {hackathon.startDate.toDate().toLocaleDateString()}</p>
            <p><strong>End Date:</strong> {hackathon.endDate.toDate().toLocaleDateString()}</p>
            <p><strong>Registration Deadline:</strong> {hackathon.registrationDeadline.toDate().toLocaleDateString()}</p>
            <p><strong>Max Team Size:</strong> {hackathon.maxTeamSize}</p>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href={`/hackathons/${params.id}/leaderboard`}>
            <Button variant="default">View Leaderboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
