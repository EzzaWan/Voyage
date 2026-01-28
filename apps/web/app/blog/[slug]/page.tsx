import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BlogContent } from "@/components/BlogContent";
import { Calendar } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const res = await fetch(`${apiUrl}/blog/${slug}`, {
      next: { revalidate: 60 }, // Revalidate every minute
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: "Post Not Found - Voyo eSIM Blog",
    };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      type: "article",
      images: post.featuredImage ? [post.featuredImage] : undefined,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="max-w-4xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-[var(--voyo-muted)] mb-6">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm text-[var(--voyo-muted)] mb-8">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>

        {post.featuredImage && (
          <div className="relative w-full h-96 mb-8 rounded-xl overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        )}
      </header>

      <div className="prose prose-invert max-w-none">
        <BlogContent content={post.content} />
      </div>
    </article>
  );
}



