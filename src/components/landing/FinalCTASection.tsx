import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface FinalCTASectionProps {
  onGetStarted: () => void;
}

export default function FinalCTASection({ onGetStarted }: FinalCTASectionProps) {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-emerald-700" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      
      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready to Map Development in Your Community?
        </h2>
        
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
          Join thousands of change makers, NGOs, and governments tracking 
          sustainable development across Africa aligned with UN SDGs and AU Agenda 2063.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            onClick={onGetStarted}
            className="bg-white text-primary hover:bg-white/90 font-semibold text-lg px-8 py-6 h-auto"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            className="border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-8 py-6 h-auto"
            asChild
          >
            <Link to="/contact">
              <Calendar className="mr-2 h-5 w-5" />
              Schedule a Demo
            </Link>
          </Button>
        </div>
        
        <p className="mt-8 text-sm text-white/70">
          No credit card required • Free forever for individual reporters
        </p>
      </div>
    </section>
  );
}
