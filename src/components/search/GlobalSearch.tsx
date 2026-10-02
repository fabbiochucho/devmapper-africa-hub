import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, MessageSquare, Search, Target, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  type: "project" | "user" | "forum" | "changemaker";
  title: string;
  subtitle: string;
  url: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Custom debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounceValue(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const performSearch = async (searchTerm: string) => {
    setLoading(true);
    try {
      const term = `%${searchTerm}%`;

      // Batch all 4 searches in parallel
      const [reportsRes, profilesRes, postsRes, changemakersRes] = await Promise.all([
        supabase
          .from("reports")
          .select("id, title, location, country_code")
          .or(`title.ilike.${term},description.ilike.${term},location.ilike.${term}`)
          .limit(5),
        supabase
          .from("profiles")
          .select("user_id, full_name, organization, country")
          .or(`full_name.ilike.${term},organization.ilike.${term}`)
          .limit(5),
        supabase
          .from("forum_posts")
          .select("id, title, category")
          .or(`title.ilike.${term},content.ilike.${term}`)
          .limit(5),
        supabase
          .from("change_makers")
          .select("id, title, location")
          .or(`title.ilike.${term},description.ilike.${term},location.ilike.${term}`)
          .limit(5),
      ]);

      const allResults: SearchResult[] = [
        ...(reportsRes.data || []).map((r) => ({
          id: r.id, type: "project" as const, title: r.title,
          subtitle: r.location || r.country_code || "Project", url: `/my-projects?id=${r.id}`,
        })),
        ...(profilesRes.data || []).map((p) => ({
          id: p.user_id, type: "user" as const, title: p.full_name || "User",
          subtitle: p.organization || p.country || "", url: `/connect?user=${p.user_id}`,
        })),
        ...(postsRes.data || []).map((p) => ({
          id: p.id, type: "forum" as const, title: p.title,
          subtitle: p.category, url: `/forum?post=${p.id}`,
        })),
        ...(changemakersRes.data || []).map((c) => ({
          id: c.id, type: "changemaker" as const, title: c.title,
          subtitle: c.location, url: `/change-makers/${c.id}`,
        })),
      ];

      setResults(allResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    setQuery("");
    navigate(result.url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "project": return <FileText className="w-4 h-4 text-muted-foreground" />;
      case "user": return <Users className="w-4 h-4 text-muted-foreground" />;
      case "forum": return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
      case "changemaker": return <Target className="w-4 h-4 text-muted-foreground" />;
      default: return <Search className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      project: "Project",
      user: "User",
      forum: "Forum",
      changemaker: "Change Maker",
    };
    return <Badge variant="outline" className="text-[10px]">{labels[type] || type}</Badge>;
  };

  const groupedResults = {
    projects: results.filter(r => r.type === "project"),
    users: results.filter(r => r.type === "user"),
    forum: results.filter(r => r.type === "forum"),
    changemakers: results.filter(r => r.type === "changemaker"),
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search projects, users, forum posts..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}

        {query.trim().length >= 2 && (
          <CommandGroup heading="Go further">
            <CommandItem value={`search-all ${query}`} onSelect={() => { onOpenChange(false); navigate(`/search?q=${encodeURIComponent(query.trim())}`); }}>
              <Search className="mr-2 h-4 w-4" />Search organisations, policies, programmes and research for "{query.trim()}"
            </CommandItem>
            <CommandItem value={`ask-ndovu ${query}`} onSelect={() => { onOpenChange(false); navigate(`/ndovu?q=${encodeURIComponent(query.trim())}`); }}>
              <Sparkles className="mr-2 h-4 w-4" />Ask Ndovu Akili about "{query.trim()}"
            </CommandItem>
          </CommandGroup>
        )}

        {!loading && query.length < 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Type at least 2 characters to search
          </div>
        )}

        {!loading && groupedResults.projects.length > 0 && (
          <CommandGroup heading="Projects" className="animate-in fade-in-0 slide-in-from-top-1 duration-200 motion-reduce:slide-in-from-top-0">
            {groupedResults.projects.map((result) => (
              <CommandItem key={result.id} onSelect={() => handleSelect(result)}>
                <div className="flex items-center gap-3 w-full">
                  {getIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  {getTypeBadge(result.type)}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && groupedResults.users.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Users" className="animate-in fade-in-0 slide-in-from-top-1 duration-200 delay-[40ms] motion-reduce:slide-in-from-top-0 motion-reduce:delay-0">
              {groupedResults.users.map((result) => (
                <CommandItem key={result.id} onSelect={() => handleSelect(result)}>
                  <div className="flex items-center gap-3 w-full">
                    {getIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                    {getTypeBadge(result.type)}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {!loading && groupedResults.forum.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Forum Posts" className="animate-in fade-in-0 slide-in-from-top-1 duration-200 delay-[80ms] motion-reduce:slide-in-from-top-0 motion-reduce:delay-0">
              {groupedResults.forum.map((result) => (
                <CommandItem key={result.id} onSelect={() => handleSelect(result)}>
                  <div className="flex items-center gap-3 w-full">
                    {getIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                    {getTypeBadge(result.type)}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {!loading && groupedResults.changemakers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Change Makers" className="animate-in fade-in-0 slide-in-from-top-1 duration-200 delay-[120ms] motion-reduce:slide-in-from-top-0 motion-reduce:delay-0">
              {groupedResults.changemakers.map((result) => (
                <CommandItem key={result.id} onSelect={() => handleSelect(result)}>
                  <div className="flex items-center gap-3 w-full">
                    {getIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                    {getTypeBadge(result.type)}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
