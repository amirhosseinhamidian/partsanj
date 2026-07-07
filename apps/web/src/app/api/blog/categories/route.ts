import { apiErrorResponse } from '@/lib/api/route-response';
import { PUBLIC_BLOG_CATEGORIES_API_PATH } from '@/lib/server/public-blog-api';
import { publicNestApi } from '@/lib/server/public-nest-api';
import { PublicBlogCategoriesResponse } from '@/lib/storefront/blog/public-blog.types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await publicNestApi<PublicBlogCategoriesResponse>(
      PUBLIC_BLOG_CATEGORIES_API_PATH,
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
