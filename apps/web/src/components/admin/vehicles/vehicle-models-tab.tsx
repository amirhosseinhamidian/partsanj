'use client';

import type {
  AdminVehicleMakeListItem,
  AdminVehicleModelListItem,
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
import { Edit3, Layers3, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { VehicleModelFormSheet } from './vehicle-model-form-sheet';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';

const PAGE_SIZE = 20;

type VehicleModelStatusFilter = 'all' | 'active' | 'inactive';

type VehicleModelsTabProps = {
  models: AdminVehicleModelListItem[];
  makes: AdminVehicleMakeListItem[];
  loading: boolean;
  onDataChanged: () => Promise<void>;
};

export function VehicleModelsTab({ models, makes, loading, onDataChanged }: VehicleModelsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [makeIdFilter, setMakeIdFilter] = useState('');

  const [statusFilter, setStatusFilter] = useState<VehicleModelStatusFilter>('all');

  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [editingModel, setEditingModel] = useState<AdminVehicleModelListItem | null>(null);

  const makeOptions = useMemo(
    () =>
      makes.map((make) => ({
        value: make.id,
        label: make.name,
        description: [make.slug, make.isActive ? 'فعال' : 'غیرفعال'].filter(Boolean).join(' · '),
      })),
    [makes],
  );

  const filteredModels = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('fa-IR');

    return models.filter((model) => {
      const matchesSearch =
        !normalizedQuery ||
        model.name.toLocaleLowerCase('fa-IR').includes(normalizedQuery) ||
        model.slug
          .toLocaleLowerCase('en-US')
          .includes(normalizedQuery.toLocaleLowerCase('en-US')) ||
        model.make.name.toLocaleLowerCase('fa-IR').includes(normalizedQuery) ||
        model.make.slug
          .toLocaleLowerCase('en-US')
          .includes(normalizedQuery.toLocaleLowerCase('en-US'));

      const matchesMake = !makeIdFilter || model.makeId === makeIdFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && model.isActive) ||
        (statusFilter === 'inactive' && !model.isActive);

      return matchesSearch && matchesMake && matchesStatus;
    });
  }, [makeIdFilter, models, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredModels.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedModels = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredModels.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredModels]);

  const columns = useMemo<DataTableColumn<AdminVehicleModelListItem>[]>(
    () => [
      {
        key: 'name',
        header: 'مدل خودرو',
        minWidth: '240px',
        cell: (row) => (
          <div className='flex min-w-0 items-center gap-3'>
            <ImageUrlPreview
              src={row.imageUrl}
              alt={`تصویر ${row.name}`}
              emptyLabel=''
              className='size-12 shrink-0'
            />

            <div className='min-w-0'>
              <p className='truncate font-bold text-foreground'>{row.name}</p>

              <p dir='ltr' className='mt-1 truncate text-xs text-foreground-muted'>
                {row.slug}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'make',
        header: 'برند خودرو',
        minWidth: '180px',
        cell: (row) => (
          <div className='min-w-0'>
            <p className='truncate font-semibold text-foreground-secondary'>{row.make.name}</p>

            <p dir='ltr' className='mt-1 truncate text-xs text-foreground-muted'>
              {row.make.slug}
            </p>
          </div>
        ),
      },
      {
        key: 'variants',
        header: 'تعداد تیپ / موتور',
        minWidth: '155px',
        align: 'center',
        cell: (row) => (
          <span className='numeric font-bold text-foreground'>
            {row._count.variants.toLocaleString('fa-IR')}
          </span>
        ),
      },
      {
        key: 'sortOrder',
        header: 'ترتیب نمایش',
        minWidth: '135px',
        align: 'center',
        cell: (row) => (
          <span className='numeric text-sm text-foreground-secondary'>
            {row.sortOrder.toLocaleString('fa-IR')}
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

  const activeFilterCount = [searchQuery.trim(), makeIdFilter, statusFilter !== 'all'].filter(
    Boolean,
  ).length;

  function resetFilters() {
    setSearchQuery('');
    setMakeIdFilter('');
    setStatusFilter('all');
    setPage(1);
  }

  function openCreateSheet() {
    setEditingModel(null);
    setSheetOpen(true);
  }

  function openEditSheet(model: AdminVehicleModelListItem) {
    setEditingModel(model);
    setSheetOpen(true);
  }

  return (
    <>
      <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-5'>
        <div className='flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex gap-3'>
            <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
              <Layers3 className='size-5' />
            </span>

            <div>
              <h2 className='type-section-title text-foreground'>مدل‌های خودرو</h2>

              <p className='mt-1 text-sm leading-6 text-foreground-muted'>
                هر مدل به یک برند خودرو متصل است و پایه ثبت تیپ، موتور و بازه سال محسوب می‌شود
              </p>
            </div>
          </div>

          <Button type='button' iconStart={<Plus />} onClick={openCreateSheet}>
            افزودن مدل خودرو
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
                placeholder='جستجو در مدل، برند یا Slug'
              />
            </FilterBarSearch>

            <FilterBarFilters>
              <FilterBarField width='md'>
                <Combobox
                  value={makeIdFilter}
                  onValueChange={(value) => {
                    setMakeIdFilter(value);
                    setPage(1);
                  }}
                  options={makeOptions}
                  clearable
                  placeholder='همه برندهای خودرو'
                  searchPlaceholder='جستجو در برندها'
                  emptyMessage='برند خودرویی پیدا نشد'
                />
              </FilterBarField>

              <FilterBarField width='md'>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as VehicleModelStatusFilter);
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
              data={paginatedModels}
              columns={columns}
              getRowId={(row) => row.id}
              loading={loading}
              loadingRows={8}
              tableClassName='min-w-[940px]'
              emptyTitle='مدل خودرویی پیدا نشد'
              emptyDescription='فیلترها را تغییر دهید یا یک مدل خودرو ایجاد کنید'
              onRowClick={openEditSheet}
              rowActions={(row) => (
                <Tooltip content='ویرایش مدل خودرو'>
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
                totalItems: filteredModels.length,
                onPageChange: setPage,
              }}
            />
          </div>
        </div>
      </section>

      <VehicleModelFormSheet
        open={sheetOpen}
        model={editingModel}
        makes={makes}
        onOpenChange={setSheetOpen}
        onSaved={onDataChanged}
      />
    </>
  );
}
