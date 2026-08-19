import type {
  StorefrontInteractionAuthorType,
  StorefrontModerationStatus,
  StorefrontOfficialInteractionIdentity,
} from '@/lib/storefront/interactions/product-interaction.types';

export type StorefrontBlogCommentAuthor = {
  type: StorefrontInteractionAuthorType;

  displayName: string;

  isOfficial: boolean;
};

export type StorefrontBlogComment = {
  id: string;

  parentId: string | null;

  body: string;

  author: StorefrontBlogCommentAuthor;

  publishedAt: string;

  replies: StorefrontBlogComment[];
};

export type StorefrontBlogCommentsResponse = {
  data: {
    enabled: boolean;

    officialIdentity: StorefrontOfficialInteractionIdentity;

    canComment: boolean;

    commentsCount: number;

    threadsCount: number;

    comments: StorefrontBlogComment[];
  };

  meta: {
    page: number;

    limit: number;

    total: number;

    totalPages: number;
  };
};

export type StorefrontBlogCommentMutationResponse = {
  data: {
    id: string;

    parentId: string | null;

    body: string;

    status: StorefrontModerationStatus;

    createdAt: string;
  };

  message?: string;
};
