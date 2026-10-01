import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type ChangeMaker = Pick<Tables<'change_makers'>, 'id' | 'title' | 'description' | 'location' | 'sdg_goals' | 'image_url' | 'impact_description' | 'is_verified'>;

const ChangeMakersSection = () => {
  // Real rows only: this section previously showed hardcoded sample people with
  // invented funding/impact figures, which the platform's own positioning
  // ("proof, not paperwork") can't afford on the landing page.
  const [changeMakers, setChangeMakers] = useState<ChangeMaker[] | null>(null);

  useEffect(() => {
    supabase
      .from('change_makers')
      .select('id, title, description, location, sdg_goals, image_url, impact_description, is_verified')
      .order('is_verified', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        if (error) console.error('Failed to load change makers:', error);
        setChangeMakers(data || []);
      });
  }, []);

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

        {changeMakers && changeMakers.length === 0 && (
          <p className="text-center text-gray-600 mb-12">
            No change makers have been featured yet. Know someone driving verified impact in their community? Nominations open on the Change Makers page.
          </p>
        )}

        {changeMakers && changeMakers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {changeMakers.map((maker) => (
              <Card key={maker.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <img
                    src={maker.image_url || '/placeholder.svg'}
                    alt={maker.title}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                  <CardTitle className="text-lg flex items-center justify-center gap-1">
                    {maker.title}
                    {maker.is_verified && <CheckCircle className="w-4 h-4 text-green-600" aria-label="Verified" />}
                  </CardTitle>
                  <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {maker.location}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 text-center line-clamp-2">{maker.description}</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {maker.sdg_goals.map((sdg) => (
                        <Badge key={sdg} variant="secondary" className="text-xs">
                          SDG {sdg}
                        </Badge>
                      ))}
                    </div>
                    {maker.impact_description && (
                      <div className="text-center">
                        <div className="font-semibold text-purple-600">{maker.impact_description}</div>
                        <div className="text-xs text-gray-500">Impact Created</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
