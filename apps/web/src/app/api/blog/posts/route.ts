import { apiErrorResponse } from '@/lib/api/route-response';
import { createPublicBlogPostsApiPath } from '@/lib/server/public-blog-api';
import { publicNestApi } from '@/lib/server/public-nest-api';
import { PublicBlogPostsResponse } from '@/lib/storefront/blog/public-blog.types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const result = await publicNestApi<PublicBlogPostsResponse>(
      createPublicBlogPostsApiPath(url.searchParams),
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
