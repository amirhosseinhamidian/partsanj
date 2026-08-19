export type AdminContentReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export type AdminContentReportTargetType =
  | 'PRODUCT_REVIEW'
  | 'PRODUCT_REVIEW_REPLY'
  | 'PRODUCT_QUESTION'
  | 'PRODUCT_QUESTION_REPLY'
  | 'BLOG_COMMENT';

export type AdminContentReportReason = 'SPAM' | 'ABUSE' | 'MISLEADING' | 'PERSONAL_INFO' | 'OTHER';

export type AdminContentReportReporter = {
  id: string;

  mobile: string;

  firstName: string | null;

  lastName: string | null;
};

export type AdminContentReportProductTarget = {
  id: string;

  name: string;

  slug: string;

  sku: string;
};

export type AdminContentReportBlogPostTarget = {
  id: string;

  title: string;

  slug: string;
};

export type AdminContentReportTargetPreview = {
  id: string;

  body: string | null;

  rating: number | null;

  product: AdminContentReportProductTarget | null;

  blogPost: AdminContentReportBlogPostTarget | null;
};

export type AdminContentReport = {
  id: string;

  reporterUserId: string;

  targetType: AdminContentReportTargetType;

  targetId: string;

  reason: AdminContentReportReason;

  details: string | null;

  status: AdminContentReportStatus;

  resolvedAt: string | null;

  createdAt: string;

  updatedAt: string;

  reporter: AdminContentReportReporter;

  target: AdminContentReportTargetPreview | null;
};

export type AdminContentReportsResponse = {
  data: AdminContentReport[];

  meta: {
    page: number;

    limit: number;

    total: number;

    totalPages: number;
  };
};

export type FindAdminContentReportsParams = {
  status?: AdminContentReportStatus;

  targetType?: AdminContentReportTargetType;

  page?: number;

  limit?: number;
};

export type AdminContentReportMutationResponse = {
  data: AdminContentReport;
};

export const adminContentReportStatusOptions = [
  {
    value: 'OPEN',
    label: 'باز',
  },
  {
    value: 'RESOLVED',
    label: 'رسیدگی‌شده',
  },
  {
    value: 'DISMISSED',
    label: 'رد گزارش',
  },
] as const;

export const adminContentReportTargetTypeOptions = [
  {
    value: 'PRODUCT_REVIEW',
    label: 'نظر محصول',
  },
  {
    value: 'PRODUCT_REVIEW_REPLY',
    label: 'پاسخ نظر محصول',
  },
  {
    value: 'PRODUCT_QUESTION',
    label: 'پرسش محصول',
  },
  {
    value: 'PRODUCT_QUESTION_REPLY',
    label: 'پاسخ پرسش محصول',
  },
  {
    value: 'BLOG_COMMENT',
    label: 'دیدگاه مقاله',
  },
] as const;

export function getAdminContentReportStatusLabel(status: AdminContentReportStatus) {
  return adminContentReportStatusOptions.find((option) => option.value === status)?.label ?? status;
}

export function getAdminContentReportTargetTypeLabel(type: AdminContentReportTargetType) {
  return adminContentReportTargetTypeOptions.find((option) => option.value === type)?.label ?? type;
}

export function getAdminContentReportReasonLabel(reason: AdminContentReportReason) {
  const labels: Record<AdminContentReportReason, string> = {
    SPAM: 'هرزنامه یا تبلیغات',

    ABUSE: 'محتوای نامناسب یا توهین‌آمیز',

    MISLEADING: 'اطلاعات گمراه‌کننده',

    PERSONAL_INFO: 'انتشار اطلاعات شخصی',

    OTHER: 'سایر',
  };

  return labels[reason];
}
