
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayCircle, BookOpen, Users, Award, Clock, CheckCircle, Star } from 'lucide-react';

const Training = () => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const courses = [
    {
      id: 'basics',
      title: 'DevMapper Basics',
      description: 'Learn the fundamentals of using DevMapper for SDG tracking',
      duration: '2 hours',
      level: 'Beginner',
      lessons: 8,
      progress: 75,
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
      progress: 30,
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
      progress: 0,
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

  const workshops = [
    {
      title: 'SDG Mapping Workshop',
      date: 'January 15, 2025',
      time: '14:00 GMT',
      instructor: 'Dr. Amina Hassan',
      participants: 45,
      maxParticipants: 50,
      description: 'Interactive workshop on mapping SDG projects across Africa'
    },
    {
      title: 'Community Engagement Best Practices',
      date: 'January 22, 2025',
      time: '16:00 GMT',
      instructor: 'John Kwame',
      participants: 32,
      maxParticipants: 40,
      description: 'Learn effective strategies for community engagement in development projects'
    },
    {
      title: 'Data Visualization for Impact',
      date: 'January 29, 2025',
      time: '15:00 GMT',
      instructor: 'Sarah Okonkwo',
      participants: 28,
      maxParticipants: 35,
      description: 'Creating compelling visualizations to communicate project impact'
    }
  ];

  const resources = [
    {
      title: 'SDG Implementation Guide',
      type: 'PDF',
      size: '2.5 MB',
      downloads: 1248,
      description: 'Comprehensive guide to implementing SDG projects in African communities'
    },
    {
      title: 'Report Template Collection',
      type: 'ZIP',
      size: '1.2 MB',
      downloads: 892,
      description: 'Ready-to-use templates for various types of development project reports'
    },
    {
      title: 'Community Engagement Toolkit',
      type: 'PDF',
      size: '3.1 MB',
      downloads: 756,
      description: 'Tools and techniques for effective community participation'
    },
    {
      title: 'Verification Checklist',
      type: 'PDF',
      size: '800 KB',
      downloads: 654,
      description: 'Step-by-step checklist for verifying project reports'
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Training & Education</h1>
        <p className="text-muted-foreground">
          Develop your skills in sustainable development tracking and community engagement
        </p>
      </div>

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
                    <div className="flex items-center justify-between text-sm">
                      <span>{course.lessons} lessons</span>
                      <span>{course.progress}% complete</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
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
                    <Button 
                      className="w-full" 
                      variant={course.progress > 0 ? "default" : "outline"}
                      onClick={() => setSelectedCourse(course.id)}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {course.progress > 0 ? 'Continue' : 'Start Course'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workshops" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Upcoming Workshops</h2>
          <div className="grid gap-4">
            {workshops.map((workshop, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{workshop.title}</CardTitle>
                      <CardDescription className="mt-2">{workshop.description}</CardDescription>
                    </div>
                    <Badge variant="outline">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{workshop.date} at {workshop.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">Instructor: {workshop.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {workshop.participants}/{workshop.maxParticipants} participants
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <Button>Register Now</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Learning Resources</h2>
          <div className="grid gap-4">
            {resources.map((resource, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{resource.title}</h3>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{resource.type} • {resource.size}</span>
                          <span>{resource.downloads} downloads</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline">Download</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Courses Completed</span>
                        <span>2/3</span>
                      </div>
                      <Progress value={66} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Reports Submitted</span>
                        <span>3/5</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Verifications Done</span>
                        <span>0/20</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                  <Button className="w-full">View Certification Requirements</Button>
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
