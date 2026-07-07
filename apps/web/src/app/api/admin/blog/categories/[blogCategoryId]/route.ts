import type { AdminBlogCategoryResponse } from '@/lib/admin/blog/categories/admin-blog-category.types';
import { readUpdateAdminBlogCategoryInput } from '@/lib/admin/blog/categories/admin-blog-category-route-input';
import { apiErrorResponse } from '@/lib/api/route-response';
import { adminBlogCategoryApiPath, adminNestApi } from '@/lib/server/admin-blog-category-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    blogCategoryId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { blogCategoryId } = await context.params;

    const result = await adminNestApi<AdminBlogCategoryResponse>(
      adminBlogCategoryApiPath(blogCategoryId),
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { blogCategoryId } = await context.params;

    const payload = await readUpdateAdminBlogCategoryInput(request);

    const result = await adminNestApi<AdminBlogCategoryResponse>(
      adminBlogCategoryApiPath(blogCategoryId),
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
