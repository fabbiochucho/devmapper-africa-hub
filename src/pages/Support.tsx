import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, MessageSquare, Phone, Mail, Clock, AlertCircle, Search, BookOpen, Shield, FileText, Globe, CreditCard, Zap, ExternalLink, MapPin } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SEOHead } from '@/components/seo/SEOHead';
import { generateFAQSchema } from '@/lib/seoSchemas';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Support = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    description: '',
    priority: 'medium'
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');

  const faqCategories = [
    {
      category: t('support.faq.categoryGettingStarted'),
      icon: <BookOpen className="w-4 h-4" />,
      faqs: [
        { q: t('support.faq.gettingStarted.q1'), a: t('support.faq.gettingStarted.a1') },
        { q: t('support.faq.gettingStarted.q2'), a: t('support.faq.gettingStarted.a2') },
        { q: t('support.faq.gettingStarted.q3'), a: t('support.faq.gettingStarted.a3') },
        { q: t('support.faq.gettingStarted.q4'), a: t('support.faq.gettingStarted.a4') },
      ]
    },
    {
      category: t('support.faq.categoryReportingVerification'),
      icon: <Shield className="w-4 h-4" />,
      faqs: [
        { q: t('support.faq.reportingVerification.q1'), a: t('support.faq.reportingVerification.a1') },
        { q: t('support.faq.reportingVerification.q2'), a: t('support.faq.reportingVerification.a2') },
        { q: t('support.faq.reportingVerification.q3'), a: t('support.faq.reportingVerification.a3') },
        { q: t('support.faq.reportingVerification.q4'), a: t('support.faq.reportingVerification.a4') },
        { q: t('support.faq.reportingVerification.q5'), a: t('support.faq.reportingVerification.a5') },
      ]
    },
    {
      category: t('support.faq.categoryProjectManagement'),
      icon: <FileText className="w-4 h-4" />,
      faqs: [
        { q: t('support.faq.projectManagement.q1'), a: t('support.faq.projectManagement.a1') },
        { q: t('support.faq.projectManagement.q2'), a: t('support.faq.projectManagement.a2') },
        { q: t('support.faq.projectManagement.q3'), a: t('support.faq.projectManagement.a3') },
        { q: t('support.faq.projectManagement.q4'), a: t('support.faq.projectManagement.a4') },
      ]
    },
    {
      category: t('support.faq.categoryEsgCompliance'),
      icon: <Globe className="w-4 h-4" />,
      faqs: [
        { q: t('support.faq.esgCompliance.q1'), a: t('support.faq.esgCompliance.a1') },
        { q: t('support.faq.esgCompliance.q2'), a: t('support.faq.esgCompliance.a2') },
        { q: t('support.faq.esgCompliance.q3'), a: t('support.faq.esgCompliance.a3') },
      ]
    },
    {
      category: t('support.faq.categoryBillingPlans'),
      icon: <CreditCard className="w-4 h-4" />,
      faqs: [
        { q: t('support.faq.billingPlans.q1'), a: t('support.faq.billingPlans.a1') },
        { q: t('support.faq.billingPlans.q2'), a: t('support.faq.billingPlans.a2') },
        { q: t('support.faq.billingPlans.q3'), a: t('support.faq.billingPlans.a3') },
        { q: t('support.faq.billingPlans.q4'), a: t('support.faq.billingPlans.a4') },
      ]
    },
    {
      category: t('support.faq.categoryCarbonSustainability'),
      icon: <Globe className="w-4 h-4" />,
      faqs: [
        { q: t('support.faq.carbonSustainability.q1'), a: t('support.faq.carbonSustainability.a1') },
        { q: t('support.faq.carbonSustainability.q2'), a: t('support.faq.carbonSustainability.a2') },
        { q: t('support.faq.carbonSustainability.q3'), a: t('support.faq.carbonSustainability.a3') },
        { q: t('support.faq.carbonSustainability.q4'), a: t('support.faq.carbonSustainability.a4') },
      ]
    },
    {
      category: t('support.faq.categoryTechnicalIssues'),
      icon: <Zap className="w-4 h-4" />,
      faqs: [
        { q: t('support.faq.technicalIssues.q1'), a: t('support.faq.technicalIssues.a1') },
        { q: t('support.faq.technicalIssues.q2'), a: t('support.faq.technicalIssues.a2') },
        { q: t('support.faq.technicalIssues.q3'), a: t('support.faq.technicalIssues.a3') },
        { q: t('support.faq.technicalIssues.q4'), a: t('support.faq.technicalIssues.a4') },
        { q: t('support.faq.technicalIssues.q5'), a: t('support.faq.technicalIssues.a5') },
      ]
    },
  ];

  const allFaqs = faqCategories.flatMap(cat => cat.faqs.map(faq => ({ ...faq, category: cat.category })));
  const filteredFaqs = faqSearch
    ? allFaqs.filter(f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase()))
    : [];

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('support.toastSignInRequired'));
      return;
    }
    setSubmittingTicket(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject: ticketForm.subject,
        category: ticketForm.category,
        description: ticketForm.description,
        priority: ticketForm.priority,
      });
      if (error) throw error;
      toast.success(t('support.toastTicketSubmitted'));
      setTicketForm({ subject: '', category: '', description: '', priority: 'medium' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('support.toastTicketSubmitFailed'));
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <SEOHead
        title={t('support.seoTitle')}
        description={t('support.seoDescription')}
        canonicalUrl="/support"
        structuredData={generateFAQSchema(
          faqCategories.flatMap((c) => c.faqs).slice(0, 12).map((f) => ({ question: f.q, answer: f.a }))
        )}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('support.pageTitle')}</h1>
        <p className="text-muted-foreground">
          {t('support.pageSubtitle')}
        </p>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">{t('support.tabKnowledgeBase')}</TabsTrigger>
          <TabsTrigger value="contact">{t('support.tabContactSupport')}</TabsTrigger>
          <TabsTrigger value="status">{t('support.tabSystemStatus')}</TabsTrigger>
          <TabsTrigger value="community">{t('support.tabCommunityHelp')}</TabsTrigger>
        </TabsList>

        {/* Knowledge Base / FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('support.searchPlaceholder')}
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {faqSearch && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t('support.faqResultsCount', { count: filteredFaqs.length, query: faqSearch })}</p>
              {filteredFaqs.map((faq, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{faq.q}</CardTitle>
                      <Badge variant="outline" className="shrink-0 text-xs">{faq.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">{faq.a}</p></CardContent>
                </Card>
              ))}
              {filteredFaqs.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">{t('support.noResultsFound')}</p>
                    <p className="text-sm text-muted-foreground">{t('support.noResultsHint')}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!faqSearch && (
            <Accordion type="multiple" className="space-y-3">
              {faqCategories.map((cat, catIdx) => (
                <AccordionItem key={catIdx} value={`cat-${catIdx}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-primary/10 rounded">{cat.icon}</div>
                      <span className="font-semibold">{cat.category}</span>
                      <Badge variant="outline" className="text-xs">{cat.faqs.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-4">
                    {cat.faqs.map((faq, faqIdx) => (
                      <div key={faqIdx} className="border rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-2">{faq.q}</h4>
                        <p className="text-sm text-muted-foreground">{faq.a}</p>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        {/* Contact Support */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('support.submitTicketTitle')}</CardTitle>
                <CardDescription>{t('support.submitTicketDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">{t('support.subjectLabel')}</label>
                    <Input
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder={t('support.subjectPlaceholder')}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('support.categoryLabel')}</label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                      required
                    >
                      <option value="">{t('support.selectCategory')}</option>
                      <option value="technical">{t('support.categoryTechnical')}</option>
                      <option value="account">{t('support.categoryAccount')}</option>
                      <option value="reporting">{t('support.categoryReporting')}</option>
                      <option value="verification">{t('support.categoryVerification')}</option>
                      <option value="billing">{t('support.categoryBilling')}</option>
                      <option value="esg">{t('support.categoryEsg')}</option>
                      <option value="pm">{t('support.categoryPm')}</option>
                      <option value="api">{t('support.categoryApi')}</option>
                      <option value="moderation">{t('support.categoryModeration')}</option>
                      <option value="other">{t('support.categoryOther')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('support.priorityLabel')}</label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="low">{t('support.priorityLow')}</option>
                      <option value="medium">{t('support.priorityMedium')}</option>
                      <option value="high">{t('support.priorityHigh')}</option>
                      <option value="urgent">{t('support.priorityUrgent')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('support.descriptionLabel')}</label>
                    <Textarea
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={t('support.descriptionPlaceholder')}
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submittingTicket}>
                    {submittingTicket ? t('support.submitting') : t('support.submitTicket')}
                  </Button>
                  {!user && (
                    <p className="text-xs text-muted-foreground text-center">{t('support.signInToSubmit')}</p>
                  )}
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mail className="w-4 h-4" />
                    {t('support.emailSupportTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">{t('support.emailSupportDesc')}</p>
                  <p className="font-medium">support@devmapper.africa</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('support.emailResponseTime')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mail className="w-4 h-4" />
                    {t('support.partnershipTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">{t('support.partnershipDesc')}</p>
                  <p className="font-medium">partnerships@devmapper.africa</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('support.partnershipResponseTime')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="w-4 h-4" />
                    {t('support.communityForumTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{t('support.communityForumDesc')}</p>
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = '/forum'}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    {t('support.visitForum')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4" />
                    {t('support.supportHoursTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span>{t('support.mondayFriday')}</span><span className="text-muted-foreground">{t('support.hoursWeekday')}</span></div>
                    <div className="flex justify-between"><span>{t('support.saturday')}</span><span className="text-muted-foreground">{t('support.hoursSaturday')}</span></div>
                    <div className="flex justify-between"><span>{t('support.sunday')}</span><span className="text-muted-foreground">{t('support.closed')}</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {t('support.locationNairobi')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="w-4 h-4" />
                    {t('support.whatsappTelegramTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">{t('support.whatsappTelegramDesc')}</p>
                  <p className="text-sm">{t('support.whatsappLabel')} <span className="font-medium">+234 XXX DEVMAP</span></p>
                  <p className="text-sm">{t('support.telegramLabel')} <span className="font-medium">@DevMapperSupport</span></p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* System Status */}
        <TabsContent value="status" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">{t('support.systemStatusTitle')}</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
                {t('support.noStatusMonitoringTitle')}
              </CardTitle>
              <CardDescription>
                {t('support.noStatusMonitoringDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  t('support.serviceMap'),
                  t('support.serviceReportPipeline'),
                  t('support.serviceAuth'),
                  t('support.serviceAnalytics'),
                  t('support.serviceAI'),
                  t('support.serviceEsg'),
                  t('support.serviceProjectManagement'),
                  t('support.servicePayment'),
                  t('support.serviceCarbon'),
                  t('support.serviceFileStorage'),
                ].map((service, i) => (
                  <div key={i} className="py-1.5 border-b last:border-0 text-sm text-muted-foreground">
                    {service}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Community Help */}
        <TabsContent value="community" className="space-y-6">
          <h2 className="text-2xl font-semibold mb-2">{t('support.communityHelpTitle')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('support.communityHelpDesc')}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: t('support.resourceGettingStartedTitle'), desc: t('support.resourceGettingStartedDesc'), icon: <BookOpen className="w-5 h-5" />, link: '/training' },
              { title: t('support.resourceSdgHandbookTitle'), desc: t('support.resourceSdgHandbookDesc'), icon: <Globe className="w-5 h-5" />, link: '/sdg-overview' },
              { title: t('support.resourceVerificationTitle'), desc: t('support.resourceVerificationDesc'), icon: <Shield className="w-5 h-5" />, link: '/guidelines' },
              { title: t('support.resourceCommunityForumTitle'), desc: t('support.resourceCommunityForumDesc'), icon: <MessageSquare className="w-5 h-5" />, link: '/forum' },
              { title: t('support.resourceApiDocsTitle'), desc: t('support.resourceApiDocsDesc'), icon: <Zap className="w-5 h-5" />, link: '/resources' },
              { title: t('support.resourceEsgGuideTitle'), desc: t('support.resourceEsgGuideDesc'), icon: <FileText className="w-5 h-5" />, link: '/esg' },
            ].map((resource, i) => (
              <Card key={i} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => window.location.href = resource.link}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">{resource.icon}</div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{resource.title}</h3>
                    <p className="text-xs text-muted-foreground">{resource.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Support;
