import { apiErrorResponse } from '@/lib/api/route-response';
import { publicBlogPostApiPath } from '@/lib/server/public-blog-api';
import { publicNestApi } from '@/lib/server/public-nest-api';
import { PublicBlogPostResponse } from '@/lib/storefront/blog/public-blog.types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const result = await publicNestApi<PublicBlogPostResponse>(publicBlogPostApiPath(slug), {
      method: 'GET',
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
