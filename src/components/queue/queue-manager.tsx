"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Phone, Plus, Trash2, UserRound } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQueueRealtime } from "@/hooks/use-queue-realtime";
import {
  addQueueEntry,
  callNextQueueEntry,
  cancelQueueEntry,
  completeQueueEntry,
  updateQueueEntry,
  type NewQueueEntryInput,
} from "@/services/queue";
import type { QueueEntry } from "@/types/database";

const initialForm = {
  customerName: "",
  phone: "",
  partySize: 1,
  notes: "",
};

export function QueueManager({ profileId }: { profileId: string }) {
  const { entries, isLoading, error, refresh, supabase } = useQueueRealtime(profileId);
  const [form, setForm] = useState<NewQueueEntryInput>(initialForm);
  const [editing, setEditing] = useState<QueueEntry | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calledEntry = useMemo(() => entries.find((entry) => entry.status === "called"), [entries]);
  const waitingEntries = useMemo(() => entries.filter((entry) => entry.status === "waiting"), [entries]);

  async function runAction(action: () => Promise<void>) {
    try {
      setActionError(null);
      await action();
      await refresh();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "A acao nao pode ser concluida.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    await runAction(async () => {
      if (editing) {
        await updateQueueEntry(supabase, editing.id, form);
      } else {
        await addQueueEntry(supabase, profileId, form);
      }
      setForm(initialForm);
      setEditing(null);
    });
    setIsSaving(false);
  }

  function startEditing(entry: QueueEntry) {
    setEditing(entry);
    setForm({
      customerName: entry.customer_name,
      phone: entry.phone ?? "",
      partySize: entry.party_size,
      notes: entry.notes ?? "",
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Editar cliente" : "Adicionar cliente"}</CardTitle>
          <CardDescription>Registre dados essenciais para organizar a chamada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {actionError ? <Alert>{actionError}</Alert> : null}
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome</Label>
              <Input
                id="customerName"
                required
                value={form.customerName}
                onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partySize">Pessoas</Label>
                <Input
                  id="partySize"
                  type="number"
                  min={1}
                  max={99}
                  value={form.partySize}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, partySize: Number(event.target.value) || 1 }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observacoes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Preferencias, prioridade operacional ou detalhes internos"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                <Plus className="size-4" />
                {editing ? "Salvar" : "Adicionar"}
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setForm(initialForm);
                  }}
                >
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Controle da fila</CardTitle>
              <CardDescription>Chame, conclua ou remova atendimentos em tempo real.</CardDescription>
            </div>
            <Button
              onClick={() => runAction(async () => void (await callNextQueueEntry(supabase, profileId)))}
              disabled={waitingEntries.length === 0}
            >
              Chamar proximo
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <Alert>{error}</Alert> : null}
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="font-medium">Fila vazia</p>
                <p className="mt-1 text-sm text-muted-foreground">Novos clientes aparecem aqui automaticamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calledEntry ? (
                  <QueueRow
                    entry={calledEntry}
                    highlighted
                    onEdit={() => startEditing(calledEntry)}
                    onComplete={() => runAction(async () => completeQueueEntry(supabase, calledEntry))}
                    onCancel={() => runAction(async () => cancelQueueEntry(supabase, calledEntry.id))}
                  />
                ) : null}
                {waitingEntries.map((entry) => (
                  <QueueRow
                    key={entry.id}
                    entry={entry}
                    onEdit={() => startEditing(entry)}
                    onComplete={() => runAction(async () => completeQueueEntry(supabase, entry))}
                    onCancel={() => runAction(async () => cancelQueueEntry(supabase, entry.id))}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QueueRow({
  entry,
  highlighted,
  onEdit,
  onComplete,
  onCancel,
}: {
  entry: QueueEntry;
  highlighted?: boolean;
  onEdit: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={highlighted ? "warning" : "secondary"}>
            {highlighted ? "Chamado" : `#${entry.position}`}
          </Badge>
          <h3 className="truncate font-semibold">{entry.customer_name}</h3>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <UserRound className="size-3.5" />
            {entry.party_size} pessoa{entry.party_size === 1 ? "" : "s"}
          </span>
          {entry.phone ? (
            <span className="inline-flex items-center gap-1">
              <Phone className="size-3.5" />
              {entry.phone}
            </span>
          ) : null}
        </div>
        {entry.notes ? <p className="text-sm text-muted-foreground">{entry.notes}</p> : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label="Editar">
          <Pencil className="size-4" />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={onComplete} aria-label="Concluir">
          <Check className="size-4" />
        </Button>
        <Button variant="destructive" size="icon-sm" onClick={onCancel} aria-label="Cancelar">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
