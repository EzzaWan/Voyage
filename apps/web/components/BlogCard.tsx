import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  createdAt: string;
}

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)] hover:border-[var(--voyo-accent)] transition-all hover:shadow-lg h-full flex flex-col cursor-pointer">
        {post.featuredImage && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <CardHeader>
          <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-[var(--voyo-muted)] text-sm line-clamp-3">
              {post.excerpt}
            </p>
          )}
        </CardHeader>
        <CardContent className="mt-auto">
          <div className="flex items-center gap-2 text-xs text-[var(--voyo-muted)]">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}







