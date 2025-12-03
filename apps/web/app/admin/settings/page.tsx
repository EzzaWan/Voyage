"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Settings {
  mockMode: boolean;
  defaultMarkupPercent: number;
  defaultCurrency: string;
  adminEmails: string[];
}

export default function AdminSettingsPage() {
  const { user } = useUser();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/settings`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSettings();
    }
  }, [user, apiUrl]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        alert("Settings saved successfully");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyage-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--voyage-muted)]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-[var(--voyage-muted)]">
          Configure admin panel and system settings
        </p>
      </div>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">System Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.mockMode}
                onChange={(e) =>
                  setSettings({ ...settings, mockMode: e.target.checked })
                }
                className="w-5 h-5 rounded border-[var(--voyage-border)] bg-[var(--voyage-bg-light)]"
              />
              <div>
                <p className="text-white font-medium">Mock Mode</p>
                <p className="text-sm text-[var(--voyage-muted)]">
                  Enable mock mode for testing
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Default Markup Percent
            </label>
            <Input
              type="number"
              value={settings.defaultMarkupPercent}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultMarkupPercent: parseFloat(e.target.value) || 0,
                })
              }
              className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white"
              step="0.01"
            />
            <p className="text-xs text-[var(--voyage-muted)] mt-1">
              Default markup percentage for pricing
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Default Currency
            </label>
            <Input
              type="text"
              value={settings.defaultCurrency}
              onChange={(e) =>
                setSettings({ ...settings, defaultCurrency: e.target.value })
              }
              className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white"
              placeholder="USD"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Admin Emails (comma-separated)
            </label>
            <textarea
              value={settings.adminEmails.join(", ")}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  adminEmails: e.target.value
                    .split(",")
                    .map((email) => email.trim())
                    .filter(Boolean),
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] text-white"
              rows={4}
            />
            <p className="text-xs text-[var(--voyage-muted)] mt-1">
              List of admin email addresses
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)]"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

