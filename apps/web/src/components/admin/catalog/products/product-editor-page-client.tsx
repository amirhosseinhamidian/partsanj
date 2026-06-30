'use client';

import type {
  AdminBrand,
  AdminCategory,
  AdminProductDetail,
  CreateProductPayload,
  UpdateProductPayload,
} from '@/lib/admin/catalog/product.types';
import { adminBrandsApi } from '@/lib/api/admin-brands-client';
import { adminCategoriesApi } from '@/lib/api/admin-categories-client';
import { adminProductsApi } from '@/lib/api/admin-products-client';
import { ClientApiError } from '@/lib/api/web-client';
import { ArchiveProductDialog } from '@/components/admin/catalog/products/archive-product-dialog';
import { ProductEditorForm } from '@/components/admin/catalog/products/product-editor-form';
import { Button } from '@/components/ui/button';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ProductCompatibilitySection } from '@/components/admin/catalog/products/product-compatibility-section';

type ProductEditorPageClientProps = {
  productId?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت اطلاعات محصول با خطا مواجه شد';
}

export function ProductEditorPageClient({ productId }: ProductEditorPageClientProps) {
  const router = useRouter();
  const isEditing = Boolean(productId);

  const [product, setProduct] = useState<AdminProductDetail | null>(null);

  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const loadEditor = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const productRequest = productId
        ? adminProductsApi.getById(productId)
        : Promise.resolve(null);

      const [brandsResult, categoriesResult, productResult] = await Promise.all([
        adminBrandsApi.list(),
        adminCategoriesApi.list(),
        productRequest,
      ]);

      setBrands(brandsResult);
      setCategories(categoriesResult);
      setProduct(productResult?.data ?? null);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/admin/login');
        return;
      }

      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadEditor();
  }, [loadEditor]);

  async function handleSave(
    payload: CreateProductPayload | UpdateProductPayload,
  ): Promise<AdminProductDetail> {
    if (productId) {
      const result = await adminProductsApi.update(productId, payload as UpdateProductPayload);

      setProduct(result.data);

      return result.data;
    }

    const result = await adminProductsApi.create(payload as CreateProductPayload);

    setProduct(result.data);

    router.replace(`/admin/catalog/products/${result.data.id}`);

    return result.data;
  }

  async function handleArchive(currentProduct: AdminProductDetail) {
    const result = await adminProductsApi.archive(currentProduct.id);

    setProduct(result.data);
  }

  const title = isEditing ? (product?.name ?? 'ویرایش محصول') : 'افزودن محصول';

  const description = isEditing
    ? 'اطلاعات فنی، قیمت، وضعیت فروش و داده‌های کاتالوگ محصول را مدیریت کنید'
    : 'اطلاعات پایه محصول را ثبت کنید؛ سازگاری خودرو بعد از ایجاد محصول اضافه می‌شود';

  return (
    <div className='space-y-6'>
      <section className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-sm font-semibold text-brand'>مدیریت کاتالوگ</p>

          <h1 className='type-page-title mt-1 text-foreground'>{title}</h1>

          <p className='type-body mt-2 text-foreground-secondary'>{description}</p>
        </div>

        <Button
          type='button'
          variant='outline'
          iconStart={<ArrowRight />}
          onClick={() => router.push('/admin/catalog/products')}
        >
          بازگشت به محصولات
        </Button>
      </section>

      {isLoading ? (
        <div className='space-y-6'>
          <div className='h-52 animate-pulse rounded-card border border-border bg-surface-muted' />
          <div className='h-80 animate-pulse rounded-card border border-border bg-surface-muted' />
        </div>
      ) : null}

      {!isLoading && loadError ? (
        <div
          role='alert'
          className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between'
        >
          <p className='text-sm font-semibold text-danger'>{loadError}</p>

          <Button
            type='button'
            variant='outline'
            size='sm'
            iconStart={<RefreshCw />}
            onClick={() => void loadEditor()}
          >
            تلاش مجدد
          </Button>
        </div>
      ) : null}

      {!isLoading && !loadError && (!isEditing || product) ? (
        <ProductEditorForm
          mode={isEditing ? 'edit' : 'create'}
          product={product}
          brands={brands}
          categories={categories}
          onSubmit={handleSave}
          onRequestArchive={isEditing ? () => setArchiveDialogOpen(true) : undefined}
        />
      ) : null}

      {isEditing && product ? (
        <ProductCompatibilitySection
          productId={product.id}
          disabled={product.status === 'ARCHIVED'}
        />
      ) : null}

      <ArchiveProductDialog
        product={product}
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        onConfirm={handleArchive}
      />
    </div>
  );
}
