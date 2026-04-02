import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ShoppingCart, Plus, Leaf, MapPin, Calendar, DollarSign, TrendingUp, Package, CheckCircle, Filter, ArrowUpDown } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

const PROJECT_TYPES = [
  { value: "reforestation", label: "Reforestation" },
  { value: "cookstoves", label: "Clean Cookstoves" },
  { value: "renewable_energy", label: "Renewable Energy" },
  { value: "waste_management", label: "Waste Management" },
  { value: "mangrove", label: "Mangrove Restoration" },
  { value: "soil_carbon", label: "Soil Carbon" },
  { value: "other", label: "Other" },
];

const CarbonMarketplace = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [purchaseQty, setPurchaseQty] = useState("");

  const [listingForm, setListingForm] = useState({
    title: "", description: "", project_type: "reforestation", methodology: "",
    vintage_year: new Date().getFullYear().toString(), country_code: "", location: "",
    total_credits: "", price_per_tonne: "", currency: "USD",
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ["marketplace-listings", typeFilter, countryFilter, sortBy],
    queryFn: async () => {
      let query = supabase.from("marketplace_listings").select("*").in("listing_status", ["active", "sold_out"]);
      if (typeFilter !== "all") query = query.eq("project_type", typeFilter);
      if (countryFilter) query = query.ilike("country_code", `%${countryFilter}%`);
      if (sortBy === "price_low") query = query.order("price_per_tonne", { ascending: true });
      else if (sortBy === "price_high") query = query.order("price_per_tonne", { ascending: false });
      else query = query.order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: myOrders } = useQuery({
    queryKey: ["my-carbon-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("carbon_credit_orders").select("*, marketplace_listings(title, project_type)").eq("buyer_id", user.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: myListings } = useQuery({
    queryKey: ["my-marketplace-listings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("marketplace_listings").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const createListing = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const totalCredits = parseFloat(listingForm.total_credits);
      const { error } = await supabase.from("marketplace_listings").insert({
        seller_id: user.id,
        title: listingForm.title,
        description: listingForm.description,
        project_type: listingForm.project_type as any,
        methodology: listingForm.methodology || null,
        vintage_year: parseInt(listingForm.vintage_year),
        country_code: listingForm.country_code || null,
        location: listingForm.location || null,
        total_credits: totalCredits,
        available_credits: totalCredits,
        price_per_tonne: parseFloat(listingForm.price_per_tonne),
        currency: listingForm.currency,
        listing_status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Listing created!");
      setShowCreateListing(false);
      setListingForm({ title: "", description: "", project_type: "reforestation", methodology: "", vintage_year: new Date().getFullYear().toString(), country_code: "", location: "", total_credits: "", price_per_tonne: "", currency: "USD" });
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-marketplace-listings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const purchaseCredits = useMutation({
    mutationFn: async () => {
      if (!user || !selectedListing) throw new Error("Missing data");
      const qty = parseFloat(purchaseQty);
      if (qty <= 0 || qty > (selectedListing.available_credits || 0)) throw new Error("Invalid quantity");
      const { error } = await supabase.from("carbon_credit_orders").insert({
        buyer_id: user.id,
        listing_id: selectedListing.id,
        quantity: qty,
        price_per_tonne: selectedListing.price_per_tonne,
        total_amount: qty * selectedListing.price_per_tonne,
        currency: selectedListing.currency,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Purchase order created!");
      setShowPurchaseDialog(false);
      setPurchaseQty("");
      setSelectedListing(null);
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-carbon-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const retireCredits = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.from("carbon_credit_orders").update({ status: "retired", retirement_date: new Date().toISOString() }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credits retired successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-carbon-orders"] });
    },
  });

  const verificationBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      verified: { variant: "default", label: "Verified" },
      gold_standard: { variant: "default", label: "Gold Standard" },
      verra: { variant: "default", label: "Verra" },
      pending: { variant: "secondary", label: "Pending" },
      unverified: { variant: "outline", label: "Unverified" },
    };
    const c = config[status] || config.unverified;
    return <Badge variant={c.variant} className="text-xs">{c.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <SEOHead title="Carbon Marketplace - DevMapper" description="Buy, sell, and retire carbon credits from verified African sustainability projects." />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Leaf className="h-7 w-7 text-primary" />
            Carbon Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">Buy, sell, and retire carbon credits from verified projects</p>
        </div>
        {user && (
          <Dialog open={showCreateListing} onOpenChange={setShowCreateListing}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />List Credits</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Carbon Credit Listing</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Project Title *" value={listingForm.title} onChange={e => setListingForm(p => ({ ...p, title: e.target.value }))} />
                <Textarea placeholder="Project Description" value={listingForm.description} onChange={e => setListingForm(p => ({ ...p, description: e.target.value }))} />
                <Select value={listingForm.project_type} onValueChange={v => setListingForm(p => ({ ...p, project_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Methodology (e.g., Verra VM0042)" value={listingForm.methodology} onChange={e => setListingForm(p => ({ ...p, methodology: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Vintage Year" value={listingForm.vintage_year} onChange={e => setListingForm(p => ({ ...p, vintage_year: e.target.value }))} />
                  <Input placeholder="Country Code (e.g., NG)" value={listingForm.country_code} onChange={e => setListingForm(p => ({ ...p, country_code: e.target.value }))} />
                </div>
                <Input placeholder="Location" value={listingForm.location} onChange={e => setListingForm(p => ({ ...p, location: e.target.value }))} />
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Total Credits (tCO2e) *" value={listingForm.total_credits} onChange={e => setListingForm(p => ({ ...p, total_credits: e.target.value }))} />
                  <Input type="number" placeholder="Price per tonne *" value={listingForm.price_per_tonne} onChange={e => setListingForm(p => ({ ...p, price_per_tonne: e.target.value }))} />
                </div>
                <Button onClick={() => createListing.mutate()} disabled={!listingForm.title || !listingForm.total_credits || !listingForm.price_per_tonne || createListing.isPending} className="w-full">
                  {createListing.isPending ? "Creating..." : "Create Listing"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Credits</TabsTrigger>
          {user && <TabsTrigger value="orders">My Orders ({myOrders?.length || 0})</TabsTrigger>}
          {user && <TabsTrigger value="mylistings">My Listings ({myListings?.length || 0})</TabsTrigger>}
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Project Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PROJECT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Filter by country..." value={countryFilter} onChange={e => setCountryFilter(e.target.value)} className="max-w-[180px]" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><ArrowUpDown className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_low">Price: Low → High</SelectItem>
                <SelectItem value="price_high">Price: High → Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading listings...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings?.map(l => (
                <Card key={l.id} className={`hover:shadow-md transition-shadow ${l.listing_status === "sold_out" ? "opacity-60" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{l.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{PROJECT_TYPES.find(t => t.value === l.project_type)?.label || l.project_type}</Badge>
                          {verificationBadge(l.verification_status)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {l.description && <p className="text-sm text-muted-foreground line-clamp-2">{l.description}</p>}
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />Vintage {l.vintage_year}
                      </div>
                      {l.location && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />{l.location}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">${l.price_per_tonne}</p>
                        <p className="text-xs text-muted-foreground">per tCO2e</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{l.available_credits?.toLocaleString()} available</p>
                        <p className="text-xs text-muted-foreground">of {l.total_credits?.toLocaleString()} total</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      disabled={l.listing_status === "sold_out" || l.seller_id === user?.id}
                      onClick={() => { setSelectedListing(l); setShowPurchaseDialog(true); }}
                    >
                      {l.listing_status === "sold_out" ? "Sold Out" : l.seller_id === user?.id ? "Your Listing" : (
                        <><ShoppingCart className="h-4 w-4 mr-2" />Purchase Credits</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {listings?.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No listings found</p>
                  <p className="text-sm">Be the first to list carbon credits!</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {user && (
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />My Orders</CardTitle>
                <CardDescription>Track your carbon credit purchases and retirements</CardDescription>
              </CardHeader>
              <CardContent>
                {myOrders && myOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myOrders.map((o: any) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">{o.marketplace_listings?.title || "Unknown"}</TableCell>
                          <TableCell>{o.quantity} tCO2e</TableCell>
                          <TableCell className="font-medium">${o.total_amount?.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={o.status === "retired" ? "default" : o.status === "paid" ? "secondary" : "outline"}>
                              {o.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {(o.status === "paid" || o.status === "delivered") && (
                              <Button size="sm" variant="outline" onClick={() => retireCredits.mutate(o.id)}>
                                <CheckCircle className="h-3 w-3 mr-1" />Retire
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No orders yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {user && (
          <TabsContent value="mylistings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />My Listings</CardTitle>
              </CardHeader>
              <CardContent>
                {myListings && myListings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myListings.map(l => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{l.title}</TableCell>
                          <TableCell><Badge variant="outline">{l.project_type}</Badge></TableCell>
                          <TableCell>${l.price_per_tonne}/t</TableCell>
                          <TableCell>{l.available_credits}/{l.total_credits}</TableCell>
                          <TableCell><Badge variant={l.listing_status === "active" ? "default" : "secondary"}>{l.listing_status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No listings yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Carbon Credits</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedListing.title}</p>
                <p className="text-sm text-muted-foreground">Price: ${selectedListing.price_per_tonne}/tCO2e | Available: {selectedListing.available_credits} tCO2e</p>
              </div>
              <Input type="number" placeholder="Quantity (tCO2e)" value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)} max={selectedListing.available_credits} />
              {purchaseQty && parseFloat(purchaseQty) > 0 && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">Total: <span className="font-bold text-lg">${(parseFloat(purchaseQty) * selectedListing.price_per_tonne).toFixed(2)}</span> {selectedListing.currency}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>Cancel</Button>
            <Button onClick={() => purchaseCredits.mutate()} disabled={!purchaseQty || parseFloat(purchaseQty) <= 0 || purchaseCredits.isPending}>
              {purchaseCredits.isPending ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarbonMarketplace;
