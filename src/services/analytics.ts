import type { SupabaseClient } from "@supabase/supabase-js";

import type { DailyAnalytics, Database } from "@/types/database";

export async function getDailyAnalytics(
  supabase: SupabaseClient<Database>,
  profileId: string,
  date = new Date(),
): Promise<DailyAnalytics> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data, error } = await supabase
    .from("attendance_history")
    .select("*")
    .eq("profile_id", profileId)
    .gte("served_at", start.toISOString())
    .lt("served_at", end.toISOString())
    .order("served_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    attendances: 0,
  }));

  for (const row of rows) {
    const servedAt = new Date(row.served_at);
    hourly[servedAt.getHours()].attendances += 1;
  }

  const peak = hourly.reduce((currentPeak, item) =>
    item.attendances > currentPeak.attendances ? item : currentPeak,
  hourly[0]);

  const waitTotal = rows.reduce((sum, row) => sum + row.wait_time_minutes, 0);

  return {
    totalAttendances: rows.length,
    averageWaitMinutes: rows.length ? Math.round(waitTotal / rows.length) : 0,
    peakHour: peak.attendances > 0 ? peak.hour : "Sem dados",
    hourlyMovement: hourly,
  };
}
