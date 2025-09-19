"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Smartphone,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [email, setEmail] = useState("")

  const features = [
    {
      icon: BarChart3,
      title: "Real-Time Inventory Tracking",
      description: "Monitor your farm inventory levels in real-time with automatic updates and low-stock alerts.",
    },
    {
      icon: Users,
      title: "Labor Management",
      description: "Track labor deployments, costs, and efficiency across all your farm operations.",
    },
    {
      icon: TrendingUp,
      title: "AI-Powered Analytics",
      description: "Get intelligent insights and recommendations to optimize your farm operations and reduce costs.",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with automatic backups and 99.9% uptime guarantee.",
    },
    {
      icon: Clock,
      title: "Save Time Daily",
      description: "Automate manual tracking processes and reduce administrative work by up to 75%.",
    },
    {
      icon: Smartphone,
      title: "Mobile Access",
      description: "Access your farm data anywhere, anytime with our responsive web application.",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Honey Farm Owner",
      content:
        "FarmTrack Pro has revolutionized how we manage our honey production. We've reduced waste by 30% and increased efficiency dramatically.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Agricultural Manager",
      content:
        "The labor tracking feature alone has saved us thousands in operational costs. The AI insights are incredibly valuable.",
      rating: 5,
    },
    {
      name: "Emma Rodriguez",
      role: "Organic Farm Owner",
      content:
        "Finally, a system that understands farming. The inventory management is intuitive and the reports are exactly what we need.",
      rating: 5,
    },
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for small farms and individual producers",
      features: [
        "Up to 100 inventory items",
        "Basic labor tracking",
        "Standard reports",
        "Email support",
        "Mobile access",
      ],
      popular: false,
    },
    {
      name: "Professional",
      price: "$79",
      period: "/month",
      description: "Ideal for medium-sized agricultural operations",
      features: [
        "Unlimited inventory items",
        "Advanced labor management",
        "AI-powered analytics",
        "Priority support",
        "Custom integrations",
        "Advanced reporting",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      description: "For large farms and agricultural businesses",
      features: [
        "Everything in Professional",
        "Multi-location support",
        "Dedicated account manager",
        "Custom training",
        "API access",
        "White-label options",
      ],
      popular: false,
    },
  ]

  const handleGetStarted = () => {
    window.location.href = "/inventory"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold text-primary">FarmTrack Pro</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-6 lg:space-x-8">
                <a
                  href="#features"
                  className="text-sm lg:text-base text-foreground hover:text-primary transition-colors"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-sm lg:text-base text-foreground hover:text-primary transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#testimonials"
                  className="text-sm lg:text-base text-foreground hover:text-primary transition-colors"
                >
                  Testimonials
                </a>
                <a
                  href="#contact"
                  className="text-sm lg:text-base text-foreground hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
              <Link href="/inventory">
                <Button variant="outline" size="sm" className="text-sm bg-transparent">
                  View Demo
                </Button>
              </Link>
              <Button onClick={handleGetStarted} size="sm" className="text-sm">
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="h-10 w-10">
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-4 pb-6 space-y-3 bg-background border-t">
              <a
                href="#features"
                className="block px-4 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block px-4 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="block px-4 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
              >
                Testimonials
              </a>
              <a
                href="#contact"
                className="block px-4 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
              >
                Contact
              </a>
              <div className="pt-4 space-y-3">
                <Link href="/inventory">
                  <Button variant="outline" className="w-full h-12 text-base bg-transparent">
                    View Demo
                  </Button>
                </Link>
                <Button onClick={handleGetStarted} className="w-full h-12 text-base">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 text-xs sm:text-sm">
            Trusted by 500+ farms worldwide
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-balance mb-4 sm:mb-6 leading-tight">
            Streamline Your Farm Operations with <span className="text-primary">Smart Inventory Management</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground text-balance mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
            Reduce waste, optimize costs, and boost efficiency with our comprehensive farm management platform. Track
            inventory, manage labor, and get AI-powered insights all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 h-12 sm:h-auto"
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 h-12 sm:h-auto bg-transparent"
            >
              Schedule Demo
            </Button>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            ✓ 14-day free trial ✓ No credit card required ✓ Cancel anytime
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-balance">
              Everything You Need to Manage Your Farm
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              Our comprehensive platform provides all the tools you need to optimize your farm operations and increase
              profitability.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-balance">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-balance">
              Trusted by Farm Owners Worldwide
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              See how FarmTrack Pro is helping farmers increase efficiency and reduce costs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="text-sm sm:text-base font-semibold">{testimonial.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-balance">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              Choose the plan that fits your farm size and needs. All plans include our core features and 24/7 support.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`border-0 shadow-sm relative ${plan.popular ? "ring-2 ring-primary" : ""}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs">Most Popular</Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                  <div className="mt-3 sm:mt-4">
                    <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm sm:text-base text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2 text-sm sm:text-base leading-relaxed">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 sm:space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full h-11 sm:h-10 text-sm sm:text-base"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-balance">
            Ready to Transform Your Farm Operations?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground text-balance mb-6 sm:mb-8 leading-relaxed">
            Join hundreds of farmers who have already streamlined their operations with FarmTrack Pro.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center max-w-lg sm:max-w-none mx-auto">
            <div className="flex-1 sm:max-w-md">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <Button size="lg" onClick={handleGetStarted} className="h-12 px-6 sm:px-8 text-base whitespace-nowrap">
              Start Free Trial
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-4">
            Start your 14-day free trial today. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-muted/50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">FarmTrack Pro</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The complete farm management solution for modern agricultural operations.
              </p>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-primary transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-primary transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Training
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground">
            <p>&copy; 2024 FarmTrack Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
