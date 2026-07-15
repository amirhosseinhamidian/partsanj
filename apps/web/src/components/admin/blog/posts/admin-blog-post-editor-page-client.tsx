'use client';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select, type SelectOption } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  BLOG_POST_STATUS_OPTIONS,
  getBlogPostStatusBadgeVariant,
  getBlogPostStatusLabel,
} from '@/lib/admin/blog/posts/admin-blog-post-presentation';
import {
  AdminBlogPostApiError,
  createAdminBlogPost,
  getAdminBlogPost,
  updateAdminBlogPost,
} from '@/lib/admin/blog/posts/admin-blog-post.client';
import type {
  AdminBlogPostDetail,
  AdminBlogPostStatus,
  BlogEditorDocument,
  CreateAdminBlogPostInput,
} from '@/lib/admin/blog/posts/admin-blog-post.types';
import {
  createEmptyBlogEditorDocument,
  hasMeaningfulBlogEditorContent,
} from '@/lib/admin/blog/posts/blog-editor.utils';
import { useAdminBlogCategories } from '@/lib/admin/blog/categories/use-admin-blog-categories';
import { cn } from '@/lib/utils/cn';
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileText,
  Globe2,
  ImageIcon,
  Save,
  Settings2,
  Share2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { TiptapEditor } from '@/components/ui/tiptap-editor';
import { Badge } from '@/components/ui/badge';

type BlogPostDraft = {
  categoryId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: BlogEditorDocument;

  coverImageUrl: string;
  coverImageAlt: string;

  status: AdminBlogPostStatus;

  showOnHome: boolean;
  homeSortOrder: string;

  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  noIndex: boolean;

  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImageUrl: string;
  openGraphImageAlt: string;
};

type BlogPostFormErrors = Partial<
  Record<
    | 'categoryId'
    | 'title'
    | 'slug'
    | 'excerpt'
    | 'content'
    | 'coverImageUrl'
    | 'coverImageAlt'
    | 'homeSortOrder'
    | 'seoTitle'
    | 'seoDescription'
    | 'canonicalUrl'
    | 'openGraphTitle'
    | 'openGraphDescription'
    | 'openGraphImageUrl'
    | 'openGraphImageAlt',
    string
  >
>;

type AdminBlogPostEditorPageClientProps = {
  blogPostId?: string;
};

const EMPTY_CATEGORY_VALUE = '__EMPTY__';

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toNullableText(value: string) {
  const normalized = value.trim();

  return normalized || null;
}

function isValidHttpUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function createDraft(post: AdminBlogPostDetail | null): BlogPostDraft {
  return {
    categoryId: post?.category.id ?? '',
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? createEmptyBlogEditorDocument(),

    coverImageUrl: post?.coverImageUrl ?? '',
    coverImageAlt: post?.coverImageAlt ?? '',

    status: post?.status ?? 'DRAFT',

    showOnHome: post?.showOnHome ?? false,
    homeSortOrder: String(post?.homeSortOrder ?? 0),

    seoTitle: post?.seoTitle ?? '',
    seoDescription: post?.seoDescription ?? '',
    canonicalUrl: post?.canonicalUrl ?? '',
    noIndex: post?.noIndex ?? false,

    openGraphTitle: post?.openGraphTitle ?? '',
    openGraphDescription: post?.openGraphDescription ?? '',
    openGraphImageUrl: post?.openGraphImageUrl ?? '',
    openGraphImageAlt: post?.openGraphImageAlt ?? '',
  };
}

function createPayload(draft: BlogPostDraft): CreateAdminBlogPostInput {
  return {
    categoryId: draft.categoryId,
    title: draft.title.trim(),
    slug: normalizeSlug(draft.slug),
    excerpt: toNullableText(draft.excerpt),
    content: draft.content,

    coverImageUrl: toNullableText(draft.coverImageUrl),
    coverImageAlt: toNullableText(draft.coverImageAlt),

    status: draft.status,

    showOnHome: draft.showOnHome,
    homeSortOrder: Number(draft.homeSortOrder || 0),

    seoTitle: toNullableText(draft.seoTitle),
    seoDescription: toNullableText(draft.seoDescription),
    canonicalUrl: toNullableText(draft.canonicalUrl),
    noIndex: draft.noIndex,

    openGraphTitle: toNullableText(draft.openGraphTitle),
    openGraphDescription: toNullableText(draft.openGraphDescription),
    openGraphImageUrl: toNullableText(draft.openGraphImageUrl),
    openGraphImageAlt: toNullableText(draft.openGraphImageAlt),
  };
}

function validateDraft(
  draft: BlogPostDraft,
  categories: {
    id: string;
    isActive: boolean;
  }[],
): BlogPostFormErrors {
  const errors: BlogPostFormErrors = {};
  const slug = normalizeSlug(draft.slug);
  const homeSortOrder = Number(draft.homeSortOrder);

  if (!draft.categoryId) {
    errors.categoryId = 'دسته‌بندی مقاله را انتخاب کنید';
  }

  if (draft.title.trim().length < 2) {
    errors.title = 'عنوان مقاله باید حداقل ۲ کاراکتر باشد';
  }

  if (!slug) {
    errors.slug = 'Slug مقاله الزامی است';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = 'Slug فقط باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد';
  }

  if (!isValidHttpUrl(draft.coverImageUrl)) {
    errors.coverImageUrl = 'آدرس تصویر کاور باید با http یا https شروع شود';
  }

  if (draft.coverImageUrl.trim() && !draft.coverImageAlt.trim()) {
    errors.coverImageAlt = 'برای تصویر کاور، متن جایگزین وارد کنید';
  }

  if (!isValidHttpUrl(draft.canonicalUrl)) {
    errors.canonicalUrl = 'Canonical URL باید با http یا https شروع شود';
  }

  if (!isValidHttpUrl(draft.openGraphImageUrl)) {
    errors.openGraphImageUrl = 'آدرس تصویر Open Graph باید با http یا https شروع شود';
  }

  if (draft.openGraphImageUrl.trim() && !draft.openGraphImageAlt.trim()) {
    errors.openGraphImageAlt = 'برای تصویر Open Graph متن جایگزین وارد کنید';
  }

  if (draft.status === 'PUBLISHED') {
    const selectedCategory = categories.find((category) => category.id === draft.categoryId);

    if (selectedCategory && !selectedCategory.isActive) {
      errors.categoryId = 'انتشار مقاله در دسته‌بندی غیرفعال مجاز نیست';
    }

    if (!hasMeaningfulBlogEditorContent(draft.content)) {
      errors.content = 'برای انتشار مقاله، محتوای غیرخالی لازم است';
    }
  }

  if (!Number.isInteger(homeSortOrder) || homeSortOrder < 0) {
    errors.homeSortOrder = 'ترتیب نمایش در صفحه اصلی باید عدد صحیح صفر یا بزرگ‌تر باشد';
  }

  return errors;
}

function getErrorMessage(error: unknown) {
  if (error instanceof AdminBlogPostApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ذخیره مقاله با خطا مواجه شد';
}

export function AdminBlogPostEditorPageClient({ blogPostId }: AdminBlogPostEditorPageClientProps) {
  const router = useRouter();
  const isEditMode = Boolean(blogPostId);

  const [post, setPost] = useState<AdminBlogPostDetail | null>(null);
  const [isPostLoading, setIsPostLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [draft, setDraft] = useState<BlogPostDraft>(() => createDraft(null));
  const [initialPayload, setInitialPayload] = useState(
    JSON.stringify(createPayload(createDraft(null))),
  );

  const [errors, setErrors] = useState<BlogPostFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditMode);

  const [seoOpen, setSeoOpen] = useState(false);
  const [openGraphOpen, setOpenGraphOpen] = useState(false);

  const { categories, isLoading: areCategoriesLoading } = useAdminBlogCategories({
    page: 1,
    limit: 100,
  });

  useEffect(() => {
    if (!blogPostId) {
      const nextDraft = createDraft(null);

      setPost(null);
      setDraft(nextDraft);
      setInitialPayload(JSON.stringify(createPayload(nextDraft)));
      setIsPostLoading(false);
      setLoadError(null);
      setSlugManuallyEdited(false);

      return;
    }

    const currentBlogPostId = blogPostId;
    const controller = new AbortController();

    async function loadPost() {
      setIsPostLoading(true);
      setLoadError(null);

      try {
        const result = await getAdminBlogPost(currentBlogPostId, controller.signal);

        const nextDraft = createDraft(result.data);

        setPost(result.data);
        setDraft(nextDraft);
        setInitialPayload(JSON.stringify(createPayload(nextDraft)));
        setSlugManuallyEdited(true);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        setLoadError(getErrorMessage(error));
      } finally {
        setIsPostLoading(false);
      }
    }

    void loadPost();

    return () => {
      controller.abort();
    };
  }, [blogPostId]);

  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: EMPTY_CATEGORY_VALUE,
        label: areCategoriesLoading ? 'در حال دریافت دسته‌بندی‌ها' : 'انتخاب دسته‌بندی',
      },
      ...categories.map((category) => ({
        value: category.id,
        label: category.isActive ? category.name : `${category.name} — غیرفعال`,
      })),
    ],
    [areCategoriesLoading, categories],
  );

  const hasChanges = useMemo(
    () => JSON.stringify(createPayload(draft)) !== initialPayload,
    [draft, initialPayload],
  );

  function setField<TKey extends keyof BlogPostDraft>(key: TKey, value: BlogPostDraft[TKey]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));

    setSubmitError(null);
    setSuccessMessage(null);
  }

  function handleTitleChange(value: string) {
    setDraft((current) => {
      const next = {
        ...current,
        title: value,
      };

      if (!isEditMode && !slugManuallyEdited) {
        const suggestedSlug = normalizeSlug(value);

        if (suggestedSlug) {
          next.slug = suggestedSlug;
        }
      }

      return next;
    });

    setErrors((current) => ({
      ...current,
      title: undefined,
      slug: undefined,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateDraft(draft, categories);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);

      if (nextErrors.seoTitle || nextErrors.seoDescription || nextErrors.canonicalUrl) {
        setSeoOpen(true);
      }

      if (
        nextErrors.openGraphTitle ||
        nextErrors.openGraphDescription ||
        nextErrors.openGraphImageUrl ||
        nextErrors.openGraphImageAlt
      ) {
        setOpenGraphOpen(true);
      }

      return;
    }

    setIsSaving(true);
    setErrors({});
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const payload = createPayload(draft);

      const result = blogPostId
        ? await updateAdminBlogPost(blogPostId, payload)
        : await createAdminBlogPost(payload);

      if (!blogPostId) {
        router.replace(`/admin/blog/posts/${result.data.id}`);
        return;
      }

      const nextDraft = createDraft(result.data);

      setPost(result.data);
      setDraft(nextDraft);
      setInitialPayload(JSON.stringify(createPayload(nextDraft)));
      setSuccessMessage('تغییرات مقاله با موفقیت ذخیره شد');
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (isPostLoading) {
    return <BlogPostEditorSkeleton />;
  }

  if (loadError) {
    return (
      <section className='rounded-card border border-danger/30 bg-danger-soft p-5'>
        <CircleAlert className='size-6 text-danger' />

        <h1 className='mt-3 text-lg font-extrabold text-danger'>دریافت مقاله ناموفق بود</h1>

        <p className='mt-2 text-sm text-danger/90'>{loadError}</p>

        <Button
          type='button'
          className='mt-5'
          onClick={() => {
            router.push('/admin/blog/posts');
          }}
        >
          بازگشت به فهرست مقالات
        </Button>
      </section>
    );
  }

  const saveLabel =
    draft.status === 'PUBLISHED' && !post?.publishedAt
      ? 'انتشار مقاله'
      : draft.status === 'ARCHIVED'
        ? 'آرشیو مقاله'
        : 'ذخیره تغییرات';

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand'>
            <BookOpenText className='size-5' />
          </span>

          <div>
            <p className='text-sm text-foreground-muted'>
              بلاگ / {isEditMode ? 'ویرایش مقاله' : 'مقاله جدید'}
            </p>

            <h1 className='mt-1 text-xl font-extrabold text-foreground'>
              {isEditMode ? (post?.title ?? 'ویرایش مقاله') : 'مقاله جدید'}
            </h1>

            <div className='mt-3 flex items-center gap-2 text-sm text-foreground-secondary'>
              <span>وضعیت:</span>

              <Badge variant={getBlogPostStatusBadgeVariant(draft.status)} dot>
                {getBlogPostStatusLabel(draft.status)}
              </Badge>
            </div>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            iconStart={<ArrowRight className='size-4' />}
            onClick={() => {
              router.push('/admin/blog/posts');
            }}
          >
            بازگشت
          </Button>

          <Button
            type='submit'
            iconStart={<Save className='size-4' />}
            disabled={isSaving || !hasChanges}
            isLoading={isSaving}
            loadingLabel='در حال ذخیره'
          >
            {saveLabel}
          </Button>
        </div>
      </header>

      {submitError ? (
        <div
          role='alert'
          className='flex items-start gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 text-danger'
        >
          <CircleAlert className='mt-0.5 size-5 shrink-0' />
          <p className='text-sm leading-6 font-semibold'>{submitError}</p>
        </div>
      ) : null}

      {successMessage ? (
        <div className='flex items-start gap-3 rounded-card border border-success/30 bg-success-soft p-4 text-success'>
          <CheckCircle2 className='mt-0.5 size-5 shrink-0' />
          <p className='text-sm font-semibold'>{successMessage}</p>
        </div>
      ) : null}

      <EditorSection
        title='اطلاعات اصلی مقاله'
        description='عنوان، دسته‌بندی، وضعیت انتشار و URL مقاله را مشخص کنید'
        icon={Settings2}
      >
        <div className='grid gap-5 md:grid-cols-2'>
          <FormField label='عنوان مقاله' required error={errors.title} className='md:col-span-2'>
            {({ id, labelId, describedBy, invalid, required }) => (
              <Input
                id={id}
                required={required}
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving}
                value={draft.title}
                maxLength={200}
                onChange={(event) => {
                  handleTitleChange(event.target.value);
                }}
                placeholder='مثلاً راهنمای انتخاب قطعات برقی خودرو'
              />
            )}
          </FormField>

          <div className='space-y-1.5'>
            <Select
              id='blog-post-category'
              label='دسته‌بندی مقاله'
              value={draft.categoryId || EMPTY_CATEGORY_VALUE}
              options={categoryOptions}
              disabled={isSaving || areCategoriesLoading}
              onValueChange={(value) => {
                setField('categoryId', value === EMPTY_CATEGORY_VALUE ? '' : value);
              }}
            />

            {errors.categoryId ? (
              <p className='text-xs font-semibold text-danger'>{errors.categoryId}</p>
            ) : null}
          </div>

          <Select
            id='blog-post-status'
            label='وضعیت مقاله'
            value={draft.status}
            options={BLOG_POST_STATUS_OPTIONS}
            disabled={isSaving}
            onValueChange={(value) => {
              setField('status', value as AdminBlogPostStatus);
            }}
          />

          <EditorSection
            title='نمایش در صفحه اصلی'
            description='برای نمایش مقاله در سکشن راهنمای انتخاب قطعه در صفحه اصلی، این گزینه را فعال کنید'
            icon={Settings2}
          >
            <div className='grid gap-5 md:grid-cols-2'>
              <FormField
                label='نمایش در صفحه اصلی'
                helperText='اگر فعال باشد، این مقاله در سکشن راهنمای انتخاب قطعه نمایش داده می‌شود'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Switch
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    checked={draft.showOnHome}
                    onCheckedChange={(checked) => {
                      setField('showOnHome', checked);
                    }}
                  />
                )}
              </FormField>

              <FormField
                label='ترتیب نمایش'
                helperText='عدد کمتر، زودتر نمایش داده می‌شود. مثلاً 1، 2، 3'
                error={errors.homeSortOrder}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type='number'
                    min={0}
                    inputMode='numeric'
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={draft.homeSortOrder}
                    onChange={(event) => {
                      setField('homeSortOrder', event.target.value);
                    }}
                    onBlur={() => {
                      const value = Number(draft.homeSortOrder);

                      setField(
                        'homeSortOrder',
                        Number.isInteger(value) && value >= 0 ? String(value) : '0',
                      );
                    }}
                    placeholder='0'
                  />
                )}
              </FormField>
            </div>
          </EditorSection>

          <FormField
            label='Slug'
            required
            helperText='فقط حروف انگلیسی کوچک، عدد و خط تیره'
            error={errors.slug}
            className='md:col-span-2'
          >
            {({ id, labelId, describedBy, invalid, required }) => (
              <Input
                id={id}
                required={required}
                dir='ltr'
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving}
                value={draft.slug}
                maxLength={220}
                onChange={(event) => {
                  setSlugManuallyEdited(true);
                  setField('slug', event.target.value);
                }}
                onBlur={() => {
                  setField('slug', normalizeSlug(draft.slug));
                }}
                placeholder='car-electrical-parts-guide'
              />
            )}
          </FormField>

          <FormField
            label='خلاصه مقاله'
            helperText='خلاصه‌ای کوتاه برای کارت مقاله و Metadata پیش‌فرض'
            error={errors.excerpt}
            className='md:col-span-2'
          >
            {({ id, labelId, describedBy, invalid }) => (
              <Textarea
                id={id}
                rows={4}
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving}
                value={draft.excerpt}
                maxLength={700}
                onChange={(event) => {
                  setField('excerpt', event.target.value);
                }}
                placeholder='خلاصه‌ای کاربردی از موضوع مقاله'
              />
            )}
          </FormField>
        </div>
      </EditorSection>

      <EditorSection
        title='محتوای مقاله'
        description='محتوا را با تیترهای H2 و H3، فهرست‌ها و لینک‌های داخلی ساختاربندی کنید'
        icon={FileText}
      >
        <TiptapEditor<BlogEditorDocument>
          id='blog-post-content'
          label='متن مقاله'
          value={draft.content}
          disabled={isSaving}
          error={errors.content}
          placeholder='متن مقاله را بنویسید. برای ساختار بهتر از تیترهای H2 و H3 استفاده کنید'
          helperText='برای ساختار بهتر مقاله و SEO، تیترهای H2 و H3 را برای بخش‌های اصلی استفاده کنید'
          minHeightClassName='min-h-[380px]'
          showCharacterCount
          characterCountLocale='fa-IR'
          onChange={(content) => {
            setField('content', content);
          }}
        />
      </EditorSection>

      <EditorSection
        title='تصویر کاور و دسترس‌پذیری'
        description='تصویر کاور اختیاری است، اما هر تصویر باید متن جایگزین مناسب داشته باشد'
        icon={ImageIcon}
      >
        <div className='grid gap-5 md:grid-cols-2'>
          <FormField label='آدرس تصویر کاور' error={errors.coverImageUrl} className='md:col-span-2'>
            {({ id, labelId, describedBy, invalid }) => (
              <Input
                id={id}
                type='url'
                dir='ltr'
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving}
                value={draft.coverImageUrl}
                maxLength={2048}
                onChange={(event) => {
                  setField('coverImageUrl', event.target.value);
                }}
                placeholder='https://cdn.partsanj.ir/blog/article-cover.jpg'
              />
            )}
          </FormField>

          <FormField
            label='متن جایگزین تصویر کاور'
            helperText='برای Screen Readerها و دسترس‌پذیری تصویر استفاده می‌شود'
            error={errors.coverImageAlt}
            className='md:col-span-2'
          >
            {({ id, labelId, describedBy, invalid }) => (
              <Input
                id={id}
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving}
                value={draft.coverImageAlt}
                maxLength={255}
                onChange={(event) => {
                  setField('coverImageAlt', event.target.value);
                }}
                placeholder='نمای نزدیک از قطعات برقی خودرو'
              />
            )}
          </FormField>
        </div>
      </EditorSection>

      <CollapsibleEditorSection
        title='تنظیمات SEO'
        description='در صورت خالی بودن، Title و Excerpt مقاله به‌صورت خودکار برای Metadata استفاده می‌شوند'
        icon={Globe2}
        open={seoOpen}
        onOpenChange={setSeoOpen}
      >
        <div className='grid gap-5 md:grid-cols-2'>
          <FormField label='عنوان SEO' error={errors.seoTitle} className='md:col-span-2'>
            {({ id, labelId, describedBy, invalid }) => (
              <Input
                id={id}
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving || !seoOpen}
                value={draft.seoTitle}
                maxLength={120}
                onChange={(event) => {
                  setField('seoTitle', event.target.value);
                }}
                placeholder='عنوان اختصاصی برای گوگل'
              />
            )}
          </FormField>

          <FormField label='توضیحات SEO' error={errors.seoDescription} className='md:col-span-2'>
            {({ id, labelId, describedBy, invalid }) => (
              <Textarea
                id={id}
                rows={4}
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving || !seoOpen}
                value={draft.seoDescription}
                maxLength={320}
                onChange={(event) => {
                  setField('seoDescription', event.target.value);
                }}
                placeholder='توضیحات اختصاصی برای نتایج جست‌وجو'
              />
            )}
          </FormField>

          <FormField label='Canonical URL' error={errors.canonicalUrl} className='md:col-span-2'>
            {({ id, labelId, describedBy, invalid }) => (
              <Input
                id={id}
                type='url'
                dir='ltr'
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving || !seoOpen}
                value={draft.canonicalUrl}
                maxLength={2048}
                onChange={(event) => {
                  setField('canonicalUrl', event.target.value);
                }}
                placeholder='https://partsanj.ir/blog/example'
              />
            )}
          </FormField>

          <FormField
            label='عدم ایندکس'
            helperText='فقط برای مقاله‌های آزمایشی یا صفحاتی که نباید در موتور جست‌وجو دیده شوند'
            className='md:col-span-2'
          >
            {({ id, labelId, describedBy, invalid }) => (
              <Switch
                id={id}
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving || !seoOpen}
                checked={draft.noIndex}
                onCheckedChange={(checked) => {
                  setField('noIndex', checked);
                }}
              />
            )}
          </FormField>
        </div>
      </CollapsibleEditorSection>

      <CollapsibleEditorSection
        title='Open Graph و اشتراک‌گذاری'
        description='این اطلاعات برای ظاهر لینک مقاله در واتساپ، تلگرام و شبکه‌های اجتماعی استفاده می‌شود'
        icon={Share2}
        open={openGraphOpen}
        onOpenChange={setOpenGraphOpen}
      >
        <div className='grid gap-5 md:grid-cols-2'>
          <FormField
            label='عنوان Open Graph'
            error={errors.openGraphTitle}
            className='md:col-span-2'
          >
            {({ id, labelId, describedBy, invalid }) => (
              <Input
                id={id}
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving || !openGraphOpen}
                value={draft.openGraphTitle}
                maxLength={160}
                onChange={(event) => {
                  setField('openGraphTitle', event.target.value);
                }}
                placeholder='عنوان مخصوص اشتراک‌گذاری'
              />
            )}
          </FormField>

          <FormField
            label='توضیحات Open Graph'
            error={errors.openGraphDescription}
            className='md:col-span-2'
          >
            {({ id, labelId, describedBy, invalid }) => (
              <Textarea
                id={id}
                rows={4}
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving || !openGraphOpen}
                value={draft.openGraphDescription}
                maxLength={500}
                onChange={(event) => {
                  setField('openGraphDescription', event.target.value);
                }}
                placeholder='توضیح مخصوص اشتراک‌گذاری'
              />
            )}
          </FormField>

          <FormField
            label='آدرس تصویر Open Graph'
            error={errors.openGraphImageUrl}
            className='md:col-span-2'
          >
            {({ id, labelId, describedBy, invalid }) => (
              <Input
                id={id}
                type='url'
                dir='ltr'
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving || !openGraphOpen}
                value={draft.openGraphImageUrl}
                maxLength={2048}
                onChange={(event) => {
                  setField('openGraphImageUrl', event.target.value);
                }}
                placeholder='https://cdn.partsanj.ir/blog/social-preview.jpg'
              />
            )}
          </FormField>

          <FormField
            label='متن جایگزین تصویر Open Graph'
            error={errors.openGraphImageAlt}
            className='md:col-span-2'
          >
            {({ id, labelId, describedBy, invalid }) => (
              <Input
                id={id}
                aria-labelledby={labelId}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={isSaving || !openGraphOpen}
                value={draft.openGraphImageAlt}
                maxLength={255}
                onChange={(event) => {
                  setField('openGraphImageAlt', event.target.value);
                }}
                placeholder='توضیح قابل فهم تصویر اشتراک‌گذاری'
              />
            )}
          </FormField>
        </div>
      </CollapsibleEditorSection>

      <div className='sticky bottom-4 z-10 flex justify-end rounded-card border border-border bg-surface/95 p-3 shadow-floating backdrop-blur'>
        <Button
          type='submit'
          iconStart={<Save className='size-4' />}
          disabled={isSaving || !hasChanges}
          isLoading={isSaving}
          loadingLabel='در حال ذخیره'
        >
          {saveLabel}
        </Button>
      </div>
    </form>
  );
}

function EditorSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Settings2;
  children: ReactNode;
}) {
  return (
    <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-5'>
      <div className='flex items-start gap-3 border-b border-border pb-4'>
        <span className='grid size-9 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
          <Icon className='size-4' />
        </span>

        <div>
          <h2 className='type-section-title text-foreground'>{title}</h2>

          <p className='mt-1 text-sm text-foreground-muted'>{description}</p>
        </div>
      </div>

      <div className='pt-5'>{children}</div>
    </section>
  );
}

function CollapsibleEditorSection({
  title,
  description,
  icon: Icon,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Globe2;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <section className='overflow-hidden rounded-card border border-border bg-surface shadow-panel'>
      <button
        type='button'
        aria-expanded={open}
        onClick={() => {
          onOpenChange(!open);
        }}
        className='flex w-full items-start gap-3 p-4 text-right sm:p-5'
      >
        <span className='grid size-9 shrink-0 place-items-center rounded-control bg-surface-muted text-foreground-secondary'>
          <Icon className='size-4' />
        </span>

        <span className='min-w-0 flex-1'>
          <span className='type-section-title block text-foreground'>{title}</span>

          <span className='mt-1 block text-sm leading-6 text-foreground-muted'>{description}</span>
        </span>

        <ChevronDown
          className={cn(
            'mt-1 size-5 shrink-0 text-foreground-muted transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className='min-h-0 overflow-hidden'>
          <div className='border-t border-border p-4 sm:p-5'>{children}</div>
        </div>
      </div>
    </section>
  );
}

function BlogPostEditorSkeleton() {
  return (
    <div className='animate-pulse space-y-6'>
      <div className='h-16 rounded-card bg-surface-muted' />
      <div className='h-80 rounded-card bg-surface-muted' />
      <div className='h-[460px] rounded-card bg-surface-muted' />
      <div className='h-52 rounded-card bg-surface-muted' />
    </div>
  );
}
