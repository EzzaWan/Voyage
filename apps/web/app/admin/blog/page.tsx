"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "@/components/ui/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBlogPage() {
  const { user, isLoaded } = useUser();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || adminLoading) {
      return;
    }

    if (!isAdmin) {
      router.push("/");
      return;
    }

    const fetchPosts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<{ posts: BlogPost[] }>(`${apiUrl}/admin/blog`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        });
        setPosts(data?.posts || []);
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, isLoaded, isAdmin, adminLoading, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      await safeFetch(`${apiUrl}/admin/blog/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
        errorMessage: "Failed to delete blog post",
      });

      setPosts(posts.filter((p) => p.id !== id));
      toast({
        title: "Blog post deleted",
        description: "The blog post has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog post",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[var(--voyo-muted)] font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Blog Management</h1>
          <p className="text-[var(--voyo-muted)] mt-1">
            {publishedCount} published, {draftCount} draft
          </p>
        </div>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      <Card className="bg-[var(--voyo-card)] border border-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Posts ({posts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-[var(--voyo-muted)] font-mono">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--voyo-muted)] mb-4">No blog posts yet.</p>
                <Link href="/admin/blog/new">
                  <Button>Create Your First Post</Button>
                </Link>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start justify-between p-4 bg-[var(--voyo-bg)]/50 border border-white/5 rounded-lg hover:border-[var(--voyo-accent)]/20 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-lg text-white">{post.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                          post.status === "published"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    {post.excerpt && (
                      <p className="text-[var(--voyo-muted)] text-sm line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-[var(--voyo-muted)] font-mono">
                      <span>Slug: {post.slug}</span>
                      <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(post.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {post.status === "published" && (
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Link href={`/admin/blog/${post.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



