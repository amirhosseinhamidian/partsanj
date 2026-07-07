import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogPostStatus, Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { PublicBlogCategorySlugParamDto } from './dto/public-blog-category-slug-param.dto.js';
import { PublicBlogPostListQueryDto } from './dto/public-blog-post-list-query.dto.js';
import { PublicBlogPostSlugParamDto } from './dto/public-blog-post-slug-param.dto.js';

const publicBlogPostListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,

  coverImageUrl: true,
  coverImageAlt: true,

  publishedAt: true,
  createdAt: true,
  updatedAt: true,

  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },

  authorUser: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.BlogPostSelect;

const publicBlogPostDetailSelect = {
  ...publicBlogPostListSelect,

  content: true,

  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  noIndex: true,

  openGraphTitle: true,
  openGraphDescription: true,
  openGraphImageUrl: true,
  openGraphImageAlt: true,
} satisfies Prisma.BlogPostSelect;

function createPublishedPostWhere(now: Date): Prisma.BlogPostWhereInput {
  return {
    status: BlogPostStatus.PUBLISHED,
    publishedAt: {
      lte: now,
    },
  };
}

function createPublicPostWhere(now: Date, categorySlug?: string): Prisma.BlogPostWhereInput {
  return {
    ...createPublishedPostWhere(now),

    category: {
      is: {
        isActive: true,

        ...(categorySlug
          ? {
              slug: categorySlug,
            }
          : {}),
      },
    },
  };
}

function createPublicBlogCategoryListSelect(now: Date) {
  return {
    id: true,
    name: true,
    slug: true,
    description: true,
    sortOrder: true,

    _count: {
      select: {
        posts: {
          where: createPublishedPostWhere(now),
        },
      },
    },
  } satisfies Prisma.BlogCategorySelect;
}

function createPublicBlogCategoryDetailSelect(now: Date) {
  return {
    id: true,
    name: true,
    slug: true,
    description: true,
    sortOrder: true,

    seoTitle: true,
    seoDescription: true,
    canonicalUrl: true,
    noIndex: true,

    openGraphTitle: true,
    openGraphDescription: true,
    openGraphImageUrl: true,
    openGraphImageAlt: true,

    _count: {
      select: {
        posts: {
          where: createPublishedPostWhere(now),
        },
      },
    },
  } satisfies Prisma.BlogCategorySelect;
}

function getPublicAuthorName(author: { firstName: string | null; lastName: string | null }) {
  const name = [author.firstName, author.lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim();

  return name || 'پارت‌سنج';
}

@Injectable()
export class BlogPublicService {
  constructor(private readonly prisma: PrismaService) {}

  async findCategories() {
    const now = new Date();

    const categories = await this.prisma.blogCategory.findMany({
      where: {
        isActive: true,

        posts: {
          some: createPublishedPostWhere(now),
        },
      },

      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],

      select: createPublicBlogCategoryListSelect(now),
    });

    return {
      data: categories.map(({ _count, ...category }) => ({
        ...category,
        postsCount: _count.posts,
      })),
    };
  }

  async findCategory(params: PublicBlogCategorySlugParamDto) {
    const now = new Date();

    const category = await this.prisma.blogCategory.findFirst({
      where: {
        slug: params.slug,
        isActive: true,

        posts: {
          some: createPublishedPostWhere(now),
        },
      },

      select: createPublicBlogCategoryDetailSelect(now),
    });

    if (!category) {
      throw new NotFoundException('دسته‌بندی بلاگ پیدا نشد');
    }

    const { _count, ...categoryData } = category;

    return {
      data: {
        ...categoryData,
        postsCount: _count.posts,
      },
    };
  }

  async findPosts(query: PublicBlogPostListQueryDto) {
    const now = new Date();

    const where = createPublicPostWhere(now, query.categorySlug);

    if (query.q) {
      where.OR = [
        {
          title: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
        {
          excerpt: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: query.limit,

        orderBy: [
          {
            publishedAt: 'desc',
          },
          {
            updatedAt: 'desc',
          },
        ],

        select: publicBlogPostListSelect,
      }),

      this.prisma.blogPost.count({
        where,
      }),
    ]);

    return {
      data: posts.map(({ authorUser, ...post }) => ({
        ...post,

        author: {
          name: getPublicAuthorName(authorUser),
        },
      })),

      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findPost(params: PublicBlogPostSlugParamDto) {
    const now = new Date();

    const post = await this.prisma.blogPost.findFirst({
      where: {
        slug: params.slug,
        ...createPublicPostWhere(now),
      },

      select: publicBlogPostDetailSelect,
    });

    if (!post) {
      throw new NotFoundException('مقاله بلاگ پیدا نشد');
    }

    const { authorUser, ...postData } = post;

    return {
      data: {
        ...postData,

        author: {
          name: getPublicAuthorName(authorUser),
        },
      },
    };
  }
}
