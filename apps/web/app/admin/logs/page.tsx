"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdminLog {
  id: string;
  action: string;
  adminEmail: string;
  entityType: string;
  entityId: string;
  data: any;
  createdAt: string;
}

interface WebhookEvent {
  id: string;
  source: string;
  payload: any;
  processed: boolean;
  createdAt: string;
}

interface LogsData {
  adminLogs: AdminLog[];
  webhookEvents: WebhookEvent[];
}

export default function AdminLogsPage() {
  const { user } = useUser();
  const [logs, setLogs] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"admin" | "webhooks">("admin");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/logs?limit=100`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLogs();
    }
  }, [user, apiUrl]);

  if (loading || !logs) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyage-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--voyage-muted)]">Loading logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Logs</h1>
        <p className="text-[var(--voyage-muted)]">
          View admin actions and webhook events
        </p>
      </div>

      <div className="flex gap-2 border-b border-[var(--voyage-border)]">
        <button
          onClick={() => setActiveTab("admin")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "admin"
              ? "text-[var(--voyage-accent)] border-b-2 border-[var(--voyage-accent)]"
              : "text-[var(--voyage-muted)] hover:text-white"
          }`}
        >
          Admin Logs ({logs.adminLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "webhooks"
              ? "text-[var(--voyage-accent)] border-b-2 border-[var(--voyage-accent)]"
              : "text-[var(--voyage-muted)] hover:text-white"
          }`}
        >
          Webhook Events ({logs.webhookEvents.length})
        </button>
      </div>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {activeTab === "admin" ? (
              <div className="space-y-2 p-4">
                {logs.adminLogs.length === 0 ? (
                  <p className="text-center text-[var(--voyage-muted)] py-8">
                    No admin logs found
                  </p>
                ) : (
                  logs.adminLogs.map((log) => (
                    <details
                      key={log.id}
                      className="p-4 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]"
                    >
                      <summary className="cursor-pointer flex items-center justify-between">
                        <div>
                          <span className="text-white font-medium">{log.action}</span>
                          <span className="text-[var(--voyage-muted)] text-sm ml-2">
                            {log.entityType} • {log.entityId.substring(0, 8)}...
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-xs">{log.adminEmail}</Badge>
                          <span className="text-xs text-[var(--voyage-muted)]">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </summary>
                      <pre className="mt-3 text-xs text-[var(--voyage-muted)] overflow-auto p-2 bg-[var(--voyage-bg)] rounded">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {logs.webhookEvents.length === 0 ? (
                  <p className="text-center text-[var(--voyage-muted)] py-8">
                    No webhook events found
                  </p>
                ) : (
                  logs.webhookEvents.map((event) => (
                    <details
                      key={event.id}
                      className="p-4 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]"
                    >
                      <summary className="cursor-pointer flex items-center justify-between">
                        <div>
                          <span className="text-white font-medium">{event.source}</span>
                          <Badge
                            className={`ml-2 ${
                              event.processed
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {event.processed ? "Processed" : "Pending"}
                          </Badge>
                        </div>
                        <span className="text-xs text-[var(--voyage-muted)]">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </summary>
                      <pre className="mt-3 text-xs text-[var(--voyage-muted)] overflow-auto p-2 bg-[var(--voyage-bg)] rounded">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </details>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

