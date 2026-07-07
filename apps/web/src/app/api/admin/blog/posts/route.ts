import type {
  AdminBlogPostResponse,
  AdminBlogPostsResponse,
} from '@/lib/admin/blog/posts/admin-blog-post.types';
import { readCreateAdminBlogPostInput } from '@/lib/admin/blog/posts/admin-blog-post-route-input';
import { apiErrorResponse } from '@/lib/api/route-response';
import { adminNestApi } from '@/lib/server/admin-api';

import { NextResponse } from 'next/server';
import {
  ADMIN_BLOG_POSTS_API_PATH,
  createAdminBlogPostsListApiPath,
} from '@/lib/admin/blog/posts/admin-blog-post-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const result = await adminNestApi<AdminBlogPostsResponse>(
      createAdminBlogPostsListApiPath(url.searchParams),
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readCreateAdminBlogPostInput(request);

    const result = await adminNestApi<AdminBlogPostResponse>(ADMIN_BLOG_POSTS_API_PATH, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
