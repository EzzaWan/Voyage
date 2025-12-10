"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, Calendar, MessageCircle, ArrowRight } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { useRouter } from "next/navigation";
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

export default function MySupportTicketsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await safeFetch<SupportTicket[]>(
        `${apiUrl}/support/tickets`,
        {
          headers: {
            "x-user-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        }
      );
      setTickets(data || []);
    } catch (error) {
      console.error("Failed to fetch support tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyage-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--voyage-muted)]">Loading your support tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            My Support Tickets
          </h1>
          <p className="text-[var(--voyage-muted)]">
            View all your support tickets and responses from our team
          </p>
        </div>
        <Link href="/support/contact">
          <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)]">
            <Mail className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-16 w-16 text-[var(--voyage-muted)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--voyage-muted)] mb-4">You don't have any support tickets yet.</p>
            <Link href="/support/contact">
              <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)]">
                Create Support Ticket
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="bg-[var(--voyage-card)] border-[var(--voyage-border)] hover:border-[var(--voyage-accent)]/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/account/support/${ticket.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">Ticket #{ticket.id.substring(0, 8)}</h3>
                      {ticket.SupportTicketReply && ticket.SupportTicketReply.length > 0 && (
                        <Badge className="bg-[var(--voyage-accent)]">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {ticket.SupportTicketReply.length} {ticket.SupportTicketReply.length === 1 ? "reply" : "replies"}
                        </Badge>
                      )}
                      {ticket.orderId && (
                        <Badge variant="outline" className="border-[var(--voyage-border)]">
                          Order: {ticket.orderId.substring(0, 8)}...
                        </Badge>
                      )}
                    </div>
                    <p className="text-[var(--voyage-muted)] mb-2 line-clamp-2">{ticket.message}</p>
                    <div className="flex items-center gap-4 text-sm text-[var(--voyage-muted)]">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      {ticket.device && (
                        <div className="flex items-center gap-1">
                          <span>{ticket.device}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[var(--voyage-muted)] flex-shrink-0 ml-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

