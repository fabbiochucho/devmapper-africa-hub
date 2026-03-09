import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Send, MessageSquare, User, Loader2, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface Conversation {
  id: string;
  created_at: string;
  participants: UserProfile[];
  lastMessage?: string;
}

const AdminMessaging = () => {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // New conversation state
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", session?.user?.id);

      if (!participations?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participations.map(p => p.conversation_id);

      const { data: convos } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      // Get participants for each conversation
      const conversationsWithParticipants: Conversation[] = [];
      for (const convo of convos || []) {
        const { data: parts } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", convo.id);

        const userIds = parts?.map(p => p.user_id).filter(id => id !== session?.user?.id) || [];
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, avatar_url")
          .in("user_id", userIds);

        conversationsWithParticipants.push({
          id: convo.id,
          created_at: convo.created_at,
          participants: profiles || [],
        });
      }

      setConversations(conversationsWithParticipants);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const searchUsers = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(10);

      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const startConversation = async (user: UserProfile) => {
    try {
      // Create conversation
      const { data: convo, error: convoError } = await supabase
        .from("conversations")
        .insert({ created_by: session?.user?.id })
        .select()
        .single();

      if (convoError) throw convoError;

      // Add both participants
      await supabase.from("conversation_participants").insert([
        { conversation_id: convo.id, user_id: session?.user?.id },
        { conversation_id: convo.id, user_id: user.user_id },
      ]);

      toast.success("Conversation started");
      setShowNewConversation(false);
      setUserSearch("");
      setSearchResults([]);
      loadConversations();
      setSelectedConversation({ id: convo.id, created_at: convo.created_at, participants: [user] });
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: selectedConversation.id,
        sender_id: session?.user?.id,
        content: newMessage,
      });

      if (error) throw error;

      setNewMessage("");
      loadMessages(selectedConversation.id);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="md:col-span-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowNewConversation(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No conversations yet</p>
          ) : (
            <div className="space-y-1">
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConversation(convo)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedConversation?.id === convo.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={convo.participants[0]?.avatar_url || undefined} />
                      <AvatarFallback>
                        {convo.participants[0]?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {convo.participants[0]?.full_name || convo.participants[0]?.email || "Unknown"}
                      </p>
                      <p className={`text-xs truncate ${
                        selectedConversation?.id === convo.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}>
                        {convo.participants[0]?.email}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="md:col-span-2 flex flex-col">
        {showNewConversation ? (
          <>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">New Conversation</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setShowNewConversation(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>

                {searching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}

                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => startConversation(user)}
                      className="w-full p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.full_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium text-sm">{user.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        ) : selectedConversation ? (
          <>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedConversation.participants[0]?.avatar_url || undefined} />
                  <AvatarFallback>
                    {selectedConversation.participants[0]?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    {selectedConversation.participants[0]?.full_name || "Unknown"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.participants[0]?.email}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === session?.user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.sender_id === session?.user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender_id === session?.user?.id
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminMessaging;
