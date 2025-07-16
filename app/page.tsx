import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Calendar, Award } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-grid-animate text-white flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-orbitron text-white-900 mb-6">
            Welcome to <span className="text-5xl neon-text glitch mb-4">OASIS-CTF</span>
          </h1>
          <p className="font-geist text-xl text-white-600 mb-8 max-w-2xl mx-auto ">
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

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="neon-box">
              <CardHeader className="text-center">
                <Trophy className="h-12 w-12 text-green mx-auto mb-4" />
                <CardTitle className="font-orbitron">Hackathon Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription><p className="text-center">Create and manage hackathons with custom rules, deadlines, and team sizes.</p>
                  
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="neon-box">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-green mx-auto mb-4" />
                <CardTitle className="font-orbitron">Team Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription><p className="text-center">Easy team formation with member management and role assignments.</p></CardDescription>
              </CardContent>
            </Card>

            <Card className="neon-box">
              <CardHeader className="text-center">
                <Calendar className="h-12 w-12 text-green mx-auto mb-4" />
                <CardTitle className="font-orbitron">Event Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription><p className="text-center">Set registration deadlines, event dates, and manage timelines effectively.</p>
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="neon-box">
              <CardHeader className="text-center">
                <Award className="h-12 w-12 text-green mx-auto mb-4" />
                <CardTitle className="font-orbitron">Admin Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription><p className="text-center">Comprehensive admin tools for managing events, teams, and participants.</p>
                  
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-white">
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
    </div>
  )
}
