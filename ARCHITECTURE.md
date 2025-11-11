# The Recursory - Architecture & Technical Overview

## Project Overview

The Recursory is a personal wiki-style knowledge base application that allows users to create, edit, and interlink articles using markdown. It features Wikipedia-style internal linking, citation management, and a modern WYSIWYG editing experience.

## Tech Stack

### Core Framework
- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety

### Database & ORM
- **Prisma 6.19.0** - Database ORM
- **better-sqlite3 12.4.1** - SQLite database driver
- **SQLite** - Local file-based database (located at `prisma/dev.db`)

### Authentication
- **NextAuth 4.24.13** - Authentication library
  - Credentials provider for email/password auth
  - bcryptjs for password hashing
  - JWT sessions

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **@tailwindcss/typography** - Prose styling for markdown content
- **@tailwindcss/postcss** - PostCSS integration

### Markdown & Content
- **react-markdown 10.1.0** - Markdown rendering
- **remark-gfm 4.0.1** - GitHub Flavored Markdown support
- **rehype-raw 7.0.0** - Raw HTML support in markdown
- **@uiw/react-md-editor** - WYSIWYG markdown editor with toolbar

## Project Structure

```
the_recursory/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth configuration
│   │   ├── register/              # User registration endpoint
│   │   └── articles/              # Article CRUD endpoints
│   │       ├── route.ts           # GET all, POST create
│   │       └── [id]/route.ts      # GET one, PUT update, DELETE
│   ├── dashboard/                 # Main app dashboard
│   ├── login/                     # Login page
│   ├── register/                  # Registration page
│   ├── layout.tsx                 # Root layout with providers
│   └── globals.css                # Global styles
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   ├── db.ts                      # Prisma client singleton
│   └── utils.ts                   # Utility functions (wiki links, citations, slugs)
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── dev.db                     # SQLite database file
├── .env                           # Environment variables (not in repo)
├── .env.example                   # Example environment variables
└── CITATIONS.md                   # Citation system documentation
```

## Database Schema

### User Model
```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  name      String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  articles  Article[]
}
```

### Article Model
```prisma
model Article {
  id         String   @id @default(cuid())
  title      String
  slug       String   @unique
  content    String
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Core Features

### 1. Authentication System
- **Location**: `lib/auth.ts`, `app/api/auth/`, `app/api/register/`
- Email/password authentication
- Session-based auth with JWT
- Protected routes via middleware
- Password hashing with bcryptjs

### 2. Article Management
- **Location**: `app/api/articles/`, `app/dashboard/page.tsx`
- Full CRUD operations for articles
- Automatic slug generation from titles
- Duplicate slug prevention
- Search functionality across title and content
- Last updated timestamps

### 3. Wiki-Style Linking
- **Location**: `lib/utils.ts` - `processWikiLinks()`, `parseWikiLinks()`
- **Syntax**: `[[Article Title]]`
- **Behavior**:
  - Blue links for existing articles (clickable, navigate to article)
  - Red links for non-existent articles (clickable, prompts to create)
  - Case-insensitive article matching
  - URL-encoded for special characters
  - Rendered as `#wiki:Article%20Title` internally

**Implementation**:
```typescript
// Markdown: [[My Article]]
// Converts to: [My Article](#wiki:My%20Article)
// WikiLink component intercepts clicks and navigates within dashboard
```

### 4. Citation System
- **Location**: `lib/utils.ts` - `processWikiLinks()`, `extractReferences()`
- **Syntax**:
  ```markdown
  Text with citation [1].

  ## References
  [1]: https://example.com "Source Title"
  ```
- **Features**:
  - Inline citations as superscript numbers
  - Click to scroll to reference
  - Auto-formatted bibliography
  - Back-links from references to citations (↑ arrow)
  - Modal dialog for easy citation entry
  - Automatic URL protocol handling (adds https:// if missing)

**Implementation**:
- Reference definitions removed from markdown before rendering
- Citations converted to `<span data-citation-ref="1">` elements
- Click handler scrolls to reference section
- References extracted and displayed separately with proper links

### 5. Markdown Editor
- **Location**: `app/dashboard/page.tsx`
- **Library**: `@uiw/react-md-editor`
- **Features**:
  - Live preview (side-by-side or live mode)
  - Formatting toolbar (bold, italic, headers, lists, links, etc.)
  - "+ Add Citation" button above editor
  - Citation modal for easy reference entry
  - Syntax highlighting
  - Supports all markdown features + GFM (tables, strikethrough, etc.)

### 6. Dashboard Interface
- **Location**: `app/dashboard/page.tsx`
- **Layout**:
  - Sidebar: Article list with search
  - Main panel: Article viewer or editor
- **States**:
  - Viewing mode: Rendered markdown with wiki links and citations
  - Creating mode: New article form with editor
  - Editing mode: Edit existing article

## Key Utility Functions

### `lib/utils.ts`

#### `generateSlug(title: string): string`
Converts article titles to URL-friendly slugs.
```typescript
"My Article Title" → "my-article-title"
```

#### `processWikiLinks(content: string): string`
Processes markdown content to:
1. Remove reference definitions (`[1]: URL "Title"`)
2. Convert wiki links (`[[Article]]` → `[Article](#wiki:Article)`)
3. Convert citations (`[1]` → `<span data-citation-ref="1">[1]</span>`)

#### `extractReferences(content: string): Array<{id, url, title}>`
Extracts citation references from markdown content.
Automatically adds `https://` to URLs without protocol.

#### `parseWikiLinks(content: string): Array<{title, match}>`
Parses and extracts all wiki-style links from content.

## Data Flow

### Article Creation Flow
1. User clicks "New" button
2. Dashboard enters create mode
3. User enters title (slug auto-generated)
4. User writes content in markdown editor with live preview
5. Can add citations via "+ Add Citation" modal
6. On submit: POST `/api/articles`
7. Backend validates, creates article with user association
8. Returns to viewing mode with new article selected

### Wiki Link Navigation Flow
1. User clicks `[[Article Name]]` in rendered content
2. `WikiLink` component intercepts click
3. Searches articles array for matching title (case-insensitive)
4. If found: navigates by setting `selectedArticle` state
5. If not found: prompts user to create article, pre-fills title

### Citation Flow
1. User clicks "+ Add Citation" while editing
2. Modal opens requesting URL and title
3. On submit:
   - Counts existing citations in content
   - Adds `[N]` citation marker before References section
   - Adds `[N]: URL "Title"` to References section
   - Creates References section if it doesn't exist
4. When viewing:
   - Citations rendered as clickable elements
   - Click scrolls to corresponding reference
   - References displayed in formatted list with external links

## API Routes

### `/api/auth/[...nextauth]` (GET, POST)
NextAuth endpoints for authentication.

### `/api/register` (POST)
User registration endpoint.
- Validates email uniqueness
- Hashes password
- Creates user in database

### `/api/articles` (GET, POST)
- **GET**: Returns all articles for authenticated user
- **POST**: Creates new article
  - Validates slug uniqueness
  - Associates with authenticated user
  - Returns created article

### `/api/articles/[id]` (GET, PUT, DELETE)
- **GET**: Returns single article by ID
- **PUT**: Updates article (title, content, slug)
  - Validates ownership
  - Validates slug uniqueness if changed
- **DELETE**: Deletes article
  - Validates ownership

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="<random-secret>"
NEXTAUTH_URL="http://localhost:3000"
```

## Styling System

### Tailwind Configuration
- Uses Tailwind CSS 4 with new PostCSS architecture
- Typography plugin for prose styling
- Custom theme with CSS variables for colors
- Light mode only (dark mode infrastructure present but not styled)

### Markdown Content Styling
- Uses `prose` class from @tailwindcss/typography
- Custom citation link styling (`.citation-link`)
- Responsive typography
- Proper spacing for references section

## Adding AI Functionality - Guide for Engineers

### Current Architecture Touchpoints

The application is structured to make AI integration straightforward. Here are the key integration points:

#### 1. Content Generation
**Location**: `app/dashboard/page.tsx`
**Opportunity**: Add AI writing assistance

```typescript
// Potential integration point in the editor
const generateWithAI = async (prompt: string) => {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      existingContent: editContent,
      context: articles.map(a => ({ title: a.title, slug: a.slug }))
    })
  });
  const { content } = await response.json();
  setEditContent(editContent + content);
};
```

**Implementation Ideas**:
- Add "AI Assist" button in editor toolbar
- Auto-suggest wiki links based on existing articles
- Generate citations from URLs (fetch title automatically)
- Content expansion/summarization
- Grammar and style checking

#### 2. Citation Enhancement
**Location**: `app/dashboard/page.tsx` - `handleAddCitation()`
**Opportunity**: Auto-extract citation info from URLs

```typescript
const handleAddCitation = async () => {
  // AI enhancement: fetch and parse URL
  if (citationUrl && !citationTitle) {
    const metadata = await fetch('/api/ai/extract-metadata', {
      method: 'POST',
      body: JSON.stringify({ url: citationUrl })
    }).then(r => r.json());

    setCitationTitle(metadata.title);
  }
  // ... existing logic
};
```

#### 3. Wiki Link Suggestions
**Location**: `app/dashboard/page.tsx` - MDEditor component
**Opportunity**: Suggest relevant articles while typing

```typescript
// Add auto-complete/suggestion system
const getSuggestedLinks = async (text: string) => {
  const response = await fetch('/api/ai/suggest-links', {
    method: 'POST',
    body: JSON.stringify({
      text,
      existingArticles: articles
    })
  });
  return response.json();
};
```

#### 4. Semantic Search
**Location**: `app/dashboard/page.tsx` - article filtering
**Current**: Simple string matching
**AI Enhancement**: Semantic search across articles

```typescript
// Replace simple filtering with AI semantic search
const semanticSearch = async (query: string) => {
  const response = await fetch('/api/ai/search', {
    method: 'POST',
    body: JSON.stringify({
      query,
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content.substring(0, 500) // snippet
      }))
    })
  });
  return response.json(); // Returns ranked results
};
```

### Suggested AI API Routes to Create

#### `/api/ai/generate` (POST)
Generate or expand content based on prompt and context.

**Input**:
```typescript
{
  prompt: string;
  existingContent?: string;
  context?: { title: string, slug: string }[]; // Available articles for wiki links
}
```

**Output**:
```typescript
{
  content: string; // Generated markdown
  suggestedLinks?: string[]; // Suggested wiki links to add
  suggestedCitations?: { url: string, title: string }[];
}
```

#### `/api/ai/extract-metadata` (POST)
Extract metadata (title, author, date) from a URL for citations.

**Input**:
```typescript
{ url: string }
```

**Output**:
```typescript
{
  title: string;
  author?: string;
  date?: string;
  description?: string;
}
```

#### `/api/ai/suggest-links` (POST)
Suggest relevant internal wiki links based on content.

**Input**:
```typescript
{
  text: string; // Current content being written
  existingArticles: { title: string, content: string }[];
}
```

**Output**:
```typescript
{
  suggestions: {
    text: string; // Text to link
    articleTitle: string; // Suggested article to link to
    confidence: number;
  }[];
}
```

#### `/api/ai/search` (POST)
Semantic search across articles.

**Input**:
```typescript
{
  query: string;
  articles: { id: string, title: string, content: string }[];
}
```

**Output**:
```typescript
{
  results: {
    id: string;
    title: string;
    relevance: number;
    snippet: string; // Relevant excerpt
  }[];
}
```

### Recommended AI Technologies

1. **OpenAI GPT-4 / GPT-4-turbo**
   - Content generation
   - Summarization
   - Link suggestions
   - Use: `openai` npm package

2. **Embeddings for Search**
   - OpenAI `text-embedding-3-small` or `text-embedding-3-large`
   - Store embeddings in database (add embedding column to Article model)
   - Use vector similarity for semantic search

3. **Web Scraping for Citations**
   - `cheerio` for HTML parsing
   - `node-fetch` for HTTP requests
   - Extract `<title>`, `<meta>` tags for citation metadata

### Database Schema Extensions for AI

Add to `prisma/schema.prisma`:

```prisma
model Article {
  id         String   @id @default(cuid())
  title      String
  slug       String   @unique
  content    String
  embedding  String?  @db.Text // Store as JSON array of floats
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Track AI-generated content
  aiGenerated Boolean @default(false)
  aiMetadata  String?  @db.Text // JSON with model, prompt, etc.
}
```

### Example AI Integration: Auto-Link Suggestions

```typescript
// app/dashboard/page.tsx

// Add state
const [aiSuggestions, setAiSuggestions] = useState<{text: string, link: string}[]>([]);

// Debounced function to get suggestions while typing
useEffect(() => {
  const timer = setTimeout(async () => {
    if (editContent.length > 100) {
      const suggestions = await fetch('/api/ai/suggest-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editContent,
          existingArticles: articles
        })
      }).then(r => r.json());

      setAiSuggestions(suggestions.suggestions);
    }
  }, 2000); // Wait 2s after user stops typing

  return () => clearTimeout(timer);
}, [editContent, articles]);

// Display suggestions in UI
{aiSuggestions.length > 0 && (
  <div className="mt-2 p-2 bg-blue-50 rounded">
    <p className="text-xs font-medium text-blue-900">AI Suggestions:</p>
    {aiSuggestions.map((sug, i) => (
      <button
        key={i}
        onClick={() => {
          const newContent = editContent.replace(
            sug.text,
            `[[${sug.link}]]`
          );
          setEditContent(newContent);
        }}
        className="text-xs text-blue-600 hover:underline mr-2"
      >
        Link "{sug.text}" to {sug.link}
      </button>
    ))}
  </div>
)}
```

## Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables: Copy `.env.example` to `.env`
4. Generate Prisma client: `npx prisma generate`
5. Run migrations: `npx prisma migrate dev`
6. Start dev server: `npm run dev`
7. Access at `http://localhost:3000`

## Key Files for AI Integration

- `app/api/` - Add new AI endpoints here
- `lib/utils.ts` - Core content processing logic
- `app/dashboard/page.tsx` - Main UI, add AI features here
- `prisma/schema.prisma` - Extend for AI metadata storage

## Next Steps for AI Features

1. **Quick Win**: URL metadata extraction for citations
2. **High Value**: Semantic search with embeddings
3. **Enhanced UX**: Auto-suggest wiki links while typing
4. **Power Feature**: AI writing assistant with context awareness
5. **Advanced**: Auto-generate article summaries and related article suggestions
