'use client';

import { VehicleMakesTab } from '@/components/admin/vehicles/vehicle-makes-tab';
import { VehicleModelsTab } from '@/components/admin/vehicles/vehicle-models-tab';
import { VehicleVariantsTab } from '@/components/admin/vehicles/vehicle-variants-tab';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  AdminVehicleMakeListItem,
  AdminVehicleModelListItem,
  AdminVehicleVariantListItem,
} from '@/lib/admin/vehicles/vehicle-management.types';
import { adminVehiclesApi } from '@/lib/api/admin-vehicles-client';
import { ClientApiError } from '@/lib/api/web-client';
import { toPersianDigits } from '@/lib/utils/digits';
import { CarFront, FileUp, RefreshCw, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type VehicleManagementTab = 'makes' | 'models' | 'variants';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ClientApiError && (error.status === 401 || error.status === 403);
}

export function VehiclesManagementPageClient() {
  const router = useRouter();
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
      if (requestId !== latestRequestId.current) return;
      setMakes(makesResponse.data);
      setModels(modelsResponse.data);
      setVariants(variantsResponse.data);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        window.location.assign('/admin/login');
        return;
      }
      if (requestId !== latestRequestId.current) return;
      setLoadError(getErrorMessage(error, 'دریافت اطلاعات خودروها با خطا مواجه شد'));
    } finally {
      if (requestId === latestRequestId.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadVehicleData(); }, [loadVehicleData]);

  return (
    <div dir='rtl' className='space-y-6 text-right'>
      <PageHeader
        title='مدیریت خودروها'
        description='برند، مدل، تیپ، موتور و بازه سال خودروها را برای سازگاری دقیق قطعات مدیریت کنید'
        icon={<CarFront className='size-5 lg:size-8' />}
        actions={
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              iconStart={<FileUp className='size-4' />}
              onClick={() => router.push('/admin/vehicles/import')}
            >
              ورود گروهی خودروها
            </Button>
            <Button
              type='button'
              variant='outline'
              iconStart={<RefreshCw />}
              disabled={isLoading}
              onClick={() => void loadVehicleData()}
            >
              بروزرسانی داده‌ها
            </Button>
          </div>
        }
      />

      {loadError ? (
        <div role='alert' className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex gap-2 text-danger'>
            <TriangleAlert className='mt-0.5 size-5 shrink-0' />
            <p className='text-sm font-semibold'>{loadError}</p>
          </div>
          <Button type='button' size='sm' variant='outline' iconStart={<RefreshCw />} onClick={() => void loadVehicleData()}>
            تلاش مجدد
          </Button>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as VehicleManagementTab)}>
        <TabsList aria-label='بخش‌های مدیریت خودرو'>
          <TabsTrigger value='variants'>
            تیپ / موتور
            <span className='numeric text-xs text-foreground-muted'>{toPersianDigits(variants.length)}</span>
          </TabsTrigger>
          <TabsTrigger value='models'>
            مدل خودرو
            <span className='numeric text-xs text-foreground-muted'>{toPersianDigits(models.length)}</span>
          </TabsTrigger>
          <TabsTrigger value='makes'>
            برند خودرو
            <span className='numeric text-xs text-foreground-muted'>{toPersianDigits(makes.length)}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='makes' className='mt-5'>
          <VehicleMakesTab makes={makes} loading={isLoading} onDataChanged={loadVehicleData} />
        </TabsContent>
        <TabsContent value='models' className='mt-5'>
          <VehicleModelsTab models={models} makes={makes} loading={isLoading} onDataChanged={loadVehicleData} />
        </TabsContent>
        <TabsContent value='variants' className='mt-5'>
          <VehicleVariantsTab variants={variants} models={models} makes={makes} loading={isLoading} onDataChanged={loadVehicleData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
