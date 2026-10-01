
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Users, Award, Clock, Star, Info } from 'lucide-react';

// This page has no backing courses/enrollments/workshops/certifications
// tables yet - everything below is a preview of planned curriculum, not
// live content. Do not add per-user progress, dates, instructor names, or
// download counts without a real table behind them.
const Training = () => {
  const { t } = useTranslation();
  const courses = [
    {
      id: 'basics',
      title: t('training.courseBasicsTitle'),
      description: t('training.courseBasicsDescription'),
      duration: t('training.courseBasicsDuration'),
      level: 'Beginner',
      lessons: 8,
      topics: [
        t('training.courseBasicsTopic1'),
        t('training.courseBasicsTopic2'),
        t('training.courseBasicsTopic3'),
        t('training.courseBasicsTopic4'),
        t('training.courseBasicsTopic5'),
        t('training.courseBasicsTopic6'),
        t('training.courseBasicsTopic7'),
        t('training.courseBasicsTopic8'),
      ]
    },
    {
      id: 'reporting',
      title: t('training.courseReportingTitle'),
      description: t('training.courseReportingDescription'),
      duration: t('training.courseReportingDuration'),
      level: 'Intermediate',
      lessons: 12,
      topics: [
        t('training.courseReportingTopic1'),
        t('training.courseReportingTopic2'),
        t('training.courseReportingTopic3'),
        t('training.courseReportingTopic4'),
        t('training.courseReportingTopic5'),
        t('training.courseReportingTopic6'),
        t('training.courseReportingTopic7'),
        t('training.courseReportingTopic8'),
        t('training.courseReportingTopic9'),
        t('training.courseReportingTopic10'),
        t('training.courseReportingTopic11'),
        t('training.courseReportingTopic12'),
      ]
    },
    {
      id: 'verification',
      title: t('training.courseVerificationTitle'),
      description: t('training.courseVerificationDescription'),
      duration: t('training.courseVerificationDuration'),
      level: 'Advanced',
      lessons: 15,
      topics: [
        t('training.courseVerificationTopic1'),
        t('training.courseVerificationTopic2'),
        t('training.courseVerificationTopic3'),
        t('training.courseVerificationTopic4'),
        t('training.courseVerificationTopic5'),
        t('training.courseVerificationTopic6'),
        t('training.courseVerificationTopic7'),
        t('training.courseVerificationTopic8'),
        t('training.courseVerificationTopic9'),
        t('training.courseVerificationTopic10'),
        t('training.courseVerificationTopic11'),
        t('training.courseVerificationTopic12'),
        t('training.courseVerificationTopic13'),
        t('training.courseVerificationTopic14'),
        t('training.courseVerificationTopic15'),
      ]
    }
  ];

  // Workshop scheduling and downloadable resources aren't live yet either -
  // no fabricated instructor names, dates, or download counts in the
  // meantime (see the "coming soon" states in each tab below).

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">{t('training.tabCourses')}</TabsTrigger>
          <TabsTrigger value="workshops">{t('training.tabWorkshops')}</TabsTrigger>
          <TabsTrigger value="resources">{t('training.tabResources')}</TabsTrigger>
          <TabsTrigger value="certification">{t('training.tabCertification')}</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
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
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">{t('training.lessonsPlanned', { count: course.lessons })}</div>
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
                    <Button className="w-full" variant="outline" disabled>
                      {t('training.comingSoon')}
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
            <CardContent className="py-16 text-center text-muted-foreground">
              <Users className="mx-auto h-10 w-10 mb-3 text-gray-400" />
              <p>{t('training.noWorkshopsMessage')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">{t('training.resourcesTitle')}</h2>
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <BookOpen className="mx-auto h-10 w-10 mb-3 text-gray-400" />
              <p>{t('training.noResourcesMessage')}</p>
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
                        <p className="text-sm text-muted-foreground">Complete basic training and submit 5 verified reports</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Certified Verifier</p>
                        <p className="text-sm text-muted-foreground">Complete verification training and review 20 reports</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Certified Trainer</p>
                        <p className="text-sm text-muted-foreground">Lead workshops and mentor new community members</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Your Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Certification progress tracking isn't live yet — there's nothing here to show until courses
                    and verification counts are wired up to your account.
                  </p>
                  <Button className="w-full" variant="outline" disabled>Coming Soon</Button>
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
