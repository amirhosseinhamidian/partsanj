import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminVehiclesPage() {
  return (
    <section className='space-y-6'>
      <div>
        <h2 className='type-page-title text-foreground'>خودروها و سازگاری قطعات</h2>

        <p className='type-body mt-2 text-foreground-secondary'>
          مدیریت برند ، مدل ، تیپ خودرو و سازگاری قطعات از این بخش انجام می‌شود
        </p>
      </div>

      <Card variant='elevated'>
        <CardHeader>
          <CardTitle>Vehicle Compatibility</CardTitle>

          <CardDescription>
            هسته سازگاری خودرو آماده است و رابط مدیریت آن در گام بعدی ساخته می‌شود
          </CardDescription>
        </CardHeader>

        <CardContent className='mt-5 text-sm text-foreground-muted'>
          این بخش بعداً به APIهای عمومی و مدیریتی خودرو متصل خواهد شد
        </CardContent>
      </Card>
    </section>
  );
}
