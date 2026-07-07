import type {
  AdminBlogCategoriesResponse,
  AdminBlogCategoryResponse,
} from '@/lib/admin/blog/categories/admin-blog-category.types';
import { readCreateAdminBlogCategoryInput } from '@/lib/admin/blog/categories/admin-blog-category-route-input';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  ADMIN_BLOG_CATEGORIES_API_PATH,
  adminNestApi,
  createAdminBlogCategoriesListApiPath,
} from '@/lib/server/admin-blog-category-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const result = await adminNestApi<AdminBlogCategoriesResponse>(
      createAdminBlogCategoriesListApiPath(url.searchParams),
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
    const payload = await readCreateAdminBlogCategoryInput(request);

    const result = await adminNestApi<AdminBlogCategoryResponse>(ADMIN_BLOG_CATEGORIES_API_PATH, {
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
