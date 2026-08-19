export type AdminInteractionType =
  | 'product-review'
  | 'product-review-reply'
  | 'product-question'
  | 'product-question-reply'
  | 'blog-comment';

export type AdminInteractionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM' | 'DELETED';

export type AdminInteractionAuthorType = 'USER' | 'STAFF' | 'IMPORTED_CUSTOMER';

export type AdminInteractionSource =
  | 'SITE'
  | 'ADMIN'
  | 'LEGACY'
  | 'INSTAGRAM'
  | 'WHATSAPP'
  | 'PHONE';

export type AdminInteractionAuthorUser = {
  id: string;
  mobile: string;
  firstName: string | null;
  lastName: string | null;
};

export type AdminInteractionTarget = {
  type: string;

  id: string;

  title: string;

  slug: string;

  sku: string | null;
};

export type AdminInteraction = {
  type: AdminInteractionType;

  id: string;

  parentId: string | null;
  rootId: string | null;

  body: string | null;

  rating: number | null;

  status: AdminInteractionStatus;

  authorType: AdminInteractionAuthorType;

  authorDisplayName: string | null;

  authorUser: AdminInteractionAuthorUser | null;

  isVerifiedPurchase: boolean | null;

  source: AdminInteractionSource;

  sourceReference: string | null;

  target: AdminInteractionTarget;

  createdAt: string;

  moderatedAt: string | null;

  publishedAt: string | null;
};

export type AdminInteractionSummaryResponse = {
  data: {
    totalPending: number;

    pending: {
      productReviews: number;
      productReviewReplies: number;

      productQuestions: number;
      productQuestionReplies: number;

      blogComments: number;
    };

    openReports: number;
  };
};

export type AdminInteractionsResponse = {
  data: AdminInteraction[];

  meta: {
    page: number;

    limit: number;

    total: number;

    totalPages: number;
  };
};

export type FindAdminInteractionsParams = {
  type?: AdminInteractionType;

  status?: AdminInteractionStatus;

  q?: string;

  productId?: string;

  blogPostId?: string;

  page?: number;

  limit?: number;
};

export type AdminInteractionMutationResponse = {
  data: unknown;
};

export const adminInteractionTypeOptions = [
  {
    value: 'product-review',
    label: 'نظرات محصولات',
  },
  {
    value: 'product-review-reply',
    label: 'پاسخ نظرات',
  },
  {
    value: 'product-question',
    label: 'پرسش محصولات',
  },
  {
    value: 'product-question-reply',
    label: 'پاسخ پرسش‌ها',
  },
  {
    value: 'blog-comment',
    label: 'دیدگاه مقالات',
  },
] as const;

export const adminInteractionStatusOptions = [
  {
    value: 'PENDING',
    label: 'در انتظار بررسی',
  },
  {
    value: 'APPROVED',
    label: 'تأییدشده',
  },
  {
    value: 'REJECTED',
    label: 'ردشده',
  },
  {
    value: 'SPAM',
    label: 'هرزنامه',
  },
  {
    value: 'DELETED',
    label: 'حذف‌شده',
  },
] as const;

export function getAdminInteractionTypeLabel(type: AdminInteractionType) {
  return adminInteractionTypeOptions.find((option) => option.value === type)?.label ?? type;
}

export function getAdminInteractionStatusLabel(status: AdminInteractionStatus) {
  return adminInteractionStatusOptions.find((option) => option.value === status)?.label ?? status;
}

export function getAdminInteractionSourceLabel(source: AdminInteractionSource) {
  const labels: Record<AdminInteractionSource, string> = {
    SITE: 'پارت‌سنج',
    ADMIN: 'ادمین',
    LEGACY: 'آرشیو قدیمی',
    INSTAGRAM: 'اینستاگرام',
    WHATSAPP: 'واتساپ',
    PHONE: 'تلفنی',
  };

  return labels[source];
}
