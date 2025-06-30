
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const ChangeMakersSection = () => {
  const changeMakers = [
    {
      id: 1,
      name: "Amina Hassan",
      title: "Education Advocate",
      location: "Lagos, Nigeria",
      sdgs: [4, 5, 10],
      projects: 12,
      impact: "50,000+ lives touched",
      funding: "$125,000",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      name: "David Ochieng",
      title: "Clean Water Champion",
      location: "Nairobi, Kenya",
      sdgs: [6, 3, 1],
      projects: 8,
      impact: "25 communities served",
      funding: "$89,000",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Sarah Mensah",
      title: "Climate Action Leader",
      location: "Accra, Ghana",
      sdgs: [13, 7, 15],
      projects: 15,
      impact: "500+ trees planted",
      funding: "$156,000",
      image: "/placeholder.svg"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Change Makers Tracked
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet the champions driving sustainable development across Africa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {changeMakers.map((maker) => (
            <Card key={maker.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <img 
                  src={maker.image} 
                  alt={maker.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <CardTitle className="text-lg">{maker.name}</CardTitle>
                <p className="text-sm text-gray-600">{maker.title}</p>
                <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {maker.location}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {maker.sdgs.map((sdg) => (
                      <Badge key={sdg} variant="secondary" className="text-xs">
                        SDG {sdg}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{maker.projects}</div>
                      <div className="text-gray-500">Projects</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{maker.funding}</div>
                      <div className="text-gray-500">Funded</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">{maker.impact}</div>
                    <div className="text-xs text-gray-500">Impact Created</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link to="/change-makers">
              <Users className="w-4 h-4 mr-2" />
              View All Change Makers
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ChangeMakersSection;
