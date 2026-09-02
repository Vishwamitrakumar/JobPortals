"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Paperclip,
  Send,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  FileText,
} from "lucide-react";

// ---------------------------------------------------------------------------
// API CONFIG
// Your .env has NEXT_PUBLIC_API=http://127.0.0.1:8000 (no /api suffix).
// Adjust API_PREFIX below to "" if your urls.py is mounted at the root
// instead of under /api/.
// ---------------------------------------------------------------------------
const API_ROOT = process.env.NEXT_PUBLIC_API || "http://127.0.0.1:8000";
const API_PREFIX = "/api"; // change to "" if not using an /api/ prefix

const ENDPOINTS = {
  send: `${API_ROOT}${API_PREFIX}/support/messages/`,
  list: `${API_ROOT}${API_PREFIX}/support/my-messages/`,
  reply: (messageId: number) =>
    `${API_ROOT}${API_PREFIX}/support/messages/${messageId}/reply/`,
  // NOTE: your urls.py doesn't show a delete route yet — add one on the
  // Django side, e.g.:
  //   path("support/messages/<int:message_id>/",
  //        SupportMessageDetailView.as_view(), name="support-message-detail")
  // with a `delete()` method that checks request.user owns the message.
  delete: (messageId: number) =>
    `${API_ROOT}${API_PREFIX}/support/messages/${messageId}/`,
};

// Change this if you store your auth token under a different key
const TOKEN_KEY = "access";

type Sender = "user" | "support";

interface Message {
  id: number;
  sender: Sender;
  name: string;
  date: string;
  text: string;
  attachmentUrl: string | null;
}

// Raw shape coming back from the Django API — matches your
// support_message table: id, sender_type, message, attachment,
// created_at, conversation_id, sender_id.
// If your serializer also returns the sender's username (recommended —
// add a SerializerMethodField for it), name it "sender_name" below, or
// change the field name here to match.
interface ApiMessage {
  id: number;
  sender_type: "user" | "support";
  message: string;
  attachment?: string | null;
  created_at: string;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
}

const PAGE_SIZE = 3;

const subjects = [
  "Application issue",
  "Account & login",
  "Payments & billing",
  "Profile & resume",
  "Other",
];

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const buildAttachmentUrl = (path?: string | null) => {
  if (!path) return null;

  if (path.startsWith("http")) {
    return path;
  }

  return `${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`;
};

// Fallback display name for the logged-in user when the API doesn't
// return one. Store this in localStorage at login time
// (localStorage.setItem("username", data.username)) for a real name
// instead of the generic "You".
const getStoredUsername = () =>
  (typeof window !== "undefined" && localStorage.getItem("username")) || "You";

// Map the flat message rows straight from the DB into UI rows.
const mapMessages = (rows: ApiMessage[]): Message[] => {
  // sort oldest -> newest by the raw timestamp first (before formatting,
  // since the formatted string isn't reliably re-parseable)
  const sorted = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  return sorted.map((m) => ({
    id: m.id,
    sender: m.sender_type,
    name:
      m.sender_name ||
      (m.sender_type === "support" ? "Support Team" : getStoredUsername()),
    date: formatDate(m.created_at),
    text: m.message,
    attachmentUrl: buildAttachmentUrl(m.attachment),
  }));
};

const HelpCenter: React.FC = () => {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [page, setPage] = useState(1);
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  // Wrap fetch so every call carries the auth header and any 401
  // bounces the user to /login.
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = getToken();
      const headers: HeadersInit = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        router.push("/login");
        throw new Error("Not authenticated");
      }
      return res;
    },
    [router]
  );

  // Gate the whole page behind auth before doing anything else.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(ENDPOINTS.list, { method: "GET" });
      if (!res.ok) throw new Error(`Failed to load messages (${res.status})`);
      const data: ApiMessage[] = await res.json();
      setMessages(mapMessages(data));
    } catch (err) {
      if (err instanceof Error && err.message !== "Not authenticated") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!checkingAuth) fetchMessages();
  }, [checkingAuth, fetchMessages]);

  const totalPages = Math.max(1, Math.ceil(messages.length / PAGE_SIZE));

  const pagedMessages = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return messages.slice(start, start + PAGE_SIZE);
  }, [messages, page]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", messageText.trim());
      if (file) formData.append("attachment", file);

      // Don't set Content-Type manually for FormData — the browser
      // sets the correct multipart boundary automatically.
      const res = await authFetch(ENDPOINTS.send, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Failed to send message (${res.status})`);

      setMessageText("");
      setSubject("");
      setFile(null);
      await fetchMessages();
      const nextTotalPages = Math.max(1, Math.ceil((messages.length + 1) / PAGE_SIZE));
      setPage(nextTotalPages);
    } catch (err) {
      if (err instanceof Error && err.message !== "Not authenticated") {
        setError(err.message);
      }
    } finally {
      setSending(false);
    }
  };

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (deletingId) return;
    setDeletingId(id);
    setError(null);
    // optimistic remove, restore on failure
    const prevMessages = messages;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      const res = await authFetch(ENDPOINTS.delete(id), { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete message (${res.status})`);
      }
      setPage((p) => {
        const remaining = prevMessages.length - 1;
        const nextTotalPages = Math.max(1, Math.ceil(remaining / PAGE_SIZE));
        return Math.min(p, nextTotalPages);
      });
    } catch (err) {
      setMessages(prevMessages); // rollback
      if (err instanceof Error && err.message !== "Not authenticated") {
        setError(err.message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Help Center</h1>
        <div className="mt-2 text-sm text-slate-500 flex items-center gap-1.5">
          <span className="text-indigo-600 hover:underline cursor-pointer">Home</span>
          <span>›</span>
          <span className="text-indigo-600 hover:underline cursor-pointer">Help Center</span>
        </div>
        <p className="mt-3 text-slate-500 text-sm">
          We're here to help! Send us a message and we'll get back to you.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Support Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900">Contact Support</h2>
            <p className="text-sm text-slate-500 mt-1">
              Fill out the form below and our team will get back to you.
            </p>

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-700">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Choose a subject</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-700">Message</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value.slice(0, 1000))}
                placeholder="Type your message here..."
                rows={6}
                className="mt-1.5 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="text-right text-xs text-slate-400 mt-1">
                {messageText.length}/1000
              </div>
            </div>

            <div className="mt-3">
              <label className="text-sm font-medium text-slate-700">
                Attachments <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <label className="mt-1.5 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-400 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors">
                <Paperclip size={16} />
                <span>{file ? file.name : "Choose file or drag it here"}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <p className="text-xs text-slate-400 mt-1.5">PDF, PNG, JPG (Max 5MB)</p>
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !messageText.trim()}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white font-medium text-sm py-2.5"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>

          {/* My Messages */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">My Messages</h2>
              {loading && <Loader2 size={16} className="animate-spin text-indigo-500" />}
            </div>

            <div className="mt-4 space-y-4 flex-1">
              {!loading && pagedMessages.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-10">
                  This is the beginning of your conversation.
                </p>
              )}

              {pagedMessages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg p-4 ${
                    m.sender === "support" ? "bg-emerald-50" : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                          m.sender === "support"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {m.sender === "support" ? (
                          <Headphones size={14} />
                        ) : (
                          m.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{m.name}</div>
                        <div className="text-xs text-slate-400">{m.date}</div>
                      </div>
                    </div>
                    {m.sender === "user" && (
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === m.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="mt-2.5 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    {m.text}
                  </p>
                  {m.attachmentUrl && (
                    <a
                      href={m.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline"
                    >
                      <FileText size={13} />
                      View attachment
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {messages.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Page {page} of {totalPages} · {messages.length} messages
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-indigo-600 text-white"
                          : "text-slate-500 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;