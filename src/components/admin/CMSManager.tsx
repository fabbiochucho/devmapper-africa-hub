import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Plus, Trash2, Eye, EyeOff, Loader2, FileText, GripVertical } from "lucide-react";

interface CMSContent {
  id: string;
  page_key: string;
  title: string;
  content: any;
  is_published: boolean;
  updated_at: string;
}

interface CMSSection {
  id: string;
  page_key: string;
  section_key: string;
  title: string | null;
  content: any;
  display_order: number;
  is_visible: boolean;
}

const PAGES = [
  { key: "training", label: "Training", description: "Courses, workshops, and certification content" },
  { key: "resources", label: "Resources", description: "Downloads, guides, and external links" },
  { key: "support", label: "Support", description: "FAQ, contact info, and help content" },
  { key: "about", label: "About", description: "Organization info and team details" },
  { key: "contact", label: "Contact", description: "Contact form and office locations" },
  { key: "connect", label: "Connect & Integrate", description: "API docs and integration guides" },
  { key: "billing", label: "Billing & Plans", description: "Pricing tiers and plan features" },
];

const CMSManager = () => {
  const [selectedPage, setSelectedPage] = useState("training");
  const [content, setContent] = useState<CMSContent | null>(null);
  const [sections, setSections] = useState<CMSSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    loadPageContent(selectedPage);
  }, [selectedPage]);

  const loadPageContent = async (pageKey: string) => {
    setLoading(true);
    try {
      // Load main content
      const { data: contentData } = await supabase
        .from("cms_content")
        .select("*")
        .eq("page_key", pageKey)
        .maybeSingle();

      if (contentData) {
        setContent(contentData);
        setEditTitle(contentData.title);
        setEditContent(JSON.stringify(contentData.content, null, 2));
        setIsPublished(contentData.is_published);
      } else {
        setContent(null);
        setEditTitle(PAGES.find(p => p.key === pageKey)?.label || pageKey);
        setEditContent("{}");
        setIsPublished(true);
      }

      // Load sections
      const { data: sectionsData } = await supabase
        .from("cms_sections")
        .select("*")
        .eq("page_key", pageKey)
        .order("display_order");

      setSections(sectionsData || []);
    } catch (error) {
      console.error("Error loading CMS content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      let parsedContent = {};
      try {
        parsedContent = JSON.parse(editContent);
      } catch {
        toast.error("Invalid JSON content");
        setSaving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (content) {
        // Update existing
        const { error } = await supabase
          .from("cms_content")
          .update({
            title: editTitle,
            content: parsedContent,
            is_published: isPublished,
            updated_by: user?.id,
          })
          .eq("id", content.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("cms_content")
          .insert({
            page_key: selectedPage,
            title: editTitle,
            content: parsedContent,
            is_published: isPublished,
            updated_by: user?.id,
          });

        if (error) throw error;
      }

      toast.success("Content saved successfully");
      loadPageContent(selectedPage);
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const addSection = async () => {
    try {
      const sectionKey = `section_${Date.now()}`;
      const { error } = await supabase
        .from("cms_sections")
        .insert({
          page_key: selectedPage,
          section_key: sectionKey,
          title: "New Section",
          content: {},
          display_order: sections.length,
        });

      if (error) throw error;
      toast.success("Section added");
      loadPageContent(selectedPage);
    } catch (error) {
      console.error("Error adding section:", error);
      toast.error("Failed to add section");
    }
  };

  const updateSection = async (section: CMSSection, updates: Partial<CMSSection>) => {
    try {
      const { error } = await supabase
        .from("cms_sections")
        .update(updates)
        .eq("id", section.id);

      if (error) throw error;
      loadPageContent(selectedPage);
    } catch (error) {
      console.error("Error updating section:", error);
      toast.error("Failed to update section");
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section?")) return;
    try {
      const { error } = await supabase
        .from("cms_sections")
        .delete()
        .eq("id", sectionId);

      if (error) throw error;
      toast.success("Section deleted");
      loadPageContent(selectedPage);
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  };

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* Page List */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Pages</h3>
        {PAGES.map((page) => (
          <button
            key={page.key}
            onClick={() => setSelectedPage(page.key)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              selectedPage === page.key
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-medium">{page.label}</span>
            </div>
            <p className={`text-xs mt-1 ${selectedPage === page.key ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              {page.description}
            </p>
          </button>
        ))}
      </div>

      {/* Content Editor */}
      <div className="md:col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Edit: {PAGES.find(p => p.key === selectedPage)?.label}</CardTitle>
                <CardDescription>
                  {content ? `Last updated: ${new Date(content.updated_at).toLocaleString()}` : "No content yet"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="published" className="text-sm">Published</Label>
                  <Switch
                    id="published"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                </div>
                <Button onClick={saveContent} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <>
                <div>
                  <Label>Page Title</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Page title"
                  />
                </div>

                <div>
                  <Label>Content (JSON)</Label>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder='{"heading": "Welcome", "items": []}'
                    className="font-mono text-sm h-64"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Define content structure as JSON. Keys depend on page templates.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Page Sections</CardTitle>
              <Button size="sm" variant="outline" onClick={addSection}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sections.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No sections yet</p>
            ) : (
              <div className="space-y-3">
                {sections.map((section) => (
                  <div key={section.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <Input
                        value={section.title || ""}
                        onChange={(e) => updateSection(section, { title: e.target.value })}
                        className="h-8"
                        placeholder="Section title"
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {section.section_key}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateSection(section, { is_visible: !section.is_visible })}
                    >
                      {section.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSection(section.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CMSManager;
