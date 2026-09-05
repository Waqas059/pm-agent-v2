"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import { isLegacyWordContainer } from "@/lib/documents/file-signature";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type DocumentRecord = Database["public"]["Tables"]["documents"]["Row"];
type PanelStatus = "loading" | "ready" | "signed_out" | "not_configured" | "no_workspace" | "error";

const BUCKET_NAME = "documents";
const MAX_FILE_SIZE = 6 * 1024 * 1024;
const allowedExtensions = [".pdf", ".doc", ".docx", ".txt", ".md", ".csv", ".json"];
const mimeByExtension: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".json": "application/json",
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function safeFileName(name: string) {
  const normalized = name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.slice(0, 180) || "document";
}

function fileExtension(name: string) {
  const extension = name.slice(name.lastIndexOf(".")).toLowerCase();
  return extension in mimeByExtension ? extension : "";
}

export default function DocumentLibraryPanel() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [status, setStatus] = useState<PanelStatus>("loading");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [isUploading, setIsUploading] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<Record<string, "extracting" | "ready" | "error">>({});

  const loadDocuments = useCallback(async () => {
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
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (workspaceError) throw workspaceError;
      if (!workspace) {
        setStatus("no_workspace");
        return;
      }

      setWorkspaceId(workspace.id);
      const { data: documentRows, error: documentsError } = await supabase
        .from("documents")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentRows ?? []);

      if (documentRows?.length) {
        const { data: extractionRows } = await supabase
          .from("document_extractions")
          .select("document_id")
          .in("document_id", documentRows.map((document) => document.id));
        if (extractionRows) {
          setExtractionStatus(Object.fromEntries(extractionRows.map((row) => [row.document_id, "ready"])));
        }
      }
      setStatus("ready");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to load documents.";
      if (errorMessage.startsWith("Supabase is not configured")) {
        setStatus("not_configured");
      } else {
        setStatus("error");
        setMessage(errorMessage);
        setMessageTone("error");
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDocuments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDocuments]);

  const documentCountLabel = useMemo(
    () => `${documents.length} ${documents.length === 1 ? "file" : "files"}`,
    [documents.length],
  );

  async function extractDocument(document: DocumentRecord): Promise<boolean> {
    setExtractionStatus((current) => ({ ...current, [document.id]: "extracting" }));
    setMessage("");

    try {
      const response = await fetch(`/api/documents/${document.id}/extract`, { method: "POST" });
      const payload = (await response.json()) as { error?: string; extraction?: { characters: number; locatorCount: number } };
      if (!response.ok || !payload.extraction) throw new Error(payload.error || "Unable to extract this document.");

      setExtractionStatus((current) => ({ ...current, [document.id]: "ready" }));
      setMessage(`${document.original_name} is ready for evidence search (${payload.extraction.locatorCount} source lines indexed).`);
      setMessageTone("success");
      return true;
    } catch (error) {
      setExtractionStatus((current) => ({ ...current, [document.id]: "error" }));
      setMessage(error instanceof Error ? error.message : "Unable to extract this document.");
      setMessageTone("error");
      return false;
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !workspaceId || !userId) return;

    const extension = fileExtension(file.name);
    if (!extension) {
      setMessage(`Unsupported file type. Use ${allowedExtensions.join(", ")}.`);
      setMessageTone("error");
      return;
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      setMessage("Files must be larger than 0 bytes and no larger than 6 MB.");
      setMessageTone("error");
      return;
    }

    const fileHeader = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    if (extension === ".doc" || isLegacyWordContainer(fileHeader)) {
      setMessage("Legacy .doc files are not supported. Save the file as .docx or PDF and upload it again.");
      setMessageTone("error");
      return;
    }

    setIsUploading(true);
    setMessage("");

    const supabase = createClient();
    const storagePath = `${workspaceId}/${userId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const mimeType = file.type || mimeByExtension[extension];

    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, file, {
        cacheControl: "3600",
        contentType: mimeType,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: document, error: metadataError } = await supabase
        .from("documents")
        .insert({
          workspace_id: workspaceId,
          original_name: file.name,
          storage_path: storagePath,
          mime_type: mimeType,
          size_bytes: file.size,
          uploaded_by: userId,
        })
        .select("*")
        .single();

      if (metadataError) {
        await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
        throw metadataError;
      }

      setDocuments((current) => [document, ...current]);
      const extracted = await extractDocument(document);
      if (!extracted) {
        setMessage(`${file.name} uploaded successfully, but text extraction needs attention.`);
        setMessageTone("error");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload this file.");
      setMessageTone("error");
    } finally {
      setIsUploading(false);
    }
  }

  async function downloadDocument(document: DocumentRecord) {
    setMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(document.storage_path, 60);
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create a download link.");
      setMessageTone("error");
    }
  }

  async function deleteDocument(document: DocumentRecord) {
    if (!window.confirm(`Delete “${document.original_name}”?`)) return;
    setMessage("");

    try {
      const supabase = createClient();
      const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([document.storage_path]);
      if (storageError) throw storageError;

      const { error: metadataError } = await supabase.from("documents").delete().eq("id", document.id);
      if (metadataError) throw metadataError;

      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setMessage(`${document.original_name} deleted.`);
      setMessageTone("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete this file.");
      setMessageTone("error");
    }
  }

  if (status === "loading") return <PanelMessage title="Loading your document library…" body="Checking the connected workspace." />;
  if (status === "not_configured") return <PanelMessage title="Connect Supabase to manage documents" body="Add your project URL and publishable key to .env.local, then reload the app." />;
  if (status === "signed_out") return <PanelMessage title="Sign in to manage documents" body="Files are private workspace assets. An authenticated session is required before they can be read or changed." />;
  if (status === "no_workspace") return <PanelMessage title="Create a workspace first" body="Your document library will appear after an authenticated workspace is created in the Product Context section." />;
  if (status === "error") return <PanelMessage title="We could not load your documents" body={message || "Please try again."} action={<button type="button" onClick={() => void loadDocuments()} className="mt-5 rounded-lg border border-[#d8dee8] bg-white px-4 py-2.5 text-sm font-semibold text-[#526075] hover:border-[#aab8ee]">Try again</button>} />;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8d98a9]">Secure workspace storage</p>
          <h2 id="documents-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Product documents</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#68748a]">Keep research notes and product documents together. Files stay private to workspace members.</p>
        </div>
        <label className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-[#5269d8] px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#435ac6] ${isUploading ? "cursor-wait opacity-60" : ""}`}>
          <span className="text-lg leading-none">+</span>
          {isUploading ? "Uploading…" : "Upload document"}
          <input type="file" className="sr-only" accept={allowedExtensions.join(",")} onChange={(event) => void handleFileChange(event)} disabled={isUploading} />
        </label>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-[#cfd7e4] bg-[#fbfcff] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#526075]">Upload a source file</p>
            <p className="mt-1 text-xs leading-5 text-[#8d98a9]">PDF, Word, Markdown, text, CSV, or JSON · maximum 6 MB</p>
          </div>
          <p className="text-xs font-semibold text-[#8d98a9]">{documentCountLabel}</p>
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#9aa4b3]"><span className="mt-0.5 text-[#53a977]">✓</span>Text extraction runs without an AI call for PDF, DOCX, Markdown, text, CSV, and JSON. Legacy .doc files should be saved as .docx or PDF first.</p>
      </div>

      {documents.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[#d8dee8] p-7 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f5fb] text-sm font-bold text-[#8692a6]">↑</div>
          <h3 className="mt-3 text-sm font-semibold text-[#526075]">No documents uploaded yet</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#9aa4b3]">Upload a product brief, research note, or other source file to keep it with the rest of your workspace context.</p>
        </div>
      ) : (
        <div className="mt-5 divide-y divide-[#e9edf2] rounded-xl border border-[#e3e7ee] bg-white">
          {documents.map((document) => (
            <article key={document.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f1f3ff] text-xs font-bold uppercase text-[#5269d8]">{fileExtension(document.original_name).replace(".", "") || "file"}</span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-[#192235]">{document.original_name}</h3>
                  <p className="mt-1 text-xs text-[#8d98a9]">{formatBytes(document.size_bytes)} · Uploaded {formatDate(document.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 pl-[52px] text-xs font-semibold text-[#8d98a9] sm:pl-0">
                <button type="button" onClick={() => void extractDocument(document)} disabled={extractionStatus[document.id] === "extracting"} className="hover:text-[#5269d8] disabled:cursor-wait disabled:opacity-60">
                  {extractionStatus[document.id] === "extracting" ? "Extracting…" : extractionStatus[document.id] === "ready" ? "Text ready" : "Extract text"}
                </button>
                <button type="button" onClick={() => void downloadDocument(document)} className="hover:text-[#5269d8]">Download</button>
                <button type="button" onClick={() => void deleteDocument(document)} className="hover:text-[#b4534b]">Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {message && <p role="alert" aria-live="polite" className={`mt-4 text-xs ${messageTone === "error" ? "text-[#b4534b]" : "text-[#4d8c65]"}`}>{message}</p>}
    </div>
  );
}

function PanelMessage({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#cfd7e4] bg-[#fbfcff] p-7 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9edff] text-lg font-bold text-[#5269d8]">D</div>
      <h3 className="mt-4 text-base font-semibold text-[#192235]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68748a]">{body}</p>
      {action}
    </div>
  );
}
