"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Zap, ArrowLeft } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isHuman, setIsHuman] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isHuman) {
      alert("Please verify that you are human")
      return
    }

    if (!agreeToTerms) {
      alert("Please agree to the Terms of Service")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match")
      return
    }

    console.log("Registration attempt:", formData)
    alert("Account created successfully!")
    window.location.href = "/dashboard"
  }

  const handleGoogleSignup = () => {
    console.log("Google signup attempt")
    alert("Google signup would be handled here")
  }

  const handleBackToLogin = () => {
    window.location.href = "/auth"
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">

      {/* Registration Form */}
      <div className="flex-1 flex items-start justify-center px-4 mt-15">
        <div className="w-full max-w-md space-y-8">

          {/* Create Account Title */}
          <h1 className="text-3xl font-bold text-foreground text-center">Let's Complete your profile</h1>

          <form onSubmit={handleRegister} className="space-y-6">

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground font-medium">OR</span>
              </div>
            </div>

            {/* Username Field */}
            <div className="space-y-3">
              <label htmlFor="username" className="block text-sm font-medium text-foreground">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="w-full glass-effect border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500/20 rounded-xl py-6 text-base"
                required
              />
            </div>

            {/* Email Field */}
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full glass-effect border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500/20 rounded-xl py-6 text-base"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full glass-effect border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500/20 rounded-xl py-6 text-base"
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-3">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="w-full glass-effect border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500/20 rounded-xl py-6 text-base"
                required
              />
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                className="border-border data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 mt-1 h-5 w-5"
              />
              <label htmlFor="terms" className="text-sm text-foreground leading-relaxed">
                I agree to the{" "}
                <button
                  type="button"
                  className="text-amber-500 hover:text-amber-400 underline transition-colors duration-200 font-medium"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="text-amber-500 hover:text-amber-400 underline transition-colors duration-200 font-medium"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* hCaptcha */}
            <div className="flex items-center space-x-4 p-5 glass-effect rounded-xl shadow-md">
              <Checkbox
                id="captcha"
                checked={isHuman}
                onCheckedChange={(checked) => setIsHuman(checked as boolean)}
                className="border-border data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 h-5 w-5"
              />
              <label htmlFor="captcha" className="text-sm text-foreground flex-1 font-medium">
                I am human
              </label>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-bold">h</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Captcha</span>
              </div>
            </div>

            {/* Create Account Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-base"
              disabled={!isHuman || !agreeToTerms}
            >
              Create Account
            </Button>

            {/* Back to Login Button */}
            <Button
              type="button"
              onClick={handleBackToLogin}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted font-semibold py-6 rounded-xl transition-all duration-300 text-base"
            >
              Already have an account?
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}