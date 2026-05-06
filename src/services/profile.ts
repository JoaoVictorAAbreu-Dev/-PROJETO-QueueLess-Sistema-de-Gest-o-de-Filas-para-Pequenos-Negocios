import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Profile } from "@/types/database";

export async function getProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  businessName: string,
): Promise<Profile> {
  const publicSlug = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${userId.slice(0, 8)}`;
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        business_name: businessName,
        public_slug: publicSlug,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getProfileByPublicId(
  supabase: SupabaseClient<Database>,
  publicId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`id.eq.${publicId},public_slug.eq.${publicId}`)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
