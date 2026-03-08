import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, MapPin, Trash2, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { africanCountries } from "@/data/countries";

interface EntityLocation {
  id: string;
  country: string;
  country_code: string | null;
  city: string | null;
  address: string | null;
  is_headquarters: boolean;
}

interface EntityLocationsManagerProps {
  entityType: "company" | "ngo";
}

const EntityLocationsManager = ({ entityType }: EntityLocationsManagerProps) => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<EntityLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    country: "",
    country_code: "",
    city: "",
    address: "",
    is_headquarters: false,
  });

  useEffect(() => {
    if (user) fetchLocations();
  }, [user]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("entity_locations")
        .select("*")
        .eq("user_id", user!.id)
        .eq("entity_type", entityType)
        .order("is_headquarters", { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.country) {
      toast.error("Please select a country");
      return;
    }
    try {
      // If marking as HQ, unset other HQs
      if (form.is_headquarters && locations.some((l) => l.is_headquarters)) {
        await supabase
          .from("entity_locations")
          .update({ is_headquarters: false })
          .eq("user_id", user!.id)
          .eq("entity_type", entityType);
      }

      const { error } = await supabase.from("entity_locations").insert({
        user_id: user!.id,
        entity_type: entityType,
        country: form.country,
        country_code: form.country_code || null,
        city: form.city || null,
        address: form.address || null,
        is_headquarters: form.is_headquarters,
      });

      if (error) throw error;
      toast.success("Location added");
      setForm({ country: "", country_code: "", city: "", address: "", is_headquarters: false });
      setShowAdd(false);
      fetchLocations();
    } catch (error: any) {
      toast.error(error.message || "Failed to add location");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("entity_locations").delete().eq("id", id);
      if (error) throw error;
      toast.success("Location removed");
      fetchLocations();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove location");
    }
  };

  const handleCountryChange = (countryName: string) => {
    const country = africanCountries.find((c) => c.name === countryName);
    setForm({ ...form, country: countryName, country_code: country?.code || "" });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Operating Locations
          </CardTitle>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Operating Location</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Select value={form.country} onValueChange={handleCountryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {africanCountries.map((c) => (
                        <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g., Lagos, Nairobi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Office address"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hq"
                    checked={form.is_headquarters}
                    onCheckedChange={(checked) => setForm({ ...form, is_headquarters: !!checked })}
                  />
                  <Label htmlFor="hq">This is the headquarters</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button onClick={handleAdd}>Add Location</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {locations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No locations added yet. Add your first operating location.
          </p>
        ) : (
          <div className="space-y-3">
            {locations.map((loc) => (
              <div key={loc.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {loc.city ? `${loc.city}, ${loc.country}` : loc.country}
                      {loc.is_headquarters && (
                        <Badge variant="secondary" className="text-xs">HQ</Badge>
                      )}
                    </div>
                    {loc.address && (
                      <p className="text-xs text-muted-foreground">{loc.address}</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(loc.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EntityLocationsManager;
