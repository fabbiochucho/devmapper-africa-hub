import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ChangeMaker {
  id: string;
  title: string;
  description: string;
  location: string;
  sdg_goals: number[];
  projects_count: number;
  total_funding: number;
  impact_description: string;
  image_url: string;
  user_name: string;
}

const ChangeMakersSection = () => {
  const [changeMakers, setChangeMakers] = useState<ChangeMaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChangeMakers = async () => {
      try {
        const { data: makers, error } = await supabase
          .from('change_makers')
          .select(`
            id,
            title,
            description,
            location,
            sdg_goals,
            projects_count,
            total_funding,
            impact_description,
            image_url,
            profiles:user_id (
              full_name
            )
          `)
          .eq('is_verified', true)
          .order('projects_count', { ascending: false })
          .limit(3);

        if (error) throw error;

        const formattedMakers = makers?.map(maker => ({
          id: maker.id,
          title: maker.title,
          description: maker.description,
          location: maker.location,
          sdg_goals: maker.sdg_goals || [],
          projects_count: maker.projects_count || 0,
          total_funding: maker.total_funding || 0,
          impact_description: maker.impact_description || '',
          image_url: maker.image_url || '/placeholder.svg',
          user_name: (maker.profiles as any)?.full_name || 'Anonymous'
        })) || [];

        setChangeMakers(formattedMakers);
      } catch (error) {
        console.error('Error fetching change makers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChangeMakers();
  }, []);

  if (loading) {
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
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (changeMakers.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Change Makers Tracked
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Be the first change maker to make a difference in your community!
            </p>
          </div>
          <div className="text-center">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to="/submit-change-maker">
                <Users className="w-4 h-4 mr-2" />
                Become a Change Maker
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

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
                  src={maker.image_url} 
                  alt={maker.user_name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <CardTitle className="text-lg">{maker.user_name}</CardTitle>
                <p className="text-sm text-gray-600">{maker.title}</p>
                <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {maker.location}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                      <div className="font-semibold text-green-600">{maker.projects_count}</div>
                      <div className="text-gray-500">Projects</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">
                        ${(maker.total_funding / 1000).toFixed(0)}K
                      </div>
                      <div className="text-gray-500">Funded</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600 text-sm">
                      {maker.impact_description}
                    </div>
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