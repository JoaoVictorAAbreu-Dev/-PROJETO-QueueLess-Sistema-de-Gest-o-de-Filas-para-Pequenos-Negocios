"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { upsertProfile } from "@/services/profile";

export function ProfileSetup({ userId }: { userId: string }) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await upsertProfile(createClient(), userId, businessName);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nao foi possivel criar o perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configure seu negocio</CardTitle>
          <CardDescription>Esse nome aparece no painel interno e na tela publica da fila.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? <Alert>{error}</Alert> : null}
            <div className="space-y-2">
              <Label htmlFor="business-name">Nome do estabelecimento</Label>
              <Input
                id="business-name"
                required
                minLength={2}
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Barbearia Central"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Criar painel"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
