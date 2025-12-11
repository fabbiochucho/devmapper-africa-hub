
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MapPin, Target, Search, Grid, Map, BarChart3 } from "lucide-react";
import { mockChangeMakers, ChangeMaker } from "@/data/mockChangeMakers";
import { sdgGoals } from "@/lib/constants";
import ChangeMakerMap from "@/components/changemaker/ChangeMakerMap";
import ChangeMakerAnalytics from "@/components/changemaker/ChangeMakerAnalytics";
import { SEOHead } from "@/components/seo/SEOHead";

const ChangeMakers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSDG, setFilterSDG] = useState<string>("all");

  const filteredChangeMakers = mockChangeMakers.filter(maker => {
    const matchesSearch = maker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         maker.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || maker.type === filterType;
    const matchesSDG = filterSDG === "all" || maker.sdg_goals.includes(filterSDG);
    
    return matchesSearch && matchesType && matchesSDG;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800';
      case 'group': return 'bg-green-100 text-green-800';
      case 'ngo': return 'bg-purple-100 text-purple-800';
      case 'corporate': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(amount);
  };

  return (
    <>
      <SEOHead
        title="Change Makers - Dev Mapper"
        description="Discover champions driving sustainable development across Africa. Connect with individuals, NGOs, and organizations making real impact on SDG goals."
        keywords={['change makers', 'SDG champions', 'Africa sustainability', 'social impact', 'development', 'NGO']}
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Change Makers</h1>
            <p className="text-muted-foreground">
              Champions driving sustainable development across Africa
            </p>
          </div>
        </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">
            <Grid className="mr-2 h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="map">
            <Map className="mr-2 h-4 w-4" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search change makers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="ngo">NGO</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSDG} onValueChange={setFilterSDG}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by SDG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SDGs</SelectItem>
                {sdgGoals.map((sdg) => (
                  <SelectItem key={sdg.number} value={sdg.number.toString()}>
                    SDG {sdg.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Change Makers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChangeMakers.map((maker) => (
              <Link key={maker.id} to={`/change-makers/${maker.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="text-center">
                    <img
                      src={maker.photo}
                      alt={maker.name}
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                    />
                    <CardTitle className="text-lg">{maker.name}</CardTitle>
                    <div className="flex items-center justify-center gap-2">
                      <Badge className={getTypeColor(maker.type)}>
                        {maker.type.charAt(0).toUpperCase() + maker.type.slice(1)}
                      </Badge>
                      {maker.verified && (
                        <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {maker.location}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 line-clamp-2">{maker.bio}</p>
                      
                      <div className="flex flex-wrap gap-1 justify-center">
                        {maker.sdg_goals.slice(0, 3).map((sdg) => (
                          <Badge key={sdg} variant="secondary" className="text-xs">
                            SDG {sdg}
                          </Badge>
                        ))}
                        {maker.sdg_goals.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{maker.sdg_goals.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-green-600">
                            {maker.impactMetrics.projectsCompleted}
                          </div>
                          <div className="text-gray-500">Projects</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">
                            {formatCurrency(maker.totalFunding)}
                          </div>
                          <div className="text-gray-500">Funded</div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="font-semibold text-purple-600">
                          {maker.impactMetrics.livesTouched.toLocaleString()}+
                        </div>
                        <div className="text-xs text-gray-500">Lives Touched</div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-gray-500">
                          Verification Score: {maker.verification_score}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filteredChangeMakers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No change makers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <ChangeMakerMap changeMakers={filteredChangeMakers} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <ChangeMakerAnalytics changeMakers={mockChangeMakers} />
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
};

export default ChangeMakers;
