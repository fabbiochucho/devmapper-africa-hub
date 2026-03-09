import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ticket, Search, Clock, CheckCircle, AlertCircle, Loader2, MessageSquare, User } from "lucide-react";

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

const TicketManager = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const updates: Record<string, any> = { status: newStatus };
      
      if (newStatus === "resolved" || newStatus === "closed") {
        updates.resolution_notes = resolutionNotes;
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updates)
        .eq("id", ticketId);

      if (error) throw error;
      
      toast.success(`Ticket ${newStatus}`);
      setSelectedTicket(null);
      setResolutionNotes("");
      loadTickets();
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    } finally {
      setUpdating(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ticket.subject.toLowerCase().includes(term) ||
      ticket.description.toLowerCase().includes(term) ||
      ticket.category.toLowerCase().includes(term)
    );
  });

  const ticketCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { key: "all", label: "Total", icon: Ticket },
          { key: "open", label: "Open", icon: AlertCircle },
          { key: "in_progress", label: "In Progress", icon: Clock },
          { key: "resolved", label: "Resolved", icon: CheckCircle },
        ].map((stat) => (
          <Card
            key={stat.key}
            className={`cursor-pointer transition-colors ${statusFilter === stat.key ? "ring-2 ring-primary" : ""}`}
            onClick={() => setStatusFilter(stat.key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{ticketCounts[stat.key as keyof typeof ticketCounts] || 0}</p>
                </div>
                <stat.icon className="w-6 h-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Support Tickets</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tickets found</p>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => {
                const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;

                return (
                  <Dialog key={ticket.id}>
                    <DialogTrigger asChild>
                      <div
                        className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setResolutionNotes(ticket.resolution_notes || "");
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{ticket.subject}</h4>
                              <Badge className={`text-xs ${priorityConfig.color}`}>
                                {priorityConfig.label}
                              </Badge>
                              <Badge className={`text-xs ${statusConfig.color}`}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {ticket.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {ticket.category}
                              </span>
                              <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{ticket.subject}</DialogTitle>
                        <DialogDescription>
                          Category: {ticket.category} • Created: {new Date(ticket.created_at).toLocaleString()}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={priorityConfig.color}>{priorityConfig.label} Priority</Badge>
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        </div>

                        {ticket.status !== "closed" && (
                          <>
                            <div>
                              <label className="text-sm font-medium">Resolution Notes</label>
                              <Textarea
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                placeholder="Add notes about the resolution..."
                                rows={3}
                              />
                            </div>

                            <div className="flex gap-2">
                              {ticket.status === "open" && (
                                <Button
                                  variant="outline"
                                  onClick={() => updateTicketStatus(ticket.id, "in_progress")}
                                  disabled={updating}
                                >
                                  Mark In Progress
                                </Button>
                              )}
                              {(ticket.status === "open" || ticket.status === "in_progress") && (
                                <Button
                                  onClick={() => updateTicketStatus(ticket.id, "resolved")}
                                  disabled={updating}
                                >
                                  {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                  Resolve
                                </Button>
                              )}
                              {ticket.status === "resolved" && (
                                <Button
                                  onClick={() => updateTicketStatus(ticket.id, "closed")}
                                  disabled={updating}
                                >
                                  Close Ticket
                                </Button>
                              )}
                            </div>
                          </>
                        )}

                        {ticket.resolution_notes && (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Resolution</p>
                            <p className="text-sm">{ticket.resolution_notes}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketManager;
