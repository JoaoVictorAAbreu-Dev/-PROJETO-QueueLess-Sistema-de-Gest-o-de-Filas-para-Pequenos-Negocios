"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Eye, EyeOff, Mail } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { upsertProfile } from "@/services/profile";

type AuthMode = "magic" | "password" | "signup";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;

      if (mode === "magic") {
        const result = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
            shouldCreateUser: true,
          },
        });

        if (result.error) {
          throw result.error;
        }

        setMessage("Enviamos um link de acesso para seu email. Abra o link para entrar.");
        return;
      }

      const result =
        mode === "password"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { business_name: businessName },
                emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
              },
            });

      if (result.error) {
        throw result.error;
      }

      if (result.data.user && mode === "signup") {
        await upsertProfile(supabase, result.data.user.id, businessName);
      }

      if (!result.data.session && mode === "signup") {
        setMessage("Cadastro criado. Confirme seu email antes de entrar.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nao foi possivel autenticar.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border bg-white shadow-sm lg:grid-cols-[1fr_420px]">
        <section className="hidden bg-slate-950 p-10 text-white lg:block">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-600">
              <Clock3 className="size-5" />
            </span>
            QueueLess
          </div>
          <div className="mt-24 max-w-md">
              <h1 className="text-4xl font-semibold leading-tight">Gestao de filas em tempo real para equipes enxutas.</h1>
              <p className="mt-4 text-slate-300">
                Organize chegadas, chamadas, tela publica e metricas diarias em um unico painel operacional.
              </p>
              <div className="mt-10 grid gap-3 text-sm text-slate-300">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">Login sem senha por link magico</div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">Painel protegido e tela publica em tempo real</div>
              </div>
            </div>
          </section>
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader>
            <CardTitle>Acesse sua conta</CardTitle>
            <CardDescription>Use seu email para receber um link de acesso ou entre com senha.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="magic" value={mode} onValueChange={(value) => setMode(value as AuthMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="magic">Email</TabsTrigger>
                <TabsTrigger value="password">Senha</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {error ? <Alert>{error}</Alert> : null}
                {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
                <TabsContent value="signup" className="mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Nome do estabelecimento</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      required={mode === "signup"}
                      placeholder="Clinica Avenida"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="magic" className="mt-0">
                  <div className="rounded-lg border bg-muted/60 p-3 text-sm text-muted-foreground">
                    Sem senha: informe o email e confirme o acesso pelo link enviado.
                  </div>
                </TabsContent>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="voce@empresa.com"
                  />
                </div>
                {mode !== "magic" ? (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        minLength={6}
                        placeholder="Minimo 6 caracteres"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                ) : null}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    "Processando..."
                  ) : mode === "magic" ? (
                    <>
                      <Mail className="size-4" />
                      Enviar link de acesso
                    </>
                  ) : mode === "password" ? (
                    "Entrar com senha"
                  ) : (
                    "Criar conta"
                  )}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
