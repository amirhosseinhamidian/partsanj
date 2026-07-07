import type { SelectOption } from '@/components/ui/select';
import type { AdminBlogPostAuthorSummary, AdminBlogPostStatus } from './admin-blog-post.types';

export const BLOG_POST_STATUS_OPTIONS = [
  {
    value: 'DRAFT',
    label: 'پیش‌نویس',
  },
  {
    value: 'PUBLISHED',
    label: 'منتشرشده',
  },
  {
    value: 'ARCHIVED',
    label: 'آرشیوشده',
  },
] satisfies SelectOption[];

export function getBlogPostStatusLabel(status: AdminBlogPostStatus) {
  switch (status) {
    case 'PUBLISHED':
      return 'منتشرشده';

    case 'ARCHIVED':
      return 'آرشیوشده';

    default:
      return 'پیش‌نویس';
  }
}

export function getBlogPostAuthorDisplayName(author: AdminBlogPostAuthorSummary) {
  const fullName = [author.firstName, author.lastName].filter(Boolean).join(' ');

  return fullName || 'بدون نام';
}

export function getBlogPostStatusBadgeVariant(
  status: AdminBlogPostStatus,
): 'success' | 'warning' | 'neutral' {
  switch (status) {
    case 'PUBLISHED':
      return 'success';

    case 'ARCHIVED':
      return 'neutral';

    default:
      return 'warning';
  }
}
