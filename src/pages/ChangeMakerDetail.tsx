import { useParams, Link } from 'react-router-dom';
import { mockChangeMakers, ChangeMaker } from '@/data/mockChangeMakers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SEOHead, generateChangeMakerSchema } from '@/components/seo/SEOHead';
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Users,
  Heart,
  Building,
  CheckCircle,
  ArrowLeft,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  DollarSign,
  Target,
  Award,
} from 'lucide-react';

const sdgColors: Record<string, string> = {
  '1': 'bg-red-600',
  '2': 'bg-yellow-500',
  '3': 'bg-green-500',
  '4': 'bg-red-500',
  '5': 'bg-orange-500',
  '6': 'bg-cyan-500',
  '7': 'bg-yellow-400',
  '8': 'bg-rose-600',
  '9': 'bg-orange-400',
  '10': 'bg-pink-500',
  '11': 'bg-amber-500',
  '12': 'bg-amber-600',
  '13': 'bg-green-600',
  '14': 'bg-blue-500',
  '15': 'bg-green-400',
  '16': 'bg-blue-600',
  '17': 'bg-blue-800',
};

const typeLabels: Record<string, { label: string; color: string }> = {
  individual: { label: 'Individual', color: 'bg-blue-500' },
  group: { label: 'Group', color: 'bg-purple-500' },
  ngo: { label: 'NGO', color: 'bg-green-500' },
  corporate: { label: 'Corporate', color: 'bg-amber-500' },
};

const ChangeMakerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const changeMaker = mockChangeMakers.find((cm) => cm.id === id);

  if (!changeMaker) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Change Maker Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The change maker you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/change-makers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Change Makers
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const typeInfo = typeLabels[changeMaker.type];

  return (
    <>
      <SEOHead
        title={`${changeMaker.name} - Dev Mapper Change Maker`}
        description={changeMaker.description}
        keywords={['change maker', 'SDG', 'Africa', changeMaker.location, ...changeMaker.sdg_goals.map(g => `SDG ${g}`)]}
        structuredData={generateChangeMakerSchema({
          name: changeMaker.name,
          description: changeMaker.description,
          location: changeMaker.location,
          type: changeMaker.type,
          website: changeMaker.website,
        })}
      />

      <div className="container mx-auto py-8 px-4">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/change-makers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Change Makers
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={changeMaker.photo} alt={changeMaker.name} />
                  <AvatarFallback className="text-2xl">
                    {changeMaker.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-2xl">{changeMaker.name}</CardTitle>
                    {changeMaker.verified && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={`${typeInfo.color} text-white`}>
                      {typeInfo.label}
                    </Badge>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {changeMaker.location}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bio */}
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{changeMaker.bio}</p>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Mission & Impact</h3>
                <p className="text-muted-foreground">{changeMaker.description}</p>
              </div>

              <Separator />

              {/* SDG Goals */}
              <div>
                <h3 className="font-semibold mb-3">SDG Focus Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {changeMaker.sdg_goals.map((goal) => (
                    <Badge
                      key={goal}
                      className={`${sdgColors[goal] || 'bg-gray-500'} text-white`}
                    >
                      SDG {goal}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href={`mailto:${changeMaker.email}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {changeMaker.email}
                  </a>
                  {changeMaker.phone && (
                    <a
                      href={`tel:${changeMaker.phone}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {changeMaker.phone}
                    </a>
                  )}
                  {changeMaker.website && (
                    <a
                      href={changeMaker.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>

                {/* Social Media */}
                {changeMaker.socialMedia && (
                  <div className="flex gap-3 mt-4">
                    {changeMaker.socialMedia.linkedin && (
                      <a
                        href={changeMaker.socialMedia.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {changeMaker.socialMedia.twitter && (
                      <a
                        href={changeMaker.socialMedia.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {changeMaker.socialMedia.facebook && (
                      <a
                        href={changeMaker.socialMedia.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {changeMaker.socialMedia.instagram && (
                      <a
                        href={changeMaker.socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Group Members */}
              {changeMaker.type === 'group' && changeMaker.members && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Team Members</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {changeMaker.members.map((member, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarImage src={member.photo} alt={member.name} />
                              <AvatarFallback>
                                {member.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {member.role}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {member.bio}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Verification Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-primary" />
                  Verification Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold text-primary">
                    {changeMaker.verification_score}%
                  </span>
                </div>
                <Progress value={changeMaker.verification_score} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {changeMaker.verifications.length} verification
                  {changeMaker.verifications.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            {/* Impact Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Impact Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Lives Touched</span>
                  </div>
                  <span className="font-semibold">
                    {changeMaker.impactMetrics.livesTouched.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Communities Served</span>
                  </div>
                  <span className="font-semibold">
                    {changeMaker.impactMetrics.communitiesServed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Projects Completed</span>
                  </div>
                  <span className="font-semibold">
                    {changeMaker.impactMetrics.projectsCompleted}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Funding */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Total Funding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-center">
                  {formatCurrency(changeMaker.totalFunding)}
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button className="w-full" asChild>
                  <Link to={`/fundraising?changemaker=${changeMaker.id}`}>
                    Support This Change Maker
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:${changeMaker.email}`}>Contact</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangeMakerDetail;
