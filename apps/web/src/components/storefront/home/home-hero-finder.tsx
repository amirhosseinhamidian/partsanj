'use client';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select, type SelectOption } from '@/components/ui/select';
import {
  getStorefrontVehicleMakes,
  getStorefrontVehicleModelsByMakeSlug,
  getStorefrontVehicleVariantsByModelSlug,
  StorefrontVehicleApiError,
} from '@/lib/storefront/vehicles/vehicle.client';
import { saveStorefrontVehicleSelection } from '@/lib/storefront/vehicles/vehicle-selection-storage';
import type {
  StorefrontVehicleMake,
  StorefrontVehicleModel,
  StorefrontVehicleVariant,
} from '@/lib/storefront/vehicles/vehicle.types';
import { toPersianDigits } from '@/lib/utils/digits';
import { Barcode, CircleAlert, Search, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

function getErrorMessage(error: unknown): string {
  if (error instanceof StorefrontVehicleApiError) {
    return error.message;
  }

  return 'دریافت اطلاعات خودرو با خطا مواجه شد';
}

function toMakeOptions(makes: StorefrontVehicleMake[]): SelectOption[] {
  return makes.map((make) => ({
    value: make.slug,
    label: make.name,
  }));
}

function toModelOptions(models: StorefrontVehicleModel[]): SelectOption[] {
  return models.map((model) => ({
    value: model.slug,
    label: model.name,
  }));
}

function formatYearRange(variant: StorefrontVehicleVariant): string | null {
  if (!variant.yearFrom && !variant.yearTo) {
    return null;
  }

  if (variant.yearFrom && variant.yearTo) {
    return `${toPersianDigits(String(variant.yearFrom))} تا ${toPersianDigits(String(variant.yearTo))}`;
  }

  if (variant.yearFrom) {
    return `از ${toPersianDigits(String(variant.yearFrom))}`;
  }

  return `تا ${toPersianDigits(String(variant.yearTo))}`;
}

function getVariantOptionLabel(variant: StorefrontVehicleVariant): string {
  const engine = [variant.engineName, variant.engineCode].filter(Boolean).join(' / ');

  const yearRange = formatYearRange(variant);

  return [variant.name, engine, yearRange].filter(Boolean).join(' — ');
}

function toVariantOptions(variants: StorefrontVehicleVariant[]): SelectOption[] {
  return variants.map((variant) => ({
    value: variant.id,
    label: getVariantOptionLabel(variant),
  }));
}

function findMakeBySlug(makes: StorefrontVehicleMake[], makeSlug: string) {
  return makes.find((make) => make.slug === makeSlug) ?? null;
}

function findModelBySlug(models: StorefrontVehicleModel[], modelSlug: string) {
  return models.find((model) => model.slug === modelSlug) ?? null;
}

export function HomeHeroFinder() {
  const router = useRouter();

  const [makes, setMakes] = useState<StorefrontVehicleMake[]>([]);
  const [models, setModels] = useState<StorefrontVehicleModel[]>([]);
  const [variants, setVariants] = useState<StorefrontVehicleVariant[]>([]);

  const [makeSlug, setMakeSlug] = useState('');
  const [modelSlug, setModelSlug] = useState('');
  const [variantId, setVariantId] = useState('');
  const [query, setQuery] = useState('');

  const [isMakesLoading, setIsMakesLoading] = useState(true);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [isVariantsLoading, setIsVariantsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMakes() {
      setIsMakesLoading(true);
      setError(null);

      try {
        const result = await getStorefrontVehicleMakes(controller.signal);

        setMakes(result.data);
      } catch (caughtError) {
        if (caughtError instanceof Error && caughtError.name === 'AbortError') {
          return;
        }

        setError(getErrorMessage(caughtError));
      } finally {
        setIsMakesLoading(false);
      }
    }

    void loadMakes();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!makeSlug) {
      setModels([]);
      setVariants([]);
      return;
    }

    const controller = new AbortController();

    async function loadModels() {
      setIsModelsLoading(true);
      setError(null);

      try {
        const result = await getStorefrontVehicleModelsByMakeSlug(makeSlug, controller.signal);

        setModels(result.data.models);
      } catch (caughtError) {
        if (caughtError instanceof Error && caughtError.name === 'AbortError') {
          return;
        }

        setError(getErrorMessage(caughtError));
      } finally {
        setIsModelsLoading(false);
      }
    }

    void loadModels();

    return () => {
      controller.abort();
    };
  }, [makeSlug]);

  useEffect(() => {
    if (!modelSlug) {
      setVariants([]);
      return;
    }

    const controller = new AbortController();

    async function loadVariants() {
      setIsVariantsLoading(true);
      setError(null);

      try {
        const result = await getStorefrontVehicleVariantsByModelSlug(modelSlug, controller.signal);

        setVariants(result.data.variants);
      } catch (caughtError) {
        if (caughtError instanceof Error && caughtError.name === 'AbortError') {
          return;
        }

        setError(getErrorMessage(caughtError));
      } finally {
        setIsVariantsLoading(false);
      }
    }

    void loadVariants();

    return () => {
      controller.abort();
    };
  }, [modelSlug]);

  const makeOptions = useMemo(() => toMakeOptions(makes), [makes]);

  const modelOptions = useMemo(() => toModelOptions(models), [models]);

  const variantOptions = useMemo(() => toVariantOptions(variants), [variants]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (!normalizedQuery && !variantId) {
      setSubmitError('برای جستجو، نام قطعه را وارد کنید یا تیپ و موتور خودرو را انتخاب کنید');
      return;
    }

    setSubmitError(null);

    if (variantId && makeSlug && modelSlug) {
      saveStorefrontVehicleSelection({
        makeSlug,
        modelSlug,
        variantId,
      });
    }

    const params = new URLSearchParams();

    if (normalizedQuery) {
      params.set('q', normalizedQuery);
    }

    if (variantId) {
      params.set('vehicleVariantId', variantId);

      if (makeSlug) {
        params.set('vehicleMake', makeSlug);
      }

      if (modelSlug) {
        params.set('vehicleModel', modelSlug);
      }
    }

    const queryString = params.toString();

    router.push(queryString ? `/products?${queryString}` : '/products');
  }

  const selectedMake = findMakeBySlug(makes, makeSlug);
  const selectedModel = findModelBySlug(models, modelSlug);

  return (
    <section
      aria-label='یافتن قطعه سازگار با خودرو'
      className='rounded-[24px] border border-border bg-surface/95 p-3 shadow-[0_18px_42px_rgba(10,27,48,0.14)] backdrop-blur-xl sm:p-4 dark:border-white/15 dark:bg-[#0a1a2c]/90 dark:shadow-[0_22px_46px_rgba(0,0,0,0.35)]'
    >
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3 px-1'>
        <div>
          <h2 className='text-base font-extrabold text-foreground'>
            قطعه مناسب خودروی خودت را پیدا کن
          </h2>

          <p className='mt-1 text-xs leading-5 text-foreground-muted'>
            خودرو را انتخاب کن و نام قطعه یا کد فنی را وارد کن تا فقط قطعات سازگار نمایش داده شوند
          </p>
        </div>

        <span className='inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand'>
          <ShieldCheck className='size-3.5' />
          بررسی سازگاری
        </span>
      </div>

      {error ? (
        <div
          role='alert'
          className='mb-4 flex items-start gap-2 rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger'
        >
          <CircleAlert className='mt-0.5 size-4 shrink-0' />
          {error}
        </div>
      ) : null}

      {submitError ? (
        <div
          role='alert'
          className='mb-4 flex items-start gap-2 rounded-control border border-warning/30 bg-warning-soft px-3 py-2 text-xs font-semibold text-warning'
        >
          <CircleAlert className='mt-0.5 size-4 shrink-0' />
          {submitError}
        </div>
      ) : null}

      <form
        dir='rtl'
        onSubmit={handleSubmit}
        className='grid gap-3 lg:grid-cols-[1fr_1fr_1.15fr_1.45fr_auto]'
      >
        <FormField label='برند خودرو'>
          {({ id, labelId, describedBy, invalid }) => (
            <Select
              id={id}
              aria-labelledby={labelId}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={makeSlug}
              disabled={isMakesLoading}
              onValueChange={(value) => {
                setMakeSlug(value);
                setModelSlug('');
                setVariantId('');
                setModels([]);
                setVariants([]);
                setSubmitError(null);
              }}
              options={makeOptions}
              placeholder={isMakesLoading ? 'در حال دریافت برندها' : 'انتخاب برند'}
            />
          )}
        </FormField>

        <FormField label='مدل خودرو'>
          {({ id, labelId, describedBy, invalid }) => (
            <Select
              id={id}
              aria-labelledby={labelId}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={modelSlug}
              disabled={isModelsLoading || !makeSlug}
              onValueChange={(value) => {
                setModelSlug(value);
                setVariantId('');
                setVariants([]);
                setSubmitError(null);
              }}
              options={modelOptions}
              placeholder={
                isModelsLoading
                  ? 'در حال دریافت مدل‌ها'
                  : selectedMake
                    ? `مدل ${selectedMake.name}`
                    : 'اول برند را انتخاب کنید'
              }
            />
          )}
        </FormField>

        <FormField label='تیپ و موتور'>
          {({ id, labelId, describedBy, invalid }) => (
            <Select
              id={id}
              aria-labelledby={labelId}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={variantId}
              disabled={isVariantsLoading || !modelSlug}
              onValueChange={(value) => {
                setVariantId(value);
                setSubmitError(null);
              }}
              options={variantOptions}
              placeholder={
                isVariantsLoading
                  ? 'در حال دریافت تیپ‌ها'
                  : selectedModel
                    ? `تیپ و موتور ${selectedModel.name}`
                    : 'اول مدل را انتخاب کنید'
              }
            />
          )}
        </FormField>

        <FormField id='home-hero-part-search' label='نام قطعه یا کد فنی'>
          {({ id, labelId, describedBy, invalid }) => (
            <Input
              id={id}
              type='search'
              dir='rtl'
              value={query}
              aria-labelledby={labelId}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              placeholder='مثلاً سنسور اکسیژن یا OEM'
              onChange={(event) => {
                setQuery(event.target.value);
                setSubmitError(null);
              }}
            />
          )}
        </FormField>

        <Button
          type='submit'
          iconStart={<Search className='size-4' />}
          className='min-h-10 whitespace-nowrap shadow-[0_10px_22px_rgba(255,91,31,0.26)] lg:mt-[27px]'
        >
          پیدا کردن قطعه سازگار
        </Button>
      </form>

      <p className='mt-3 flex items-center justify-center gap-1.5 text-xs text-foreground-muted'>
        <Barcode className='size-3.5 text-brand' />
        می‌توانید فقط نام قطعه یا کد فنی را هم جستجو کنید
      </p>
    </section>
  );
}
