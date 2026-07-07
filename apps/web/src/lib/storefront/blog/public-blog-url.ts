export type PublicBlogListingUrlParams = {
  page?: number;
  q?: string | null;
};

function normalizeQuery(value?: string | null) {
  const normalized = value?.trim();

  return normalized || undefined;
}

function createUrl(pathname: string, params: PublicBlogListingUrlParams = {}) {
  const searchParams = new URLSearchParams();

  const query = normalizeQuery(params.q);

  if (query) {
    searchParams.set('q', query);
  }

  if (params.page && params.page > 1) {
    searchParams.set('page', String(params.page));
  }

  const queryString = searchParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function createPublicBlogIndexHref(params: PublicBlogListingUrlParams = {}) {
  return createUrl('/blog', params);
}

export function createPublicBlogCategoryHref(
  slug: string,
  params: PublicBlogListingUrlParams = {},
) {
  return createUrl(`/blog/category/${encodeURIComponent(slug.trim())}`, params);
}
