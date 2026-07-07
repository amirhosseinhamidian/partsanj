import { AdminBlogPostEditorPageClient } from '@/components/admin/blog/posts/admin-blog-post-editor-page-client';

type AdminBlogPostEditorPageProps = {
  params: Promise<{
    blogPostId: string;
  }>;
};

export default async function AdminBlogPostEditorPage({ params }: AdminBlogPostEditorPageProps) {
  const { blogPostId } = await params;

  return <AdminBlogPostEditorPageClient blogPostId={blogPostId} />;
}
