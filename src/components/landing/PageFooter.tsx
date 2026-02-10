import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PageFooter() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <img src="/lovable-uploads/06a46dda-ed52-44ed-8f8e-2edb1752ffa6.png" alt="Dev Mapper Logo" className="w-16 h-16 mr-4" />
              <div>
                <h2 className="text-2xl font-bold text-white">{t('nav.devMapper')}</h2>
                <p className="text-sm text-gray-300 font-medium">{t('nav.africaSdgTracker')}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">{t('footer.tagline')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.platform')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/submit-report" className="hover:text-white transition-colors">{t('footer.reportProjects')}</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition-colors">{t('footer.verifyData')}</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition-colors">{t('footer.trackProgress')}</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition-colors">{t('footer.analytics')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.community')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/guidelines" className="hover:text-white transition-colors">{t('footer.guidelines')}</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">{t('footer.support')}</Link></li>
              <li><Link to="/training" className="hover:text-white transition-colors">{t('footer.training')}</Link></li>
              <li><Link to="/resources" className="hover:text-white transition-colors">{t('footer.resources')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.connect')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/connect" className="hover:text-white transition-colors">{t('footer.telegramBot')}</Link></li>
              <li><Link to="/connect" className="hover:text-white transition-colors">{t('footer.mobileApp')}</Link></li>
              <li><Link to="/connect" className="hover:text-white transition-colors">{t('footer.apiAccess')}</Link></li>
              <li><Link to="/connect" className="hover:text-white transition-colors">{t('footer.partnerships')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <a href="#top" className="hover:text-white transition-colors">{t('footer.copyright')}</a>
        </div>
      </div>
    </footer>
  );
}
