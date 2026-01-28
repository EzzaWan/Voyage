"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "@/components/ui/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: string;
}

export default function AdminBlogEditPage() {
  const { user, isLoaded } = useUser();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BlogPost>({
    id: "",
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    metaTitle: "",
    metaDescription: "",
    status: "draft",
  });

  useEffect(() => {
    if (!isLoaded || adminLoading) {
      return;
    }

    if (!isAdmin) {
      router.push("/");
      return;
    }

    if (!isNew) {
      const fetchPost = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
          const data = await safeFetch<BlogPost>(`${apiUrl}/admin/blog/${id}`, {
            headers: {
              "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
            },
            showToast: false,
          });
          setFormData({
            ...data,
            excerpt: data.excerpt || "",
            featuredImage: data.featuredImage || "",
            metaTitle: data.metaTitle || "",
            metaDescription: data.metaDescription || "",
          });
        } catch (error) {
          console.error("Failed to fetch blog post:", error);
          toast({
            title: "Error",
            description: "Failed to load blog post",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchPost();
    } else {
      setLoading(false);
    }
  }, [user, isLoaded, isAdmin, adminLoading, router, id, isNew]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: formData.slug || generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt?.trim() || null,
        content: formData.content.trim(),
        featuredImage: formData.featuredImage?.trim() || null,
        metaTitle: formData.metaTitle?.trim() || null,
        metaDescription: formData.metaDescription?.trim() || null,
        status: formData.status,
      };

      if (isNew) {
        await safeFetch(`${apiUrl}/admin/blog`, {
          method: "POST",
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          errorMessage: "Failed to create blog post",
        });
        toast({
          title: "Success",
          description: "Blog post created successfully",
        });
        router.push("/admin/blog");
      } else {
        await safeFetch(`${apiUrl}/admin/blog/${id}`, {
          method: "PUT",
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          errorMessage: "Failed to update blog post",
        });
        toast({
          title: "Success",
          description: "Blog post updated successfully",
        });
        router.push("/admin/blog");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save blog post",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || adminLoading || loading) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {isNew ? "Create New Post" : "Edit Post"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card className="bg-[var(--voyo-card)] border border-white/5 text-white">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  className="bg-[var(--voyo-bg)] border-[var(--voyo-border)] text-white"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                  className="bg-[var(--voyo-bg)] border-[var(--voyo-border)] text-white font-mono text-sm"
                  placeholder="auto-generated-from-title"
                />
                <p className="text-xs text-[var(--voyo-muted)] mt-1">
                  URL-friendly version of the title
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  rows={3}
                  className="bg-[var(--voyo-bg)] border-[var(--voyo-border)] text-white"
                  placeholder="Short description of the post"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-[var(--voyo-border)] bg-[var(--voyo-bg)] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--voyo-accent)]"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--voyo-card)] border border-white/5 text-white">
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  required
                  rows={20}
                  className="bg-[var(--voyo-bg)] border-[var(--voyo-border)] text-white font-mono text-sm"
                  placeholder="Write your blog post content here. HTML and Markdown are supported."
                />
                <p className="text-xs text-[var(--voyo-muted)] mt-1">
                  Supports HTML and Markdown formatting
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--voyo-card)] border border-white/5 text-white">
            <CardHeader>
              <CardTitle>Media & SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  type="url"
                  value={formData.featuredImage}
                  onChange={(e) =>
                    setFormData({ ...formData, featuredImage: e.target.value })
                  }
                  className="bg-[var(--voyo-bg)] border-[var(--voyo-border)] text-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="metaTitle">SEO Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, metaTitle: e.target.value })
                  }
                  className="bg-[var(--voyo-bg)] border-[var(--voyo-border)] text-white"
                  placeholder="Leave empty to use post title"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">SEO Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, metaDescription: e.target.value })
                  }
                  rows={3}
                  className="bg-[var(--voyo-bg)] border-[var(--voyo-border)] text-white"
                  placeholder="Leave empty to use excerpt"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/admin/blog">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : isNew ? "Create Post" : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}



