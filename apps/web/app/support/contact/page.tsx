"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { useUser } from "@clerk/nextjs";

export default function ContactSupportPage() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: user?.fullName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    orderId: "",
    device: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const deviceModels = [
    "iPhone 15 Pro Max",
    "iPhone 15 Pro",
    "iPhone 15",
    "iPhone 14 Pro Max",
    "iPhone 14 Pro",
    "iPhone 14",
    "iPhone 13 Pro Max",
    "iPhone 13 Pro",
    "iPhone 13",
    "iPhone 12 Pro Max",
    "iPhone 12 Pro",
    "iPhone 12",
    "Samsung Galaxy S24 Ultra",
    "Samsung Galaxy S24",
    "Samsung Galaxy S23 Ultra",
    "Samsung Galaxy S23",
    "Google Pixel 8 Pro",
    "Google Pixel 8",
    "Google Pixel 7 Pro",
    "Google Pixel 7",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError("Name is required");
        setLoading(false);
        return;
      }
      if (!formData.email.trim()) {
        setError("Email is required");
        setLoading(false);
        return;
      }
      if (!formData.message.trim()) {
        setError("Message is required");
        setLoading(false);
        return;
      }
      if (formData.message.trim().length < 10) {
        setError("Message must be at least 10 characters long");
        setLoading(false);
        return;
      }
      if (formData.message.trim().length > 1000) {
        setError("Message must be no more than 1000 characters long");
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      };

      // Only include optional fields if they have values
      if (formData.orderId && formData.orderId.trim()) {
        payload.orderId = formData.orderId.trim();
      }
      if (formData.device && formData.device.trim()) {
        payload.device = formData.device.trim();
      }

      await safeFetch(`${apiUrl}/support/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        errorMessage: "Failed to send message. Please try again.",
      });

      setSuccess(true);
      setFormData({
        name: user?.fullName || "",
        email: user?.primaryEmailAddress?.emailAddress || "",
        orderId: "",
        device: "",
        message: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen py-10">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Message Sent Successfully!</h2>
              <p className="text-[var(--voyage-muted)] mb-6">
                We've received your message and will get back to you as soon as possible, usually within 24-48 hours.
              </p>
              <div className="flex gap-4 justify-center">
                <a href="/support">
                  <Button variant="outline" className="border-[var(--voyage-border)] text-white">
                    Back to Support
                  </Button>
                </a>
                <a href="/">
                  <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white">
                    Go Home
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Contact Support</h1>
          <p className="text-[var(--voyage-muted)]">
            Send us a message and we'll get back to you as soon as possible
          </p>
        </div>

        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Support Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="orderId" className="block text-sm font-medium text-white mb-2">
                  Order ID <span className="text-[var(--voyage-muted)] text-xs">(optional)</span>
                </label>
                <Input
                  id="orderId"
                  type="text"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  className="bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white"
                  placeholder="Order ID if related to a purchase"
                />
              </div>

              <div>
                <label htmlFor="device" className="block text-sm font-medium text-white mb-2">
                  Device Model <span className="text-[var(--voyage-muted)] text-xs">(optional)</span>
                </label>
                <select
                  id="device"
                  value={formData.device}
                  onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-[var(--voyage-border)] bg-[var(--voyage-bg)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--voyage-accent)]"
                >
                  <option value="">Select device model</option>
                  {deviceModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                  Message <span className="text-red-400">*</span>
                </label>
                <Textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white min-h-[200px]"
                  placeholder="Please describe your issue or question in detail..."
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


