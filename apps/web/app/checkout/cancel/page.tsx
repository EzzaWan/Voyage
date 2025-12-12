import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function CancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center">
        <XCircle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-4xl font-bold text-white">Payment Cancelled</h1>
      <p className="text-[var(--voyage-muted)] text-lg max-w-md">
        Your payment was cancelled. You have not been charged. You can try again whenever you're ready.
      </p>
      <Link href="/">
        <Button variant="outline" className="border-[var(--voyage-border)] text-white hover:bg-[var(--voyage-card)] px-8 py-6 text-lg rounded-full">
          Return to Store
        </Button>
      </Link>
    </div>
  );
}
