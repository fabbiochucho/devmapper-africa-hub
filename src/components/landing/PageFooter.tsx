
import { Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function PageFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="/lovable-uploads/06a46dda-ed52-44ed-8f8e-2edb1752ffa6.png" 
                alt="Dev Mapper Logo" 
                className="w-16 h-16 mr-4"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">Dev Mapper</h2>
                <p className="text-sm text-gray-300 font-medium">Africa SDG Tracker</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Empowering communities to track sustainable development across Africa.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/submit-report" className="hover:text-white transition-colors">Report Projects</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition-colors">Verify Data</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition-colors">Track Progress</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/guidelines" className="hover:text-white transition-colors">Guidelines</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Support</Link></li>
              <li><Link to="/training" className="hover:text-white transition-colors">Training</Link></li>
              <li><Link to="/resources" className="hover:text-white transition-colors">Resources</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/connect" className="hover:text-white transition-colors">Telegram Bot</Link></li>
              <li><Link to="/connect" className="hover:text-white transition-colors">Mobile App</Link></li>
              <li><Link to="/connect" className="hover:text-white transition-colors">API Access</Link></li>
              <li><Link to="/connect" className="hover:text-white transition-colors">Partnerships</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <a href="#top" className="hover:text-white transition-colors">&copy; 2025 DevMapper. Built for sustainable development in Africa.</a>
        </div>
      </div>
    </footer>
  );
}
