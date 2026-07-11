import { ApiRequestError } from '@/lib/api/api-error';
import {
  isAdminBlogPostStatus,
  type BlogEditorDocument,
  type CreateAdminBlogPostInput,
  type UpdateAdminBlogPostInput,
} from './admin-blog-post.types';

const nullableTextFields = [
  'excerpt',
  'coverImageUrl',
  'coverImageAlt',
  'seoTitle',
  'seoDescription',
  'canonicalUrl',
  'openGraphTitle',
  'openGraphDescription',
  'openGraphImageUrl',
  'openGraphImageAlt',
] as const;

const booleanFields = ['noIndex', 'showOnHome'] as const;
const numberFields = ['homeSortOrder'] as const;

const createAllowedKeys = new Set<string>([
  'categoryId',
  'title',
  'slug',
  'content',
  'status',
  ...nullableTextFields,
  ...booleanFields,
  ...numberFields,
]);

const updateAllowedKeys = new Set<string>(createAllowedKeys);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isEditorDocument(value: unknown): value is BlogEditorDocument {
  return isPlainObject(value) && value.type === 'doc' && Array.isArray(value.content);
}

async function readBodyObject(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new ApiRequestError('بدنه درخواست معتبر نیست', 400, 'INVALID_BLOG_POST_REQUEST_BODY');
  }

  if (!isPlainObject(payload)) {
    throw new ApiRequestError('اطلاعات مقاله معتبر نیست', 400, 'INVALID_BLOG_POST_INPUT');
  }

  return payload;
}

function assertAllowedKeys(payload: Record<string, unknown>, allowedKeys: Set<string>) {
  const unknownKey = Object.keys(payload).find((key) => !allowedKeys.has(key));

  if (unknownKey) {
    throw new ApiRequestError(`فیلد «${unknownKey}» مجاز نیست`, 400, 'INVALID_BLOG_POST_FIELD');
  }
}

function readRequiredText(payload: Record<string, unknown>, key: 'categoryId' | 'title' | 'slug') {
  const value = payload[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    const fieldLabels = {
      categoryId: 'دسته‌بندی مقاله',
      title: 'عنوان مقاله',
      slug: 'Slug مقاله',
    };

    throw new ApiRequestError(
      `${fieldLabels[key]} معتبر نیست`,
      400,
      'INVALID_BLOG_POST_REQUIRED_FIELD',
    );
  }

  return value;
}

function readRequiredContent(payload: Record<string, unknown>) {
  const value = payload.content;

  if (!isEditorDocument(value)) {
    throw new ApiRequestError(
      'محتوای مقاله باید یک سند معتبر Editor باشد',
      400,
      'INVALID_BLOG_POST_CONTENT',
    );
  }

  return value;
}

function readOptionalNullableText(
  payload: Record<string, unknown>,
  key: (typeof nullableTextFields)[number],
) {
  if (!hasOwn(payload, key)) {
    return undefined;
  }

  const value = payload[key];

  if (value !== null && typeof value !== 'string') {
    throw new ApiRequestError(`مقدار «${key}» معتبر نیست`, 400, 'INVALID_BLOG_POST_TEXT_FIELD');
  }

  return value;
}

function readOptionalStatus(payload: Record<string, unknown>) {
  if (!hasOwn(payload, 'status')) {
    return undefined;
  }

  const value = payload.status;

  if (!isAdminBlogPostStatus(value)) {
    throw new ApiRequestError('وضعیت مقاله معتبر نیست', 400, 'INVALID_BLOG_POST_STATUS');
  }

  return value;
}

function readOptionalBoolean(
  payload: Record<string, unknown>,
  key: (typeof booleanFields)[number],
) {
  if (!hasOwn(payload, key)) {
    return undefined;
  }

  const value = payload[key];

  if (typeof value !== 'boolean') {
    throw new ApiRequestError(`مقدار «${key}» معتبر نیست`, 400, 'INVALID_BLOG_POST_BOOLEAN_FIELD');
  }

  return value;
}

function readOptionalNumber(payload: Record<string, unknown>, key: (typeof numberFields)[number]) {
  if (!hasOwn(payload, key)) {
    return undefined;
  }

  const value = payload[key];

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ApiRequestError(`مقدار «${key}» معتبر نیست`, 400, 'INVALID_BLOG_POST_NUMBER_FIELD');
  }

  return value;
}

function readOptionalContent(payload: Record<string, unknown>) {
  if (!hasOwn(payload, 'content')) {
    return undefined;
  }

  const value = payload.content;

  if (!isEditorDocument(value)) {
    throw new ApiRequestError(
      'محتوای مقاله باید یک سند معتبر Editor باشد',
      400,
      'INVALID_BLOG_POST_CONTENT',
    );
  }

  return value;
}

function appendOptionalFields(payload: Record<string, unknown>, target: UpdateAdminBlogPostInput) {
  const excerpt = readOptionalNullableText(payload, 'excerpt');

  if (excerpt !== undefined) {
    target.excerpt = excerpt;
  }

  const coverImageUrl = readOptionalNullableText(payload, 'coverImageUrl');

  if (coverImageUrl !== undefined) {
    target.coverImageUrl = coverImageUrl;
  }

  const coverImageAlt = readOptionalNullableText(payload, 'coverImageAlt');

  if (coverImageAlt !== undefined) {
    target.coverImageAlt = coverImageAlt;
  }

  const status = readOptionalStatus(payload);

  if (status !== undefined) {
    target.status = status;
  }

  const seoTitle = readOptionalNullableText(payload, 'seoTitle');

  if (seoTitle !== undefined) {
    target.seoTitle = seoTitle;
  }

  const seoDescription = readOptionalNullableText(payload, 'seoDescription');

  if (seoDescription !== undefined) {
    target.seoDescription = seoDescription;
  }

  const canonicalUrl = readOptionalNullableText(payload, 'canonicalUrl');

  if (canonicalUrl !== undefined) {
    target.canonicalUrl = canonicalUrl;
  }

  const noIndex = readOptionalBoolean(payload, 'noIndex');

  if (noIndex !== undefined) {
    target.noIndex = noIndex;
  }

  const showOnHome = readOptionalBoolean(payload, 'showOnHome');

  if (showOnHome !== undefined) {
    target.showOnHome = showOnHome;
  }

  const homeSortOrder = readOptionalNumber(payload, 'homeSortOrder');

  if (homeSortOrder !== undefined) {
    target.homeSortOrder = homeSortOrder;
  }

  const openGraphTitle = readOptionalNullableText(payload, 'openGraphTitle');

  if (openGraphTitle !== undefined) {
    target.openGraphTitle = openGraphTitle;
  }

  const openGraphDescription = readOptionalNullableText(payload, 'openGraphDescription');

  if (openGraphDescription !== undefined) {
    target.openGraphDescription = openGraphDescription;
  }

  const openGraphImageUrl = readOptionalNullableText(payload, 'openGraphImageUrl');

  if (openGraphImageUrl !== undefined) {
    target.openGraphImageUrl = openGraphImageUrl;
  }

  const openGraphImageAlt = readOptionalNullableText(payload, 'openGraphImageAlt');

  if (openGraphImageAlt !== undefined) {
    target.openGraphImageAlt = openGraphImageAlt;
  }

  const content = readOptionalContent(payload);

  if (content !== undefined) {
    target.content = content;
  }
}

export async function readCreateAdminBlogPostInput(
  request: Request,
): Promise<CreateAdminBlogPostInput> {
  const payload = await readBodyObject(request);

  assertAllowedKeys(payload, createAllowedKeys);

  const input: CreateAdminBlogPostInput = {
    categoryId: readRequiredText(payload, 'categoryId'),
    title: readRequiredText(payload, 'title'),
    slug: readRequiredText(payload, 'slug'),
    content: readRequiredContent(payload),
  };

  appendOptionalFields(payload, input);

  return input;
}

export async function readUpdateAdminBlogPostInput(
  request: Request,
): Promise<UpdateAdminBlogPostInput> {
  const payload = await readBodyObject(request);

  assertAllowedKeys(payload, updateAllowedKeys);

  if (Object.keys(payload).length === 0) {
    throw new ApiRequestError(
      'حداقل یکی از اطلاعات مقاله باید تغییر کند',
      400,
      'EMPTY_BLOG_POST_UPDATE',
    );
  }

  const input: UpdateAdminBlogPostInput = {};

  if (hasOwn(payload, 'categoryId')) {
    input.categoryId = readRequiredText(payload, 'categoryId');
  }

  if (hasOwn(payload, 'title')) {
    input.title = readRequiredText(payload, 'title');
  }

  if (hasOwn(payload, 'slug')) {
    input.slug = readRequiredText(payload, 'slug');
  }

  appendOptionalFields(payload, input);

  return input;
}
