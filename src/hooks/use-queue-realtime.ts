"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { listActiveQueue } from "@/services/queue";
import type { QueueEntry } from "@/types/database";

export function useQueueRealtime(profileId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const queue = await listActiveQueue(supabase, profileId);
      setEntries(queue);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nao foi possivel carregar a fila.");
    } finally {
      setIsLoading(false);
    }
  }, [profileId, supabase]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refresh();
    }, 0);

    const channel = supabase
      .channel(`queue-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      window.clearTimeout(timeout);
      void supabase.removeChannel(channel);
    };
  }, [profileId, refresh, supabase]);

  return { entries, isLoading, error, refresh, supabase };
}
