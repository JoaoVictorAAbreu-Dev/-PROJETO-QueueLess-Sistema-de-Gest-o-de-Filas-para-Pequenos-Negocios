"use client";

import { Clock3, UsersRound } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueueRealtime } from "@/hooks/use-queue-realtime";
import type { Profile } from "@/types/database";

export function PublicQueue({ profile }: { profile: Profile }) {
  const { entries, isLoading, error } = useQueueRealtime(profile.id);
  const called = entries.find((entry) => entry.status === "called");
  const waiting = entries.filter((entry) => entry.status === "waiting");

  return (
    <main className="min-h-screen bg-[#f6f8fb] p-4 text-slate-950 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-lg border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Fila em tempo real</p>
            <h1 className="mt-1 text-3xl font-semibold">{profile.business_name}</h1>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
            <Clock3 className="size-4" />
            Atualizacao automatica
          </div>
        </header>

        {error ? <Alert>{error}</Alert> : null}

        <section className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <Card className="border-blue-200 bg-blue-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg text-blue-50">Chamando agora</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24 bg-white/20" />
              ) : called ? (
                <div>
                  <div className="text-5xl font-semibold">{called.customer_name}</div>
                  <p className="mt-3 flex items-center gap-2 text-blue-50">
                    <UsersRound className="size-4" />
                    {called.party_size} pessoa{called.party_size === 1 ? "" : "s"}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-semibold">Aguardando chamada</div>
                  <p className="mt-3 text-blue-50">O proximo cliente aparecera aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proximos da fila</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : waiting.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">
                  Nenhum cliente aguardando no momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {waiting.map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Badge variant={index === 0 ? "success" : "secondary"}>#{index + 1}</Badge>
                        <span className="truncate font-medium">{entry.customer_name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {entry.party_size} pessoa{entry.party_size === 1 ? "" : "s"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
