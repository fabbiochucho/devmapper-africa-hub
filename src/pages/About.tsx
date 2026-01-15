import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Target, Award, Linkedin, Twitter } from 'lucide-react';
import { SEOHead, generateOrganizationSchema } from '@/components/seo/SEOHead';
import WhyNowSection from '@/components/landing/WhyNowSection';
import ImpactMetricsSection from '@/components/landing/ImpactMetricsSection';

const About = () => {
  return (
    <>
      <SEOHead 
        title="About DevMapper - Africa's SDG & ESG Tracking Platform"
        description="Learn about DevMapper's mission to empower communities across Africa to track and verify sustainable development projects aligned with UN SDGs and AU Agenda 2063."
        structuredData={generateOrganizationSchema()}
      />
      
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About DevMapper</h1>
            <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
              Empowering communities across Africa to track, verify, and celebrate sustainable development progress
            </p>
          </div>
        </section>

        {/* Dibadili Institute Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <Card className="border-l-4 border-l-primary">
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
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Target className="w-12 h-12 mx-auto text-primary mb-3" />
                    <h3 className="font-semibold">Our Mission</h3>
                    <p className="text-sm text-muted-foreground">Democratizing development tracking through technology</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Users className="w-12 h-12 mx-auto text-primary mb-3" />
                    <h3 className="font-semibold">Our Approach</h3>
                    <p className="text-sm text-muted-foreground">Community-driven, data-verified, impact-focused</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Award className="w-12 h-12 mx-auto text-primary mb-3" />
                    <h3 className="font-semibold">Our Impact</h3>
                    <p className="text-sm text-muted-foreground">Thousands of projects tracked, millions of lives touched</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why Now Section */}
        <WhyNowSection />

        {/* Impact Metrics Section */}
        <ImpactMetricsSection />

        {/* Chief Development Mappers */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-8">Chief Development Mappers</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="overflow-hidden">
                <CardHeader className="text-center bg-gradient-to-b from-muted/50 to-background pt-8">
                  <img 
                    src="/placeholder.svg" 
                    alt="Pauline Abiola-Oshunniyi"
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-background shadow-lg"
                    loading="lazy"
                  />
                  <CardTitle>Pauline Abiola-Oshunniyi</CardTitle>
                  <p className="text-muted-foreground">Co-Chief Development Mapper</p>
                  <div className="flex justify-center gap-2 mt-2">
                    <a href="#" className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="LinkedIn">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a href="#" className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="Twitter">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
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

              <Card className="overflow-hidden">
                <CardHeader className="text-center bg-gradient-to-b from-muted/50 to-background pt-8">
                  <img 
                    src="/placeholder.svg" 
                    alt="Abiola Oshunniyi"
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-background shadow-lg"
                    loading="lazy"
                  />
                  <CardTitle>Abiola Oshunniyi</CardTitle>
                  <p className="text-muted-foreground">Co-Chief Development Mapper</p>
                  <div className="flex justify-center gap-2 mt-2">
                    <a href="#" className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="LinkedIn">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a href="#" className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="Twitter">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
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
        </section>

        {/* DevMapper Team */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
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
                  <div className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <img 
                      src="/placeholder.svg" 
                      alt="Development Team"
                      className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                      loading="lazy"
                    />
                    <h4 className="font-semibold">Development Team</h4>
                    <p className="text-sm text-muted-foreground">Building robust, scalable solutions</p>
                  </div>
                  <div className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <img 
                      src="/placeholder.svg" 
                      alt="Research Team"
                      className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                      loading="lazy"
                    />
                    <h4 className="font-semibold">Research Team</h4>
                    <p className="text-sm text-muted-foreground">Ensuring data accuracy and insights</p>
                  </div>
                  <div className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <img 
                      src="/placeholder.svg" 
                      alt="Community Team"
                      className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                      loading="lazy"
                    />
                    <h4 className="font-semibold">Community Team</h4>
                    <p className="text-sm text-muted-foreground">Connecting with users across Africa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
};

export default About;
