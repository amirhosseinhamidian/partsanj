'use client';

import type { AdminVehicleMakeListItem } from '@/lib/admin/vehicles/vehicle-management.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { CarFront, Edit3, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { VehicleMakeFormSheet } from './vehicle-make-form-sheet';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';

const PAGE_SIZE = 20;

type VehicleMakeStatusFilter = 'all' | 'active' | 'inactive';

type VehicleMakesTabProps = {
  makes: AdminVehicleMakeListItem[];
  loading: boolean;
  onDataChanged: () => Promise<void>;
};

export function VehicleMakesTab({ makes, loading, onDataChanged }: VehicleMakesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState<VehicleMakeStatusFilter>('all');

  const [page, setPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);

  const [editingMake, setEditingMake] = useState<AdminVehicleMakeListItem | null>(null);

  const filteredMakes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('fa-IR');

    return makes.filter((make) => {
      const matchesSearch =
        !normalizedQuery ||
        make.name.toLocaleLowerCase('fa-IR').includes(normalizedQuery) ||
        make.slug.toLocaleLowerCase('en-US').includes(normalizedQuery.toLocaleLowerCase('en-US'));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && make.isActive) ||
        (statusFilter === 'inactive' && !make.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [makes, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMakes.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedMakes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredMakes.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredMakes]);

  const columns = useMemo<DataTableColumn<AdminVehicleMakeListItem>[]>(
    () => [
      {
        key: 'name',
        header: 'برند خودرو',
        minWidth: '260px',
        cell: (row) => (
          <div className='flex min-w-0 items-center gap-3'>
            <ImageUrlPreview
              src={row.logoUrl}
              alt={`لوگوی ${row.name}`}
              emptyLabel=''
              className='size-10 shrink-0'
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
        key: 'models',
        header: 'تعداد مدل',
        minWidth: '130px',
        align: 'center',
        cell: (row) => (
          <span className='numeric font-bold text-foreground'>
            {row._count.models.toLocaleString('fa-IR')}
          </span>
        ),
      },
      {
        key: 'sortOrder',
        header: 'ترتیب نمایش',
        minWidth: '145px',
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

  const activeFilterCount = [searchQuery.trim(), statusFilter !== 'all'].filter(Boolean).length;

  function resetFilters() {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
  }

  function openCreateSheet() {
    setEditingMake(null);
    setSheetOpen(true);
  }

  function openEditSheet(make: AdminVehicleMakeListItem) {
    setEditingMake(make);
    setSheetOpen(true);
  }

  return (
    <>
      <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-5'>
        <div className='flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex gap-3'>
            <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
              <CarFront className='size-5' />
            </span>

            <div>
              <h2 className='type-section-title text-foreground'>برندهای خودرو</h2>

              <p className='mt-1 text-sm leading-6 text-foreground-muted'>
                برندهای مرجع خودرو را برای ساخت مدل و تیپ‌های وابسته مدیریت کنید
              </p>
            </div>
          </div>

          <Button type='button' iconStart={<Plus />} onClick={openCreateSheet}>
            افزودن برند خودرو
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
                placeholder='جستجو در نام یا Slug برند'
              />
            </FilterBarSearch>

            <FilterBarFilters>
              <FilterBarField width='md'>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as VehicleMakeStatusFilter);
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
              data={paginatedMakes}
              columns={columns}
              getRowId={(row) => row.id}
              loading={loading}
              loadingRows={8}
              tableClassName='min-w-[760px]'
              emptyTitle='برند خودرویی پیدا نشد'
              emptyDescription='فیلترها را تغییر دهید یا یک برند خودرو ایجاد کنید'
              onRowClick={openEditSheet}
              rowActions={(row) => (
                <Tooltip content='ویرایش برند خودرو'>
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
                totalItems: filteredMakes.length,
                onPageChange: setPage,
              }}
            />
          </div>
        </div>
      </section>

      <VehicleMakeFormSheet
        open={sheetOpen}
        make={editingMake}
        onOpenChange={setSheetOpen}
        onSaved={onDataChanged}
      />
    </>
  );
}
