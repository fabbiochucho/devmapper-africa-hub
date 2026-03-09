import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminVerification } from "@/hooks/useAdminVerification";
import { Loader2, LayoutDashboard, FileText, MessageSquare, Users, Settings, Ticket, Send, Megaphone } from "lucide-react";
import CMSManager from "@/components/admin/CMSManager";
import BroadcastManager from "@/components/admin/BroadcastManager";
import TicketManager from "@/components/admin/TicketManager";
import ForumModeration from "@/components/admin/ForumModeration";
import AdminMessaging from "@/components/admin/AdminMessaging";
import AdminOverview from "@/components/admin/AdminOverview";

const AdminCRM = () => {
  const { isAdmin, loading: adminLoading } = useAdminVerification();

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to access the Admin CRM.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin CRM</h1>
        <p className="text-muted-foreground">
          Manage site content, moderate forums, send broadcasts, and handle support tickets
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">Broadcast</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="forum" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Forum</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            <span className="hidden sm:inline">Tickets</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverview />
        </TabsContent>

        <TabsContent value="content">
          <CMSManager />
        </TabsContent>

        <TabsContent value="broadcast">
          <BroadcastManager />
        </TabsContent>

        <TabsContent value="messages">
          <AdminMessaging />
        </TabsContent>

        <TabsContent value="forum">
          <ForumModeration />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCRM;
