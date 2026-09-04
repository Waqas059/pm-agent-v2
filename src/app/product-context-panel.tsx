"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type ContextItem = Database["public"]["Tables"]["context_items"]["Row"];
type ContextCategory = Database["public"]["Enums"]["context_category"];
type PanelStatus = "loading" | "ready" | "signed_out" | "not_configured" | "no_workspace" | "error";

const categories: Array<{ value: ContextCategory | "all"; label: string }> = [
  { value: "all", label: "All context" },
  { value: "product", label: "Product" },
  { value: "goals", label: "Goals" },
  { value: "personas", label: "Personas" },
  { value: "strategy", label: "Strategy" },
  { value: "constraints", label: "Constraints" },
  { value: "metrics", label: "Metrics" },
  { value: "decisions", label: "Decisions" },
  { value: "assumptions", label: "Assumptions" },
];

const categoryDescriptions: Record<ContextCategory, string> = {
  product: "The product and the problem it solves",
  goals: "Outcomes your team is working toward",
  personas: "People and teams you serve",
  strategy: "Strategic direction and positioning",
  constraints: "Boundaries, risks, and limitations",
  metrics: "Signals that show whether it is working",
  decisions: "Important choices and their reasoning",
  assumptions: "Beliefs that still need validation",
};

const emptyForm = {
  category: "product" as ContextCategory,
  title: "",
  content: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function ProductContextPanel() {
  const [items, setItems] = useState<ContextItem[]>([]);
  const [status, setStatus] = useState<PanelStatus>("loading");
  const [message, setMessage] = useState("");
  const [workspaceName, setWorkspaceName] = useState("Product workspace");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContextCategory | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setStatus("signed_out");
        return;
      }

      setUserId(userData.user.id);
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id, name")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (workspaceError) throw workspaceError;
      if (!workspace) {
        setStatus("no_workspace");
        return;
      }

      setWorkspaceId(workspace.id);
      setWorkspaceName(workspace.name);
      const { data: contextItems, error: contextError } = await supabase
        .from("context_items")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("updated_at", { ascending: false });

      if (contextError) throw contextError;
      setItems(contextItems ?? []);
      setStatus("ready");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to load the workspace.";
      if (errorMessage.startsWith("Supabase is not configured")) {
        setStatus("not_configured");
      } else {
        setStatus("error");
        setMessage(errorMessage);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  const visibleItems = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.category === filter)),
    [filter, items],
  );

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function startEdit(item: ContextItem) {
    setEditingId(item.id);
    setForm({ category: item.category, title: item.title, content: item.content });
    setIsFormOpen(true);
  }

  async function createWorkspace() {
    if (!userId) return;
    setIsSaving(true);
    setMessage("");

    try {
      const supabase = createClient();
      const suffix = crypto.randomUUID().slice(0, 8);
      const { error } = await supabase.from("workspaces").insert({
        owner_id: userId,
        name: "Product workspace",
        slug: `product-workspace-${suffix}`,
        description: "A shared home for product context and decisions.",
      });
      if (error) throw error;
      await loadWorkspace();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to create the workspace.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveContext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId || !userId || !form.title.trim() || !form.content.trim()) return;

    setIsSaving(true);
    setMessage("");
    const supabase = createClient();
    const title = form.title.trim();
    const content = form.content.trim();

    try {
      if (editingId) {
        const { data, error } = await supabase
          .from("context_items")
          .update({ category: form.category, title, content, updated_by: userId })
          .eq("id", editingId)
          .select("*")
          .single();
        if (error) throw error;
        setItems((current) => current.map((item) => (item.id === editingId ? data : item)));
      } else {
        const { data, error } = await supabase
          .from("context_items")
          .insert({
            workspace_id: workspaceId,
            category: form.category,
            title,
            content,
            source_type: "user_input",
            provenance: { source: "product_context_form" },
            created_by: userId,
            updated_by: userId,
          })
          .select("*")
          .single();
        if (error) throw error;
        setItems((current) => [data, ...current]);
      }

      setForm(emptyForm);
      setEditingId(null);
      setIsFormOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save this context item.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteContext(item: ContextItem) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.from("context_items").delete().eq("id", item.id);
      if (error) throw error;
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete this context item.");
    }
  }

  if (status === "loading") {
    return <PanelMessage title="Loading your product context…" body="Checking the connected workspace." />;
  }

  if (status === "not_configured") {
    return <PanelMessage title="Connect Supabase to manage context" body="Add your project URL and publishable key to .env.local, then reload the app." />;
  }

  if (status === "signed_out") {
    return <PanelMessage title="Sign in to manage product context" body="This workspace is protected by Supabase. An authenticated session is required before context can be read or changed." />;
  }

  if (status === "no_workspace") {
    return (
      <div className="rounded-2xl border border-dashed border-[#cfd7e4] bg-[#fbfcff] p-7 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9edff] text-lg font-bold text-[#5269d8]">P</div>
        <h3 className="mt-4 text-base font-semibold text-[#192235]">Create your product workspace</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68748a]">This creates one private workspace for your account. You can then start adding the context your team relies on.</p>
        <button type="button" onClick={() => void createWorkspace()} disabled={isSaving} className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#5269d8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#435ac6] disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? "Creating…" : "Create workspace"}
        </button>
        {message && <p role="alert" className="mt-4 text-xs text-[#b4534b]">{message}</p>}
      </div>
    );
  }

  if (status === "error") {
    return (
      <PanelMessage title="We could not load this workspace" body={message || "Please try again."} action={<button type="button" onClick={() => void loadWorkspace()} className="mt-5 rounded-lg border border-[#d8dee8] bg-white px-4 py-2.5 text-sm font-semibold text-[#526075] hover:border-[#aab8ee]">Try again</button>} />
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8d98a9]">{workspaceName}</p>
          <h2 id="context-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Build your product context</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#68748a]">Capture the facts your team returns to, so future PM work starts with shared understanding.</p>
        </div>
        <button type="button" onClick={startCreate} className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#5269d8] px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#435ac6]">
          <span className="text-lg leading-none">+</span>
          Add context
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={saveContext} className="mt-7 rounded-xl border border-[#cdd6f6] bg-[#f8f9ff] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#192235]">{editingId ? "Edit context" : "Add product context"}</h3>
              <p className="mt-1 text-xs text-[#7d88a2]">Manual context is saved to this workspace.</p>
            </div>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-xs font-semibold text-[#68748a] hover:text-[#192235]">Cancel</button>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-xs font-semibold text-[#526075]">
              Category
              <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ContextCategory }))} className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal text-[#192235] outline-none focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]">
                {categories.filter((category) => category.value !== "all").map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
              <span className="font-normal text-[#8d98a9]">{categoryDescriptions[form.category]}</span>
            </label>
            <label className="grid gap-2 text-xs font-semibold text-[#526075]">
              Title
              <input required maxLength={160} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="For example, our primary customer problem" className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]" />
            </label>
            <label className="grid gap-2 text-xs font-semibold text-[#526075]">
              Context
              <textarea required maxLength={20000} rows={4} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="Write the durable product knowledge your team should share…" className="resize-y rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal leading-6 text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]" />
            </label>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[#8d98a9]">Source: entered manually</p>
            <button type="submit" disabled={isSaving || !form.title.trim() || !form.content.trim()} className="rounded-lg bg-[#5269d8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#435ac6] disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "Saving…" : editingId ? "Save changes" : "Save context"}</button>
          </div>
        </form>
      )}

      <div className="mt-7 flex gap-2 overflow-x-auto border-b border-[#e3e7ee] pb-3" role="group" aria-label="Filter context by category">
        {categories.map((category) => (
          <button key={category.value} type="button" aria-pressed={filter === category.value} onClick={() => setFilter(category.value)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === category.value ? "bg-[#192235] text-white" : "bg-[#f3f5f8] text-[#68748a] hover:bg-[#e8ebf2]"}`}>
            {category.label}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[#d8dee8] p-7 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f5fb] text-sm font-bold text-[#8692a6]">+</div>
          <h3 className="mt-3 text-sm font-semibold text-[#526075]">{filter === "all" ? "No context added yet" : `No ${categories.find((category) => category.value === filter)?.label.toLowerCase()} context yet`}</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#9aa4b3]">Start with one durable fact about your product. You can edit it as your understanding changes.</p>
          <button type="button" onClick={startCreate} className="mt-4 text-xs font-semibold text-[#5269d8] hover:text-[#435ac6]">Add the first item <span aria-hidden>→</span></button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {visibleItems.map((item) => (
            <article key={item.id} className="rounded-xl border border-[#e3e7ee] bg-white p-4 transition-shadow hover:shadow-[0_8px_24px_rgba(25,34,53,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-[#eef1ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5269d8]">{item.category}</span>
                <div className="flex items-center gap-3 text-xs font-semibold text-[#9aa4b3]">
                  <button type="button" onClick={() => startEdit(item)} className="hover:text-[#5269d8]">Edit</button>
                  <button type="button" onClick={() => void deleteContext(item)} className="hover:text-[#b4534b]">Delete</button>
                </div>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#192235]">{item.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#68748a]">{item.content}</p>
              <p className="mt-4 text-[11px] text-[#a0a9b8]">Updated {formatDate(item.updated_at)} · Manual input</p>
            </article>
          ))}
        </div>
      )}

      {message && <p role="alert" className="mt-4 text-xs text-[#b4534b]">{message}</p>}
      <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#f8f9fb] px-3 py-2.5 text-xs leading-5 text-[#8d98a9]">
        <span className="mt-0.5 text-[#53a977]">✓</span>
        Your context is stored separately from assumptions and evidence. Imported and generated sources will arrive in later tasks.
      </div>
    </div>
  );
}

function PanelMessage({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#cfd7e4] bg-[#fbfcff] p-7 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9edff] text-lg font-bold text-[#5269d8]">P</div>
      <h3 className="mt-4 text-base font-semibold text-[#192235]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68748a]">{body}</p>
      {action}
    </div>
  );
}
