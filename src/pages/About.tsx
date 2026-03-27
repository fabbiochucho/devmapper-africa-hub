import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Target, Award, Linkedin, Twitter, Globe, GraduationCap, Heart, Building, Zap, BookOpen, ExternalLink, Briefcase, Shield } from 'lucide-react';
import { SEOHead, generateOrganizationSchema } from '@/components/seo/SEOHead';
import WhyNowSection from '@/components/landing/WhyNowSection';
import ImpactMetricsSection from '@/components/landing/ImpactMetricsSection';
import { Button } from '@/components/ui/button';

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

        {/* DiBadili Institute / Become Change Institute */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-2xl text-center">DiBadili Institute</CardTitle>
                <p className="text-center text-muted-foreground italic">"Become Change" — The Become Change Institute</p>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="text-lg leading-relaxed mb-4">
                  DiBadili Institute (the <strong>Become Change Institute</strong>) is an African development research and innovation 
                  hub dedicated to advancing sustainable development across the continent. Founded on the principles of community-driven 
                  change, data-driven decision making, and tri-sector systems strengthening, we bridge the gap between grassroots 
                  initiatives and global development goals.
                </p>
                <p className="text-lg leading-relaxed mb-4">
                  Our mission is to empower communities, organizations, and governments with the tools and insights needed to create 
                  lasting positive change. Through DevMapper, we're revolutionizing how development projects are tracked, verified, 
                  and celebrated across all 54 African nations — connecting SDG progress with AU Agenda 2063 aspirations and ESG 
                  compliance frameworks.
                </p>
                <p className="text-lg leading-relaxed mb-4">
46:                   Working at the intersection of policy, financing, governance, and execution, we support DevMapper's strategic 
                  positioning as development intelligence infrastructure for Africa's most complex challenges.
                </p>
                <div className="grid md:grid-cols-4 gap-6 mt-8">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Target className="w-10 h-10 mx-auto text-primary mb-3" />
                    <h3 className="font-semibold text-sm">Our Mission</h3>
                    <p className="text-xs text-muted-foreground">Democratizing development tracking through technology and systems thinking</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Users className="w-10 h-10 mx-auto text-primary mb-3" />
                    <h3 className="font-semibold text-sm">Our Approach</h3>
                    <p className="text-xs text-muted-foreground">Community-driven, data-verified, tri-sector, impact-focused</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Award className="w-10 h-10 mx-auto text-primary mb-3" />
                    <h3 className="font-semibold text-sm">Our Impact</h3>
                    <p className="text-xs text-muted-foreground">100M+ people reached, 20+ African countries, $500M+ mobilized</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Building className="w-10 h-10 mx-auto text-primary mb-3" />
                    <h3 className="font-semibold text-sm">Our Partners</h3>
                    <p className="text-xs text-muted-foreground">World Bank, USAID, BMGF, Global Fund, WHO, Africa CDC</p>
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
            <h2 className="text-3xl font-bold text-center mb-3">Chief Development Mappers</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
              DevMapper is led by two extraordinary professionals combining decades of experience in global development, 
              health systems, ESG governance, education, and community empowerment.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Abiola Oshunniyi */}
              <Card className="overflow-hidden">
                <CardHeader className="text-center bg-gradient-to-b from-muted/50 to-background pt-8">
                  <img 
                    src="/placeholder.svg" 
                    alt="Abiola Oshunniyi"
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-background shadow-lg"
                    loading="lazy"
                  />
                  <CardTitle className="text-xl">Abiola Oshunniyi</CardTitle>
                  <p className="text-muted-foreground text-sm">Co-Chief Development Mapper & Platform Architect</p>
                  <p className="text-xs text-muted-foreground italic mt-1">Global Development Tri-Sector Strategist</p>
                  <div className="flex justify-center gap-2 mt-3">
                    <a href="https://www.linkedin.com/in/abiolaoshunniyi" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="LinkedIn">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a href="https://abiolaoshunniyi.lovable.app" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="Website">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm leading-relaxed">
                    Abiola Oshunniyi is a <strong>Global Development Tri-Sector Strategist and Systems Strengthening Expert</strong> with 
                    nearly two decades of experience spanning public health, sustainability, governance, and digital transformation. He 
                    advises governments, donors, and corporations, translating evidence, policy, and technology into measurable public value.
                  </p>
                  <p className="text-sm leading-relaxed">
                    He is the <strong>Co-founder of DiBadili Institute</strong> (Become Change Institute) and <strong>Chief Executive/Responsibility 
                    Officer at ParallelPoint Consult</strong>. Credited with one of the three early global digital COVID-19 response successes, 
                    he also led Africa's largest mHealth CommCare deployment and pioneered ESG frameworks across emerging markets.
                  </p>

                  {/* Impact Stats */}
                  <div className="grid grid-cols-4 gap-2 py-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">100M+</p>
                      <p className="text-[10px] text-muted-foreground">People Reached</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">100K+</p>
                      <p className="text-[10px] text-muted-foreground">Health Workers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">$500M+</p>
                      <p className="text-[10px] text-muted-foreground">Mobilized</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">20+</p>
                      <p className="text-[10px] text-muted-foreground">Countries</p>
                    </div>
                  </div>

                  {/* Key Organizations */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trusted By</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {['World Bank', 'USAID', 'BMGF', 'Global Fund', 'CHAI', 'UNICEF', 'WHO', 'Africa CDC', 'UNFPA'].map(org => (
                        <Badge key={org} variant="outline" className="text-[10px] px-1.5 py-0">{org}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Awards */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recognition</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-start gap-1.5"><Award className="w-3 h-3 text-primary mt-0.5 shrink-0" /> Global Sustainability Award — GCPIT (2023)</li>
                      <li className="flex items-start gap-1.5"><Award className="w-3 h-3 text-primary mt-0.5 shrink-0" /> Mentor of the Year — HealthTech Hub Africa (2023)</li>
                      <li className="flex items-start gap-1.5"><Award className="w-3 h-3 text-primary mt-0.5 shrink-0" /> Global Health Supply Chain Summit Prize Finalist (2019)</li>
                      <li className="flex items-start gap-1.5"><Award className="w-3 h-3 text-primary mt-0.5 shrink-0" /> Young Leaders Award — Mandela Washington Fellowship (2017)</li>
                    </ul>
                  </div>

                  {/* Education */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Education & Training</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {['Cambridge CISL', 'Harvard Medical School', 'MIT', 'UCLA Anderson', 'University of Edinburgh', 'University of Washington', 'Lagos Business School', 'Business School Netherlands'].map(inst => (
                        <Badge key={inst} variant="secondary" className="text-[10px] px-1.5 py-0">{inst}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Mentorship */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mentorship & Leadership</h4>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      <li>• Co-Curator — DELT-Her initiative (NASENI/PICTT)</li>
                      <li>• Mentor — Villgro Africa, TechStars, Novartis/Bridge for Billions</li>
                      <li>• Academy of Public Health, PMDAN/IPMA Member</li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge>Health Systems</Badge>
                    <Badge>ESG & Sustainability</Badge>
                    <Badge>Digital Health</Badge>
                    <Badge>Governance</Badge>
                    <Badge>Systems Strengthening</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Pauline Abiola-Oshunniyi */}
              <Card className="overflow-hidden">
                <CardHeader className="text-center bg-gradient-to-b from-muted/50 to-background pt-8">
                  <img 
                    src="/placeholder.svg" 
                    alt="Pauline Abiola-Oshunniyi"
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-background shadow-lg"
                    loading="lazy"
                  />
                  <CardTitle className="text-xl">Pauline Abiola-Oshunniyi</CardTitle>
                   <p className="text-muted-foreground text-sm">Co-Chief Development Mapper & Community Lead</p>
                   <p className="text-xs text-muted-foreground italic mt-1">International Development and Systems Leadership Strategist</p>
                  <div className="flex justify-center gap-2 mt-3">
                    <a href="https://www.linkedin.com/in/paulineabiolaoshunniyi" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="LinkedIn">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm leading-relaxed">
                    Pauline Abiola-Oshunniyi is an <strong>award-winning international development professional, sustainability strategist, and systems leadership advocate</strong> working at the intersection of governance, ESG, and sustainable development across Africa.
                  </p>
                  <p className="text-sm leading-relaxed">
                    With more than two decades of experience across development practice, policy engagement, and institutional leadership, Pauline works with governments, development institutions, and private sector partners to design solutions that strengthen systems, empower communities, and support Africa's transition toward resilient and sustainable economies.
                  </p>
                  <p className="text-sm leading-relaxed">
                    She consults at the executive level through fractional leadership, strategic advisory, board-level engagement, and international speaking focused on sustainability, governance, systems strengthening, and future-ready leadership. Her work centers on translating complex development challenges into actionable strategies that strengthen institutions and unlock sustainable growth.
                  </p>
                  <p className="text-sm leading-relaxed">
                    Pauline is a pioneer Fellow of the <strong>Mandela Washington Fellowship</strong> under the Young African Leaders Initiative and a <strong>Vital Voices Global Partnership Lead Fellow</strong>. Her leadership has supported the design of partnerships with regional and global institutions, facilitated multi-stakeholder dialogues across Africa, and contributed to initiatives mobilizing development finance for institutional strengthening and sustainable development programs.
                  </p>

                  {/* Recognition */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recognition</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-start gap-1.5"><Award className="w-3 h-3 text-primary mt-0.5 shrink-0" /> UN Habitat Emerging Community Champion Award</li>
                      <li className="flex items-start gap-1.5"><Award className="w-3 h-3 text-primary mt-0.5 shrink-0" /> Transform Kenya Awards</li>
                      <li className="flex items-start gap-1.5"><Award className="w-3 h-3 text-primary mt-0.5 shrink-0" /> AU / UN OCHA Helping Hands Award</li>
                      <li className="flex items-start gap-1.5"><Award className="w-3 h-3 text-primary mt-0.5 shrink-0" /> Mandela Washington Fellowship Pioneer Fellow</li>
                      <li className="flex items-start gap-1.5"><Award className="w-3 h-3 text-primary mt-0.5 shrink-0" /> Vital Voices Global Partnership Lead Fellow</li>
                    </ul>
                  </div>

                  {/* Core Focus Areas */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Core Focus Areas</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                        <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Sustainability & ESG</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                        <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Governance & Policy</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                        <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Systems Leadership</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                        <Heart className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Community Empowerment</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                        <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Strategic Advisory</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                        <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Institutional Strengthening</span>
                      </div>
                    </div>
                  </div>

                  {/* Regional Experience */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Regional Experience</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {['Kenya', 'Nigeria', 'Uganda', 'Tanzania', 'Rwanda', 'Ghana', 'South Africa'].map(country => (
                        <Badge key={country} variant="outline" className="text-[10px] px-1.5 py-0">
                          <MapPin className="w-2.5 h-2.5 mr-0.5" />{country}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* DevMapper Role */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">DevMapper Role</h4>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      <li>• Co-leads strategic vision and institutional partnerships</li>
                      <li>• Designs community engagement and stakeholder coordination strategy</li>
                      <li>• Champions multilingual and inclusive platform design</li>
                      <li>• Oversees change maker nomination and recognition programs</li>
                      <li>• Drives sustainability advisory and governance initiatives</li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge>Sustainability</Badge>
                    <Badge>Governance</Badge>
                    <Badge>Systems Leadership</Badge>
                    <Badge>Strategic Advisory</Badge>
                    <Badge>Community Empowerment</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>



        {/* DevMapper Team */}
        <section className="py-16 bg-muted/30">
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
                    <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-primary/10 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-semibold">Development Team</h4>
                    <p className="text-sm text-muted-foreground">Building robust, scalable solutions for Africa's development data infrastructure</p>
                  </div>
                  <div className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-semibold">Research Team</h4>
                    <p className="text-sm text-muted-foreground">Ensuring data accuracy, SDG alignment validation, and evidence-based insights</p>
                  </div>
                  <div className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-primary/10 flex items-center justify-center">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-semibold">Community Team</h4>
                    <p className="text-sm text-muted-foreground">Connecting with users across Africa, supporting change makers and grassroots validators</p>
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
