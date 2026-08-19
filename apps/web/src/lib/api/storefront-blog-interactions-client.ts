import { requestStorefrontApi } from '@/lib/api/storefront-web-client';

import type {
  StorefrontBlogCommentMutationResponse,
  StorefrontBlogCommentsResponse,
} from '@/lib/storefront/interactions/blog-interaction.types';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

function commentsPath(slug: string) {
  return `/api/blog/posts/${encodeURIComponent(slug)}/comments`;
}

export const storefrontBlogInteractionsApi = {
  getComments(
    slug: string,
    params: {
      page?: number;
      limit?: number;
    } = {},
  ) {
    const searchParams = new URLSearchParams();

    if (params.page) {
      searchParams.set('page', String(params.page));
    }

    if (params.limit) {
      searchParams.set('limit', String(params.limit));
    }

    const query = searchParams.toString();

    return requestStorefrontApi<StorefrontBlogCommentsResponse>(
      `${commentsPath(slug)}${query ? `?${query}` : ''}`,
    );
  },

  createComment(
    slug: string,
    input: {
      body: string;
      parentId?: string;
    },
  ) {
    return requestStorefrontApi<StorefrontBlogCommentMutationResponse>(commentsPath(slug), {
      method: 'POST',

      headers: JSON_HEADERS,

      body: JSON.stringify(input),
    });
  },
};
