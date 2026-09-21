
import React from 'react';
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
  const courses = [
    {
      id: 'basics',
      title: 'DevMapper Basics',
      description: 'Learn the fundamentals of using DevMapper for SDG tracking',
      duration: '2 hours',
      level: 'Beginner',
      lessons: 8,
      topics: [
        'Platform Overview',
        'Creating Your Profile',
        'Understanding SDGs',
        'Basic Report Submission',
        'Reading Maps and Data',
        'Community Guidelines',
        'Verification Process',
        'Getting Help'
      ]
    },
    {
      id: 'reporting',
      title: 'Advanced Reporting',
      description: 'Master the art of comprehensive project reporting',
      duration: '3 hours',
      level: 'Intermediate',
      lessons: 12,
      topics: [
        'Data Collection Best Practices',
        'Photo Documentation',
        'GPS Coordinates',
        'Impact Measurement',
        'Stakeholder Engagement',
        'Progress Updates',
        'Evidence Gathering',
        'Quality Assurance',
        'Report Templates',
        'Common Mistakes',
        'Review Process',
        'Publication Guidelines'
      ]
    },
    {
      id: 'verification',
      title: 'Data Verification',
      description: 'Learn to verify and validate community reports',
      duration: '4 hours',
      level: 'Advanced',
      lessons: 15,
      topics: [
        'Verification Principles',
        'Source Validation',
        'Cross-referencing',
        'Expert Review',
        'Community Validation',
        'Red Flags',
        'Verification Tools',
        'Documentation Standards',
        'Conflict Resolution',
        'Appeal Process',
        'Quality Metrics',
        'Reviewer Guidelines',
        'Bias Prevention',
        'Continuous Improvement',
        'Certification Process'
      ]
    }
  ];

  // Workshop scheduling and downloadable resources aren't live yet either -
  // no fabricated instructor names, dates, or download counts in the
  // meantime (see the "coming soon" states in each tab below).

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Training & Education</h1>
        <p className="text-muted-foreground">
          Develop your skills in sustainable development tracking and community engagement
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          This is a preview of planned training content — course delivery, workshop scheduling, downloadable
          resources, and certification tracking aren't live yet. For help right now, see the FAQs on the{' '}
          <a href="/support" className="underline font-medium">Support page</a>.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="workshops">Workshops</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="certification">Certification</TabsTrigger>
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
                    <div className="text-sm text-muted-foreground">{course.lessons} lessons planned</div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Course Topics:</p>
                      <div className="flex flex-wrap gap-1">
                        {course.topics.slice(0, 3).map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {course.topics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{course.topics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button className="w-full" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workshops" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Workshops</h2>
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Users className="mx-auto h-10 w-10 mb-3 text-gray-400" />
              <p>No workshops are scheduled yet. Check back soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Learning Resources</h2>
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <BookOpen className="mx-auto h-10 w-10 mb-3 text-gray-400" />
              <p>No downloadable resources are available yet. Check back soon.</p>
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
