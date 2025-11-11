import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { articleQueries } from "@/lib/db";
import { generateId } from "@/lib/auth";
import { generateUniqueSlug } from "@/lib/utils";

// Get all articles for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const articles = articleQueries.findByUserId.all(userId);

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new article
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, slug } = await request.json();

    if (!title || !content || !slug) {
      return NextResponse.json(
        { error: "Title, content, and slug are required" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const articleId = generateId();

    // Generate a unique slug if the provided one already exists
    const uniqueSlug = generateUniqueSlug(
      slug,
      (testSlug) => {
        const existing = articleQueries.checkSlugExists.get(testSlug);
        return !!existing;
      }
    );

    articleQueries.create.run(articleId, title, content, uniqueSlug, userId);

    return NextResponse.json(
      { message: "Article created successfully", id: articleId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
