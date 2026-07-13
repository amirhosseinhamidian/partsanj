import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Box,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  CreditCard,
  FileCheck2,
  Headphones,
  PackageCheck,
  RotateCcw,
  Scale,
  ShieldCheck,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

type ReturnsNavigationItem = {
  id: string;
  title: string;
};

type ReturnsSectionProps = {
  id: string;
  number: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
};

type ReturnCaseCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  costText: string;
};

const LAST_UPDATED_AT = '۲۲ تیر ۱۴۰۵';

const RETURNS_NAVIGATION: ReturnsNavigationItem[] = [
  { id: 'overview', title: 'دامنه و مهلت بازگشت' },
  { id: 'change-of-mind', title: 'انصراف از خرید' },
  { id: 'mismatch', title: 'مغایرت یا کسری کالا' },
  { id: 'shipping-damage', title: 'آسیب در حمل' },
  { id: 'technical-defect', title: 'ایراد فنی و گارانتی' },
  { id: 'installed-parts', title: 'قطعات نصب‌شده و برقی' },
  { id: 'non-returnable', title: 'موارد غیرقابل پذیرش' },
  { id: 'return-process', title: 'مراحل ثبت درخواست' },
  { id: 'shipping-method', title: 'نحوه ارسال کالای برگشتی' },
  { id: 'inspection', title: 'بررسی و تعیین نتیجه' },
  { id: 'refund', title: 'بازگشت وجه و هزینه‌ها' },
  { id: 'support', title: 'پشتیبانی و اختلاف' },
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStorefrontSiteSettings();

  return {
    title: `شرایط بازگشت و مرجوعی کالا | ${settings.siteName}`,
    description: `شرایط انصراف از خرید، بازگشت قطعات مغایر یا آسیب‌دیده، بررسی ایراد فنی و نحوه استرداد وجه در ${settings.siteName}.`,
  };
}

export default async function ReturnsPage() {
  const settings = await getStorefrontSiteSettings();

  return (
    <main className='relative bg-background'>
      <ReturnsBackground />

      <div className='relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16'>
        <ReturnsHero siteName={settings.siteName} />

        <div className='mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start'>
          <ReturnsNavigation />

          <article className='min-w-0 space-y-5'>
            <ReturnsSummary siteName={settings.siteName} />

            <ReturnsSection
              id='overview'
              number='۱'
              title='دامنه این سیاست و مهلت بازگشت'
              icon={RotateCcw}
            >
              <p>
                این سیاست درباره سفارش‌هایی است که از طریق فروشگاه اینترنتی
                {` ${settings.siteName} `}ثبت می‌شوند و نحوه انصراف از خرید، اعلام مغایرت، آسیب حمل،
                ایراد فنی، تعویض کالا و بازگشت وجه را توضیح می‌دهد.
              </p>

              <ul>
                <li>
                  مشتری در خرید اینترنتی، در حدود قوانین لازم‌الاجرای کشور، از حق انصراف برخوردار
                  است. مهلت عمومی اعمال این حق برای کالا از زمان تحویل آغاز می‌شود و کمتر از هفت روز
                  کاری نخواهد بود.
                </li>
                <li>
                  برای تسریع در رسیدگی به آسیب ظاهری، کسری یا مغایرت سفارش، بهتر است موضوع حداکثر تا
                  ۲۴ ساعت پس از تحویل همراه با عکس و ویدئو به پشتیبانی اعلام شود.
                </li>
                <li>
                  اعلام دیرهنگام به‌تنهایی حقوق قانونی مشتری را از بین نمی‌برد؛ اما ممکن است تشخیص
                  منشأ آسیب، بررسی وضعیت اولیه کالا و پیگیری از شرکت حمل را دشوار کند.
                </li>
                <li>
                  شرایط اختصاصی گارانتی یا بازگشت هر کالا، در صورت وجود، در صفحه محصول، کارت ضمانت
                  یا فاکتور همان سفارش درج می‌شود.
                </li>
              </ul>

              <NoticeBox>
                پیش از نصب یا استفاده از قطعه، کد فنی، مشخصات خودرو، سلامت ظاهری و کامل‌بودن متعلقات
                را بررسی کنید. نصب کالا ممکن است امکان تشخیص وضعیت اولیه آن را محدود کند.
              </NoticeBox>
            </ReturnsSection>

            <ReturnsSection
              id='change-of-mind'
              number='۲'
              title='انصراف از خرید بدون وجود ایراد یا مغایرت'
              icon={Clock3}
            >
              <p>
                اگر مشتری پس از تحویل و بدون وجود ایراد یا مغایرت از خرید منصرف شود، درخواست در مهلت
                قانونی بررسی می‌شود. برای حفظ امکان فروش مجدد، کالا باید در وضعیت اولیه و بدون
                استفاده یا نصب بازگردانده شود.
              </p>

              <ul>
                <li>
                  قطعه نباید روی خودرو نصب، تست عملیاتی، روغنی، کثیف، مخدوش، شکسته یا دست‌کاری شده
                  باشد.
                </li>
                <li>
                  همه متعلقات، دفترچه، لیبل، هولوگرام، کارت ضمانت، هدیه همراه و بسته‌بندی موجود باید
                  تحویل داده شوند.
                </li>
                <li>
                  بازشدن بسته‌بندی صرفاً برای بررسی متعارف کالا، به‌تنهایی موجب رد درخواست نیست؛
                  بااین‌حال بسته‌بندی نباید بیش از حد لازم آسیب دیده یا غیرقابل استفاده شده باشد.
                </li>
                <li>
                  در انصراف بدون ایراد، هزینه ارسال کالا به فروشگاه بر عهده مشتری است؛ مگر اینکه
                  قانون یا توافق دیگری مقرر کرده باشد.
                </li>
              </ul>
            </ReturnsSection>

            <ReturnsSection
              id='mismatch'
              number='۳'
              title='مغایرت، ارسال کالای اشتباه یا کسری سفارش'
              icon={PackageCheck}
            >
              <p>
                مغایرت شامل تفاوت میان کالای تحویل‌شده و اطلاعات قطعی سفارش است؛ مانند تفاوت در
                برند، کد فنی، مدل، تعداد، سمت نصب، مشخصات اصلی یا ارسال کالایی غیر از کالای ثبت‌شده.
              </p>

              <ul>
                <li>تا زمان دریافت راهنمایی پشتیبانی، کالا را نصب، استفاده یا دست‌کاری نکنید.</li>
                <li>
                  تصویر برچسب قطعه، بسته‌بندی، فاکتور، محتویات مرسوله و در صورت امکان ویدئوی بازکردن
                  بسته را ارسال کنید.
                </li>
                <li>
                  اگر مغایرت ناشی از عملکرد فروشگاه تأیید شود، تعویض کالا یا بازگشت وجه بدون تحمیل
                  هزینه ارسال برگشتی به مشتری انجام می‌شود.
                </li>
                <li>
                  تفاوت جزئی در رنگ بسته‌بندی، طراحی چاپ، کشور درج‌شده روی جعبه یا ظاهر غیرعملکردی
                  که ناشی از تغییر بسته‌بندی تولیدکننده است، در صورتی که برند، اصالت و مشخصات فنی
                  کالا یکسان باشد، لزوماً مغایرت محسوب نمی‌شود.
                </li>
              </ul>
            </ReturnsSection>

            <ReturnsSection
              id='shipping-damage'
              number='۴'
              title='آسیب‌دیدگی در فرایند حمل و تحویل'
              icon={Truck}
            >
              <ul>
                <li>
                  هنگام تحویل، پارگی شدید، خیس‌شدگی، فرورفتگی، شکستگی یا بازشدن غیرعادی بسته را
                  بررسی کنید.
                </li>
                <li>
                  اگر آسیب آشکار و جدی است، در صورت امکان از تحویل مرسوله خودداری کنید و موضوع را در
                  حضور مأمور حمل ثبت نمایید.
                </li>
                <li>
                  بسته‌بندی، برچسب ارسال، فاکتور و همه اجزای آسیب‌دیده را تا پایان بررسی نگه دارید و
                  از آن‌ها عکس یا ویدئو تهیه کنید.
                </li>
                <li>
                  اگر آسیب حمل یا بسته‌بندی نامناسب منتسب به فروشگاه یا متصدی حمل تأیید شود، هزینه
                  بازگشت و ارسال جایگزین بر عهده فروشگاه خواهد بود.
                </li>
              </ul>
            </ReturnsSection>

            <ReturnsSection
              id='technical-defect'
              number='۵'
              title='ایراد فنی، سلامت کالا و گارانتی'
              icon={Wrench}
            >
              <p>
                در صورت ادعای ایراد فنی، کالا باید برای بررسی کارشناسی در اختیار فروشگاه یا شرکت
                ارائه‌دهنده گارانتی قرار گیرد. نتیجه بررسی مشخص می‌کند ایراد ذاتی کالا بوده یا ناشی
                از نصب، سیم‌کشی، قطعات جانبی، شرایط خودرو یا استفاده نادرست است.
              </p>

              <ul>
                <li>
                  اگر کالا دارای گارانتی شرکتی باشد، نحوه رسیدگی تابع ضوابط شرکت گارانتی‌کننده خواهد
                  بود.
                </li>
                <li>
                  در کالاهای بدون گارانتی شرکتی، فروشگاه پس از بررسی یا دریافت نظر کارشناس، امکان
                  تعویض، تعمیر، بازگشت وجه یا رد درخواست را متناسب با نتیجه اعلام می‌کند.
                </li>
                <li>
                  ارائه فاکتور نصب، گزارش تعمیرکار، کد خطا، عکس یا ویدئو می‌تواند برای تشخیص دقیق‌تر
                  ضروری باشد.
                </li>
                <li>
                  اگر ایراد فنی ذاتی کالا تأیید شود، هزینه‌های متعارف بازگشت کالا بر عهده فروشگاه
                  است.
                </li>
              </ul>
            </ReturnsSection>

            <ReturnsSection
              id='installed-parts'
              number='۶'
              title='قطعات نصب‌شده، برقی و حساس'
              icon={CarFront}
            >
              <p>
                نصب قطعه معمولاً وضعیت آن را از کالای نو و بررسی‌نشده خارج می‌کند. بنابراین درخواست
                بازگشت قطعات نصب‌شده صرفاً بر اساس انصراف از خرید پذیرفته نمی‌شود؛ اما ادعای ایراد
                ذاتی، مغایرت یا ضمانت همچنان قابل بررسی است.
              </p>

              <ul>
                <li>
                  قطعات برقی و الکترونیکی مانند سنسورها، ECU، یونیت‌ها، رله‌ها، کوئل و تجهیزات مشابه
                  باید پیش از نصب از نظر کد فنی و سازگاری بررسی شوند.
                </li>
                <li>
                  برای رسیدگی به قطعات برقی یا نصب‌شده، فروشگاه می‌تواند فاکتور نصب توسط تعمیرکار،
                  گزارش دیاگ یا تأیید کارشناس را درخواست کند.
                </li>
                <li>
                  سوختگی، اتصال کوتاه، شکستگی سوکت، تغییر سیم‌کشی، نوسان برق، نصب غیراصولی یا آثار
                  دست‌کاری می‌تواند موجب خروج کالا از شرایط بازگشت یا ضمانت شود.
                </li>
                <li>
                  قطعه‌ای که صرفاً برای آزمون روی خودرو نصب شده نیز نصب‌شده محسوب می‌شود؛ مگر آنکه
                  نوع کالا یا روش بررسی مورد تأیید پشتیبانی قرار گرفته باشد.
                </li>
              </ul>

              <NoticeBox>
                غیرقابل‌مرجوع‌بودن قطعات برقی یک حکم مطلق نیست. اگر مغایرت، عیب ذاتی یا مسئولیت
                فروشگاه تأیید شود، درخواست مطابق قانون و نتیجه کارشناسی رسیدگی خواهد شد.
              </NoticeBox>
            </ReturnsSection>

            <ReturnsSection
              id='non-returnable'
              number='۷'
              title='مواردی که ممکن است قابل پذیرش نباشند'
              icon={Ban}
            >
              <p>
                جز در مواردی که ایراد ذاتی، مغایرت، آسیب حمل یا حق قانونی مشتری احراز شود، درخواست
                بازگشت در شرایط زیر ممکن است رد شود:
              </p>

              <ul>
                <li>
                  نصب، استفاده، مصرف، روغنی‌شدن، شست‌وشو، رنگ‌آمیزی، برش، سوراخ‌کاری، جوش‌کاری،
                  برنامه‌ریزی یا هرگونه تغییر در کالا.
                </li>
                <li>
                  شکستگی، سوختگی، خط‌وخش، آسیب سوکت، مخدوش‌شدن سریال یا لیبل و صدمه ناشی از نگهداری
                  یا ارسال نامناسب توسط مشتری.
                </li>
                <li>ناقص‌بودن متعلقات، هدایا، کارت ضمانت یا اجزای اصلی بسته‌بندی.</li>
                <li>
                  بازشدن یا مصرف‌شدن کالاهای مصرفی و سیالاتی که امکان فروش مجدد یا تشخیص مقدار اولیه
                  آن‌ها وجود ندارد.
                </li>
                <li>
                  قطعات سفارشی، کدنویسی‌شده، آماده‌سازی‌شده برای خودروی مشخص یا کالاهایی که به
                  درخواست اختصاصی مشتری تهیه شده‌اند، در صورتی که محدودیت بازگشت پیش از خرید به‌صورت
                  روشن اعلام شده باشد.
                </li>
                <li>
                  انتخاب اشتباه قطعه توسط مشتری، در صورتی که اطلاعات صفحه محصول صحیح بوده و کالا نصب
                  یا از وضعیت اولیه خارج شده باشد.
                </li>
              </ul>
            </ReturnsSection>

            <ReturnsSection
              id='return-process'
              number='۸'
              title='مراحل ثبت درخواست بازگشت'
              icon={FileCheck2}
            >
              <ol className='space-y-4 [counter-reset:return-step]'>
                {[
                  'از طریق صفحه تماس با ما، درخواست خود را پیش از ارسال کالا ثبت کنید.',
                  'شماره سفارش، نام کالا، دلیل درخواست و توضیح کامل وضعیت را اعلام کنید.',
                  'در موارد مغایرت، آسیب یا ایراد، تصاویر و ویدئوهای خواسته‌شده را ارسال کنید.',
                  'پس از بررسی اولیه، پشتیبانی نشانی، روش ارسال و کد یا توضیحات لازم را اعلام می‌کند.',
                  'کالا را همراه همه متعلقات، فاکتور و بسته‌بندی مناسب ارسال کنید.',
                  'پس از دریافت، نتیجه بررسی و تصمیم نهایی از طریق راه ارتباطی ثبت‌شده اعلام می‌شود.',
                ].map((item, index) => (
                  <li key={item} className='flex items-start gap-3 pr-0 before:hidden'>
                    <span className='numeric grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-extrabold text-brand'>
                      {new Intl.NumberFormat('fa-IR').format(index + 1)}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>

              <div className='mt-6 flex flex-wrap gap-3'>
                <Link
                  href='/contact'
                  className='inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-extrabold text-brand-foreground transition hover:bg-brand-hover'
                >
                  ثبت درخواست مرجوعی
                  <ChevronLeft className='size-4' />
                </Link>

                <Link
                  href='/terms'
                  className='inline-flex h-11 items-center justify-center gap-2 rounded-control border border-border bg-surface px-5 text-sm font-extrabold text-foreground-secondary transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand'
                >
                  قوانین و شرایط استفاده
                  <Scale className='size-4' />
                </Link>
              </div>
            </ReturnsSection>

            <ReturnsSection
              id='shipping-method'
              number='۹'
              title='نحوه بسته‌بندی و ارسال کالای برگشتی'
              icon={Box}
            >
              <ul>
                <li>
                  کالا را بدون هماهنگی قبلی یا به نشانی درج‌شده روی بسته اولیه ارسال نکنید؛ نشانی و
                  روش معتبر توسط پشتیبانی اعلام می‌شود.
                </li>
                <li>
                  جعبه اصلی کالا را داخل یک کارتن محافظ قرار دهید و از چسباندن برچسب ارسال یا نوشتن
                  آدرس مستقیم روی بسته‌بندی اصلی خودداری کنید.
                </li>
                <li>
                  کالا باید در برابر ضربه، رطوبت و جابه‌جایی ایمن شود. مسئولیت آسیب ناشی از
                  بسته‌بندی نامناسب در مسیر بازگشت می‌تواند بر عهده ارسال‌کننده باشد.
                </li>
                <li>
                  رسید ارسال و کد رهگیری را تا پایان فرایند نگه دارید و در صورت درخواست برای
                  پشتیبانی ارسال کنید.
                </li>
                <li>ارسال به‌صورت پس‌کرایه فقط با تأیید قبلی پشتیبانی مجاز است.</li>
              </ul>
            </ReturnsSection>

            <ReturnsSection
              id='inspection'
              number='۱۰'
              title='بررسی کالا و تعیین نتیجه'
              icon={BadgeCheck}
            >
              <p>
                پس از رسیدن کالا، وضعیت ظاهری، متعلقات، سریال، آثار نصب، تطبیق با سفارش و ادعای
                ثبت‌شده بررسی می‌شود. برای ایرادهای تخصصی ممکن است کالا به کارشناس یا شرکت گارانتی
                ارجاع داده شود.
              </p>

              <ul>
                <li>
                  در صورت تأیید درخواست، نتیجه می‌تواند شامل تعویض، ارسال قطعه صحیح، تعمیر، اعتبار
                  خرید یا بازگشت وجه باشد.
                </li>
                <li>
                  انتخاب میان تعویض و استرداد وجه با توجه به نوع درخواست، موجودی جایگزین، شرایط
                  گارانتی، نتیجه کارشناسی و حقوق قانونی مشتری انجام می‌شود.
                </li>
                <li>
                  اگر کالا سالم و مطابق سفارش تشخیص داده شود یا شرایط اعلام‌شده رعایت نشده باشد،
                  کالا با اطلاع مشتری بازگردانده می‌شود و هزینه ارسال مجدد ممکن است بر عهده مشتری
                  باشد.
                </li>
                <li>
                  زمان بررسی عادی پس از دریافت کالا بین ۲ تا ۵ روز کاری است؛ بررسی‌های تخصصی یا
                  گارانتی ممکن است بیشتر طول بکشد.
                </li>
              </ul>
            </ReturnsSection>

            <ReturnsSection
              id='refund'
              number='۱۱'
              title='بازگشت وجه و هزینه‌های ارسال'
              icon={CreditCard}
            >
              <div className='grid gap-4 md:grid-cols-3'>
                <ReturnCaseCard
                  icon={RotateCcw}
                  title='انصراف مشتری'
                  description='کالا سالم، استفاده‌نشده و در مهلت قانونی بازگردانده می‌شود.'
                  costText='هزینه بازگشت با مشتری'
                />

                <ReturnCaseCard
                  icon={PackageCheck}
                  title='مغایرت یا آسیب'
                  description='ارسال اشتباه، کسری یا آسیب منتسب به فروشگاه تأیید می‌شود.'
                  costText='هزینه بازگشت با فروشگاه'
                />

                <ReturnCaseCard
                  icon={Wrench}
                  title='ایراد فنی'
                  description='نقص ذاتی کالا پس از بررسی کارشناسی تأیید می‌شود.'
                  costText='هزینه متعارف با فروشگاه'
                />
              </div>

              <ul className='mt-6'>
                <li>
                  بازگشت وجه پس از دریافت و تأیید نهایی کالا، در اسرع وقت و در حالت عادی حداکثر طی
                  هفت روز کاری آغاز می‌شود.
                </li>
                <li>
                  مبلغ ترجیحاً به همان حساب، کارت یا ابزار پرداخت متعلق به پرداخت‌کننده بازگردانده
                  می‌شود و ممکن است احراز اطلاعات بانکی لازم باشد.
                </li>
                <li>
                  زمان نهایی نشستن مبلغ در حساب مشتری می‌تواند به فرایند بانک یا پرداخت‌یار وابسته
                  باشد.
                </li>
                <li>
                  اگر فقط بخشی از سفارش بازگردانده شود، مبلغ همان اقلام و هزینه‌های مرتبط طبق نتیجه
                  نهایی محاسبه خواهد شد.
                </li>
              </ul>
            </ReturnsSection>

            <ReturnsSection
              id='support'
              number='۱۲'
              title='پشتیبانی، شکایت و حل اختلاف'
              icon={ShieldCheck}
            >
              <p>
                هدف {settings.siteName} رسیدگی منصفانه و شفاف به درخواست‌های بازگشت است. در صورت
                اختلاف درباره وضعیت کالا یا نتیجه کارشناسی، مشتری می‌تواند مستندات خود را برای
                بازبینی مجدد به پشتیبانی ارسال کند.
              </p>

              <ul>
                <li>این سیاست حقوق قانونی مشتری و تعهدات فروشگاه را محدود نمی‌کند.</li>
                <li>
                  در صورت حل‌نشدن موضوع از طریق پشتیبانی، طرفین می‌توانند از مراجع قانونی و صنفی
                  صالح پیگیری کنند.
                </li>
                <li>
                  فروشگاه می‌تواند این سیاست را با رعایت قوانین به‌روزرسانی کند؛ نسخه معتبر و تاریخ
                  به‌روزرسانی در همین صفحه درج می‌شود.
                </li>
              </ul>

              <div className='mt-6 rounded-3xl border border-brand/15 bg-brand-soft/60 p-5'>
                <p className='text-sm leading-7 font-bold text-foreground'>
                  پیش از ارسال هر کالا، ابتدا درخواست را ثبت کنید تا روش و نشانی صحیح بازگشت از طرف
                  پشتیبانی اعلام شود.
                </p>

                <Link
                  href='/contact'
                  className='mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-brand hover:underline'
                >
                  ارتباط با پشتیبانی {settings.siteName}
                  <ChevronLeft className='size-4' />
                </Link>
              </div>
            </ReturnsSection>
          </article>
        </div>
      </div>
    </main>
  );
}

function ReturnsHero({ siteName }: { siteName: string }) {
  return (
    <section className='overflow-hidden rounded-[32px] border border-border bg-surface shadow-panel'>
      <div className='relative p-6 sm:p-8 lg:p-10'>
        <div className='pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-brand/10 blur-3xl' />
        <div className='pointer-events-none absolute -right-16 -bottom-24 size-64 rounded-full border border-brand/10' />

        <div className='relative max-w-4xl'>
          <div className='inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-extrabold text-brand'>
            <RotateCcw className='size-4' />
            بازگشت، تعویض و استرداد وجه
          </div>

          <h1 className='mt-6 text-3xl leading-[1.7] font-black text-foreground sm:text-4xl lg:text-5xl'>
            شرایط بازگشت و مرجوعی کالا در {siteName}
          </h1>

          <p className='mt-5 max-w-3xl text-base leading-9 text-foreground-secondary lg:text-lg'>
            در این صفحه شرایط انصراف از خرید، بازگشت کالای مغایر یا آسیب‌دیده، رسیدگی به ایراد فنی و
            نحوه بازگشت وجه را به‌طور شفاف توضیح داده‌ایم. پیش از نصب قطعه، این شرایط را مطالعه
            کنید.
          </p>

          <div className='mt-6 flex flex-wrap items-center gap-3 text-sm font-bold text-foreground-secondary'>
            <span className='rounded-full border border-border bg-background/70 px-4 py-2'>
              آخرین به‌روزرسانی: {LAST_UPDATED_AT}
            </span>

            <Link
              href='/contact'
              className='inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 transition hover:border-brand/30 hover:text-brand'
            >
              ثبت درخواست بازگشت
              <ChevronLeft className='size-4' />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReturnsNavigation() {
  return (
    <aside className='self-start lg:sticky lg:top-24'>
      <nav
        aria-label='فهرست شرایط بازگشت کالا'
        className='rounded-[24px] border border-border bg-surface p-3 shadow-sm'
      >
        <div className='px-3 py-2'>
          <p className='text-sm font-extrabold text-foreground'>فهرست مطالب</p>
          <p className='mt-1 text-xs leading-6 text-foreground-muted'>
            برای رفتن به هر بخش، عنوان آن را انتخاب کنید.
          </p>
        </div>

        <div className='mt-2 space-y-1 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:overscroll-contain'>
          {RETURNS_NAVIGATION.map((item, index) => (
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

function ReturnsSummary({ siteName }: { siteName: string }) {
  const items = [
    'درخواست بازگشت را پیش از ارسال کالا با پشتیبانی هماهنگ کنید.',
    'برای انصراف، کالا باید استفاده یا نصب نشده و در وضعیت اولیه باشد.',
    'در مغایرت، آسیب حمل یا ایراد تأییدشده، هزینه متعارف بازگشت با فروشگاه است.',
    'قطعات نصب‌شده و برقی بر اساس علت درخواست و نتیجه کارشناسی بررسی می‌شوند.',
  ];

  return (
    <section className='rounded-[28px] border border-brand/20 bg-brand-soft/60 p-6 shadow-sm lg:p-7'>
      <div className='flex items-start gap-4'>
        <span className='grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_rgb(255_92_0/0.22)]'>
          <CheckCircle2 className='size-6' />
        </span>

        <div className='min-w-0'>
          <h2 className='text-lg font-black text-foreground'>خلاصه شرایط بازگشت در {siteName}</h2>

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

function ReturnsSection({ id, number, title, icon: Icon, children }: ReturnsSectionProps) {
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

function ReturnCaseCard({ icon: Icon, title, description, costText }: ReturnCaseCardProps) {
  return (
    <div className='rounded-3xl border border-border bg-background/70 p-5'>
      <span className='grid size-10 place-items-center rounded-2xl bg-brand-soft text-brand'>
        <Icon className='size-5' />
      </span>

      <h3 className='mt-4 text-base font-black text-foreground'>{title}</h3>
      <p className='mt-2 text-sm leading-7 text-foreground-secondary'>{description}</p>
      <p className='mt-3 text-xs font-extrabold text-brand'>{costText}</p>
    </div>
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

function ReturnsBackground() {
  return (
    <div className='pointer-events-none absolute inset-0 overflow-hidden'>
      <div className='absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/90 to-transparent dark:from-white/5' />
      <div className='absolute top-40 -right-28 size-80 rounded-full border border-brand/10' />
      <div className='absolute top-12 -left-24 size-96 rounded-full bg-brand/5 blur-3xl' />
      <div className='absolute right-1/3 bottom-32 size-72 rounded-full bg-info/5 blur-3xl' />
    </div>
  );
}
