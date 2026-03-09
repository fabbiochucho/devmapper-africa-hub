import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, ExternalLink } from "lucide-react";

export default function PageFooter() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t text-foreground py-12" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src="/lovable-uploads/06a46dda-ed52-44ed-8f8e-2edb1752ffa6.png" 
                alt="Dev Mapper Logo" 
                className="w-12 h-12 mr-3" 
                loading="lazy"
                width={48}
                height={48}
              />
              <div>
                <h2 className="text-xl font-bold">{t('nav.devMapper')}</h2>
                <p className="text-xs text-muted-foreground font-medium">{t('nav.africaSdgTracker')}</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4 max-w-xs">{t('footer.tagline')}</p>
            
            {/* Certificate Verification CTA */}
            <Link 
              to="/verify" 
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Shield className="w-4 h-4" />
              Verify SDG Certificate
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">{t('footer.platform')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/submit-report" className="hover:text-foreground transition-colors">{t('footer.reportProjects')}</Link></li>
              <li><Link to="/analytics" className="hover:text-foreground transition-colors">{t('footer.analytics')}</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link to="/platform-overview" className="hover:text-foreground transition-colors">Platform Overview</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">{t('footer.community')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/change-makers" className="hover:text-foreground transition-colors">Change Makers</Link></li>
              <li><Link to="/fundraising" className="hover:text-foreground transition-colors">Fundraising</Link></li>
              <li><Link to="/forum" className="hover:text-foreground transition-colors">Forum</Link></li>
              <li><Link to="/guidelines" className="hover:text-foreground transition-colors">{t('footer.guidelines')}</Link></li>
              <li><Link to="/training" className="hover:text-foreground transition-colors">{t('footer.training')}</Link></li>
            </ul>
          </div>

          {/* Connect & Standards */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">{t('footer.connect')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="/support" className="hover:text-foreground transition-colors">{t('footer.support')}</Link></li>
              <li><Link to="/spvf-standards" className="hover:text-foreground transition-colors">SPVF Standards</Link></li>
              <li><Link to="/sdg-indicators" className="hover:text-foreground transition-colors">SDG Indicators</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Dev Mapper Africa. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/verify" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Verify Certificate
            </Link>
            <Link to="/sdg-overview" className="hover:text-foreground transition-colors">SDG Overview</Link>
            <Link to="/resources" className="hover:text-foreground transition-colors">{t('footer.resources')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
