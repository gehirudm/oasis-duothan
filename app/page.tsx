import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Calendar, Award } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-grid-animate text-black flex flex-col items-center justify-center">
      
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-orbitron text-black-900 mb-6">
            Welcome to <span className="text-5xl neon-text glitch mb-4">OASIS-CTF</span>
          </h1>
          <p className="font-geist text-xl text-black-600 mb-8 max-w-2xl mx-auto ">
            The ultimate platform for organizing and participating in hackathons. Create teams, manage events, and build
            amazing projects together.
          </p>
          <div className="space-x-4">
            <Link href="/hackathons">
              <Button variant="outline" size="lg" className="neon-btn font-orbitron">
                View Hackathons
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" size="lg" className="neon-btn font-orbitron">
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

     
      <section className="py-4 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="neon-box">
              <CardHeader className="text-center">
                <Trophy className="h-12 w-12 text-black mx-auto mb-4" />
                <CardTitle className="font-orbitron text-black">Hackathon Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription><p className="text-center">Create and manage hackathons with custom rules, deadlines, and team sizes.</p>
                  
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="neon-box">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-black mx-auto mb-4" />
                <CardTitle className="font-orbitron text-black">Team Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription><p className="text-center">Easy team formation with member management.</p></CardDescription>
              </CardContent>
            </Card>

            <Card className="neon-box">
              <CardHeader className="text-center">
                <Calendar className="h-12 w-12 text-black mx-auto mb-4" />
                <CardTitle className="font-orbitron text-black">Event Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription><p className="text-center">Set registration deadlines, event dates, and manage timelines effectively.</p>
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="neon-box">
              <CardHeader className="text-center">
                <Award className="h-12 w-12 text-black mx-auto mb-4" />
                <CardTitle className="font-orbitron text-black">Team Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription><p className="text-center">Competitive challenges to complete by teams.</p>
                  
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <section className="py-24 px-4 gradient-box text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Hackathon Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers, designers, and innovators building the future.
          </p>
          <Link href="/hackathons">
            <Button size="lg" variant="secondary" className="px-8">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
    </div>

  )
}
