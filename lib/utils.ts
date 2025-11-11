/**
 * Converts a string to a URL-friendly slug
 * Examples:
 * - "My Article Title" -> "my-article-title"
 * - "Hello, World!" -> "hello-world"
 * - "React & Next.js Guide" -> "react-nextjs-guide"
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove special characters except hyphens
    .replace(/[^\w\-]+/g, "")
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/\-\-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates a unique slug by checking if it exists and appending numbers if needed
 * Examples:
 * - If "my-article" exists, try "my-article-2", "my-article-3", etc.
 */
export function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => boolean,
  currentArticleId?: string
): string {
  // If editing an article, we need to allow the same slug if it belongs to the current article
  let slug = baseSlug;
  let counter = 2;

  while (checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Parses wiki-style links [[Article Title]] in markdown content
 * Returns array of wiki-link matches with title and position
 */
export function parseWikiLinks(content: string): Array<{ title: string; match: string }> {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  const links: Array<{ title: string; match: string }> = [];
  let match;

  while ((match = wikiLinkRegex.exec(content)) !== null) {
    links.push({
      title: match[1].trim(),
      match: match[0],
    });
  }

  return links;
}

/**
 * Converts wiki-links to markdown links with hash-based URLs
 * [[Article Title]] -> [Article Title](#wiki:Article%20Title)
 * Also handles citations [1] -> <sup>[1](#ref-1)</sup>
 * Removes reference definitions from content
 */
export function processWikiLinks(content: string): string {
  // First, remove reference definitions (they'll be displayed separately)
  let processed = content.replace(/^\[\d+\]:\s+.+$/gm, '').trim();

  // Process wiki links
  processed = processed.replace(/\[\[([^\]]+)\]\]/g, (match, title) => {
    const trimmedTitle = title.trim();
    return `[${trimmedTitle}](#wiki:${encodeURIComponent(trimmedTitle)})`;
  });

  // Process citations - match [number] but not [[wiki links]] or [text](url)
  // This regex looks for [digits] not preceded by [ and not followed by ] or ( or :
  processed = processed.replace(/(?<!\[)\[(\d+)\](?!\]|[\(\:])/g, (match, num) => {
    return `<sup><span data-citation-ref="${num}" class="citation-link" style="cursor:pointer;color:#4f46e5;font-weight:600;">[${num}]</span></sup>`;
  });

  return processed;
}

/**
 * Extract and format references from markdown content
 */
export function extractReferences(content: string): Array<{ id: string; url: string; title: string }> {
  const references: Array<{ id: string; url: string; title: string }> = [];
  // Match reference definitions: [1]: url "title" or [1]: url
  const refRegex = /^\[(\d+)\]:\s+(.+?)(?:\s+"([^"]+)")?$/gm;
  let match;

  while ((match = refRegex.exec(content)) !== null) {
    let url = match[2].trim();

    // Ensure URL has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    references.push({
      id: match[1],
      url: url,
      title: match[3] || match[2].trim(),
    });
  }

  return references;
}
