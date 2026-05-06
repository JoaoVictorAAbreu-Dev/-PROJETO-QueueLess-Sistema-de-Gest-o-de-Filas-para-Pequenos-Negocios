import { notFound } from "next/navigation";

import { PublicQueue } from "@/components/queue/public-queue";
import { createClient } from "@/lib/supabase/server";
import { getProfileByPublicId } from "@/services/profile";

export default async function PublicQueuePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const supabase = await createClient();
  const profile = await getProfileByPublicId(supabase, businessId);

  if (!profile) {
    notFound();
  }

  return <PublicQueue profile={profile} />;
}
