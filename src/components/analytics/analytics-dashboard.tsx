"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Clock, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { getDailyAnalytics } from "@/services/analytics";
import type { DailyAnalytics } from "@/types/database";

export function AnalyticsDashboard({ profileId }: { profileId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [analytics, setAnalytics] = useState<DailyAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setAnalytics(await getDailyAnalytics(supabase, profileId));
        setError(null);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Nao foi possivel carregar as metricas.");
      } finally {
        setIsLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      void loadAnalytics();
    }, 0);

    const channel = supabase
      .channel(`analytics-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_history",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          void loadAnalytics();
        },
      )
      .subscribe();

    return () => {
      window.clearTimeout(timeout);
      void supabase.removeChannel(channel);
    };
  }, [profileId, supabase]);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return <Alert>{error}</Alert>;
  }

  const data = analytics ?? {
    totalAttendances: 0,
    averageWaitMinutes: 0,
    peakHour: "Sem dados",
    hourlyMovement: [],
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Atendimentos hoje"
          value={String(data.totalAttendances)}
          description="Concluidos desde 00:00"
          icon={<Users className="size-4" />}
        />
        <MetricCard
          title="Espera media"
          value={`${data.averageWaitMinutes} min`}
          description="Da entrada ate conclusao"
          icon={<Clock className="size-4" />}
        />
        <MetricCard
          title="Pico de movimento"
          value={data.peakHour}
          description="Horario com mais atendimentos"
          icon={<TrendingUp className="size-4" />}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Movimento por horario</CardTitle>
          <CardDescription>Distribuicao dos atendimentos concluidos ao longo do dia.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourlyMovement}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} interval={2} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="attendances" name="Atendimentos" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <Activity className="size-3.5" />
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
