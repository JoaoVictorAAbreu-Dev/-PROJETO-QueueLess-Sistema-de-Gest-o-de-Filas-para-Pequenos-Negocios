import { redirect } from "next/navigation";

import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileSetup } from "@/components/queue/profile-setup";
import { QueueManager } from "@/components/queue/queue-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/profile";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);

  if (!profile) {
    return <ProfileSetup userId={user.id} />;
  }

  return (
    <AppShell profile={profile}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">{profile.business_name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Painel operacional</h1>
          <p className="mt-2 text-muted-foreground">Gerencie a fila ativa e acompanhe o movimento do dia.</p>
        </div>
      </div>
      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Fila</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="queue">
          <QueueManager profileId={profile.id} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsDashboard profileId={profile.id} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
