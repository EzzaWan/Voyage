import { Metadata } from "next";
import { BlogCard } from "@/components/BlogCard";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Blog - Voyo eSIM",
  description: "Read the latest articles about eSIM technology, travel tips, and global connectivity.",
  openGraph: {
    title: "Blog - Voyo eSIM",
    description: "Read the latest articles about eSIM technology, travel tips, and global connectivity.",
    type: "website",
  },
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  createdAt: string;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const res = await fetch(`${apiUrl}/blog`, {
      next: { revalidate: 60 }, // Revalidate every minute
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Blog</h1>
        <p className="text-[var(--voyo-muted)] text-lg">
          Stay updated with the latest insights on eSIM technology, travel tips, and global connectivity.
        </p>
      </div>

      {posts.length === 0 ? (
        <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
          <CardContent className="py-12 text-center">
            <p className="text-[var(--voyo-muted)]">
              No blog posts available yet. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}










