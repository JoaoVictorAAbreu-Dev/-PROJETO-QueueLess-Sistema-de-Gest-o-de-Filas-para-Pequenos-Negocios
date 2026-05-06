import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, QueueEntry } from "@/types/database";

export type NewQueueEntryInput = {
  customerName: string;
  phone?: string;
  partySize: number;
  notes?: string;
};

export async function listActiveQueue(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<QueueEntry[]> {
  const { data, error } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("profile_id", profileId)
    .in("status", ["waiting", "called"])
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function addQueueEntry(
  supabase: SupabaseClient<Database>,
  profileId: string,
  input: NewQueueEntryInput,
): Promise<QueueEntry> {
  const { count, error: countError } = await supabase
    .from("queue_entries")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .in("status", ["waiting", "called"]);

  if (countError) {
    throw countError;
  }

  const { data, error } = await supabase
    .from("queue_entries")
    .insert({
      profile_id: profileId,
      customer_name: input.customerName.trim(),
      phone: input.phone?.trim() || null,
      party_size: input.partySize,
      notes: input.notes?.trim() || null,
      position: (count ?? 0) + 1,
      status: "waiting",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateQueueEntry(
  supabase: SupabaseClient<Database>,
  entryId: string,
  input: NewQueueEntryInput,
): Promise<QueueEntry> {
  const { data, error } = await supabase
    .from("queue_entries")
    .update({
      customer_name: input.customerName.trim(),
      phone: input.phone?.trim() || null,
      party_size: input.partySize,
      notes: input.notes?.trim() || null,
    })
    .eq("id", entryId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function callNextQueueEntry(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<QueueEntry | null> {
  const { data: nextEntry, error: findError } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("profile_id", profileId)
    .eq("status", "waiting")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (!nextEntry) {
    return null;
  }

  const { data, error } = await supabase
    .from("queue_entries")
    .update({ status: "called", called_at: new Date().toISOString() })
    .eq("id", nextEntry.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function completeQueueEntry(
  supabase: SupabaseClient<Database>,
  entry: QueueEntry,
): Promise<void> {
  const completedAt = new Date();
  const createdAt = new Date(entry.created_at);
  const waitMinutes = Math.max(0, Math.round((completedAt.getTime() - createdAt.getTime()) / 60000));

  const { error: historyError } = await supabase.from("attendance_history").insert({
    profile_id: entry.profile_id,
    queue_entry_id: entry.id,
    customer_name: entry.customer_name,
    party_size: entry.party_size,
    wait_time_minutes: waitMinutes,
    served_at: completedAt.toISOString(),
  });

  if (historyError) {
    throw historyError;
  }

  const { error } = await supabase
    .from("queue_entries")
    .update({ status: "completed", completed_at: completedAt.toISOString() })
    .eq("id", entry.id);

  if (error) {
    throw error;
  }
}

export async function cancelQueueEntry(
  supabase: SupabaseClient<Database>,
  entryId: string,
): Promise<void> {
  const { error } = await supabase
    .from("queue_entries")
    .update({ status: "cancelled" })
    .eq("id", entryId);

  if (error) {
    throw error;
  }
}
