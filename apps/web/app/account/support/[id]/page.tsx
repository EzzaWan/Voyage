"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Mail, Calendar, MessageCircle, User } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { useToast } from "@/components/ui/use-toast";

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

export default function SupportTicketDetailPage() {
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
    if (user?.primaryEmailAddress?.emailAddress && params.id) {
      fetchTicket();
    }
  }, [user, params.id]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const data = await safeFetch<SupportTicket>(
        `${apiUrl}/support/tickets/${params.id}`,
        {
          headers: {
            "x-user-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        }
      );
      setTicket(data);
    } catch (error: any) {
      console.error("Failed to fetch ticket:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load ticket. Please try again.",
        variant: "destructive",
      });
      router.push("/account/support");
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

    if (replyMessage.trim().length < 10) {
      toast({
        title: "Error",
        description: "Message must be at least 10 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (replyMessage.trim().length > 1000) {
      toast({
        title: "Error",
        description: "Message must be no more than 1000 characters long.",
        variant: "destructive",
      });
      return;
    }

    setReplying(true);
    try {
      await safeFetch(
        `${apiUrl}/support/tickets/${params.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          body: JSON.stringify({
            message: replyMessage.trim(),
          }),
          errorMessage: "Failed to send reply. Please try again.",
        }
      );

      toast({
        title: "Success",
        description: "Your reply has been sent successfully.",
      });

      setReplyMessage("");
      // Refresh ticket to show new reply
      await fetchTicket();
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
          onClick={() => router.push("/account/support")}
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

      {/* Original Message */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Your Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-[var(--voyage-bg-light)] rounded-lg p-4 border border-[var(--voyage-border)] mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--voyage-muted)] flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
              <Badge>You</Badge>
            </div>
            <p className="text-white whitespace-pre-wrap">{ticket.message}</p>
          </div>
          {ticket.orderId && (
            <p className="text-sm text-[var(--voyage-muted)]">
              Order ID: <span className="text-white font-mono">{ticket.orderId}</span>
            </p>
          )}
          {ticket.device && (
            <p className="text-sm text-[var(--voyage-muted)] mt-2">
              Device: <span className="text-white">{ticket.device}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Replies */}
      {ticket.SupportTicketReply && ticket.SupportTicketReply.length > 0 ? (
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Responses ({ticket.SupportTicketReply.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.SupportTicketReply.map((reply) => (
              <div
                key={reply.id}
                className={`p-4 rounded-lg border ${
                  reply.isAdmin
                    ? "bg-[var(--voyage-accent)]/10 border-[var(--voyage-accent)]/30"
                    : "bg-[var(--voyage-bg-light)] border-[var(--voyage-border)]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className={reply.isAdmin ? "bg-[var(--voyage-accent)]" : ""}>
                    {reply.isAdmin ? "Support Team" : "You"}
                  </Badge>
                  <span className="text-xs text-[var(--voyage-muted)] flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(reply.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-white whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-[var(--voyage-muted)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--voyage-muted)]">No responses yet. Our support team will get back to you soon.</p>
          </CardContent>
        </Card>
      )}

      {/* Reply Form */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Send className="h-5 w-5" />
            Add Reply
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your reply here (minimum 10 characters)..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white min-h-[120px]"
              disabled={replying}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--voyage-muted)]">
                {replyMessage.length}/1000 characters
              </p>
              <Button
                onClick={handleReply}
                disabled={replying || !replyMessage.trim() || replyMessage.trim().length < 10}
                className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

