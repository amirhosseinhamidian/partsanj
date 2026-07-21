'use client';

import { Button } from '@/components/ui/button';
import type {
  VehicleImportEntity,
  VehicleImportPreview,
  VehicleImportRowError,
  VehicleQuickCreateReference,
} from '@/lib/admin/vehicles/vehicle-import.types';
import { AlertTriangle, CarFront, CheckCircle2, Route } from 'lucide-react';

type Props = {
  entity: VehicleImportEntity;
  preview: VehicleImportPreview;
  onQuickCreate: (reference: VehicleQuickCreateReference) => void;
};

function Status({ valid }: { valid: boolean }) {
  return valid ? (
    <span className='inline-flex items-center gap-1 text-xs font-bold text-success'>
      <CheckCircle2 className='size-4' /> معتبر
    </span>
  ) : (
    <span className='inline-flex items-center gap-1 text-xs font-bold text-danger'>
      <AlertTriangle className='size-4' /> نیازمند اصلاح
    </span>
  );
}

function Errors({
  errors,
  preview,
  onQuickCreate,
}: {
  errors: VehicleImportRowError[];
  preview: VehicleImportPreview;
  onQuickCreate: (reference: VehicleQuickCreateReference) => void;
}) {
  if (!errors.length) return <span className='text-xs text-foreground-muted'>بدون خطا</span>;

  return (
    <div className='min-w-64 space-y-2'>
      {errors.map((error, index) => {
        const missingMake = error.code === 'VEHICLE_MAKE_NOT_FOUND'
          ? preview.missingReferences.makes.find((item) => item.slug === error.value)
          : undefined;
        const missingModel = error.code === 'VEHICLE_MODEL_NOT_FOUND'
          ? preview.missingReferences.models.find((item) => item.slug === error.value)
          : undefined;

        return (
          <div key={`${error.code}-${index}`} className='rounded-control border border-danger/20 bg-danger-soft/60 p-2.5'>
            <p className='text-xs leading-5 text-danger'>{error.message}</p>
            {missingMake?.canCreate ? (
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='mt-2'
                iconStart={<CarFront className='size-3.5' />}
                onClick={() => onQuickCreate({
                  kind: 'make',
                  slug: missingMake.slug,
                  suggestedName: missingMake.suggestedNames[0] ?? missingMake.slug,
                })}
              >
                ساخت برند خودرو
              </Button>
            ) : null}
            {missingModel?.canCreate ? (
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='mt-2'
                iconStart={<Route className='size-3.5' />}
                onClick={() => onQuickCreate({
                  kind: 'model',
                  slug: missingModel.slug,
                  makeSlug: missingModel.makeSlug,
                  suggestedName: missingModel.suggestedNames[0] ?? missingModel.slug,
                })}
              >
                ساخت مدل خودرو
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function VehicleImportPreviewTable({ entity, preview, onQuickCreate }: Props) {
  const headers = [
    'ردیف',
    'نام',
    'Slug',
    ...(entity === 'models'
      ? ['برند']
      : entity === 'variants'
        ? ['مدل / برند']
        : []),
    'عملیات',
    'اعتبار',
    'خطاها',
  ];

  return (
    <div className='overflow-hidden rounded-card border border-border bg-surface'>
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse text-start'>
          <thead className='bg-surface-muted'>
            <tr className='border-b border-border'>
              {headers.map((label) => (
                  <th key={label} className='px-4 py-3 text-start text-xs font-extrabold text-foreground-secondary'>
                    {label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row) => {
              const makeSlug = 'makeSlug' in row ? row.makeSlug : null;
              const modelSlug = 'modelSlug' in row ? row.modelSlug : null;
              return (
                <tr key={`${row.rowNumber}-${row.slug}`} className='border-b border-border last:border-b-0'>
                  <td className='px-4 py-3 text-sm text-foreground-secondary'>{row.rowNumber}</td>
                  <td className='min-w-52 px-4 py-3 text-sm font-bold text-foreground'>{row.name}</td>
                  <td dir='ltr' className='min-w-44 px-4 py-3 text-left text-xs text-foreground-secondary'>{row.slug}</td>
                  {entity !== 'makes' ? (
                    <td className='min-w-44 px-4 py-3 text-xs text-foreground-secondary'>
                      {entity === 'models' ? makeSlug : `${modelSlug ?? '—'} / ${makeSlug ?? '—'}`}
                    </td>
                  ) : null}
                  <td className='px-4 py-3 text-xs font-bold text-foreground-secondary'>{row.action === 'CREATE' ? 'ایجاد' : row.action === 'UPDATE' ? 'به‌روزرسانی' : '—'}</td>
                  <td className='px-4 py-3'><Status valid={row.valid} /></td>
                  <td className='px-4 py-3'><Errors errors={row.errors} preview={preview} onQuickCreate={onQuickCreate} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
