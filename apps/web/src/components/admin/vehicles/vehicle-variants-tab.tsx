'use client';

import type {
  AdminVehicleMakeListItem,
  AdminVehicleModelListItem,
  AdminVehicleVariantListItem,
} from '@/lib/admin/vehicles/vehicle-management.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  FilterBar,
  FilterBarActions,
  FilterBarClearButton,
  FilterBarField,
  FilterBarFilters,
  FilterBarSearch,
} from '@/components/ui/filter-bar';
import { IconButton } from '@/components/ui/icon-button';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { Edit3, Plus, Route } from 'lucide-react';
import { useMemo, useState } from 'react';
import { VehicleVariantFormSheet } from './vehicle-variant-form-sheet';
import { toPersianDigits } from '@/lib/utils/digits';

const PAGE_SIZE = 20;

type VehicleVariantStatusFilter = 'all' | 'active' | 'inactive';

type VehicleVariantsTabProps = {
  variants: AdminVehicleVariantListItem[];
  models: AdminVehicleModelListItem[];
  makes: AdminVehicleMakeListItem[];
  loading: boolean;
  onDataChanged: () => Promise<void>;
};

function formatVehicleYears(variant: AdminVehicleVariantListItem): string {
  const calendarLabel = variant.yearCalendar === 'SHAMSI' ? 'شمسی' : 'میلادی';

  const yearFrom =
    variant.yearFrom !== null && variant.yearFrom !== undefined
      ? toPersianDigits(variant.yearFrom)
      : null;

  const yearTo =
    variant.yearTo !== null && variant.yearTo !== undefined
      ? toPersianDigits(variant.yearTo)
      : null;

  if (yearFrom && yearTo) {
    return `${yearFrom} تا ${yearTo} · ${calendarLabel}`;
  }

  if (yearFrom) {
    return `از ${yearFrom} · ${calendarLabel}`;
  }

  if (yearTo) {
    return `تا ${yearTo} · ${calendarLabel}`;
  }

  return 'بدون بازه سال';
}

function formatEngine(variant: AdminVehicleVariantListItem): string {
  const parts = [
    variant.engineName,
    variant.engineCode ? `کد: ${variant.engineCode}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : 'بدون اطلاعات موتور';
}

export function VehicleVariantsTab({
  variants,
  models,
  makes,
  loading,
  onDataChanged,
}: VehicleVariantsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [makeIdFilter, setMakeIdFilter] = useState('');
  const [modelIdFilter, setModelIdFilter] = useState('');

  const [statusFilter, setStatusFilter] = useState<VehicleVariantStatusFilter>('all');

  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [editingVariant, setEditingVariant] = useState<AdminVehicleVariantListItem | null>(null);

  const makeOptions = useMemo(
    () =>
      makes.map((make) => ({
        value: make.id,
        label: make.name,
        description: [make.slug, make.isActive ? 'فعال' : 'غیرفعال'].filter(Boolean).join(' · '),
      })),
    [makes],
  );

  const modelOptions = useMemo(
    () =>
      models
        .filter((model) => !makeIdFilter || model.makeId === makeIdFilter)
        .map((model) => ({
          value: model.id,
          label: model.name,
          description: [model.make.name, model.slug, model.isActive ? 'فعال' : 'غیرفعال']
            .filter(Boolean)
            .join(' · '),
        })),
    [makeIdFilter, models],
  );

  const filteredVariants = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('fa-IR');

    return variants.filter((variant) => {
      const searchTargets = [
        variant.name,
        variant.slug,
        variant.engineCode ?? '',
        variant.engineName ?? '',
        variant.model.name,
        variant.model.slug,
        variant.model.make.name,
        variant.model.make.slug,
      ];

      const matchesSearch =
        !normalizedQuery ||
        searchTargets.some((target) => target.toLocaleLowerCase('fa-IR').includes(normalizedQuery));

      const matchesMake = !makeIdFilter || variant.model.make.id === makeIdFilter;

      const matchesModel = !modelIdFilter || variant.modelId === modelIdFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && variant.isActive) ||
        (statusFilter === 'inactive' && !variant.isActive);

      return matchesSearch && matchesMake && matchesModel && matchesStatus;
    });
  }, [makeIdFilter, modelIdFilter, searchQuery, statusFilter, variants]);

  const totalPages = Math.max(1, Math.ceil(filteredVariants.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedVariants = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredVariants.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredVariants]);

  const columns = useMemo<DataTableColumn<AdminVehicleVariantListItem>[]>(
    () => [
      {
        key: 'name',
        header: 'تیپ / موتور',
        minWidth: '260px',
        cell: (row) => (
          <div className='min-w-0'>
            <p className='truncate font-bold text-foreground'>{row.name}</p>

            <p dir='ltr' className='mt-1 truncate text-xs text-foreground-muted'>
              {row.slug}
            </p>
          </div>
        ),
      },
      {
        key: 'vehicle',
        header: 'خودرو',
        minWidth: '200px',
        cell: (row) => (
          <div className='min-w-0'>
            <p className='truncate font-semibold text-foreground-secondary'>
              {row.model.make.name} · {row.model.name}
            </p>

            <p dir='ltr' className='mt-1 truncate text-xs text-foreground-muted'>
              {row.model.make.slug} / {row.model.slug}
            </p>
          </div>
        ),
      },
      {
        key: 'engine',
        header: 'موتور',
        minWidth: '190px',
        cell: (row) => (
          <span className='text-sm text-foreground-secondary'>{formatEngine(row)}</span>
        ),
      },
      {
        key: 'years',
        header: 'بازه سال',
        minWidth: '170px',
        align: 'center',
        cell: (row) => (
          <span className='text-sm text-foreground-secondary'>{formatVehicleYears(row)}</span>
        ),
      },
      {
        key: 'compatibilities',
        header: 'سازگاری محصول',
        minWidth: '145px',
        align: 'center',
        cell: (row) => (
          <Badge size='sm' variant={row._count.compatibilities > 0 ? 'brand' : 'neutral'}>
            {toPersianDigits(row._count.compatibilities)} مورد
          </Badge>
        ),
      },
      {
        key: 'sortOrder',
        header: 'ترتیب',
        minWidth: '100px',
        align: 'center',
        cell: (row) => (
          <span className='numeric text-sm text-foreground-secondary'>
            {toPersianDigits(row.sortOrder)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'وضعیت',
        minWidth: '120px',
        align: 'center',
        cell: (row) => (
          <Badge variant={row.isActive ? 'success' : 'neutral'} dot>
            {row.isActive ? 'فعال' : 'غیرفعال'}
          </Badge>
        ),
      },
    ],
    [],
  );

  const activeFilterCount = [
    searchQuery.trim(),
    makeIdFilter,
    modelIdFilter,
    statusFilter !== 'all',
  ].filter(Boolean).length;

  function resetFilters() {
    setSearchQuery('');
    setMakeIdFilter('');
    setModelIdFilter('');
    setStatusFilter('all');
    setPage(1);
  }

  function handleMakeFilterChange(makeId: string) {
    setMakeIdFilter(makeId);
    setModelIdFilter('');
    setPage(1);
  }

  function openCreateSheet() {
    setEditingVariant(null);
    setSheetOpen(true);
  }

  function openEditSheet(variant: AdminVehicleVariantListItem) {
    setEditingVariant(variant);
    setSheetOpen(true);
  }

  return (
    <>
      <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-5'>
        <div className='flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex gap-3'>
            <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
              <Route className='size-5' />
            </span>

            <div>
              <h2 className='type-section-title text-foreground'>تیپ، موتور و بازه سال</h2>

              <p className='mt-1 text-sm leading-6 text-foreground-muted'>
                دقیق‌ترین سطح کاتالوگ خودرو برای اتصال قطعات به خودروهای سازگار است
              </p>
            </div>
          </div>

          <Button type='button' iconStart={<Plus />} onClick={openCreateSheet}>
            افزودن تیپ / موتور
          </Button>
        </div>

        <div className='pt-5'>
          <FilterBar>
            <FilterBarSearch>
              <SearchInput
                value={searchQuery}
                onValueChange={(value) => {
                  setSearchQuery(value);
                  setPage(1);
                }}
                onSearch={(value) => {
                  setSearchQuery(value);
                  setPage(1);
                }}
                placeholder='جستجو در تیپ، موتور، مدل، برند یا Slug'
              />
            </FilterBarSearch>

            <FilterBarFilters>
              <FilterBarField width='md'>
                <Combobox
                  value={makeIdFilter}
                  onValueChange={handleMakeFilterChange}
                  options={makeOptions}
                  clearable
                  placeholder='همه برندهای خودرو'
                  searchPlaceholder='جستجو در برندها'
                  emptyMessage='برند خودرویی پیدا نشد'
                />
              </FilterBarField>

              <FilterBarField width='md'>
                <Combobox
                  value={modelIdFilter}
                  onValueChange={(value) => {
                    setModelIdFilter(value);
                    setPage(1);
                  }}
                  options={modelOptions}
                  clearable
                  disabled={modelOptions.length === 0}
                  placeholder='همه مدل‌های خودرو'
                  searchPlaceholder='جستجو در مدل‌ها'
                  emptyMessage='مدل خودرویی پیدا نشد'
                />
              </FilterBarField>

              <FilterBarField width='md'>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as VehicleVariantStatusFilter);
                    setPage(1);
                  }}
                  placeholder='همه وضعیت‌ها'
                  options={[
                    {
                      value: 'all',
                      label: 'همه وضعیت‌ها',
                    },
                    {
                      value: 'active',
                      label: 'فعال',
                    },
                    {
                      value: 'inactive',
                      label: 'غیرفعال',
                    },
                  ]}
                />
              </FilterBarField>
            </FilterBarFilters>

            <FilterBarActions>
              <FilterBarClearButton activeFilterCount={activeFilterCount} onClick={resetFilters} />
            </FilterBarActions>
          </FilterBar>

          <div className='mt-5'>
            <DataTable
              data={paginatedVariants}
              columns={columns}
              getRowId={(row) => row.id}
              loading={loading}
              loadingRows={8}
              tableClassName='min-w-[1380px]'
              emptyTitle='تیپ یا موتور خودرویی پیدا نشد'
              emptyDescription='فیلترها را تغییر دهید یا یک تیپ / موتور جدید ثبت کنید'
              onRowClick={openEditSheet}
              rowActions={(row) => (
                <Tooltip content='ویرایش تیپ / موتور خودرو'>
                  <span className='inline-flex'>
                    <IconButton
                      type='button'
                      aria-label={`ویرایش ${row.name}`}
                      icon={<Edit3 />}
                      variant='ghost'
                      size='sm'
                      onClick={() => openEditSheet(row)}
                    />
                  </span>
                </Tooltip>
              )}
              pagination={{
                page: currentPage,
                pageSize: PAGE_SIZE,
                totalItems: filteredVariants.length,
                onPageChange: setPage,
              }}
            />
          </div>
        </div>
      </section>

      <VehicleVariantFormSheet
        open={sheetOpen}
        variant={editingVariant}
        models={models}
        makes={makes}
        onOpenChange={setSheetOpen}
        onSaved={onDataChanged}
      />
    </>
  );
}
