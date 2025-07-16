import { getHackathonById, getHackathonLeaderboard } from "@/lib/firestore"
import { notFound } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Trophy } from "lucide-react"

interface LeaderboardPageProps {
  params: {
    id: string
  }
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const hackathon = await getHackathonById(params.id)
  if (!hackathon) notFound()

  const leaderboard = await getHackathonLeaderboard(params.id)

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="flex flex-col items-center">
            <Trophy className="h-10 w-10 text-yellow-500" />
            <CardTitle className="text-2xl font-bold mt-2">
              Leaderboard – {hackathon.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {leaderboard.length === 0 ? (
              <p className="text-center text-gray-500">No teams have scored yet.</p>
            ) : (
              <table className="w-full table-auto border-collapse mt-4 text-left">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="p-3">Rank</th>
                    <th className="p-3">Team Name</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Challenges Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((team, index) => (
                    <tr key={team.id} className="border-t border-gray-300">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 font-medium">{team.name}</td>
                      <td className="p-3">{team.totalScore}</td>
                      <td className="p-3">{team.completedChallenges?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
