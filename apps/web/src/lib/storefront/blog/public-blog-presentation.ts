export function formatPublicBlogDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function shouldShowPublicBlogUpdatedAt(publishedAt: string, updatedAt: string) {
  const publishedDate = new Date(publishedAt);
  const updatedDate = new Date(updatedAt);

  if (Number.isNaN(publishedDate.getTime()) || Number.isNaN(updatedDate.getTime())) {
    return false;
  }

  return updatedDate.getTime() - publishedDate.getTime() > 60_000;
}
