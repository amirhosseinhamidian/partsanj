import { ProductEditorPageClient } from '@/components/admin/catalog/products/product-editor-page-client';

type ProductEditorPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductEditorPage({ params }: ProductEditorPageProps) {
  const { id } = await params;

  return <ProductEditorPageClient productId={id} />;
}
