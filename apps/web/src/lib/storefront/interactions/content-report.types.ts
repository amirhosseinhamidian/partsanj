export type StorefrontContentReportTargetType =
  | 'PRODUCT_REVIEW'
  | 'PRODUCT_REVIEW_REPLY'
  | 'PRODUCT_QUESTION'
  | 'PRODUCT_QUESTION_REPLY'
  | 'BLOG_COMMENT';

export type StorefrontContentReportReason =
  | 'SPAM'
  | 'ABUSE'
  | 'MISLEADING'
  | 'PERSONAL_INFO'
  | 'OTHER';

export type StorefrontContentReportResponse = {
  data: {
    id: string;

    targetType: StorefrontContentReportTargetType;

    targetId: string;

    reason: StorefrontContentReportReason;

    details: string | null;

    status: 'OPEN' | 'RESOLVED' | 'DISMISSED';

    createdAt: string;

    alreadyReported: boolean;
  };

  message?: string;
};
