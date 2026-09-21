
import React from 'react';
import { Link } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

type ChangeMaker = Database['public']['Tables']['change_makers']['Row'];

interface ChangeMakerMapProps {
  changeMakers: ChangeMaker[];
}

// The real change_makers table has no lat/lng columns (unlike `reports`,
// which does), and there is no country-centroid lookup anywhere in this
// codebase to place a marker honestly. Rather than fabricate coordinates,
// this renders each change maker's real `location` text instead of a pin.
// Revisit with a real map once change_makers gains geocoded coordinates.
const ChangeMakerMap: React.FC<ChangeMakerMapProps> = ({ changeMakers }) => {
  if (changeMakers.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <MapPin className="mx-auto h-10 w-10 mb-3 text-gray-400" />
          <p>No verified change makers to show yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-6 space-y-3">
        <p className="text-sm text-muted-foreground text-center mb-4">
          Precise map coordinates aren't available for change makers yet — showing reported locations instead.
        </p>
        {changeMakers.map((changeMaker) => (
          <Link
            key={changeMaker.id}
            to={`/change-makers/${changeMaker.id}`}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{changeMaker.title}</div>
                <div className="text-xs text-muted-foreground">{changeMaker.location}</div>
              </div>
            </div>
            {changeMaker.is_verified && (
              <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default ChangeMakerMap;
