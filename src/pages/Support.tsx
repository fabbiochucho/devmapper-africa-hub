import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, MessageSquare, Phone, Mail, Clock, CheckCircle, AlertCircle, Search, BookOpen, Shield, Users, FileText, Globe, CreditCard, Zap, ExternalLink, MapPin } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Support = () => {
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    description: '',
    priority: 'medium'
  });
  const [faqSearch, setFaqSearch] = useState('');

  const faqCategories = [
    {
      category: 'Getting Started',
      icon: <BookOpen className="w-4 h-4" />,
      faqs: [
        { q: "How do I create an account?", a: "Click 'Sign Up' on the homepage. You can register with email, Google, or GitHub. After registration, you'll be prompted to complete your profile and select your primary role (citizen reporter, NGO, government, or corporate)." },
        { q: "How do I submit a development project report?", a: "Navigate to 'Submit Report' from the sidebar. Fill out the project details including title, description, location (with GPS coordinates), SDG alignment, and supporting documentation. Your report starts at 'Self-Report' verification level and can be upgraded through community verification." },
        { q: "What are the different user roles?", a: "DevMapper has 5 primary roles: Citizen Reporter (default), NGO Representative, Government Official, Corporate Representative, and Platform Admin. Each role has different verification capabilities. For example, only government officials can provide Level 4 'Institutional Verification'." },
        { q: "Is DevMapper free to use?", a: "Yes! The Free tier allows you to submit up to 3 projects per month, use Kanban and List views, and access basic analytics. Paid plans (Lite, Pro, Advanced, Enterprise) unlock features like Gantt charts, AI Copilot, ESG modules, and higher project quotas." },
      ]
    },
    {
      category: 'Reporting & Verification',
      icon: <Shield className="w-4 h-4" />,
      faqs: [
        { q: "How is data verified on the platform?", a: "We use a 5-level verification system: 1) Self-Report (submitted by project owner), 2) Citizen Verification (community members confirm), 3) NGO Verification (organization validates), 4) Government Verification (official institutional confirmation), and 5) Platform Audit (automated cross-referencing and expert review)." },
        { q: "Can I edit or update my submitted reports?", a: "Yes. Go to 'My Projects', select the project, and use 'Update Progress' to add milestones, budget updates, indicator data, and photo evidence. All updates maintain an audit trail visible to verifiers." },
        { q: "How do I verify someone else's project?", a: "Navigate to the project page and click 'Verify'. Your verification level is automatically determined by your role. You must provide written comments and optionally upload evidence. You cannot verify your own projects." },
        { q: "What happens when a project is flagged?", a: "Flagged projects enter a review queue. A moderator examines the flag within 48 hours. If the flag is valid, the project may be suspended pending correction. The reporter receives notification and can respond or appeal." },
        { q: "How do SDG and Agenda 2063 alignment work?", a: "When submitting a project, select the relevant SDG goals (1–17). The platform automatically maps these to AU Agenda 2063 aspirations. The SDG-Agenda 2063 dashboard shows alignment density, gap analysis, and country-level filtering." },
      ]
    },
    {
      category: 'Project Management',
      icon: <FileText className="w-4 h-4" />,
      faqs: [
        { q: "What PM features are available on the Free plan?", a: "Free users get Kanban Board and List View with basic task management. You can create tasks, set priorities, and track status (to-do, in-progress, done). Gantt Chart, resource allocation, and AI Copilot require Lite+ or Pro+ plans." },
        { q: "How does the Gantt Chart view work?", a: "Available on Lite+ plans. The Gantt Chart visualizes project timelines, task dependencies, and milestone dates. Tasks are displayed as horizontal bars with drag-to-reschedule support. It integrates directly with your project milestones from Supabase." },
        { q: "Can I assign tasks to team members?", a: "Yes, on Lite+ plans and above. Task assignment uses the project affiliation system — only users who are affiliated with a project (owner, partner, funder) can be assigned tasks. Assignees receive notifications." },
        { q: "What is the AI Copilot?", a: "Available on Pro+ plans. The AI Copilot assists with compliance gap analysis, report drafting, and general development questions. It has context-aware modes for different use cases and maintains conversation history." },
      ]
    },
    {
      category: 'ESG & Compliance',
      icon: <Globe className="w-4 h-4" />,
      faqs: [
        { q: "How do I access ESG features?", a: "ESG modules are available for organizations on Pro plans and above with esg_enabled set to true. Navigate to 'ESG Dashboard' from the sidebar to access emissions tracking, supplier management, scenario analysis, and regulatory exposure profiles." },
        { q: "How does Scope 3 emissions tracking work?", a: "Import your suppliers via CSV or manual entry. The platform calculates Scope 3 emissions based on supplier activity data, emission factors, and industry benchmarks. Data quality is tracked (estimated vs. measured vs. verified) to ensure transparency." },
        { q: "What regulatory frameworks does the Rule Engine cover?", a: "The Rule Engine matches your organization's profile (country, actor type, sector) against stored regulatory frameworks. It covers mandatory ESG disclosure requirements, climate reporting mandates, and voluntary frameworks like GRI and TCFD across African jurisdictions." },
      ]
    },
    {
      category: 'Billing & Plans',
      icon: <CreditCard className="w-4 h-4" />,
      faqs: [
        { q: "What subscription plans are available?", a: "We offer 5 tiers: Free (3 projects/month), Lite ($5/month, 10 projects), Pro ($15/month, 40 projects + ESG), Advanced ($30/month, 150 projects + full features), and Enterprise (custom pricing, unlimited). Scholarships are available for qualifying organizations." },
        { q: "How do I apply for a scholarship?", a: "Go to Settings → Billing → Apply for Scholarship. Provide your organization details, mission statement, and proof of eligibility. Scholarships grant Pro-tier access at no cost for qualifying NGOs, community organizations, and educational institutions." },
        { q: "What payment methods are accepted?", a: "We accept payments via Flutterwave and Paystack, supporting credit/debit cards, mobile money (M-Pesa, MTN MoMo), bank transfers, and USSD across African currencies (NGN, KES, ZAR, GHS, UGX, TZS, etc.)." },
        { q: "How do project quotas work?", a: "Each plan has a monthly project quota that refreshes on your billing date. Pro+ plans support rollover — unused quota carries to the next month (up to your plan cap). Quota status is visible in your dashboard." },
      ]
    },
    {
      category: 'Technical Issues',
      icon: <Zap className="w-4 h-4" />,
      faqs: [
        { q: "The map isn't loading — what should I do?", a: "Maps require a stable internet connection. Try: 1) Refresh the page, 2) Clear browser cache, 3) Try a different browser. If maps consistently fail, check if your organization has firewall rules blocking MapLibre or Leaflet tile servers." },
        { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page. Enter your email and you'll receive a password reset link. The link expires in 1 hour. If you signed up with Google or GitHub, use those providers to log in instead." },
        { q: "Can I use DevMapper offline?", a: "DevMapper is a Progressive Web App (PWA). You can install it to your home screen for quick access. Basic viewing works offline, but submitting reports and syncing data requires an internet connection." },
        { q: "My report submission failed — what happened?", a: "Common causes: 1) Project quota exhausted (check plan limits), 2) Missing required fields (title, description, location, SDG goals), 3) Network timeout. Check the error message for specifics. Reports auto-save as drafts." },
      ]
    },
  ];

  const allFaqs = faqCategories.flatMap(cat => cat.faqs.map(faq => ({ ...faq, category: cat.category })));
  const filteredFaqs = faqSearch
    ? allFaqs.filter(f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase()))
    : [];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Support ticket submitted:', ticketForm);
    alert('Support ticket submitted successfully! We\'ll get back to you within 24 hours.');
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Support Center</h1>
        <p className="text-muted-foreground">
          Get help with DevMapper, find answers to common questions, and reach our support team
        </p>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">Knowledge Base</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
          <TabsTrigger value="community">Community Help</TabsTrigger>
        </TabsList>

        {/* Knowledge Base / FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for help (e.g., 'verification', 'ESG', 'billing')..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {faqSearch && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{faqSearch}"</p>
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
                    <p className="font-medium">No results found</p>
                    <p className="text-sm text-muted-foreground">Try different search terms, or contact support directly.</p>
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
                <CardTitle>Submit a Support Ticket</CardTitle>
                <CardDescription>Get personalized help from our support team. Average response: under 24 hours.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="technical">Technical Issue</option>
                      <option value="account">Account & Authentication</option>
                      <option value="reporting">Report Submission</option>
                      <option value="verification">Verification & Trust</option>
                      <option value="billing">Billing & Plans</option>
                      <option value="esg">ESG & Compliance</option>
                      <option value="pm">Project Management</option>
                      <option value="api">API & Integrations</option>
                      <option value="moderation">Moderation Appeal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="low">Low — General question</option>
                      <option value="medium">Medium — Feature not working</option>
                      <option value="high">High — Blocking my work</option>
                      <option value="urgent">Urgent — Data loss or security issue</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of your issue. Include steps to reproduce, browser/device info, and any error messages."
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Submit Ticket</Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mail className="w-4 h-4" />
                    Email Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">General inquiries and technical support</p>
                  <p className="font-medium">support@devmapper.africa</p>
                  <p className="text-xs text-muted-foreground mt-1">Response time: Within 24 hours (business days)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mail className="w-4 h-4" />
                    Partnership Inquiries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">For NGOs, governments, and corporate partners</p>
                  <p className="font-medium">partnerships@devmapper.africa</p>
                  <p className="text-xs text-muted-foreground mt-1">Response time: Within 48 hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="w-4 h-4" />
                    Community Forum
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">Get help from fellow DevMapper users and moderators</p>
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = '/forum'}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Visit Forum
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4" />
                    Support Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span>Monday – Friday</span><span className="text-muted-foreground">9:00 AM – 6:00 PM EAT</span></div>
                    <div className="flex justify-between"><span>Saturday</span><span className="text-muted-foreground">10:00 AM – 2:00 PM EAT</span></div>
                    <div className="flex justify-between"><span>Sunday</span><span className="text-muted-foreground">Closed</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Nairobi, Kenya (UTC+3)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="w-4 h-4" />
                    WhatsApp / Telegram Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">Quick support via messaging platforms</p>
                  <p className="text-sm">WhatsApp: <span className="font-medium">+254 XXX DEVMAP</span></p>
                  <p className="text-sm">Telegram: <span className="font-medium">@DevMapperBot</span></p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* System Status */}
        <TabsContent value="status" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                All Systems Operational
              </CardTitle>
              <CardDescription>Last checked: {new Date().toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: 'Map Services (MapLibre / Leaflet)', status: 'Operational' },
                  { name: 'Report Submission Pipeline', status: 'Operational' },
                  { name: 'User Authentication (Supabase Auth)', status: 'Operational' },
                  { name: 'Analytics Dashboard', status: 'Operational' },
                  { name: 'AI Copilot (Edge Function)', status: 'Operational' },
                  { name: 'ESG Module', status: 'Operational' },
                  { name: 'Project Management', status: 'Operational' },
                  { name: 'Payment Processing (Flutterwave / Paystack)', status: 'Operational' },
                  { name: 'API Gateway', status: 'Operational' },
                  { name: 'File Storage', status: 'Operational' },
                ].map((service, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0">
                    <span className="text-sm">{service.name}</span>
                    <Badge className="bg-green-500/15 text-green-700 border-green-500/30">{service.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uptime History (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-0.5">
                {Array.from({ length: 30 }, (_, i) => (
                  <div key={i} className="flex-1 h-8 bg-green-500/80 rounded-sm" title={`Day ${30 - i}: 100% uptime`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">99.95% uptime over the last 30 days</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Community Help */}
        <TabsContent value="community" className="space-y-6">
          <h2 className="text-2xl font-semibold mb-2">Community Help Resources</h2>
          <p className="text-muted-foreground mb-4">
            Learn from tutorials, guides, and the DevMapper community.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Getting Started Guide', desc: 'Step-by-step walkthrough of setting up your profile and submitting your first report', icon: <BookOpen className="w-5 h-5" />, link: '/training' },
              { title: 'SDG Alignment Handbook', desc: 'How to correctly tag projects with SDG goals and Agenda 2063 aspirations', icon: <Globe className="w-5 h-5" />, link: '/sdg-overview' },
              { title: 'Verification Best Practices', desc: 'Guidelines for citizen, NGO, and government verifiers', icon: <Shield className="w-5 h-5" />, link: '/guidelines' },
              { title: 'Community Forum', desc: 'Ask questions, share insights, and connect with other users across Africa', icon: <MessageSquare className="w-5 h-5" />, link: '/forum' },
              { title: 'API Documentation', desc: 'Comprehensive REST API reference for developers building on DevMapper', icon: <Zap className="w-5 h-5" />, link: '/resources' },
              { title: 'ESG Reporting Guide', desc: 'How to use emissions tracking, supplier management, and scenario analysis', icon: <FileText className="w-5 h-5" />, link: '/esg' },
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
