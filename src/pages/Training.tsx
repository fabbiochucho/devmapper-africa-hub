import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Users, Award, Clock, Star, Info, Download, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TEMPLATES, downloadTemplate } from '@/lib/bulkUploadTemplates';

// Courses are self-guided study paths through DevMapper's own published guides and
// standards pages - there are no separate lesson, enrolment or workshop tables. Progress
// toward certification is computed from real activity (verified reports, verification logs).

const GUIDE_PAGES = {
  overview: '/platform-overview',
  guidelines: '/guidelines',
  sdgOverview: '/sdg-overview',
  search: '/search',
  submitReport: '/submit-report',
  indicators: '/sdg-indicators',
  spvf: '/spvf-standards',
  certWorkflow: '/certification-workflow',
  dspm: '/dspm-methodology',
  verify: '/verify',
  verifiers: '/verifier-marketplace',
} as const;
type GuideKey = keyof typeof GUIDE_PAGES;

const REPORTER_TARGET = 5;
const VERIFIER_TARGET = 20;

const Training = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const courses: { id: string; title: string; description: string; duration: string; level: string; topics: string[]; path: GuideKey[] }[] = [
    {
      id: 'basics',
      title: t('training.courseBasicsTitle'),
      description: t('training.courseBasicsDescription'),
      duration: t('training.courseBasicsDuration'),
      level: 'Beginner',
      topics: Array.from({ length: 8 }, (_, i) => t(`training.courseBasicsTopic${i + 1}`)),
      path: ['overview', 'guidelines', 'sdgOverview', 'search', 'submitReport'],
    },
    {
      id: 'reporting',
      title: t('training.courseReportingTitle'),
      description: t('training.courseReportingDescription'),
      duration: t('training.courseReportingDuration'),
      level: 'Intermediate',
      topics: Array.from({ length: 12 }, (_, i) => t(`training.courseReportingTopic${i + 1}`)),
      path: ['guidelines', 'submitReport', 'indicators', 'spvf'],
    },
    {
      id: 'verification',
      title: t('training.courseVerificationTitle'),
      description: t('training.courseVerificationDescription'),
      duration: t('training.courseVerificationDuration'),
      level: 'Advanced',
      topics: Array.from({ length: 15 }, (_, i) => t(`training.courseVerificationTopic${i + 1}`)),
      path: ['certWorkflow', 'dspm', 'spvf', 'verify', 'verifiers'],
    },
  ];

  // Certification progress from real activity.
  const [progress, setProgress] = useState<{ verifiedReports: number; reviews: number } | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [reports, reviews] = await Promise.all([
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_verified', true),
        supabase.from('verification_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      if (!cancelled) setProgress({ verifiedReports: reports.count ?? 0, reviews: reviews.count ?? 0 });
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Workshop requests go through the contact pipeline (saved + admins notified + emailed).
  const [workshop, setWorkshop] = useState({ name: '', email: '', organisation: '', topic: '', message: '' });
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (user?.email) setWorkshop((w) => (w.email ? w : { ...w, email: user.email ?? '' }));
  }, [user]);
  const requestWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.functions.invoke('send-contact-email', {
      body: {
        name: workshop.name,
        email: workshop.email,
        subject: `Workshop request: ${workshop.topic || 'General'}`,
        message: `Organisation: ${workshop.organisation || '-'}\nTopic: ${workshop.topic || '-'}\n\n${workshop.message}`,
      },
    });
    setSending(false);
    if (error) {
      toast.error(t('training.workshopError'));
      return;
    }
    toast.success(t('training.workshopSent'));
    setWorkshop((w) => ({ ...w, organisation: '', topic: '', message: '' }));
  };

  const ProgressRow = ({ label, value, target }: { label: string; value: number; target: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{Math.min(value, target)} / {target}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (value / target) * 100)}%` }} />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('training.pageTitle')}</h1>
        <p className="text-muted-foreground">
          {t('training.pageSubtitle')}
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t('training.previewBannerPrefix')}{' '}
          <a href="/support" className="underline font-medium">{t('training.previewBannerLinkText')}</a>{t('training.previewBannerSuffix')}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="courses">{t('training.tabCourses')}</TabsTrigger>
          <TabsTrigger value="workshops">{t('training.tabWorkshops')}</TabsTrigger>
          <TabsTrigger value="resources">{t('training.tabResources')}</TabsTrigger>
          <TabsTrigger value="certification">{t('training.tabCertification')}</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={course.level === 'Beginner' ? 'default' : course.level === 'Intermediate' ? 'secondary' : 'destructive'}>
                      {course.level}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t('training.courseTopicsLabel')}</p>
                      <div className="flex flex-wrap gap-1">
                        {course.topics.slice(0, 3).map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {course.topics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            {t('training.moreTopics', { count: course.topics.length - 3 })}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium">{t('training.studyPathLabel')}</p>
                      <ol className="space-y-1 text-sm">
                        {course.path.map((key, i) => (
                          <li key={key}>
                            <Link to={GUIDE_PAGES[key]} className="text-primary hover:underline">
                              {i + 1}. {t(`training.guide.${key}`)}
                            </Link>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <Button className="w-full" asChild>
                      <Link to={GUIDE_PAGES[course.path[0]]}>
                        {t('training.startCourse')} <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workshops" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">{t('training.workshopsTitle')}</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Users className="w-5 h-5" />{t('training.workshopRequestTitle')}</CardTitle>
              <CardDescription>{t('training.workshopsIntro')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={requestWorkshop} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ws-name">{t('training.workshopName')}</Label>
                  <Input id="ws-name" required value={workshop.name} onChange={(e) => setWorkshop({ ...workshop, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ws-email">{t('training.workshopEmail')}</Label>
                  <Input id="ws-email" type="email" required value={workshop.email} onChange={(e) => setWorkshop({ ...workshop, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ws-org">{t('training.workshopOrg')}</Label>
                  <Input id="ws-org" value={workshop.organisation} onChange={(e) => setWorkshop({ ...workshop, organisation: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ws-topic">{t('training.workshopTopic')}</Label>
                  <select
                    id="ws-topic"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={workshop.topic}
                    onChange={(e) => setWorkshop({ ...workshop, topic: e.target.value })}
                  >
                    <option value="">{t('training.workshopTopicAny')}</option>
                    {courses.map((c) => <option key={c.id} value={c.title}>{c.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ws-message">{t('training.workshopMessage')}</Label>
                  <Textarea id="ws-message" required rows={4} value={workshop.message} onChange={(e) => setWorkshop({ ...workshop, message: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={sending}>{sending ? t('training.workshopSending') : t('training.workshopSubmit')}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">{t('training.resourcesTitle')}</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('training.templatesTitle')}</CardTitle>
              <CardDescription>{t('training.templatesDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {TEMPLATES.map((tpl) => (
                <div key={tpl.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{tpl.label}</p>
                    <p className="text-xs text-muted-foreground">{tpl.description}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => downloadTemplate(tpl)}>
                    <Download className="w-4 h-4 mr-1" />CSV
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="w-5 h-5" />{t('training.guidesTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {(['guidelines', 'spvf', 'dspm', 'certWorkflow', 'indicators', 'sdgOverview'] as GuideKey[]).map((key) => (
                <Link key={key} to={GUIDE_PAGES[key]} className="rounded-lg border p-3 text-sm text-primary hover:bg-muted">
                  {t(`training.guide.${key}`)}
                </Link>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-6 h-6" />
                DevMapper Certification Program
              </CardTitle>
              <CardDescription>
                Earn recognition for your expertise in sustainable development tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Certification Levels</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Certified Reporter</p>
                        <p className="text-sm text-muted-foreground">Submit {REPORTER_TARGET} reports that pass verification</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Certified Verifier</p>
                        <p className="text-sm text-muted-foreground">Complete {VERIFIER_TARGET} verification reviews</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Certified Trainer</p>
                        <p className="text-sm text-muted-foreground">Awarded by nomination to members who lead workshops and mentor others</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{t('training.progressTitle')}</h3>
                  {!user ? (
                    <p className="text-sm text-muted-foreground">
                      <Link to="/auth" className="text-primary underline">{t('training.progressSignIn')}</Link>
                    </p>
                  ) : !progress ? (
                    <p className="text-sm text-muted-foreground">{t('training.progressLoading')}</p>
                  ) : (
                    <div className="space-y-4">
                      <ProgressRow label={t('training.progressVerifiedReports')} value={progress.verifiedReports} target={REPORTER_TARGET} />
                      <ProgressRow label={t('training.progressReviews')} value={progress.reviews} target={VERIFIER_TARGET} />
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/submit-report">{t('training.guide.submitReport')}</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Training;
