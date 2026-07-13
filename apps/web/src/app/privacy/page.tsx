import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Cookie,
  CreditCard,
  Database,
  Eye,
  FileText,
  Fingerprint,
  Headphones,
  LockKeyhole,
  ServerCog,
  Share2,
  ShieldCheck,
  Trash2,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

type PrivacyNavigationItem = {
  id: string;
  title: string;
};

type PrivacySectionProps = {
  id: string;
  number: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
};

const LAST_UPDATED_AT = '۲۲ تیر ۱۴۰۵';

const PRIVACY_NAVIGATION: PrivacyNavigationItem[] = [
  { id: 'scope', title: 'دامنه این سیاست' },
  { id: 'collected-data', title: 'اطلاعاتی که جمع‌آوری می‌شود' },
  { id: 'collection-method', title: 'نحوه جمع‌آوری اطلاعات' },
  { id: 'usage', title: 'نحوه استفاده از اطلاعات' },
  { id: 'payment', title: 'اطلاعات پرداخت' },
  { id: 'cookies', title: 'کوکی‌ها و ذخیره‌سازی محلی' },
  { id: 'technical-data', title: 'اطلاعات فنی و گزارش‌ها' },
  { id: 'sharing', title: 'اشتراک‌گذاری با اشخاص ثالث' },
  { id: 'retention', title: 'مدت نگهداری اطلاعات' },
  { id: 'user-rights', title: 'حقوق و درخواست‌های کاربر' },
  { id: 'communications', title: 'پیام‌ها و اطلاع‌رسانی' },
  { id: 'security', title: 'امنیت اطلاعات' },
  { id: 'children', title: 'کاربران زیر سن قانونی' },
  { id: 'changes-contact', title: 'تغییرات و تماس با ما' },
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStorefrontSiteSettings();

  return {
    title: `حریم خصوصی | ${settings.siteName}`,
    description: `نحوه جمع‌آوری، استفاده، نگهداری و حفاظت از اطلاعات کاربران در فروشگاه اینترنتی ${settings.siteName}.`,
  };
}

export default async function PrivacyPage() {
  const settings = await getStorefrontSiteSettings();

  return (
    <main className='relative bg-background'>
      <PrivacyBackground />

      <div className='relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16'>
        <PrivacyHero siteName={settings.siteName} />

        <div className='mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start'>
          <PrivacyNavigation />

          <article className='min-w-0 space-y-5'>
            <PrivacySummary siteName={settings.siteName} />

            <PrivacySection
              id='scope'
              number='۱'
              title='دامنه این سیاست و پذیرش آن'
              icon={FileText}
            >
              <p>
                این سیاست توضیح می‌دهد که فروشگاه اینترنتی
                {` ${settings.siteName} `}هنگام استفاده کاربران از وب‌سایت، ایجاد حساب، انتخاب
                خودرو، ثبت نشانی، خرید کالا، پرداخت و دریافت خدمات پشتیبانی چه اطلاعاتی را دریافت
                می‌کند و این اطلاعات چگونه استفاده، نگهداری و محافظت می‌شوند.
              </p>

              <p>
                استفاده از خدمات سایت به معنای آگاهی از مفاد این سیاست است. پردازش اطلاعات کاربران
                فقط در حدود نیازهای عملیاتی فروشگاه، ارائه خدمات، اجرای سفارش، امنیت سامانه و
                الزامات قانونی انجام می‌شود.
              </p>

              <NoticeBox>
                این صفحه بخشی از قوانین استفاده از سایت است و باید همراه با
                <Link href='/terms' className='mx-1 font-extrabold text-brand hover:underline'>
                  قوانین و شرایط استفاده
                </Link>
                و
                <Link href='/returns' className='mx-1 font-extrabold text-brand hover:underline'>
                  شرایط بازگشت کالا
                </Link>
                مطالعه شود.
              </NoticeBox>
            </PrivacySection>

            <PrivacySection
              id='collected-data'
              number='۲'
              title='اطلاعاتی که ممکن است جمع‌آوری شود'
              icon={Database}
            >
              <p>
                نوع اطلاعات دریافتی به نحوه استفاده کاربر از سایت بستگی دارد و ممکن است شامل موارد
                زیر باشد:
              </p>

              <ul>
                <li>
                  اطلاعات حساب کاربری مانند نام، نام خانوادگی، شماره همراه و وضعیت تأیید شماره تلفن.
                </li>
                <li>
                  اطلاعات تحویل سفارش مانند استان، شهر، نشانی، کدپستی، نام تحویل‌گیرنده و شماره
                  تماس.
                </li>
                <li>
                  اطلاعات خودروهای ذخیره‌شده یا انتخاب‌شده مانند برند، مدل، تیپ، سال ساخت یا سایر
                  مشخصاتی که کاربر وارد می‌کند.
                </li>
                <li>
                  اطلاعات سبد خرید، سفارش‌ها، اقلام خریداری‌شده، مبلغ، روش ارسال، وضعیت پرداخت، کد
                  رهگیری و سوابق مرجوعی یا پشتیبانی.
                </li>
                <li>
                  پیام‌ها، تصاویر یا مدارکی که کاربر برای بررسی سازگاری قطعه، مغایرت، آسیب حمل،
                  ایراد فنی یا پیگیری سفارش ارسال می‌کند.
                </li>
                <li>
                  اطلاعات فنی مانند نشانی IP، نوع مرورگر، نوع دستگاه، سیستم‌عامل، زمان درخواست‌ها و
                  گزارش خطاهای فنی یا امنیتی.
                </li>
              </ul>

              <p>
                فروشگاه از کاربران درخواست نمی‌کند اطلاعات حساس و غیرضروری مانند دیدگاه‌های عقیدتی،
                مذهبی، وضعیت پزشکی یا سایر داده‌های نامرتبط با خرید قطعات خودرو را در سایت ثبت کنند.
              </p>
            </PrivacySection>

            <PrivacySection
              id='collection-method'
              number='۳'
              title='اطلاعات چگونه دریافت می‌شود؟'
              icon={Fingerprint}
            >
              <ul>
                <li>
                  اطلاعاتی که کاربر هنگام ایجاد حساب، ثبت نشانی، انتخاب خودرو، تکمیل سفارش یا ارتباط
                  با پشتیبانی مستقیماً وارد می‌کند.
                </li>
                <li>
                  اطلاعاتی که هنگام استفاده از سایت به‌صورت فنی تولید می‌شود؛ مانند نشست ورود،
                  تنظیمات مرورگر، رخدادهای امنیتی و گزارش خطا.
                </li>
                <li>
                  اطلاعاتی که درگاه پرداخت، شرکت حمل، سرویس پیامک یا سایر ارائه‌دهندگان ضروری خدمات
                  درباره وضعیت انجام یک عملیات به فروشگاه اعلام می‌کنند.
                </li>
                <li>
                  اطلاعاتی که کاربر با رضایت خود از طریق فرم‌ها، تماس تلفنی، پیام‌رسان‌ها یا سایر
                  کانال‌های رسمی فروشگاه ارائه می‌دهد.
                </li>
              </ul>
            </PrivacySection>

            <PrivacySection
              id='usage'
              number='۴'
              title='اطلاعات برای چه اهدافی استفاده می‌شود؟'
              icon={Eye}
            >
              <ul>
                <li>ایجاد و مدیریت حساب کاربری و تأیید هویت از طریق شماره همراه.</li>
                <li>نمایش محصولات متناسب‌تر با خودروی انتخاب‌شده توسط کاربر.</li>
                <li>تشکیل سبد خرید، ثبت سفارش و رزرو موجودی کالا.</li>
                <li>پردازش پرداخت و بررسی نتیجه تراکنش.</li>
                <li>بسته‌بندی، ارسال، تحویل و پیگیری مرسوله.</li>
                <li>رسیدگی به لغو، مرجوعی، مغایرت، گارانتی و درخواست پشتیبانی.</li>
                <li>پیشگیری از تقلب، سوءاستفاده، دسترسی غیرمجاز و سفارش‌های مشکوک.</li>
                <li>رفع خطا، بهبود عملکرد، امنیت، تجربه کاربری و محتوای فروشگاه.</li>
                <li>اجرای تکالیف قانونی، مالی، حسابداری و پاسخ‌گویی به مراجع صالح.</li>
              </ul>

              <NoticeBox>
                اطلاعات فقط به اندازه متناسب با هدف اعلام‌شده جمع‌آوری و استفاده می‌شود و فروشگاه از
                اطلاعات کاربران برای اهداف نامرتبط یا غیرقانونی استفاده نمی‌کند.
              </NoticeBox>
            </PrivacySection>

            <PrivacySection
              id='payment'
              number='۵'
              title='پرداخت و اطلاعات بانکی'
              icon={CreditCard}
            >
              <p>
                پرداخت سفارش از طریق درگاه پرداخت ارائه‌دهنده خدمات پرداخت انجام می‌شود. اطلاعات
                حساس کارت بانکی، مانند رمز پویا و CVV2، مستقیماً در محیط درگاه وارد می‌شود و در
                اختیار فروشگاه قرار نمی‌گیرد.
              </p>

              <ul>
                <li>
                  فروشگاه ممکن است شناسه تراکنش، مبلغ، زمان پرداخت، وضعیت پرداخت، شماره پیگیری و
                  اطلاعات لازم برای تطبیق سفارش را نگهداری کند.
                </li>
                <li>نتیجه پرداخت صرفاً پس از تأیید درگاه و بررسی سمت سرور قطعی محسوب می‌شود.</li>
                <li>
                  در صورت بازگشت وجه، اطلاعات لازم برای تطبیق پرداخت و استرداد وجه مطابق ضوابط مالی
                  و بانکی استفاده می‌شود.
                </li>
              </ul>
            </PrivacySection>

            <PrivacySection
              id='cookies'
              number='۶'
              title='کوکی‌ها و ذخیره‌سازی محلی مرورگر'
              icon={Cookie}
            >
              <p>
                سایت ممکن است برای حفظ نشست ورود، نگهداری سبد خرید، تنظیمات نمایش، انتخاب خودرو،
                امنیت درخواست‌ها و بهبود تجربه کاربری از کوکی یا فناوری‌های مشابه در مرورگر استفاده
                کند.
              </p>

              <ul>
                <li>
                  کوکی‌های ضروری برای ورود، امنیت، سبد خرید و عملکرد اصلی سایت لازم‌اند و
                  غیرفعال‌کردن آن‌ها ممکن است بخشی از خدمات را مختل کند.
                </li>
                <li>
                  تنظیمات غیرحساس مانند حالت نمایش یا برخی ترجیحات ممکن است در حافظه محلی مرورگر
                  ذخیره شوند.
                </li>
                <li>
                  کاربر می‌تواند کوکی‌ها را از تنظیمات مرورگر حذف یا محدود کند؛ اما در این صورت ممکن
                  است لازم باشد دوباره وارد حساب شود یا تنظیمات خود را مجدداً انتخاب کند.
                </li>
              </ul>
            </PrivacySection>

            <PrivacySection
              id='technical-data'
              number='۷'
              title='گزارش‌های فنی، امنیتی و آماری'
              icon={ServerCog}
            >
              <p>
                برای حفظ پایداری و امنیت سامانه، برخی رخدادهای فنی به‌صورت محدود ثبت می‌شوند. این
                اطلاعات ممکن است شامل زمان درخواست، IP، مسیر بازدیدشده، شناسه نشست، نوع مرورگر، پاسخ
                سرور و جزئیات خطا باشد.
              </p>

              <ul>
                <li>شناسایی حملات، ربات‌ها، تلاش ورود غیرمجاز و تقلب.</li>
                <li>بررسی خطاهای سفارش، پرداخت، موجودی و ارسال.</li>
                <li>تحلیل عملکرد صفحات و بهبود سرعت و تجربه کاربری.</li>
                <li>حفظ سوابق لازم برای رسیدگی به اختلاف یا رخداد امنیتی.</li>
              </ul>

              <p>
                گزارش‌های آماری تا حد امکان به‌صورت تجمیعی استفاده می‌شوند و هدف آن‌ها شناسایی
                عملکرد کلی سایت است، نه بررسی غیرضروری رفتار شخصی کاربران.
              </p>
            </PrivacySection>

            <PrivacySection
              id='sharing'
              number='۸'
              title='اشتراک‌گذاری اطلاعات با اشخاص ثالث'
              icon={Share2}
            >
              <p>
                فروشگاه اطلاعات کاربران را نمی‌فروشد. انتقال محدود اطلاعات فقط در موارد لازم برای
                ارائه خدمات، اجرای قرارداد یا رعایت قانون انجام می‌شود؛ از جمله:
              </p>

              <ul>
                <li>درگاه پرداخت و ارائه‌دهندگان خدمات مالی برای انجام و تأیید تراکنش.</li>
                <li>شرکت پست، پیک، باربری یا سایر متصدیان حمل برای تحویل سفارش.</li>
                <li>
                  ارائه‌دهنده پیامک، ایمیل یا زیرساخت ارتباطی برای ارسال کد ورود و اطلاع‌رسانی
                  سفارش.
                </li>
                <li>ارائه‌دهندگان میزبانی، پایگاه داده، پشتیبان‌گیری، امنیت و خدمات فنی ضروری.</li>
                <li>
                  شرکت گارانتی‌کننده، تأمین‌کننده یا کارشناس فنی در حد لازم برای بررسی اصالت،
                  سازگاری، ایراد یا ضمانت کالا.
                </li>
                <li>
                  مراجع قضایی، انتظامی، مالیاتی یا سایر مراجع قانونی، در صورت وجود درخواست معتبر و
                  در حدود صلاحیت قانونی.
                </li>
              </ul>

              <p>
                اطلاعاتی که در اختیار ارائه‌دهندگان خدمات قرار می‌گیرد باید به حداقل موردنیاز برای
                انجام همان خدمت محدود باشد.
              </p>
            </PrivacySection>

            <PrivacySection id='retention' number='۹' title='مدت نگهداری اطلاعات' icon={Clock3}>
              <p>
                اطلاعات تا زمانی نگهداری می‌شود که برای ارائه خدمات، اجرای سفارش، پشتیبانی، حل
                اختلاف، امنیت، امور مالی و تکالیف قانونی موردنیاز باشد.
              </p>

              <ul>
                <li>
                  اطلاعات سفارش و پرداخت ممکن است به دلیل الزامات حسابداری، مالیاتی، گارانتی و
                  رسیدگی به اختلاف برای مدت طولانی‌تری حفظ شود.
                </li>
                <li>
                  اطلاعات سبد خرید، نشست‌ها و گزارش‌های فنی ممکن است با دوره‌های کوتاه‌تر حذف یا
                  بی‌نام شوند.
                </li>
                <li>
                  پس از پایان نیاز قانونی یا عملیاتی، اطلاعات حذف، ناشناس یا از دسترس عملیاتی خارج
                  می‌شوند؛ مگر اینکه نگهداری آن‌ها به حکم قانون یا مرجع صالح لازم باشد.
                </li>
              </ul>
            </PrivacySection>

            <PrivacySection
              id='user-rights'
              number='۱۰'
              title='حقوق کاربر و درخواست اصلاح یا حذف'
              icon={Trash2}
            >
              <p>
                کاربر می‌تواند از طریق حساب کاربری یا تماس با پشتیبانی، در حدود امکانات فنی و
                الزامات قانونی، درخواست‌های زیر را مطرح کند:
              </p>

              <ul>
                <li>مشاهده و اصلاح اطلاعات حساب، نشانی‌ها و خودروهای ذخیره‌شده.</li>
                <li>اصلاح اطلاعات نادرست یا ناقص مرتبط با سفارش.</li>
                <li>درخواست حذف حساب یا اطلاعاتی که نگهداری آن‌ها دیگر ضروری نیست.</li>
                <li>اعتراض به استفاده نادرست یا خارج از هدف از اطلاعات شخصی.</li>
                <li>لغو دریافت پیام‌های تبلیغاتی غیرضروری.</li>
              </ul>

              <NoticeBox>
                حذف حساب لزوماً به معنای حذف فوری تمام سوابق سفارش و پرداخت نیست. اطلاعاتی که
                نگهداری آن‌ها برای امور مالی، گارانتی، جلوگیری از تقلب، حل اختلاف یا اجرای قانون
                لازم است، تا پایان مدت ضروری حفظ خواهد شد.
              </NoticeBox>
            </PrivacySection>

            <PrivacySection
              id='communications'
              number='۱۱'
              title='پیامک‌ها، اعلان‌ها و ارتباطات فروشگاه'
              icon={Bell}
            >
              <ul>
                <li>
                  پیام‌های عملیاتی مانند کد ورود، ثبت سفارش، نتیجه پرداخت، تغییر وضعیت سفارش، ارسال
                  و پشتیبانی برای ارائه خدمت ضروری‌اند.
                </li>
                <li>
                  پیام‌های تبلیغاتی یا اطلاع‌رسانی غیرضروری فقط در صورت وجود مبنای مناسب و امکان لغو
                  دریافت ارسال می‌شوند.
                </li>
                <li>
                  لغو پیام‌های تبلیغاتی مانع دریافت پیام‌های ضروری مربوط به امنیت حساب یا سفارش فعال
                  نخواهد شد.
                </li>
              </ul>
            </PrivacySection>

            <PrivacySection
              id='security'
              number='۱۲'
              title='امنیت و حفاظت از اطلاعات'
              icon={LockKeyhole}
            >
              <p>
                فروشگاه متناسب با اندازه و ماهیت سامانه از تدابیر فنی و سازمانی متعارف برای حفاظت از
                اطلاعات استفاده می‌کند؛ از جمله کنترل دسترسی، احراز هویت، ثبت رخدادهای امنیتی،
                ارتباط امن، به‌روزرسانی نرم‌افزار و پشتیبان‌گیری.
              </p>

              <ul>
                <li>
                  دسترسی کارکنان و ارائه‌دهندگان خدمات باید به اطلاعات موردنیاز برای انجام وظیفه
                  محدود باشد.
                </li>
                <li>
                  کاربر مسئول حفاظت از تلفن همراه، رمز یک‌بارمصرف و دسترسی به حساب خود است و نباید
                  این اطلاعات را در اختیار دیگران قرار دهد.
                </li>
                <li>
                  در صورت مشاهده ورود مشکوک یا سوءاستفاده احتمالی، موضوع باید سریعاً به پشتیبانی
                  اعلام شود.
                </li>
              </ul>

              <p>
                هیچ سامانه اینترنتی را نمی‌توان کاملاً مصون از خطر دانست؛ بااین‌حال فروشگاه تلاش
                می‌کند رخدادهای امنیتی را شناسایی، محدود و مطابق الزامات قانونی پیگیری کند.
              </p>
            </PrivacySection>

            <PrivacySection
              id='children'
              number='۱۳'
              title='کاربران زیر سن قانونی'
              icon={UserRound}
            >
              <p>
                خرید و ثبت تعهد مالی باید توسط شخص دارای اهلیت قانونی یا با اطلاع و نظارت ولی یا
                سرپرست قانونی انجام شود. فروشگاه خدمات خود را با هدف جمع‌آوری اطلاعات کودکان طراحی
                نکرده است.
              </p>

              <p>
                اگر مشخص شود اطلاعات کاربر زیر سن قانونی بدون مجوز لازم ثبت شده است، موضوع پس از
                بررسی و در حدود الزامات قانونی اصلاح یا حذف خواهد شد.
              </p>
            </PrivacySection>

            <PrivacySection
              id='changes-contact'
              number='۱۴'
              title='به‌روزرسانی سیاست و تماس با ما'
              icon={Headphones}
            >
              <p>
                این سیاست ممکن است به دلیل تغییر خدمات، فناوری، فرایندهای فروشگاه یا الزامات قانونی
                اصلاح شود. نسخه معتبر همیشه در همین صفحه منتشر می‌شود و تاریخ آخرین به‌روزرسانی در
                ابتدای صفحه قابل مشاهده است.
              </p>

              <p>
                برای سؤال، اعتراض یا درخواست مرتبط با اطلاعات شخصی، از طریق صفحه تماس با ما با
                پشتیبانی ارتباط بگیرید. برای بررسی دقیق‌تر، ممکن است احراز هویت صاحب حساب ضروری
                باشد.
              </p>

              <div className='mt-5 flex flex-wrap gap-3'>
                <Link
                  href='/contact'
                  className='inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-hover'
                >
                  ارتباط با پشتیبانی
                  <ChevronLeft className='size-4' aria-hidden='true' />
                </Link>

                <Link
                  href='/terms'
                  className='inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-surface px-5 py-2.5 text-sm font-extrabold text-foreground transition hover:border-brand/40 hover:text-brand'
                >
                  قوانین استفاده از سایت
                </Link>
              </div>
            </PrivacySection>
          </article>
        </div>
      </div>
    </main>
  );
}

function PrivacyHero({ siteName }: { siteName: string }) {
  return (
    <section className='relative overflow-hidden rounded-[32px] border border-border bg-surface px-5 py-8 shadow-panel sm:px-8 sm:py-10 lg:px-12'>
      <div className='pointer-events-none absolute -top-20 -left-16 size-56 rounded-full bg-brand/10 blur-3xl' />
      <div className='pointer-events-none absolute right-0 -bottom-20 size-64 rounded-full bg-info/10 blur-3xl' />

      <div className='relative max-w-3xl'>
        <div className='inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1.5 text-xs font-extrabold text-brand'>
          <ShieldCheck className='size-4' aria-hidden='true' />
          سیاست حفاظت از اطلاعات کاربران
        </div>

        <h1 className='mt-5 text-3xl font-black tracking-tight text-foreground sm:text-4xl'>
          حریم خصوصی
        </h1>

        <p className='mt-4 text-sm leading-8 text-foreground-secondary sm:text-base'>
          در این صفحه توضیح داده‌ایم که {siteName} چه اطلاعاتی را برای ارائه خدمات فروشگاهی دریافت
          می‌کند، چرا از آن‌ها استفاده می‌کند و چگونه از اطلاعات کاربران محافظت می‌شود.
        </p>

        <div className='mt-6 flex flex-wrap items-center gap-3 text-xs font-bold text-foreground-muted'>
          <span className='inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-2'>
            <Clock3 className='size-4' aria-hidden='true' />
            آخرین به‌روزرسانی: {LAST_UPDATED_AT}
          </span>

          <span className='inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-2'>
            <LockKeyhole className='size-4' aria-hidden='true' />
            حداقل‌گرایی در جمع‌آوری اطلاعات
          </span>
        </div>
      </div>
    </section>
  );
}

function PrivacyNavigation() {
  return (
    <aside className='self-start lg:sticky lg:top-24'>
      <nav
        aria-label='فهرست سیاست حریم خصوصی'
        className='rounded-[24px] border border-border bg-surface p-3 shadow-sm'
      >
        <div className='px-3 py-2'>
          <p className='text-sm font-extrabold text-foreground'>فهرست مطالب</p>
          <p className='mt-1 text-xs leading-6 text-foreground-muted'>
            برای رفتن به هر بخش، عنوان آن را انتخاب کنید.
          </p>
        </div>

        <div className='mt-2 space-y-1 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:overscroll-contain'>
          {PRIVACY_NAVIGATION.map((item, index) => (
            <Link
              key={item.id}
              href={`#${item.id}`}
              className='group flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-bold text-foreground-secondary transition hover:bg-brand-soft hover:text-brand'
            >
              <span className='numeric grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-xs transition group-hover:bg-brand group-hover:text-white'>
                {new Intl.NumberFormat('fa-IR').format(index + 1)}
              </span>
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function PrivacySummary({ siteName }: { siteName: string }) {
  const cards = [
    {
      icon: Database,
      title: 'جمع‌آوری هدفمند',
      description: 'فقط اطلاعات لازم برای حساب، خرید، ارسال و پشتیبانی دریافت می‌شود.',
    },
    {
      icon: Share2,
      title: 'عدم فروش اطلاعات',
      description: 'اطلاعات کاربران فروخته نمی‌شود و فقط برای ارائه خدمات ضروری منتقل می‌شود.',
    },
    {
      icon: ShieldCheck,
      title: 'حفاظت متعارف',
      description: 'از کنترل دسترسی و تدابیر فنی متناسب برای حفاظت از داده‌ها استفاده می‌شود.',
    },
  ];

  return (
    <section className='rounded-[28px] border border-brand/20 bg-brand-soft/70 p-5 sm:p-6'>
      <div className='flex items-start gap-3'>
        <div className='grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-white'>
          <ShieldCheck className='size-5' aria-hidden='true' />
        </div>

        <div>
          <h2 className='text-lg font-black text-foreground'>
            تعهد {siteName} درباره اطلاعات کاربران
          </h2>
          <p className='mt-2 text-sm leading-8 text-foreground-secondary'>
            اطلاعات کاربران دارایی قابل فروش فروشگاه نیست. دریافت و استفاده از اطلاعات باید مشخص،
            متناسب با نیاز و محدود به ارائه خدمات یا اجرای تکالیف قانونی باشد.
          </p>
        </div>
      </div>

      <div className='mt-5 grid gap-3 md:grid-cols-3'>
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.title} className='rounded-2xl border border-border/80 bg-surface/90 p-4'>
              <Icon className='size-5 text-brand' aria-hidden='true' />
              <p className='mt-3 text-sm font-extrabold text-foreground'>{card.title}</p>
              <p className='mt-1.5 text-xs leading-6 text-foreground-muted'>{card.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PrivacySection({ id, number, title, icon: Icon, children }: PrivacySectionProps) {
  return (
    <section
      id={id}
      className='scroll-mt-28 rounded-[28px] border border-border bg-surface p-5 shadow-sm sm:p-7'
    >
      <div className='flex items-start gap-4'>
        <div className='grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-muted text-brand'>
          <Icon className='size-5' aria-hidden='true' />
        </div>

        <div className='min-w-0 flex-1'>
          <p className='text-xs font-extrabold text-brand'>بخش {number}</p>
          <h2 className='mt-1 text-lg leading-8 font-black text-foreground sm:text-xl'>{title}</h2>
        </div>
      </div>

      <div className='mt-6 space-y-4 text-sm leading-8 text-foreground-secondary sm:text-base sm:leading-9 [&_li]:relative [&_li]:pr-5 [&_li]:before:absolute [&_li]:before:top-[0.9rem] [&_li]:before:right-0 [&_li]:before:size-1.5 [&_li]:before:rounded-full [&_li]:before:bg-brand [&_strong]:font-extrabold [&_strong]:text-foreground [&_ul]:space-y-3'>
        {children}
      </div>
    </section>
  );
}

function NoticeBox({ children }: { children: ReactNode }) {
  return (
    <div className='mt-5 flex items-start gap-3 rounded-3xl border border-warning/25 bg-warning-soft p-5 text-sm leading-7 text-foreground'>
      <CheckCircle2 className='mt-0.5 size-5 shrink-0 text-warning' aria-hidden='true' />
      <div>{children}</div>
    </div>
  );
}

function PrivacyBackground() {
  return (
    <div className='pointer-events-none absolute inset-0 overflow-hidden'>
      <div className='absolute top-40 -right-28 size-80 rounded-full bg-brand/5 blur-3xl' />
      <div className='absolute top-[46rem] -left-32 size-96 rounded-full bg-info/5 blur-3xl' />
    </div>
  );
}
