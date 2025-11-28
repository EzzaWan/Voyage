import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>
      <h1 className="text-4xl font-bold text-white">Payment Successful!</h1>
      <p className="text-[var(--voyage-muted)] text-lg max-w-md">
        Your eSIM order has been confirmed. You will receive an email with installation instructions shortly.
      </p>
      <Link href="/my-esims">
        <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white px-8 py-6 text-lg rounded-full">
          View My eSIMs
        </Button>
      </Link>
    </div>
  );
}
