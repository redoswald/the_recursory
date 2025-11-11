import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { articleQueries } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/utils";

// Update an article
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const userId = (session.user as any).id;

    // Get the current article to check its current slug
    const currentArticle = articleQueries.findById.get(id) as any;

    if (!currentArticle || currentArticle.user_id !== userId) {
      return NextResponse.json(
        { error: "Article not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Generate a unique slug if needed, but allow keeping the same slug
    const uniqueSlug = generateUniqueSlug(
      slug,
      (testSlug) => {
        // If it's the same as the current article's slug, allow it
        if (testSlug === currentArticle.slug) {
          return false;
        }
        const existing = articleQueries.checkSlugExists.get(testSlug);
        return !!existing;
      }
    );

    const result = articleQueries.update.run(title, content, uniqueSlug, id, userId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Article not found or you don't have permission" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Article updated successfully" });
  } catch (error: any) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete an article
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const result = articleQueries.delete.run(id, userId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Article not found or you don't have permission" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
