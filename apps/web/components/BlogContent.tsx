"use client";

import { useEffect, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";

interface BlogContentProps {
  content: string;
  className?: string;
}

export function BlogContent({ content, className = "" }: BlogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Sanitize and set HTML content
      const sanitized = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "u",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "a",
          "blockquote",
          "code",
          "pre",
          "img",
          "hr",
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "class"],
      });

      contentRef.current.innerHTML = sanitized;

      // Add styling to the content
      const style = document.createElement("style");
      style.textContent = `
        .blog-content {
          line-height: 1.8;
          color: var(--voyo-text);
        }
        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          color: white;
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .blog-content h1 { font-size: 2.25rem; }
        .blog-content h2 { font-size: 1.875rem; }
        .blog-content h3 { font-size: 1.5rem; }
        .blog-content h4 { font-size: 1.25rem; }
        .blog-content p {
          margin-bottom: 1.25rem;
          color: var(--voyo-text);
        }
        .blog-content a {
          color: var(--voyo-accent);
          text-decoration: underline;
        }
        .blog-content a:hover {
          color: var(--voyo-accent-soft);
        }
        .blog-content ul,
        .blog-content ol {
          margin-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .blog-content li {
          margin-bottom: 0.5rem;
        }
        .blog-content blockquote {
          border-left: 4px solid var(--voyo-accent);
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: var(--voyo-muted);
        }
        .blog-content code {
          background: var(--voyo-bg-light);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          color: var(--voyo-accent);
        }
        .blog-content pre {
          background: var(--voyo-bg-light);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .blog-content pre code {
          background: transparent;
          padding: 0;
        }
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }
        .blog-content hr {
          border: none;
          border-top: 1px solid var(--voyo-border);
          margin: 2rem 0;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [content]);

  return (
    <div
      ref={contentRef}
      className={`blog-content ${className}`}
    />
  );
}

