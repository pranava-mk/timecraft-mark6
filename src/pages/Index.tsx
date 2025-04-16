
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream">
      <div className="text-center max-w-3xl px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">
          Welcome to Time Share Synergy
        </h1>
        <p className="text-xl text-navy/80 mb-8">
          Exchange your skills and time with others in your community. 
          Every hour you give is an hour you can receive.
        </p>
        <div className="space-x-4">
          <Button asChild size="lg" className="bg-teal hover:bg-teal/90">
            <Link to="/explore">
              Explore Services
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-teal text-teal">
            <Link to="/offer">
              Offer Your Skills
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Index
