"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import dynamic from "next/dynamic";
import { generateSlug, processWikiLinks, extractReferences } from "@/lib/utils";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

type Article = {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [citationUrl, setCitationUrl] = useState("");
  const [citationTitle, setCitationTitle] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchArticles();
    }
  }, [status]);

  const fetchArticles = async () => {
    try {
      const response = await fetch("/api/articles");
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          slug: editSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create article");
      } else {
        setIsCreating(false);
        setEditTitle("");
        setEditContent("");
        setEditSlug("");
        fetchArticles();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/articles/${selectedArticle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          slug: editSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update article");
      } else {
        setIsEditing(false);
        fetchArticles();
        setSelectedArticle({
          ...selectedArticle,
          title: editTitle,
          content: editContent,
          slug: editSlug,
        });
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchArticles();
        setSelectedArticle(null);
      }
    } catch (err) {
      console.error("Error deleting article:", err);
    }
  };

  const startEditing = (article: Article) => {
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditSlug(article.slug);
    setIsEditing(true);
    setError("");
  };

  const startCreating = () => {
    setEditTitle("");
    setEditContent("");
    setEditSlug("");
    setIsCreating(true);
    setIsEditing(false);
    setSelectedArticle(null);
    setError("");
  };

  const handleAddCitation = () => {
    if (!citationUrl || !citationTitle) {
      alert("Please enter both URL and title for the citation");
      return;
    }

    // Count existing citations
    const existingCitations = (editContent.match(/\[\d+\]/g) || []).length;
    const nextNum = existingCitations + 1;

    // Add inline citation at the end of content or where cursor would be
    const citation = `[${nextNum}]`;

    // Check if References section exists
    let newContent = editContent;
    const referenceLine = `[${nextNum}]: ${citationUrl} "${citationTitle}"`;

    if (newContent.includes("## References")) {
      // Add to existing References section
      newContent = newContent + `\n${referenceLine}`;
    } else {
      // Create new References section
      newContent = newContent + `\n\n## References\n${referenceLine}`;
    }

    // Add the citation marker at the end of the content (before References)
    const refIndex = newContent.indexOf("## References");
    if (refIndex > 0) {
      newContent = newContent.substring(0, refIndex).trimEnd() + ` ${citation}\n\n` + newContent.substring(refIndex);
    }

    setEditContent(newContent);
    setShowCitationModal(false);
    setCitationUrl("");
    setCitationTitle("");
  };

  // Filter articles based on search query
  const filteredArticles = articles.filter((article) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query)
    );
  });

  // Find article by title for wiki links
  const findArticleByTitle = (title: string) => {
    return articles.find(
      (article) => article.title.toLowerCase() === title.toLowerCase()
    );
  };

  // Custom link component for wiki-style links
  const WikiLink = ({ href, children, ...props }: any) => {
    if (href && href.startsWith("#wiki:")) {
      const articleTitle = decodeURIComponent(href.replace("#wiki:", ""));
      const linkedArticle = findArticleByTitle(articleTitle);

      const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (linkedArticle) {
          // Article exists, navigate to it
          setIsEditing(false);
          setIsCreating(false);
          setSelectedArticle(linkedArticle);
        } else {
          // Article doesn't exist, prompt to create it
          if (confirm(`The article "${articleTitle}" doesn't exist yet. Would you like to create it?`)) {
            setEditTitle(articleTitle);
            setEditContent("");
            setEditSlug(generateSlug(articleTitle));
            setIsCreating(true);
            setIsEditing(false);
            setSelectedArticle(null);
            setError("");
          }
        }
      };

      return (
        <button
          type="button"
          onClick={handleClick}
          className={`${
            linkedArticle
              ? "text-indigo-600 hover:text-indigo-800"
              : "text-red-600 hover:text-red-800"
          } underline cursor-pointer bg-transparent border-0 p-0 font-inherit inline`}
          title={linkedArticle ? `Go to ${articleTitle}` : `Article "${articleTitle}" does not exist - click to create`}
        >
          {children}
        </button>
      );
    }

    // Handle anchor links (citations and references)
    if (href && href.startsWith("#")) {
      return (
        <a
          href={href}
          className="text-indigo-600 hover:text-indigo-800 underline"
          onClick={(e) => {
            e.preventDefault();
            const element = document.getElementById(href.substring(1));
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          {children}
        </a>
      );
    }

    // Regular links - open external links in new tab, internal links in same tab
    const isExternal = href && (href.startsWith("http://") || href.startsWith("https://"));

    return (
      <a
        href={href}
        className="text-indigo-600 hover:text-indigo-800 underline"
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">The Recursory</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Articles</h2>
                <button
                  onClick={startCreating}
                  className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                >
                  New
                </button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                {articles.length === 0 ? (
                  <p className="text-sm text-gray-500">No articles yet</p>
                ) : filteredArticles.length === 0 ? (
                  <p className="text-sm text-gray-500">No articles match your search</p>
                ) : (
                  filteredArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => {
                        setSelectedArticle(article);
                        setIsEditing(false);
                        setIsCreating(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        selectedArticle?.id === article.id
                          ? "bg-indigo-50 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {article.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              {isCreating ? (
                <form onSubmit={handleCreateArticle}>
                  <h2 className="text-2xl font-bold mb-4">Create New Article</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => {
                          setEditTitle(e.target.value);
                          setEditSlug(generateSlug(e.target.value));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Content
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCitationModal(true)}
                          className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100"
                        >
                          + Add Citation
                        </button>
                      </div>
                      <div data-color-mode="light">
                        <MDEditor
                          value={editContent}
                          onChange={(value) => setEditContent(value || "")}
                          height={500}
                          preview="live"
                          hideToolbar={false}
                          enableScroll={true}
                          visibleDragbar={false}
                          textareaProps={{
                            placeholder: "Start writing in Markdown... Use the toolbar above for formatting.",
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {loading ? "Creating..." : "Create Article"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : selectedArticle && isEditing ? (
                <form onSubmit={handleUpdateArticle}>
                  <h2 className="text-2xl font-bold mb-4">Edit Article</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => {
                          setEditTitle(e.target.value);
                          setEditSlug(generateSlug(e.target.value));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Content
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCitationModal(true)}
                          className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100"
                        >
                          + Add Citation
                        </button>
                      </div>
                      <div data-color-mode="light">
                        <MDEditor
                          value={editContent}
                          onChange={(value) => setEditContent(value || "")}
                          height={500}
                          preview="live"
                          hideToolbar={false}
                          enableScroll={true}
                          visibleDragbar={false}
                          textareaProps={{
                            placeholder: "Start writing in Markdown... Use the toolbar above for formatting.",
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : selectedArticle ? (
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        {selectedArticle.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Last updated: {new Date(selectedArticle.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(selectedArticle)}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(selectedArticle.id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div
                    className="prose max-w-none"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;

                      // Handle citation clicks
                      const citationRef = target.getAttribute('data-citation-ref');
                      if (citationRef) {
                        e.preventDefault();
                        const element = document.getElementById(`ref-${citationRef}`);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                        return;
                      }

                      // Handle anchor link clicks
                      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
                        e.preventDefault();
                        const href = target.getAttribute('href');
                        if (href) {
                          const element = document.getElementById(href.substring(1));
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "center" });
                          }
                        }
                      }
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{ a: WikiLink as any }}
                    >
                      {processWikiLinks(selectedArticle.content)}
                    </ReactMarkdown>
                    {extractReferences(selectedArticle.content).length > 0 && (
                      <div className="mt-8 pt-4 border-t border-gray-300">
                        <h2 className="text-xl font-bold mb-4">References</h2>
                        <ol className="space-y-2">
                          {extractReferences(selectedArticle.content).map((ref) => (
                            <li key={ref.id} id={`ref-${ref.id}`} className="text-sm">
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                {ref.title}
                              </a>
                              {" "}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  const element = document.getElementById(`cite-${ref.id}`);
                                  if (element) {
                                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }
                                }}
                                className="text-gray-500 hover:text-gray-700 text-xs bg-transparent border-0 cursor-pointer"
                              >
                                ↑
                              </button>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <p>Select an article to view or create a new one</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Citation Modal */}
      {showCitationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Citation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source URL
                </label>
                <input
                  type="url"
                  value={citationUrl}
                  onChange={(e) => setCitationUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Title
                </label>
                <input
                  type="text"
                  value={citationTitle}
                  onChange={(e) => setCitationTitle(e.target.value)}
                  placeholder="Title of the Article or Source"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowCitationModal(false);
                  setCitationUrl("");
                  setCitationTitle("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCitation}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Add Citation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
