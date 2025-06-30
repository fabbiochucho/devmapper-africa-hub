
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Target, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About DevMapper</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Empowering communities across Africa to track, verify, and celebrate sustainable development progress
        </p>
      </div>

      {/* Dibadili Institute Section */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Dibadili Institute</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p className="text-lg leading-relaxed mb-4">
            Dibadili Institute is a leading African development research and innovation hub dedicated to advancing 
            sustainable development across the continent. Founded on the principles of community-driven change and 
            data-driven decision making, we bridge the gap between grassroots initiatives and global development goals.
          </p>
          <p className="text-lg leading-relaxed mb-4">
            Our mission is to empower communities, organizations, and governments with the tools and insights needed 
            to create lasting positive change. Through DevMapper, we're revolutionizing how development projects are 
            tracked, verified, and celebrated across Africa.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <Target className="w-12 h-12 mx-auto text-green-600 mb-3" />
              <h3 className="font-semibold">Our Mission</h3>
              <p className="text-sm text-muted-foreground">Democratizing development tracking through technology</p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto text-blue-600 mb-3" />
              <h3 className="font-semibold">Our Approach</h3>
              <p className="text-sm text-muted-foreground">Community-driven, data-verified, impact-focused</p>
            </div>
            <div className="text-center">
              <Award className="w-12 h-12 mx-auto text-purple-600 mb-3" />
              <h3 className="font-semibold">Our Impact</h3>
              <p className="text-sm text-muted-foreground">Thousands of projects tracked, millions of lives touched</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chief Development Mappers */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Chief Development Mappers</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="text-center">
              <img 
                src="/placeholder.svg" 
                alt="Pauline Abiola-Oshunniyi"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <CardTitle>Pauline Abiola-Oshunniyi</CardTitle>
              <p className="text-muted-foreground">Co-Chief Development Mapper</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed mb-4">
                Pauline brings over 15 years of experience in international development, with a focus on 
                community engagement and sustainable project implementation. She has led development 
                initiatives across West and East Africa, specializing in education, health, and women's 
                empowerment programs.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Development Strategy</Badge>
                <Badge variant="secondary">Community Engagement</Badge>
                <Badge variant="secondary">Women's Empowerment</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <img 
                src="/placeholder.svg" 
                alt="Abiola Oshunniyi"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <CardTitle>Abiola Oshunniyi</CardTitle>
              <p className="text-muted-foreground">Co-Chief Development Mapper</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed mb-4">
                Abiola is a technology innovator and development economist with expertise in data analytics 
                and digital transformation. He has architected several technology solutions for development 
                organizations and brings deep technical knowledge to sustainable development tracking and 
                verification systems.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Technology Innovation</Badge>
                <Badge variant="secondary">Data Analytics</Badge>
                <Badge variant="secondary">Digital Transformation</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DevMapper Team */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">The DevMapper Team</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-8">
            Our diverse team of developers, researchers, and community advocates work tirelessly to 
            build and maintain the DevMapper platform.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <img 
                src="/placeholder.svg" 
                alt="Team Member"
                className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
              />
              <h4 className="font-semibold">Development Team</h4>
              <p className="text-sm text-muted-foreground">Building robust, scalable solutions</p>
            </div>
            <div className="text-center">
              <img 
                src="/placeholder.svg" 
                alt="Team Member"
                className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
              />
              <h4 className="font-semibold">Research Team</h4>
              <p className="text-sm text-muted-foreground">Ensuring data accuracy and insights</p>
            </div>
            <div className="text-center">
              <img 
                src="/placeholder.svg" 
                alt="Team Member"
                className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
              />
              <h4 className="font-semibold">Community Team</h4>
              <p className="text-sm text-muted-foreground">Connecting with users across Africa</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
