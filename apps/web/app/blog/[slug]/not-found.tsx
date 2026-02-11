import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
        <CardContent className="py-12">
          <h1 className="text-3xl font-bold text-white mb-4">
            Post Not Found
          </h1>
          <p className="text-[var(--voyo-muted)] mb-8">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}







