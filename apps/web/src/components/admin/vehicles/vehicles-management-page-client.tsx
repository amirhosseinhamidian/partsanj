'use client';

import type {
  AdminVehicleMakeListItem,
  AdminVehicleModelListItem,
  AdminVehicleVariantListItem,
} from '@/lib/admin/vehicles/vehicle-management.types';
import { adminVehiclesApi } from '@/lib/api/admin-vehicles-client';
import { ClientApiError } from '@/lib/api/web-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CarFront, Layers3, RefreshCw, Route, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { VehicleMakesTab } from '@/components/admin/vehicles/vehicle-makes-tab';
import { VehicleModelsTab } from '@/components/admin/vehicles/vehicle-models-tab';
import { VehicleVariantsTab } from '@/components/admin/vehicles/vehicle-variants-tab';

type VehicleManagementTab = 'makes' | 'models' | 'variants';

type VehicleTabPlaceholderProps = {
  title: string;
  description: string;
  count: number;
  entityLabel: string;
  icon: ReactNode;
  loading: boolean;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ClientApiError && (error.status === 401 || error.status === 403);
}

function VehicleTabPlaceholder({
  title,
  description,
  count,
  entityLabel,
  icon,
  loading,
}: VehicleTabPlaceholderProps) {
  if (loading) {
    return (
      <div className='space-y-4 rounded-card border border-border bg-surface p-5 shadow-panel'>
        <div className='h-6 w-44 animate-pulse rounded bg-surface-muted' />
        <div className='h-4 w-80 max-w-full animate-pulse rounded bg-surface-muted' />
        <div className='h-40 animate-pulse rounded-control bg-surface-muted' />
      </div>
    );
  }

  return (
    <section className='rounded-card border border-border bg-surface p-5 shadow-panel'>
      <div className='flex items-start gap-3'>
        <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
          {icon}
        </span>

        <div>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='type-section-title text-foreground'>{title}</h2>

            <Badge size='sm' variant='brand'>
              {count.toLocaleString('fa-IR')} {entityLabel}
            </Badge>
          </div>

          <p className='mt-1 text-sm leading-6 text-foreground-muted'>{description}</p>
        </div>
      </div>

      <div className='mt-5 rounded-control border border-dashed border-border bg-surface-muted px-4 py-7 text-center'>
        <p className='font-bold text-foreground'>داده‌های این بخش با موفقیت بارگذاری شدند</p>

        <p className='mt-1 text-sm text-foreground-muted'>
          در گام بعد، جدول و فرم ایجاد و ویرایش این بخش اضافه می‌شود
        </p>
      </div>
    </section>
  );
}

export function VehiclesManagementPageClient() {
  const [activeTab, setActiveTab] = useState<VehicleManagementTab>('makes');

  const [makes, setMakes] = useState<AdminVehicleMakeListItem[]>([]);

  const [models, setModels] = useState<AdminVehicleModelListItem[]>([]);

  const [variants, setVariants] = useState<AdminVehicleVariantListItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const latestRequestId = useRef(0);

  const loadVehicleData = useCallback(async () => {
    const requestId = latestRequestId.current + 1;

    latestRequestId.current = requestId;

    setIsLoading(true);
    setLoadError(null);

    try {
      const [makesResponse, modelsResponse, variantsResponse] = await Promise.all([
        adminVehiclesApi.listMakes(),
        adminVehiclesApi.listModels(),
        adminVehiclesApi.listVariants(),
      ]);

      if (requestId !== latestRequestId.current) {
        return;
      }

      setMakes(makesResponse.data);
      setModels(modelsResponse.data);
      setVariants(variantsResponse.data);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        window.location.assign('/admin/login');
        return;
      }

      if (requestId !== latestRequestId.current) {
        return;
      }

      setLoadError(getErrorMessage(error, 'دریافت اطلاعات خودروها با خطا مواجه شد'));
    } finally {
      if (requestId === latestRequestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadVehicleData();
  }, [loadVehicleData]);

  return (
    <div dir='rtl' className='space-y-6 text-right'>
      <section className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-sm font-semibold text-brand'>مدیریت داده</p>

          <h1 className='type-page-title mt-1 text-foreground'>مدیریت خودروها</h1>

          <p className='type-body mt-2 text-foreground-secondary'>
            برند، مدل، تیپ، موتور و بازه سال خودروها را برای سازگاری دقیق قطعات مدیریت کنید
          </p>
        </div>

        <Button
          type='button'
          variant='outline'
          iconStart={<RefreshCw />}
          disabled={isLoading}
          onClick={() => void loadVehicleData()}
        >
          بروزرسانی داده‌ها
        </Button>
      </section>

      {loadError ? (
        <div
          role='alert'
          className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between'
        >
          <div className='flex gap-2 text-danger'>
            <TriangleAlert className='mt-0.5 size-5 shrink-0' />

            <p className='text-sm font-semibold'>{loadError}</p>
          </div>

          <Button
            type='button'
            size='sm'
            variant='outline'
            iconStart={<RefreshCw />}
            onClick={() => void loadVehicleData()}
          >
            تلاش مجدد
          </Button>
        </div>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as VehicleManagementTab)}
      >
        <TabsList aria-label='بخش‌های مدیریت خودرو'>
          <TabsTrigger value='variants'>
            تیپ / موتور
            <span className='numeric text-xs text-foreground-muted'>
              {variants.length.toLocaleString('fa-IR')}
            </span>
          </TabsTrigger>

          <TabsTrigger value='models'>
            مدل خودرو
            <span className='numeric text-xs text-foreground-muted'>
              {models.length.toLocaleString('fa-IR')}
            </span>
          </TabsTrigger>

          <TabsTrigger value='makes'>
            برند خودرو
            <span className='numeric text-xs text-foreground-muted'>
              {makes.length.toLocaleString('fa-IR')}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='makes' className='mt-5'>
          <VehicleMakesTab makes={makes} loading={isLoading} onDataChanged={loadVehicleData} />
        </TabsContent>

        <TabsContent value='models' className='mt-5'>
          <VehicleModelsTab
            models={models}
            makes={makes}
            loading={isLoading}
            onDataChanged={loadVehicleData}
          />
        </TabsContent>

        <TabsContent value='variants' className='mt-5'>
          <VehicleVariantsTab
            variants={variants}
            models={models}
            makes={makes}
            loading={isLoading}
            onDataChanged={loadVehicleData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
