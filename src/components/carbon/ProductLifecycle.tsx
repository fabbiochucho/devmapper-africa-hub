import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Package, Plus, Trash2, ArrowRight, Leaf, Factory, Truck, Recycle, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface LifecycleStage {
  id: string;
  stage: 'raw_materials' | 'production' | 'transport' | 'usage' | 'end_of_life';
  description: string;
  emissions: number; // tCO2e
  dataQuality: 'primary' | 'secondary' | 'estimated';
  notes?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  functionalUnit: string;
  stages: LifecycleStage[];
}

const STAGE_CONFIG = {
  raw_materials: { label: 'Raw Materials', icon: <Leaf className="h-4 w-4" />, color: '#10b981', description: 'Extraction and processing of raw materials' },
  production: { label: 'Production', icon: <Factory className="h-4 w-4" />, color: '#3b82f6', description: 'Manufacturing and assembly' },
  transport: { label: 'Transport', icon: <Truck className="h-4 w-4" />, color: '#f59e0b', description: 'Distribution and logistics' },
  usage: { label: 'Usage', icon: <Users className="h-4 w-4" />, color: '#8b5cf6', description: 'Product use phase' },
  end_of_life: { label: 'End of Life', icon: <Recycle className="h-4 w-4" />, color: '#ef4444', description: 'Disposal, recycling, or reuse' },
};

const PRODUCT_CATEGORIES = ['Food & Beverage', 'Construction', 'Electronics', 'Textiles', 'Chemicals', 'Agriculture', 'Packaging', 'Other'];

// Benchmark data by category (tCO2e per unit — illustrative)
const BENCHMARKS: Record<string, number> = {
  'Food & Beverage': 2.5,
  'Construction': 150,
  'Electronics': 45,
  'Textiles': 8,
  'Chemicals': 25,
  'Agriculture': 3,
  'Packaging': 1.2,
  'Other': 10,
};

export default function ProductLifecycle() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showStageForm, setShowStageForm] = useState(false);

  // Product form
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [functionalUnit, setFunctionalUnit] = useState("1 unit");

  // Stage form
  const [stageType, setStageType] = useState<LifecycleStage['stage']>('raw_materials');
  const [stageDesc, setStageDesc] = useState("");
  const [stageEmissions, setStageEmissions] = useState("");
  const [stageQuality, setStageQuality] = useState<'primary' | 'secondary' | 'estimated'>('estimated');

  const createProduct = () => {
    if (!productName || !productCategory) return;
    const product: Product = {
      id: crypto.randomUUID(),
      name: productName,
      category: productCategory,
      functionalUnit,
      stages: [],
    };
    setProducts(prev => [...prev, product]);
    setSelectedProduct(product.id);
    setShowCreate(false);
    setProductName(""); setProductCategory(""); setFunctionalUnit("1 unit");
    toast.success(`Product "${productName}" created`);
  };

  const addStage = () => {
    if (!selectedProduct || !stageEmissions) return;
    const stage: LifecycleStage = {
      id: crypto.randomUUID(),
      stage: stageType,
      description: stageDesc || STAGE_CONFIG[stageType].description,
      emissions: parseFloat(stageEmissions),
      dataQuality: stageQuality,
    };
    setProducts(prev => prev.map(p =>
      p.id === selectedProduct ? { ...p, stages: [...p.stages, stage] } : p
    ));
    setShowStageForm(false);
    setStageDesc(""); setStageEmissions("");
    toast.success(`${STAGE_CONFIG[stageType].label} stage added`);
  };

  const removeStage = (productId: string, stageId: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, stages: p.stages.filter(s => s.id !== stageId) } : p
    ));
  };

  const current = products.find(p => p.id === selectedProduct);
  const totalPCF = current?.stages.reduce((s, st) => s + st.emissions, 0) || 0;
  const benchmark = current ? BENCHMARKS[current.category] || 10 : 0;
  const vsBenchmark = benchmark > 0 ? ((totalPCF - benchmark) / benchmark * 100) : 0;

  const chartData = current ? Object.entries(STAGE_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: current.stages.filter(s => s.stage === key).reduce((sum, s) => sum + s.emissions, 0),
    fill: config.color,
  })) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Product Carbon Footprint
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Lifecycle assessment • Cradle-to-grave analysis • Inspired by Blonk Sustainability
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />New Product</Button>
      </div>

      {/* Create Product Dialog */}
      {showCreate && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">Create Product Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Product Name</Label><Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g., Solar Panel" /></div>
              <div>
                <Label>Category</Label>
                <Select value={productCategory} onValueChange={setProductCategory}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Functional Unit</Label><Input value={functionalUnit} onChange={e => setFunctionalUnit(e.target.value)} placeholder="e.g., 1 kWp panel" /></div>
            </div>
            <Button onClick={createProduct} disabled={!productName || !productCategory}>Create Product</Button>
          </CardContent>
        </Card>
      )}

      {/* Product Selector */}
      {products.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {products.map(p => (
            <Button key={p.id} variant={selectedProduct === p.id ? "default" : "outline"} size="sm" onClick={() => setSelectedProduct(p.id)}>
              {p.name}
            </Button>
          ))}
        </div>
      )}

      {/* Product Detail */}
      {current && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Total PCF</p>
                <p className="text-2xl font-bold">{totalPCF.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Stages Covered</p>
                <p className="text-2xl font-bold">{new Set(current.stages.map(s => s.stage)).size}/5</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">vs Benchmark</p>
                <p className={`text-2xl font-bold ${vsBenchmark <= 0 ? "text-green-600" : "text-red-500"}`}>
                  {vsBenchmark > 0 ? "+" : ""}{vsBenchmark.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">{current.category} avg: {benchmark} tCO₂e</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Category</p>
                <Badge variant="secondary">{current.category}</Badge>
                <p className="text-xs text-muted-foreground mt-1">Unit: {current.functionalUnit}</p>
              </CardContent>
            </Card>
          </div>

          {/* Lifecycle Flow Visual */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Lifecycle Stages</CardTitle>
                <Button size="sm" onClick={() => setShowStageForm(!showStageForm)}>
                  <Plus className="h-4 w-4 mr-2" />{showStageForm ? "Cancel" : "Add Stage"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Visual flow */}
              <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2">
                {Object.entries(STAGE_CONFIG).map(([key, config], i) => {
                  const stageEmissions = current.stages.filter(s => s.stage === key).reduce((sum, s) => sum + s.emissions, 0);
                  const pct = totalPCF > 0 ? (stageEmissions / totalPCF * 100) : 0;
                  const hasData = current.stages.some(s => s.stage === key);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`flex flex-col items-center p-3 rounded-lg border min-w-[100px] ${hasData ? "bg-background" : "bg-muted/30 opacity-60"}`}>
                        <div className="p-2 rounded-full" style={{ backgroundColor: `${config.color}20` }}>{config.icon}</div>
                        <p className="text-xs font-medium mt-1">{config.label}</p>
                        <p className="text-sm font-bold">{stageEmissions.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{pct.toFixed(0)}%</p>
                      </div>
                      {i < 4 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Add Stage Form */}
              {showStageForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label>Stage</Label>
                      <Select value={stageType} onValueChange={v => setStageType(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STAGE_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Emissions (tCO₂e)</Label>
                      <Input type="number" value={stageEmissions} onChange={e => setStageEmissions(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                      <Label>Data Quality</Label>
                      <Select value={stageQuality} onValueChange={v => setStageQuality(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary (measured)</SelectItem>
                          <SelectItem value="secondary">Secondary (database)</SelectItem>
                          <SelectItem value="estimated">Estimated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={stageDesc} onChange={e => setStageDesc(e.target.value)} placeholder="Optional details" />
                    </div>
                  </div>
                  <Button onClick={addStage} disabled={!stageEmissions} size="sm">Add Stage Data</Button>
                </div>
              )}

              {/* Entries Table */}
              {current.stages.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Emissions</TableHead>
                      <TableHead>% of Total</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {current.stages.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="flex items-center gap-2">
                          {STAGE_CONFIG[s.stage].icon}
                          {STAGE_CONFIG[s.stage].label}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.description}</TableCell>
                        <TableCell className="font-mono font-bold">{s.emissions.toFixed(3)} tCO₂e</TableCell>
                        <TableCell>{totalPCF > 0 ? (s.emissions / totalPCF * 100).toFixed(1) : 0}%</TableCell>
                        <TableCell>
                          <Badge variant={s.dataQuality === 'primary' ? 'default' : 'secondary'} className="text-xs">{s.dataQuality}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeStage(current.id, s.id)}><Trash2 className="h-3 w-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Chart */}
          {current.stages.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Emissions by Lifecycle Stage</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.filter(d => d.value > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis />
                    <Tooltip formatter={(val: number) => `${val.toFixed(3)} tCO₂e`} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.filter(d => d.value > 0).map((d, i) => (
                        <Badge key={i}>{d.fill}</Badge>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {products.length === 0 && !showCreate && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No products assessed yet</p>
            <p className="text-sm">Create a product to begin lifecycle carbon footprint analysis</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
