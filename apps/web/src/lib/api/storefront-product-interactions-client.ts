import { requestStorefrontApi } from '@/lib/api/storefront-web-client';

import type {
  StorefrontHelpfulMutationResponse,
  StorefrontProductQuestionMutationResponse,
  StorefrontProductQuestionReplyMutationResponse,
  StorefrontProductQuestionsResponse,
  StorefrontProductReviewMutationResponse,
  StorefrontProductReviewsResponse,
  StorefrontProductReviewSort,
} from '@/lib/storefront/interactions/product-interaction.types';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

function productPath(slug: string) {
  return `/api/catalog/products/${encodeURIComponent(slug)}`;
}

export const storefrontProductInteractionsApi = {
  getReviews(
    slug: string,
    params: {
      sort?: StorefrontProductReviewSort;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const searchParams = new URLSearchParams();

    if (params.sort) {
      searchParams.set('sort', params.sort);
    }

    if (params.page) {
      searchParams.set('page', String(params.page));
    }

    if (params.limit) {
      searchParams.set('limit', String(params.limit));
    }

    const query = searchParams.toString();

    return requestStorefrontApi<StorefrontProductReviewsResponse>(
      `${productPath(slug)}/reviews${query ? `?${query}` : ''}`,
    );
  },

  upsertReview(
    slug: string,
    input: {
      rating: number;
      body?: string | null;
    },
  ) {
    return requestStorefrontApi<StorefrontProductReviewMutationResponse>(
      `${productPath(slug)}/review`,
      {
        method: 'PUT',
        headers: JSON_HEADERS,

        body: JSON.stringify(input),
      },
    );
  },

  markHelpful(slug: string, reviewId: string) {
    return requestStorefrontApi<StorefrontHelpfulMutationResponse>(
      `${productPath(slug)}/reviews/${encodeURIComponent(reviewId)}/helpful`,
      {
        method: 'POST',
      },
    );
  },

  removeHelpful(slug: string, reviewId: string) {
    return requestStorefrontApi<StorefrontHelpfulMutationResponse>(
      `${productPath(slug)}/reviews/${encodeURIComponent(reviewId)}/helpful`,
      {
        method: 'DELETE',
      },
    );
  },

  getQuestions(slug: string) {
    return requestStorefrontApi<StorefrontProductQuestionsResponse>(
      `${productPath(slug)}/questions`,
    );
  },

  createQuestion(slug: string, body: string) {
    return requestStorefrontApi<StorefrontProductQuestionMutationResponse>(
      `${productPath(slug)}/questions`,
      {
        method: 'POST',
        headers: JSON_HEADERS,

        body: JSON.stringify({
          body,
        }),
      },
    );
  },

  createQuestionReply(
    slug: string,
    questionId: string,
    input: {
      body: string;
      parentId?: string;
    },
  ) {
    return requestStorefrontApi<StorefrontProductQuestionReplyMutationResponse>(
      `${productPath(slug)}/questions/${encodeURIComponent(questionId)}/replies`,
      {
        method: 'POST',
        headers: JSON_HEADERS,

        body: JSON.stringify(input),
      },
    );
  },
};
