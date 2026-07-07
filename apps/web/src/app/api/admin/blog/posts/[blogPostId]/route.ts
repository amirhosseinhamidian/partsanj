import type { AdminBlogPostResponse } from '@/lib/admin/blog/posts/admin-blog-post.types';
import { readUpdateAdminBlogPostInput } from '@/lib/admin/blog/posts/admin-blog-post-route-input';
import { apiErrorResponse } from '@/lib/api/route-response';
import { adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';
import { adminBlogPostApiPath } from '@/lib/admin/blog/posts/admin-blog-post-api';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    blogPostId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { blogPostId } = await context.params;

    const result = await adminNestApi<AdminBlogPostResponse>(adminBlogPostApiPath(blogPostId), {
      method: 'GET',
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { blogPostId } = await context.params;

    const payload = await readUpdateAdminBlogPostInput(request);

    const result = await adminNestApi<AdminBlogPostResponse>(adminBlogPostApiPath(blogPostId), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
