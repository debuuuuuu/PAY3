"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContactView } from "@pay3/shared";
import { apiFetch } from "@/lib/api";
import { truncateKey } from "@/lib/wallet";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactView[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [resolveInput, setResolveInput] = useState("");
  const [resolveResult, setResolveResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await apiFetch<{ contacts: ContactView[] }>("/contacts");
    setContacts(data.contacts);
  }, []);

  useEffect(() => {
    refresh()
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/contacts", {
        method: "POST",
        body: JSON.stringify({
          name,
          stellarAddress: address,
          verified: true,
        }),
      });
      setName("");
      setAddress("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await apiFetch(`/contacts/${id}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    setResolveResult(null);
    setError(null);
    try {
      const result = await apiFetch<{
        ok: true;
        kind: string;
        stellarAddress: string;
        contact?: ContactView;
      }>("/contacts/resolve", {
        method: "POST",
        body: JSON.stringify({ recipient: resolveInput }),
      });
      const label = result.contact
        ? `${result.contact.name} → ${result.stellarAddress}`
        : result.stellarAddress;
      setResolveResult(`Resolved (${result.kind}): ${label}`);
    } catch (err) {
      setResolveResult(null);
      setError(err instanceof Error ? err.message : "Resolve failed");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
          Contacts
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Save verified recipients like &quot;Alex&quot; → G-address. Pay3 never
          guesses — ambiguous names block payment until you clarify.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-6"
      >
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold">
          Add contact
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="text-white/50">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex"
              required
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-white/30"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/50">Stellar address</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="G…"
              required
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-[family-name:var(--font-jetbrains-mono)] text-xs text-white outline-none focus:border-white/30"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save contact"}
        </button>
      </form>

      <form
        onSubmit={handleResolve}
        className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-6"
      >
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold">
          Test resolver
        </h2>
        <p className="text-sm text-white/50">
          Try a name or G-address — same logic future MCP payments will use.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={resolveInput}
            onChange={(e) => setResolveInput(e.target.value)}
            placeholder="Alex or G…"
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
          <button type="submit" className="btn-primary shrink-0">
            Resolve
          </button>
        </div>
        {resolveResult ? (
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-white/80">
            {resolveResult}
          </p>
        ) : null}
      </form>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <h2 className="mb-3 text-xs uppercase tracking-wide text-white/40">
          Saved contacts
        </h2>
        {loading ? (
          <p className="text-sm text-white/50">Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-white/50">No contacts yet.</p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-white/50">
                    {truncateKey(c.stellarAddress)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="text-sm text-white/50 underline hover:text-white"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
