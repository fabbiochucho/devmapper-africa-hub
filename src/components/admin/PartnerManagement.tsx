
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function PartnerManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Failed to fetch partners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPartner) {
        const { error } = await supabase
          .from('partners')
          .update(formData)
          .eq('id', editingPartner.id);
        
        if (error) throw error;
        toast.success('Partner updated successfully');
      } else {
        const { error } = await supabase
          .from('partners')
          .insert([formData]);
        
        if (error) throw error;
        toast.success('Partner added successfully');
      }
      
      setShowDialog(false);
      setEditingPartner(null);
      setFormData({ name: '', logo_url: '', website_url: '', display_order: 0, is_active: true });
      fetchPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      toast.error('Failed to save partner');
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logo_url: partner.logo_url,
      website_url: partner.website_url || '',
      display_order: partner.display_order,
      is_active: partner.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Partner deleted successfully');
      fetchPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('Failed to delete partner');
    }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Partner ${is_active ? 'activated' : 'deactivated'} successfully`);
      fetchPartners();
    } catch (error) {
      console.error('Error updating partner status:', error);
      toast.error('Failed to update partner status');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', logo_url: '', website_url: '', display_order: 0, is_active: true });
    setEditingPartner(null);
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading partners...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Partner Management</CardTitle>
          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Partner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPartner ? 'Edit Partner' : 'Add New Partner'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Partner Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="website_url">Website URL (Optional)</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPartner ? 'Update' : 'Add'} Partner
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Logo</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell className="font-medium">{partner.name}</TableCell>
                <TableCell>
                  <img 
                    src={partner.logo_url} 
                    alt={partner.name}
                    className="w-16 h-8 object-contain"
                  />
                </TableCell>
                <TableCell>
                  {partner.website_url && partner.website_url !== '#' && (
                    <a 
                      href={partner.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </TableCell>
                <TableCell>{partner.display_order}</TableCell>
                <TableCell>
                  <Switch
                    checked={partner.is_active}
                    onCheckedChange={(checked) => toggleActive(partner.id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(partner)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(partner.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {partners.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No partners found. Add your first partner to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
