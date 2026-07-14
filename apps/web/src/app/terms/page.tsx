import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  BadgeCheck,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  Copyright,
  CreditCard,
  FileText,
  Headphones,
  PackageCheck,
  RotateCcw,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';
import { ReactNode } from 'react';

type TermsNavigationItem = {
  id: string;
  title: string;
};

type TermsSectionProps = {
  id: string;
  number: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
};

const LAST_UPDATED_AT = '۲۲ تیر ۱۴۰۵';

const TERMS_NAVIGATION: TermsNavigationItem[] = [
  { id: 'acceptance', title: 'پذیرش قوانین' },
  { id: 'account', title: 'حساب کاربری و اطلاعات مشتری' },
  { id: 'product-information', title: 'اطلاعات و انتخاب قطعه' },
  { id: 'price-stock', title: 'قیمت و موجودی' },
  { id: 'order-process', title: 'ثبت و تأیید سفارش' },
  { id: 'payment', title: 'پرداخت' },
  { id: 'shipping', title: 'ارسال و تحویل' },
  { id: 'inspection', title: 'بررسی سفارش هنگام تحویل' },
  { id: 'cancellation-return', title: 'لغو و بازگشت کالا' },
  { id: 'authenticity-warranty', title: 'اصالت و ضمانت کالا' },
  { id: 'site-use', title: 'نحوه استفاده از سایت' },
  { id: 'intellectual-property', title: 'مالکیت فکری' },
  { id: 'force-majeure', title: 'شرایط خارج از اختیار' },
  { id: 'privacy', title: 'حریم خصوصی' },
  { id: 'changes-disputes', title: 'تغییر قوانین و اختلافات' },
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStorefrontSiteSettings();

  return {
    title: `قوانین و شرایط استفاده | ${settings.siteName}`,
    description: `قوانین ثبت سفارش، پرداخت، ارسال، انتخاب قطعه و استفاده از خدمات فروشگاه اینترنتی ${settings.siteName}.`,
  };
}

export default async function TermsPage() {
  const settings = await getStorefrontSiteSettings();

  return (
    <main className='relative bg-background'>
      <TermsBackground />

      <div className='relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16'>
        <TermsHero siteName={settings.siteName} />

        <div className='mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start'>
          <TermsNavigation />

          <article className='min-w-0 space-y-5'>
            <ImportantSummary siteName={settings.siteName} />

            <TermsSection id='acceptance' number='۱' title='پذیرش قوانین و تعاریف' icon={FileText}>
              <p>
                استفاده از وب‌سایت {settings.siteName}، ایجاد حساب کاربری، افزودن کالا به سبد خرید
                یا ثبت سفارش به معنای مطالعه و پذیرش این قوانین است. منظور از «فروشگاه» در این متن،
                {` ${settings.siteName} `}و منظور از «کاربر» یا «مشتری»، شخصی است که از خدمات سایت
                استفاده می‌کند یا سفارش ثبت می‌کند.
              </p>

              <p>
                این قوانین همراه با اطلاعات درج‌شده در صفحه محصول، شیوه ارسال، شرایط بازگشت کالا و
                سایر سیاست‌های اعلام‌شده در سایت، چارچوب استفاده از خدمات فروشگاه را تشکیل می‌دهند.
                در صورت وجود تفاوت میان یک شرط عمومی و شرایط اختصاصی درج‌شده در صفحه محصول، شرایط
                اختصاصی همان محصول ملاک خواهد بود؛ مشروط بر اینکه با قوانین لازم‌الاجرای کشور مغایرت
                نداشته باشد.
              </p>
            </TermsSection>

            <TermsSection
              id='account'
              number='۲'
              title='حساب کاربری و اطلاعات مشتری'
              icon={UserRound}
            >
              <ul>
                <li>
                  مشتری موظف است نام، شماره همراه، نشانی، کدپستی و سایر اطلاعات لازم برای ثبت و
                  ارسال سفارش را صحیح و کامل وارد کند.
                </li>
                <li>
                  مسئولیت تأخیر، برگشت مرسوله یا عدم تحویل ناشی از اطلاعات ناقص یا نادرست، تا حدی که
                  ناشی از قصور فروشگاه نباشد، بر عهده مشتری است.
                </li>
                <li>
                  هر حساب کاربری برای استفاده صاحب همان شماره همراه ایجاد می‌شود. حفظ دسترسی به تلفن
                  همراه، رمز یک‌بارمصرف و اطلاعات حساب بر عهده کاربر است.
                </li>
                <li>
                  در صورت مشاهده فعالیت غیرعادی، احتمال سوءاستفاده، سفارش‌گذاری غیرمتعارف یا نقض
                  قوانین، فروشگاه می‌تواند تا زمان بررسی، دسترسی حساب یا پردازش سفارش را محدود کند.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id='product-information'
              number='۳'
              title='اطلاعات محصول و انتخاب قطعه مناسب'
              icon={CarFront}
            >
              <p>
                فروشگاه تلاش می‌کند مشخصات فنی، برند، کد فنی، تصاویر، کاربرد و خودروهای سازگار با هر
                قطعه را با دقت درج کند. بااین‌حال، ممکن است میان سال تولید، تیپ، نسخه موتور، شماره
                شاسی یا کد فنی خودروها تفاوت‌هایی وجود داشته باشد که صرفاً از روی نام خودرو قابل
                تشخیص نباشد.
              </p>

              <ul>
                <li>
                  مشتری باید پیش از خرید، مشخصات خودرو و در صورت نیاز کد فنی قطعه قبلی را با اطلاعات
                  صفحه محصول تطبیق دهد.
                </li>
                <li>
                  انتخاب خودرو در سایت ابزار کمکی برای محدودکردن نتایج است و جایگزین بررسی نهایی کد
                  فنی، شماره شاسی یا نظر تعمیرکار متخصص نیست.
                </li>
                <li>
                  در موارد تردید، مشتری می‌تواند پیش از خرید از طریق صفحه تماس با ما، درخواست بررسی
                  سازگاری قطعه را ثبت کند.
                </li>
                <li>
                  اگر مغایرت ناشی از اطلاعات اشتباه فروشگاه یا راهنمایی نادرست پشتیبانی باشد، موضوع
                  مطابق شرایط بازگشت کالا بررسی خواهد شد.
                </li>
              </ul>

              <NoticeBox>
                نصب قطعه باید توسط فرد متخصص انجام شود. آسیب ناشی از نصب غیراصولی، استفاده نامناسب،
                تغییر در قطعه یا استفاده خارج از کاربرد اعلام‌شده، مشمول مسئولیت فروشگاه نیست؛ مگر
                اینکه ایراد ذاتی یا مغایرت کالا اثبات شود.
              </NoticeBox>
            </TermsSection>

            <TermsSection
              id='price-stock'
              number='۴'
              title='قیمت، تخفیف و موجودی'
              icon={BadgeCheck}
            >
              <ul>
                <li>
                  قیمت‌های سایت به تومان نمایش داده می‌شوند؛ مگر آنکه در محل مربوط، واحد دیگری
                  به‌طور صریح درج شده باشد.
                </li>
                <li>
                  افزودن کالا به سبد خرید به‌تنهایی به معنای رزرو موجودی یا تثبیت قیمت نیست. قیمت و
                  موجودی تا پیش از ثبت نهایی سفارش می‌تواند تغییر کند.
                </li>
                <li>
                  موجودی برخی قطعات ممکن است نیازمند استعلام باشد. این محصولات تا زمان تأیید موجودی
                  و قیمت، قابل خرید مستقیم نیستند.
                </li>
                <li>
                  در صورت بروز خطای آشکار در قیمت‌گذاری، مشخصات یا موجودی، فروشگاه پیش از ارسال با
                  مشتری تماس می‌گیرد. مشتری می‌تواند سفارش را با شرایط صحیح تأیید کند یا مبلغ
                  پرداخت‌شده را به‌طور کامل دریافت کند.
                </li>
                <li>
                  فروشگاه می‌تواند برای حفظ امکان خرید مصرف‌کنندگان، تعداد قابل سفارش بعضی کالاها را
                  محدود یا سفارش‌های با تعداد غیرمتعارف را پیش از تأیید بررسی کند.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id='order-process'
              number='۵'
              title='فرایند ثبت، رزرو و تأیید سفارش'
              icon={ShoppingCart}
            >
              <p>
                ثبت سفارش زمانی انجام می‌شود که مشتری اطلاعات لازم را تکمیل کند و سیستم شماره سفارش
                صادر نماید. صدور شماره سفارش به معنای ثبت درخواست خرید است و پردازش نهایی سفارش به
                تأیید پرداخت، موجودی و اطلاعات سفارش وابسته است.
              </p>

              <ul>
                <li>
                  پس از ایجاد سفارش پرداخت‌نشده، موجودی اقلام برای مدت محدودی که در صفحه سفارش نمایش
                  داده می‌شود، برای مشتری رزرو خواهد شد.
                </li>
                <li>
                  اگر پرداخت تا پایان زمان اعلام‌شده تکمیل نشود، سفارش می‌تواند منقضی و موجودی
                  رزروشده به‌صورت خودکار آزاد شود.
                </li>
                <li>
                  پرداخت موفق باعث قطعی‌شدن رزرو موجودی می‌شود؛ اما سفارش تا زمان شروع پردازش یا
                  ارسال می‌تواند در انتظار بررسی عملیاتی فروشگاه باشد.
                </li>
                <li>
                  در صورت عدم امکان تأمین کالا پس از پرداخت، فروشگاه موضوع را به مشتری اطلاع می‌دهد
                  و مبلغ مربوط را بدون کسر به پرداخت‌کننده بازمی‌گرداند یا با رضایت مشتری کالای
                  جایگزین ارائه می‌کند.
                </li>
              </ul>
            </TermsSection>

            <TermsSection id='payment' number='۶' title='پرداخت و بازگشت وجه' icon={CreditCard}>
              <ul>
                <li>
                  پرداخت اینترنتی از طریق درگاه‌های بانکی یا پرداخت‌یارهای معرفی‌شده در سایت انجام
                  می‌شود. فروشگاه اطلاعات محرمانه کارت بانکی را دریافت یا ذخیره نمی‌کند.
                </li>
                <li>
                  موفق‌بودن پرداخت زمانی قطعی است که نتیجه تراکنش توسط سرویس پرداخت تأیید و وضعیت
                  سفارش در سایت به‌روزرسانی شود.
                </li>
                <li>
                  اگر مبلغ از حساب مشتری کسر شود ولی سفارش پرداخت‌شده ثبت نشود، ابتدا وضعیت تراکنش
                  از طریق بانک یا پرداخت‌یار بررسی می‌شود. مبالغ تراکنش‌های ناموفق معمولاً طبق روال
                  شبکه بانکی به حساب مبدأ بازمی‌گردند.
                </li>
                <li>
                  بازگشت وجه توسط فروشگاه، تا حد امکان به همان حساب یا ابزار پرداخت متعلق به
                  پرداخت‌کننده انجام می‌شود. فروشگاه می‌تواند برای جلوگیری از سوءاستفاده، اطلاعات
                  لازم برای احراز مالکیت حساب را درخواست کند.
                </li>
              </ul>
            </TermsSection>

            <TermsSection id='shipping' number='۷' title='آماده‌سازی، ارسال و تحویل' icon={Truck}>
              <p>
                زمان‌های اعلام‌شده برای آماده‌سازی و تحویل، تقریبی هستند و با توجه به مقصد، روش حمل،
                تعطیلات رسمی، شرایط جوی، محدودیت شرکت حمل و نوع کالا ممکن است تغییر کنند.
              </p>

              <ul>
                <li>
                  روش‌ها و هزینه‌های قابل انتخاب ارسال پیش از نهایی‌شدن سفارش به مشتری نمایش داده
                  می‌شوند.
                </li>
                <li>
                  سفارش به نشانی ثبت‌شده توسط مشتری تحویل می‌شود. حضور تحویل‌گیرنده و ارائه اطلاعات
                  لازم برای احراز سفارش ممکن است ضروری باشد.
                </li>
                <li>
                  پس از تحویل مرسوله به شرکت حمل، کد رهگیری در صورت فراهم‌بودن از طریق حساب کاربری
                  یا سایر راه‌های ارتباطی اعلام می‌شود.
                </li>
                <li>
                  فروشگاه پیگیری مشکلات حمل را تسهیل می‌کند، اما زمان‌بندی و عملیات توزیع پس از
                  تحویل مرسوله به متصدی حمل می‌تواند تحت تأثیر عملکرد همان شرکت قرار گیرد.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id='inspection'
              number='۸'
              title='بررسی سفارش هنگام تحویل'
              icon={PackageCheck}
            >
              <ul>
                <li>
                  مشتری باید هنگام تحویل، سلامت ظاهری بسته‌بندی، تعداد بسته‌ها و مطابقت مشخصات اولیه
                  مرسوله با سفارش را بررسی کند.
                </li>
                <li>
                  در صورت پارگی شدید، ضربه‌خوردگی، خیس‌شدگی یا آسیب آشکار بسته، بهتر است موضوع هنگام
                  تحویل در حضور مأمور حمل ثبت و در کوتاه‌ترین زمان به پشتیبانی اطلاع داده شود.
                </li>
                <li>
                  برای بررسی آسیب حمل، مغایرت یا کسری کالا، نگهداری بسته‌بندی، برچسب ارسال، فاکتور و
                  تهیه عکس یا ویدئو از وضعیت مرسوله ضروری است.
                </li>
                <li>
                  اعلام دیرهنگام، حق قانونی مشتری را به‌طور خودکار از بین نمی‌برد؛ اما ممکن است
                  تشخیص منشأ آسیب و پیگیری از شرکت حمل را دشوار کند.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id='cancellation-return'
              number='۹'
              title='لغو سفارش و بازگشت کالا'
              icon={RotateCcw}
            >
              <p>
                امکان لغو سفارش پیش از شروع آماده‌سازی یا ارسال، با توجه به وضعیت سفارش بررسی
                می‌شود. شرایط حق انصراف، کالای مغایر، آسیب‌دیده، نصب‌شده، استفاده‌شده یا دارای ایراد
                فنی در صفحه مستقل «شرایط بازگشت کالا» توضیح داده شده است.
              </p>

              <div className='mt-5 flex flex-wrap gap-3'>
                <Link
                  href='/returns'
                  className='inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-extrabold text-brand-foreground transition hover:bg-brand-hover'
                >
                  مطالعه شرایط بازگشت کالا
                  <ChevronLeft className='size-4' />
                </Link>

                <Link
                  href='/contact'
                  className='inline-flex h-11 items-center justify-center gap-2 rounded-control border border-border bg-surface px-5 text-sm font-extrabold text-foreground-secondary transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand'
                >
                  ارتباط با پشتیبانی
                  <Headphones className='size-4' />
                </Link>
              </div>
            </TermsSection>

            <TermsSection
              id='authenticity-warranty'
              number='۱۰'
              title='اصالت، سلامت و ضمانت کالا'
              icon={ShieldCheck}
            >
              <ul>
                <li>
                  وضعیت اصالت، برند، شرکتی یا افترمارکت‌بودن کالا مطابق اطلاعات صفحه محصول و فاکتور
                  سفارش ارزیابی می‌شود.
                </li>
                <li>
                  وجود گارانتی فقط زمانی قطعی است که در صفحه محصول، بسته‌بندی، کارت ضمانت یا فاکتور
                  به‌طور صریح ذکر شده باشد.
                </li>
                <li>
                  شرایط مدت و نحوه استفاده از ضمانت تابع ضوابط شرکت تولیدکننده، واردکننده یا
                  ارائه‌دهنده گارانتی است.
                </li>
                <li>
                  آسیب ناشی از نصب اشتباه، تصادف، نوسان برق، استفاده خارج از مشخصات، دست‌کاری،
                  شکستگی یا مصرف نامناسب ممکن است خارج از پوشش ضمانت باشد.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id='site-use'
              number='۱۱'
              title='استفاده مجاز از سایت و نظرات کاربران'
              icon={Scale}
            >
              <ul>
                <li>
                  استفاده از سایت برای فعالیت غیرقانونی، ایجاد اختلال، تلاش برای دسترسی غیرمجاز،
                  استخراج انبوه اطلاعات یا آسیب‌زدن به زیرساخت‌ها ممنوع است.
                </li>
                <li>
                  کاربران در ثبت دیدگاه باید از انتشار محتوای توهین‌آمیز، خلاف قانون، تبلیغاتی،
                  گمراه‌کننده یا ناقض حریم خصوصی و حقوق دیگران خودداری کنند.
                </li>
                <li>
                  فروشگاه می‌تواند دیدگاه‌های نامرتبط، تکراری، خلاف قانون یا فاقد تجربه واقعی
                  استفاده را منتشر نکند یا حذف کند؛ بااین‌حال، نقد محترمانه و تجربه واقعی خرید صرفاً
                  به دلیل منفی‌بودن حذف نخواهد شد.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id='intellectual-property'
              number='۱۲'
              title='مالکیت مادی و معنوی محتوا'
              icon={Copyright}
            >
              <p>
                نام تجاری، نشان، طراحی رابط کاربری، تصاویر اختصاصی، توضیحات، مقالات، دسته‌بندی‌ها و
                سایر محتوای تولیدشده توسط {settings.siteName} تحت حمایت قوانین مالکیت فکری است.
                بازنشر یا استفاده تجاری از این محتوا بدون اجازه کتبی مجاز نیست؛ مگر در مواردی که
                منبع دیگری برای محتوا ذکر شده یا استفاده طبق قانون مجاز باشد.
              </p>
            </TermsSection>

            <TermsSection
              id='force-majeure'
              number='۱۳'
              title='شرایط خارج از اختیار فروشگاه'
              icon={AlertTriangle}
            >
              <p>
                در رخدادهایی مانند اختلال گسترده اینترنت یا شبکه بانکی، قطعی زیرساخت، حوادث طبیعی،
                محدودیت‌های حمل‌ونقل، تغییرات ناگهانی مقررات، جنگ، اعتصاب یا سایر شرایطی که خارج از
                کنترل متعارف فروشگاه است، ممکن است اجرای تعهدات با تأخیر مواجه شود. فروشگاه در چنین
                شرایطی تلاش می‌کند مشتری را مطلع کرده و سفارش‌های متأثر را در اولین فرصت تعیین تکلیف
                کند.
              </p>
            </TermsSection>

            <TermsSection
              id='privacy'
              number='۱۴'
              title='حریم خصوصی و ارتباط با مشتری'
              icon={ShieldCheck}
            >
              <p>
                اطلاعات مشتری فقط در حدود لازم برای ایجاد حساب، پردازش سفارش، ارسال، پشتیبانی،
                پیشگیری از تقلب و الزامات قانونی استفاده می‌شود. جزئیات بیشتر در صفحه حریم خصوصی
                منتشر خواهد شد. فروشگاه اطلاعات بانکی محرمانه مشتری را ذخیره نمی‌کند و ارتباطات رسمی
                از مسیرهای معرفی‌شده در وب‌سایت انجام می‌شود.
              </p>

              <Link
                href='/privacy'
                className='mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-brand hover:underline'
              >
                مطالعه سیاست حریم خصوصی
                <ChevronLeft className='size-4' />
              </Link>
            </TermsSection>

            <TermsSection
              id='changes-disputes'
              number='۱۵'
              title='به‌روزرسانی قوانین، پشتیبانی و حل اختلاف'
              icon={Scale}
            >
              <ul>
                <li>
                  فروشگاه می‌تواند این قوانین را برای هماهنگی با تغییرات خدمات یا مقررات اصلاح کند.
                  نسخه جدید از زمان انتشار در همین صفحه معتبر خواهد بود و تاریخ به‌روزرسانی در
                  ابتدای صفحه درج می‌شود.
                </li>
                <li>
                  تغییرات جدید، حقوق و تعهدات قطعی‌شده در سفارش‌های قبلی را برخلاف قانون به‌صورت
                  یک‌طرفه تغییر نمی‌دهد.
                </li>
                <li>
                  در صورت بروز اختلاف، ابتدا موضوع از طریق پشتیبانی بررسی می‌شود. اگر توافق حاصل
                  نشود، رسیدگی از طریق مراجع صالح قانونی جمهوری اسلامی ایران انجام خواهد شد.
                </li>
              </ul>

              <div className='mt-6 rounded-3xl border border-brand/15 bg-brand-soft/60 p-5'>
                <p className='text-sm leading-7 font-bold text-foreground'>
                  برای پرسش درباره این قوانین، ثبت شکایت یا پیگیری سفارش از صفحه تماس با ما استفاده
                  کنید.
                </p>

                <Link
                  href='/contact'
                  className='mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-brand hover:underline'
                >
                  تماس با {settings.siteName}
                  <ChevronLeft className='size-4' />
                </Link>
              </div>
            </TermsSection>
          </article>
        </div>
      </div>
    </main>
  );
}

function TermsHero({ siteName }: { siteName: string }) {
  return (
    <section className='overflow-hidden rounded-[32px] border border-border bg-surface shadow-panel'>
      <div className='relative p-6 sm:p-8 lg:p-10'>
        <div className='pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-brand/10 blur-3xl' />
        <div className='pointer-events-none absolute -right-16 -bottom-24 size-64 rounded-full border border-brand/10' />

        <div className='relative max-w-4xl'>
          <div className='inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-extrabold text-brand'>
            <FileText className='size-4' />
            قوانین استفاده از خدمات
          </div>

          <h1 className='mt-6 text-3xl leading-[1.7] font-black text-foreground sm:text-4xl lg:text-5xl'>
            قوانین و شرایط استفاده از {siteName}
          </h1>

          <p className='mt-5 max-w-3xl text-base leading-9 text-foreground-secondary lg:text-lg'>
            این صفحه نحوه استفاده از سایت، انتخاب قطعه، ثبت سفارش، پرداخت، رزرو موجودی، ارسال و
            مسئولیت‌های متقابل فروشگاه و مشتری را توضیح می‌دهد. پیش از ثبت سفارش، متن را با دقت
            مطالعه کنید.
          </p>

          <div className='mt-6 flex flex-wrap items-center gap-3 text-sm font-bold text-foreground-secondary'>
            <span className='rounded-full border border-border bg-background/70 px-4 py-2'>
              آخرین به‌روزرسانی: {LAST_UPDATED_AT}
            </span>

            <Link
              href='/contact'
              className='inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 transition hover:border-brand/30 hover:text-brand'
            >
              پرسش از پشتیبانی
              <ChevronLeft className='size-4' />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TermsNavigation() {
  return (
    <aside className='self-start lg:sticky lg:top-24'>
      <nav
        aria-label='فهرست قوانین و شرایط استفاده'
        className='rounded-[24px] border border-border bg-surface p-3 shadow-sm'
      >
        <div className='px-3 py-2'>
          <p className='text-sm font-extrabold text-foreground'>فهرست مطالب</p>
          <p className='mt-1 text-xs leading-6 text-foreground-muted'>
            برای رفتن به هر بخش، عنوان آن را انتخاب کنید.
          </p>
        </div>

        <div className='mt-2 space-y-1 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:overscroll-contain'>
          {TERMS_NAVIGATION.map((item, index) => (
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

function ImportantSummary({ siteName }: { siteName: string }) {
  const items = [
    'افزودن کالا به سبد خرید به معنای رزرو موجودی نیست.',
    'پس از ایجاد سفارش، موجودی فقط تا پایان زمان نمایش‌داده‌شده رزرو می‌ماند.',
    'تطبیق نهایی قطعه با کد فنی و مشخصات دقیق خودرو اهمیت دارد.',
    'شرایط لغو و مرجوعی در صفحه مستقل بازگشت کالا اعلام می‌شود.',
  ];

  return (
    <section className='rounded-[28px] border border-brand/20 bg-brand-soft/60 p-6 shadow-sm lg:p-7'>
      <div className='flex items-start gap-4'>
        <span className='grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_rgb(255_92_0/0.22)]'>
          <CheckCircle2 className='size-6' />
        </span>

        <div className='min-w-0'>
          <h2 className='text-lg font-black text-foreground'>خلاصه نکات مهم خرید از {siteName}</h2>

          <ul className='mt-4 grid gap-3 text-sm leading-7 text-foreground-secondary sm:grid-cols-2'>
            {items.map((item) => (
              <li key={item} className='flex items-start gap-2'>
                <CheckCircle2 className='mt-1 size-4 shrink-0 text-brand' />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function TermsSection({ id, number, title, icon: Icon, children }: TermsSectionProps) {
  return (
    <section
      id={id}
      className='scroll-mt-28 rounded-[28px] border border-border bg-surface p-6 shadow-sm lg:p-8'
    >
      <div className='flex items-start gap-4'>
        <span className='grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand'>
          <Icon className='size-6 stroke-[1.8]' />
        </span>

        <div className='min-w-0 pt-1'>
          <p className='text-xs font-extrabold tracking-wide text-brand'>بخش {number}</p>
          <h2 className='mt-1 text-xl leading-8 font-black text-foreground sm:text-2xl'>{title}</h2>
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
      <AlertTriangle className='mt-0.5 size-5 shrink-0 text-warning' />
      <p className='font-bold'>{children}</p>
    </div>
  );
}

function TermsBackground() {
  return (
    <div className='pointer-events-none absolute inset-0 overflow-hidden'>
      <div className='absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/90 to-transparent dark:from-white/5' />
      <div className='absolute top-40 -right-28 size-80 rounded-full border border-brand/10' />
      <div className='absolute top-12 -left-24 size-96 rounded-full bg-brand/5 blur-3xl' />
      <div className='absolute right-1/3 bottom-32 size-72 rounded-full bg-info/5 blur-3xl' />
    </div>
  );
}
