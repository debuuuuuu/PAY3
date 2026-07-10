"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Contact = {
  id: string;
  displayName: string;
  alias: string | null;
  stellarAddress: string;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [alias, setAlias] = useState("");
  const [stellarAddress, setStellarAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setContacts(await apiFetch<Contact[]>("/api/contacts"));
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load."),
    );
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/contacts", {
        method: "POST",
        body: JSON.stringify({
          displayName,
          alias: alias || undefined,
          stellarAddress,
        }),
      });
      setDisplayName("");
      setAlias("");
      setStellarAddress("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await apiFetch(`/api/contacts/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Contacts</h1>
        <p className="text-pay3-gray-400 text-sm mt-1">
          Verified recipients for AI transfers. Ambiguous names are never guessed.
        </p>
      </div>

      <form onSubmit={(e) => void create(e)} className="border border-white/10 rounded-2xl p-5 space-y-3 max-w-xl">
        <input
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
          placeholder="Alias (optional)"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
        />
        <input
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm"
          placeholder="Stellar address (G...)"
          value={stellarAddress}
          onChange={(e) => setStellarAddress(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Saving…" : "Add contact"}
        </button>
      </form>

      {error ? <p className="text-red-300 font-mono text-sm">{error}</p> : null}

      <ul className="space-y-3">
        {contacts.map((c) => (
          <li key={c.id} className="border border-white/10 rounded-2xl p-5 flex justify-between gap-4">
            <div>
              <p className="font-display">{c.displayName}</p>
              {c.alias ? (
                <p className="text-xs text-pay3-gray-400">alias: {c.alias}</p>
              ) : null}
              <p className="text-xs font-mono text-pay3-gray-400 mt-1">{c.stellarAddress}</p>
            </div>
            <button
              type="button"
              onClick={() => void remove(c.id)}
              className="rounded-full border border-white/20 px-3 py-1.5 text-sm h-fit"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
