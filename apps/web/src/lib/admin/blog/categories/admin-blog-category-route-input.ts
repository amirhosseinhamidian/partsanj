import { ApiRequestError } from '@/lib/api/api-error';
import type {
  CreateAdminBlogCategoryInput,
  UpdateAdminBlogCategoryInput,
} from './admin-blog-category.types';

const nullableTextFields = [
  'description',
  'seoTitle',
  'seoDescription',
  'canonicalUrl',
  'openGraphTitle',
  'openGraphDescription',
  'openGraphImageUrl',
  'openGraphImageAlt',
] as const;

const booleanFields = ['isActive', 'noIndex'] as const;

const createAllowedKeys = new Set<string>([
  'name',
  'slug',
  'sortOrder',
  ...nullableTextFields,
  ...booleanFields,
]);

const updateAllowedKeys = new Set<string>(createAllowedKeys);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

async function readBodyObject(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new ApiRequestError('بدنه درخواست معتبر نیست', 400, 'INVALID_BLOG_CATEGORY_REQUEST_BODY');
  }

  if (!isPlainObject(payload)) {
    throw new ApiRequestError('اطلاعات دسته‌بندی معتبر نیست', 400, 'INVALID_BLOG_CATEGORY_INPUT');
  }

  return payload;
}

function assertAllowedKeys(payload: Record<string, unknown>, allowedKeys: Set<string>) {
  const unknownKey = Object.keys(payload).find((key) => !allowedKeys.has(key));

  if (unknownKey) {
    throw new ApiRequestError(`فیلد «${unknownKey}» مجاز نیست`, 400, 'INVALID_BLOG_CATEGORY_FIELD');
  }
}

function readRequiredText(payload: Record<string, unknown>, key: 'name' | 'slug') {
  const value = payload[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ApiRequestError(
      key === 'name' ? 'نام دسته‌بندی معتبر نیست' : 'Slug دسته‌بندی معتبر نیست',
      400,
      'INVALID_BLOG_CATEGORY_REQUIRED_FIELD',
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
    throw new ApiRequestError(`مقدار «${key}» معتبر نیست`, 400, 'INVALID_BLOG_CATEGORY_TEXT_FIELD');
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
    throw new ApiRequestError(
      `مقدار «${key}» معتبر نیست`,
      400,
      'INVALID_BLOG_CATEGORY_BOOLEAN_FIELD',
    );
  }

  return value;
}

function readOptionalSortOrder(payload: Record<string, unknown>) {
  if (!hasOwn(payload, 'sortOrder')) {
    return undefined;
  }

  const value = payload.sortOrder;

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ApiRequestError(
      'ترتیب نمایش دسته‌بندی معتبر نیست',
      400,
      'INVALID_BLOG_CATEGORY_SORT_ORDER',
    );
  }

  return value;
}

function addOptionalFields(
  payload: Record<string, unknown>,
  target: CreateAdminBlogCategoryInput | UpdateAdminBlogCategoryInput,
) {
  for (const key of nullableTextFields) {
    const value = readOptionalNullableText(payload, key);

    if (value !== undefined) {
      target[key] = value;
    }
  }

  for (const key of booleanFields) {
    const value = readOptionalBoolean(payload, key);

    if (value !== undefined) {
      target[key] = value;
    }
  }

  const sortOrder = readOptionalSortOrder(payload);

  if (sortOrder !== undefined) {
    target.sortOrder = sortOrder;
  }
}

export async function readCreateAdminBlogCategoryInput(
  request: Request,
): Promise<CreateAdminBlogCategoryInput> {
  const payload = await readBodyObject(request);

  assertAllowedKeys(payload, createAllowedKeys);

  const input: CreateAdminBlogCategoryInput = {
    name: readRequiredText(payload, 'name'),
    slug: readRequiredText(payload, 'slug'),
  };

  addOptionalFields(payload, input);

  return input;
}

export async function readUpdateAdminBlogCategoryInput(
  request: Request,
): Promise<UpdateAdminBlogCategoryInput> {
  const payload = await readBodyObject(request);

  assertAllowedKeys(payload, updateAllowedKeys);

  if (Object.keys(payload).length === 0) {
    throw new ApiRequestError(
      'حداقل یکی از اطلاعات دسته‌بندی باید تغییر کند',
      400,
      'EMPTY_BLOG_CATEGORY_UPDATE',
    );
  }

  const input: UpdateAdminBlogCategoryInput = {};

  if (hasOwn(payload, 'name')) {
    input.name = readRequiredText(payload, 'name');
  }

  if (hasOwn(payload, 'slug')) {
    input.slug = readRequiredText(payload, 'slug');
  }

  addOptionalFields(payload, input);

  return input;
}
