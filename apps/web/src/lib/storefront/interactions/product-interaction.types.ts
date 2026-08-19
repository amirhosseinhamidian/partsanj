export type StorefrontInteractionAuthorType = 'USER' | 'STAFF' | 'IMPORTED_CUSTOMER';

export type StorefrontModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM' | 'DELETED';

export type StorefrontProductReviewSort = 'NEWEST' | 'HIGHEST' | 'LOWEST' | 'HELPFUL';

export type StorefrontOfficialInteractionIdentity = {
  displayName: string;
  avatarUrl: string | null;
  badgeLabel: string;
};

export type StorefrontInteractionAuthor = {
  type: StorefrontInteractionAuthorType;
  displayName: string;
};

export type StorefrontProductReviewReply = {
  id: string;
  parentId: string | null;

  body: string;

  author: StorefrontInteractionAuthor;

  publishedAt: string;
};

export type StorefrontProductReview = {
  id: string;

  rating: number;
  body: string | null;

  author: StorefrontInteractionAuthor;

  isVerifiedPurchase: boolean;

  helpfulCount: number;
  isHelpfulByCurrentUser: boolean;

  publishedAt: string;

  replies: StorefrontProductReviewReply[];
};

export type StorefrontMyProductReview = {
  id: string;

  rating: number;
  body: string | null;

  status: StorefrontModerationStatus;

  isVerifiedPurchase: boolean;

  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type StorefrontRatingBreakdownItem = {
  rating: number;
  count: number;
  percentage: number;
};

export type StorefrontProductReviewsResponse = {
  data: {
    enabled: boolean;

    officialIdentity: StorefrontOfficialInteractionIdentity;

    summary: {
      averageRating: number;
      ratingsCount: number;
      breakdown: StorefrontRatingBreakdownItem[];
    };

    reviews: StorefrontProductReview[];

    myReview: StorefrontMyProductReview | null;
  };

  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type StorefrontProductQuestionReply = {
  id: string;

  parentId: string | null;

  body: string;

  author: StorefrontInteractionAuthor;

  publishedAt: string;
};

export type StorefrontProductQuestion = {
  id: string;

  body: string;

  author: StorefrontInteractionAuthor;

  isPinned: boolean;

  canCurrentUserReply: boolean;

  publishedAt: string;

  replies: StorefrontProductQuestionReply[];
};

export type StorefrontProductQuestionsResponse = {
  data: {
    enabled: boolean;

    officialIdentity: StorefrontOfficialInteractionIdentity;

    questionsCount: number;

    questions: StorefrontProductQuestion[];
  };
};

export type StorefrontProductReviewMutationResponse = {
  data: {
    id: string;

    rating: number;
    body: string | null;

    status: StorefrontModerationStatus;

    isVerifiedPurchase: boolean;

    createdAt: string;
    updatedAt: string;
  };

  message?: string;
};

export type StorefrontProductQuestionMutationResponse = {
  data: {
    id: string;

    body: string;

    status: StorefrontModerationStatus;

    createdAt: string;
  };

  message?: string;
};

export type StorefrontProductQuestionReplyMutationResponse = {
  data: {
    id: string;

    parentId: string | null;

    body: string;

    status: StorefrontModerationStatus;

    createdAt: string;
  };

  message?: string;
};

export type StorefrontHelpfulMutationResponse = {
  data: {
    reviewId: string;

    isHelpful: boolean;

    helpfulCount: number;
  };
};
