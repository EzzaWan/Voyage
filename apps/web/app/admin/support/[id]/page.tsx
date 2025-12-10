"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Mail, Smartphone, Calendar, User } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface SupportTicketReply {
  id: string;
  message: string;
  isAdmin: boolean;
  adminEmail?: string | null;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  orderId: string | null;
  device: string | null;
  message: string;
  createdAt: string;
  SupportTicketReply: SupportTicketReply[];
}

export default function AdminSupportTicketDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    if (user && params.id) {
      fetchTicket();
    }
  }, [user, params.id]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const data = await safeFetch<SupportTicket>(
        `${apiUrl}/admin/support/tickets/${params.id}`,
        {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        }
      );
      setTicket(data);
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
      toast({
        title: "Error",
        description: "Failed to load ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    setReplying(true);
    try {
      await safeFetch(
        `${apiUrl}/admin/support/tickets/${params.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          body: JSON.stringify({
            message: replyMessage,
          }),
        }
      );

      toast({
        title: "Reply sent",
        description: "Your reply has been sent to the customer.",
      });

      setReplyMessage("");
      fetchTicket(); // Refresh ticket to show new reply
    } catch (error: any) {
      console.error("Failed to send reply:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReplying(false);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyage-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--voyage-muted)]">Loading ticket...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/support")}
          className="text-[var(--voyage-muted)] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Support Ticket</h1>
          <p className="text-[var(--voyage-muted)]">Ticket ID: {ticket.id.substring(0, 8)}...</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--voyage-muted)] flex items-center gap-2 mb-1">
                <User className="h-4 w-4" />
                Name
              </p>
              <p className="text-white">{ticket.name}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--voyage-muted)] flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4" />
                Email
              </p>
              <a href={`mailto:${ticket.email}`} className="text-[var(--voyage-accent)] hover:underline">
                {ticket.email}
              </a>
            </div>
            {ticket.orderId && (
              <div>
                <p className="text-sm text-[var(--voyage-muted)] mb-1">Order ID</p>
                <Link href={`/admin/orders/${ticket.orderId}`} className="text-[var(--voyage-accent)] hover:underline font-mono text-sm">
                  {ticket.orderId}
                </Link>
              </div>
            )}
            {ticket.device && (
              <div>
                <p className="text-sm text-[var(--voyage-muted)] flex items-center gap-2 mb-1">
                  <Smartphone className="h-4 w-4" />
                  Device
                </p>
                <p className="text-white">{ticket.device}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-[var(--voyage-muted)] flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                Submitted
              </p>
              <p className="text-white">{new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white">Original Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-[var(--voyage-bg-light)] rounded-lg p-4 border border-[var(--voyage-border)]">
              <p className="text-white whitespace-pre-wrap">{ticket.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Thread */}
      {ticket.SupportTicketReply && ticket.SupportTicketReply.length > 0 && (
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white">Conversation ({ticket.SupportTicketReply.length} replies)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.SupportTicketReply.map((reply) => (
              <div
                key={reply.id}
                className={`p-4 rounded-lg border ${
                  reply.isAdmin
                    ? "bg-[var(--voyage-accent)]/10 border-[var(--voyage-accent)]/30 ml-8"
                    : "bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] mr-8"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={reply.isAdmin ? "bg-[var(--voyage-accent)]" : ""}>
                      {reply.isAdmin ? `Admin${reply.adminEmail ? ` (${reply.adminEmail})` : ""}` : "Customer"}
                    </Badge>
                    <span className="text-xs text-[var(--voyage-muted)]">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-white whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reply Form */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">Reply to Customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply here..."
            className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white min-h-[150px]"
          />
          <Button
            onClick={handleReply}
            disabled={replying || !replyMessage.trim()}
            className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)]"
          >
            {replying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

