import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Ship, Plus, Trash2, TrendingDown, Route, Truck, Plane, Train, Anchor } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface FreightEntry {
  id: string;
  mode: 'road' | 'rail' | 'air' | 'maritime';
  origin: string;
  destination: string;
  distance: number; // km
  weight: number; // tonnes
  emissions: number; // tCO2e
  emissionFactor: number;
  fuelType?: string;
}

const MODE_CONFIG = {
  road: { label: 'Road', icon: <Truck className="h-4 w-4" />, factor: 0.062, unit: 'tonne-km', color: '#f59e0b' },
  rail: { label: 'Rail', icon: <Train className="h-4 w-4" />, factor: 0.022, unit: 'tonne-km', color: '#10b981' },
  air: { label: 'Air', icon: <Plane className="h-4 w-4" />, factor: 0.602, unit: 'tonne-km', color: '#ef4444' },
  maritime: { label: 'Maritime', icon: <Anchor className="h-4 w-4" />, factor: 0.016, unit: 'tonne-km', color: '#3b82f6' },
};

// Logistics benchmark data (kgCO2e per tonne-km)
const BENCHMARKS = {
  road: { best: 0.04, average: 0.062, worst: 0.12 },
  rail: { best: 0.01, average: 0.022, worst: 0.04 },
  air: { best: 0.50, average: 0.602, worst: 0.80 },
  maritime: { best: 0.008, average: 0.016, worst: 0.03 },
};

export default function SupplyChainLogistics() {
  const [entries, setEntries] = useState<FreightEntry[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [mode, setMode] = useState<FreightEntry['mode']>('road');
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState("");
  const [weight, setWeight] = useState("");

  const addEntry = () => {
    if (!distance || !weight) return;
    const d = parseFloat(distance);
    const w = parseFloat(weight);
    const factor = MODE_CONFIG[mode].factor;
    const emissions = (d * w * factor) / 1000; // Convert to tCO2e

    const entry: FreightEntry = {
      id: crypto.randomUUID(),
      mode, origin, destination,
      distance: d, weight: w,
      emissions, emissionFactor: factor,
    };
    setEntries(prev => [...prev, entry]);
    setShowForm(false);
    setOrigin(""); setDestination(""); setDistance(""); setWeight("");
    toast.success(`Added: ${emissions.toFixed(3)} tCO₂e`);
  };

  const totalEmissions = entries.reduce((s, e) => s + e.emissions, 0);
  const totalTonneKm = entries.reduce((s, e) => s + e.distance * e.weight, 0);

  const byMode = Object.entries(MODE_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: entries.filter(e => e.mode === key).reduce((s, e) => s + e.emissions, 0),
    color: config.color,
  })).filter(d => d.value > 0);

  // Route optimization: suggest mode shifts
  const optimizationSuggestions = entries
    .filter(e => e.mode === 'air' && e.distance < 2000)
    .map(e => ({
      entry: e,
      suggestion: `Switch ${e.origin}→${e.destination} from air to rail/road`,
      savings: e.emissions - (e.distance * e.weight * MODE_CONFIG.rail.factor / 1000),
    }));

  const roadEntries = entries.filter(e => e.mode === 'road' && e.distance > 500);
  roadEntries.forEach(e => {
    optimizationSuggestions.push({
      entry: e,
      suggestion: `Consider rail for ${e.origin}→${e.destination} (${e.distance}km)`,
      savings: e.emissions - (e.distance * e.weight * MODE_CONFIG.rail.factor / 1000),
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Ship className="h-6 w-6 text-primary" />
            Supply Chain & Logistics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Freight emissions tracking • Route optimization • Inspired by EPA SmartWay
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />{showForm ? "Cancel" : "Add Shipment"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Freight Emissions</p>
            <p className="text-2xl font-bold">{totalEmissions.toFixed(2)}<span className="text-sm font-normal text-muted-foreground ml-1">tCO₂e</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Freight Volume</p>
            <p className="text-2xl font-bold">{(totalTonneKm / 1000).toFixed(0)}<span className="text-sm font-normal text-muted-foreground ml-1">k tonne-km</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Avg Intensity</p>
            <p className="text-2xl font-bold">{totalTonneKm > 0 ? (totalEmissions * 1000 / totalTonneKm * 1000).toFixed(1) : 0}<span className="text-sm font-normal text-muted-foreground ml-1">gCO₂e/tkm</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Optimization Potential</p>
            <p className="text-2xl font-bold text-green-600">{optimizationSuggestions.reduce((s, o) => s + o.savings, 0).toFixed(2)}<span className="text-sm font-normal text-muted-foreground ml-1">tCO₂e</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">Add Freight Shipment</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label>Transport Mode</Label>
                <Select value={mode} onValueChange={v => setMode(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Origin</Label><Input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g., Lagos" /></div>
              <div><Label>Destination</Label><Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g., Nairobi" /></div>
              <div><Label>Distance (km)</Label><Input type="number" value={distance} onChange={e => setDistance(e.target.value)} /></div>
              <div><Label>Weight (tonnes)</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Factor: {MODE_CONFIG[mode].factor} kgCO₂e/{MODE_CONFIG[mode].unit}</span>
              {distance && weight && (
                <Badge variant="secondary">
                  Est: {(parseFloat(distance || "0") * parseFloat(weight || "0") * MODE_CONFIG[mode].factor / 1000).toFixed(3)} tCO₂e
                </Badge>
              )}
            </div>
            <Button onClick={addEntry} disabled={!distance || !weight}>Add Shipment</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="shipments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shipments">Shipments ({entries.length})</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments">
          <Card>
            <CardContent className="pt-4">
              {entries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mode</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Emissions</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="flex items-center gap-2">{MODE_CONFIG[e.mode].icon}{MODE_CONFIG[e.mode].label}</TableCell>
                        <TableCell>{e.origin} → {e.destination}</TableCell>
                        <TableCell>{e.distance.toLocaleString()} km</TableCell>
                        <TableCell>{e.weight} t</TableCell>
                        <TableCell className="font-mono font-bold">{e.emissions.toFixed(4)} tCO₂e</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Route className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No shipments added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          {byMode.length > 0 ? (
            <Card>
              <CardHeader><CardTitle className="text-sm">Emissions by Transport Mode</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={byMode}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis />
                    <Tooltip formatter={(val: number) => `${val.toFixed(3)} tCO₂e`} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Add shipments to see analysis</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4" />Route Optimization Suggestions</CardTitle>
              <CardDescription>AI-identified opportunities to reduce freight emissions</CardDescription>
            </CardHeader>
            <CardContent>
              {optimizationSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {optimizationSuggestions.map((o, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
                      <TrendingDown className="h-5 w-5 text-green-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{o.suggestion}</p>
                        <p className="text-xs text-muted-foreground">Current: {o.entry.emissions.toFixed(3)} tCO₂e via {MODE_CONFIG[o.entry.mode].label}</p>
                      </div>
                      <Badge variant="default" className="bg-green-600">Save {o.savings.toFixed(3)} tCO₂e</Badge>
                    </div>
                  ))}
                </div>
              ) : entries.length > 0 ? (
                <p className="text-center text-muted-foreground py-4">No optimization suggestions. Your logistics are already efficient!</p>
              ) : (
                <p className="text-center text-muted-foreground py-4">Add shipments to get optimization suggestions</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Logistics Emission Benchmarks</CardTitle>
              <CardDescription>kgCO₂e per tonne-km by transport mode (EPA SmartWay aligned)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mode</TableHead>
                    <TableHead>Best in Class</TableHead>
                    <TableHead>Industry Average</TableHead>
                    <TableHead>Worst</TableHead>
                    <TableHead>Your Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(BENCHMARKS).map(([key, bench]) => {
                    const modeEntries = entries.filter(e => e.mode === key);
                    const modeTonneKm = modeEntries.reduce((s, e) => s + e.distance * e.weight, 0);
                    const modeEmissions = modeEntries.reduce((s, e) => s + e.emissions, 0);
                    const yourIntensity = modeTonneKm > 0 ? (modeEmissions * 1000 / modeTonneKm) : null;
                    return (
                      <TableRow key={key}>
                        <TableCell className="flex items-center gap-2">
                          {MODE_CONFIG[key as keyof typeof MODE_CONFIG].icon}
                          {MODE_CONFIG[key as keyof typeof MODE_CONFIG].label}
                        </TableCell>
                        <TableCell className="text-green-600 font-mono">{bench.best}</TableCell>
                        <TableCell className="font-mono">{bench.average}</TableCell>
                        <TableCell className="text-red-500 font-mono">{bench.worst}</TableCell>
                        <TableCell>
                          {yourIntensity !== null ? (
                            <Badge variant={yourIntensity <= bench.average ? "default" : "destructive"}>
                              {yourIntensity.toFixed(3)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
