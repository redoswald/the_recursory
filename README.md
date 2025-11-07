# The Recursory

Your personal Wikipedia - Create, organize, and manage your knowledge base with markdown articles.

## Overview

The Recursory is a Next.js application that allows users to create personal Wikipedias by ingesting their knowledge banks and blogs. The goal is to transform blogs (like Marginal Revolution) into searchable, structured wiki-style websites.

## Features

- **User Authentication**: Simple email + password authentication using NextAuth.js
- **Article Management**: Create, read, update, and delete articles
- **Markdown Support**: Write articles using full Markdown syntax with GitHub Flavored Markdown (GFM)
- **Real-time Preview**: View your markdown articles rendered in beautiful HTML
- **Secure & Private**: Each user has their own isolated article collection
- **SQLite Database**: Lightweight, file-based database for easy deployment

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS
- **Markdown**: react-markdown with remark-gfm

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd the_recursory
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory (or use the existing one):
```env
DATABASE_URL="file:./data.db"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**Important**: Change the `NEXTAUTH_SECRET` to a random string in production!

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Creating an Account

1. Navigate to the homepage
2. Click "Get Started" or "Register"
3. Enter your email, password, and optionally your name
4. Click "Create account"

### Creating Articles

1. Log in to your account
2. In the dashboard, click the "New" button
3. Fill in:
   - **Title**: The article title
   - **Slug**: A URL-friendly identifier (e.g., "my-first-article")
   - **Content**: Your article content in Markdown format
4. Click "Create Article"

### Editing Articles

1. Select an article from the sidebar
2. Click the "Edit" button
3. Make your changes
4. Click "Save Changes"

### Markdown Examples

The Recursory supports full Markdown syntax:

```markdown
# Heading 1
## Heading 2

**Bold text** and *italic text*

- Bullet points
- Lists

1. Numbered
2. Lists

[Links](https://example.com)

> Blockquotes

`Inline code` and code blocks:

\`\`\`
Code blocks
\`\`\`
```

## Database Schema

### Users Table
- `id`: Unique identifier
- `email`: User's email (unique)
- `password`: Hashed password
- `name`: Optional display name
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Articles Table
- `id`: Unique identifier
- `title`: Article title
- `content`: Markdown content
- `slug`: URL-friendly identifier (unique)
- `user_id`: Reference to user
- `created_at`: Article creation timestamp
- `updated_at`: Last update timestamp

## Security Features

- Passwords are hashed using bcrypt
- JWT-based session management
- Protected API routes with authentication checks
- User isolation - users can only access their own articles
- SQL injection prevention through prepared statements

## Future Enhancements

Potential features for future versions:

- Blog ingestion from RSS feeds
- Full-text search across articles
- Article categories and tags
- Rich text editor with live preview
- Export to PDF/HTML
- Collaborative editing
- Public/private article visibility
- Article linking and backlinks
- Version history

## Project Structure

```
the_recursory/
├── app/
│   ├── api/
│   │   ├── articles/          # Article CRUD endpoints
│   │   ├── auth/              # NextAuth configuration
│   │   └── register/          # User registration
│   ├── dashboard/             # Main application dashboard
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── providers.tsx          # SessionProvider wrapper
├── lib/
│   ├── auth.ts                # Authentication configuration
│   └── db.ts                  # Database schema and queries
└── public/                    # Static assets
```

## Contributing

This is an MVP (Minimum Viable Product). Contributions are welcome!

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
