const ENGLISH_MESSAGE_MAP: Readonly<Record<string, string>> = {
  'Verification code sent successfully': 'کد تأیید با موفقیت ارسال شد.',
  'Verification code is invalid or expired':
    'کد تأیید نامعتبر است یا منقضی شده است.',
  'This account is inactive': 'این حساب کاربری غیرفعال است.',
  'Authentication is no longer valid':
    'اعتبار ورود شما به پایان رسیده است. لطفاً دوباره وارد شوید.',
  'Authentication token is required':
    'برای انجام این عملیات باید وارد حساب کاربری شوید.',
  'Authentication token is invalid or expired':
    'اعتبار ورود شما به پایان رسیده است. لطفاً دوباره وارد شوید.',
  'Authentication token is invalid':
    'اطلاعات ورود شما معتبر نیست. لطفاً دوباره وارد شوید.',
  'Authentication token is no longer valid':
    'اعتبار ورود شما به پایان رسیده است. لطفاً دوباره وارد شوید.',
  'Authentication is required':
    'برای انجام این عملیات باید وارد حساب کاربری شوید.',
  'You do not have permission to access this resource':
    'اجازه دسترسی به این بخش را ندارید.',
  'Unable to send verification code':
    'ارسال کد تأیید در حال حاضر امکان‌پذیر نیست. لطفاً دوباره تلاش کنید.',
  'Unsupported OTP delivery mode': 'روش ارسال کد تأیید پشتیبانی نمی‌شود.',
  'Console OTP delivery is forbidden outside development':
    'روش ارسال کد تأیید در این محیط مجاز نیست.',
  'Vehicle variant not found': 'تیپ خودرو یافت نشد.',
  'Vehicle make not found': 'برند خودرو یافت نشد.',
  'Vehicle model not found': 'مدل خودرو یافت نشد.',
  'Brand not found': 'برند یافت نشد.',
  'Category not found': 'دسته‌بندی یافت نشد.',
  'Product not found': 'محصول یافت نشد.',
  'Cart item not found': 'آیتم سبد خرید یافت نشد.',
  'Cart not found': 'سبد خرید یافت نشد.',
  'Guest cart not found': 'سبد خرید مهمان یافت نشد.',
  'Authentication is required to merge a cart':
    'برای ادغام سبد خرید باید وارد حساب کاربری شوید.',
  'Guest cart token is required': 'اطلاعات سبد خرید مهمان موجود نیست.',
  'Customer address not found': 'آدرس موردنظر یافت نشد.',
  'Customer vehicle not found': 'خودروی موردنظر یافت نشد.',
  'Order not found': 'سفارش یافت نشد.',
  'User not found': 'کاربر یافت نشد.',
  'Blog category not found': 'دسته‌بندی بلاگ یافت نشد.',
  'Blog post not found': 'مقاله بلاگ یافت نشد.',
  'At least one field must be provided':
    'حداقل یکی از فیلدها باید ارسال شود.',
  'A record with the same unique value already exists':
    'رکوردی با این اطلاعات قبلاً ثبت شده است.',
  'Category cannot be deleted because it has dependent records':
    'این دسته‌بندی به‌دلیل داشتن اطلاعات وابسته قابل حذف نیست.',
  'A vehicle model with variants cannot be moved to another make':
    'مدلی که دارای تیپ خودرو است نمی‌تواند به برند دیگری منتقل شود.',
  'yearFrom cannot be greater than yearTo':
    'سال شروع نمی‌تواند بعد از سال پایان باشد.',
  'createdFrom cannot be greater than createdTo':
    'تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.',
  'Address label must not be empty': 'عنوان آدرس نمی‌تواند خالی باشد.',
  'Recipient first name must not be empty': 'نام گیرنده نمی‌تواند خالی باشد.',
  'Recipient last name must not be empty':
    'نام خانوادگی گیرنده نمی‌تواند خالی باشد.',
  'Province must not be empty': 'استان نمی‌تواند خالی باشد.',
  'City must not be empty': 'شهر نمی‌تواند خالی باشد.',
  'Address line must not be empty': 'نشانی نمی‌تواند خالی باشد.',
  'Postal code must contain exactly 10 digits':
    'کد پستی باید دقیقاً ۱۰ رقم باشد.',
  'Recipient mobile number is invalid': 'شماره موبایل گیرنده معتبر نیست.',
  'mobile must be a valid Iranian mobile number':
    'شماره موبایل باید یک شماره معتبر ایرانی باشد.',
  'code must contain exactly 4 digits': 'کد تأیید باید دقیقاً ۴ رقم باشد.',
  'Value cannot be converted to JSON':
    'امکان پردازش اطلاعات ارسال‌شده وجود ندارد.',
  'Dashboard time boundaries could not be calculated':
    'دریافت اطلاعات داشبورد در حال حاضر امکان‌پذیر نیست. لطفاً دوباره تلاش کنید.',
  'Authenticated user was not returned':
    'اطلاعات کاربر واردشده دریافت نشد.',
  'Failed to fetch': 'ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.',
  'fetch failed': 'ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.',
  'Load failed': 'دریافت اطلاعات انجام نشد. لطفاً دوباره تلاش کنید.',
  'Network Error': 'ارتباط با شبکه برقرار نشد. لطفاً دوباره تلاش کنید.',
  'Network request failed':
    'ارتباط با شبکه برقرار نشد. لطفاً دوباره تلاش کنید.',
  'The operation was aborted': 'عملیات لغو شد.',
  'Request aborted': 'عملیات لغو شد.',
  'Bad Request': 'اطلاعات ارسال‌شده معتبر نیست.',
  Unauthorized: 'برای انجام این عملیات باید وارد حساب کاربری شوید.',
  Forbidden: 'اجازه انجام این عملیات را ندارید.',
  'Not Found': 'اطلاعات درخواستی یافت نشد.',
  Conflict: 'اطلاعات هم‌زمان تغییر کرده است. لطفاً دوباره تلاش کنید.',
  'Unprocessable Entity': 'امکان پردازش اطلاعات ارسال‌شده وجود ندارد.',
  'Too Many Requests':
    'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.',
  'Internal Server Error':
    'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.',
  'Service Unavailable':
    'سرویس موقتاً در دسترس نیست. لطفاً دوباره تلاش کنید.',
};

const FIELD_LABELS: Readonly<Record<string, string>> = {
  mobile: 'شماره موبایل',
  phone: 'شماره موبایل',
  code: 'کد تأیید',
  name: 'نام',
  title: 'عنوان',
  slug: 'نامک',
  description: 'توضیحات',
  content: 'محتوا',
  status: 'وضعیت',
  role: 'نقش کاربر',
  quantity: 'تعداد',
  price: 'قیمت',
  stockQuantity: 'موجودی',
  yearFrom: 'سال شروع',
  yearTo: 'سال پایان',
  createdFrom: 'تاریخ شروع',
  createdTo: 'تاریخ پایان',
  postalCode: 'کد پستی',
  province: 'استان',
  city: 'شهر',
  addressLine: 'نشانی',
  recipientFirstName: 'نام گیرنده',
  recipientLastName: 'نام خانوادگی گیرنده',
  recipientMobile: 'شماره موبایل گیرنده',
  brandId: 'برند',
  categoryId: 'دسته‌بندی',
  productId: 'محصول',
  vehicleMakeId: 'برند خودرو',
  vehicleModelId: 'مدل خودرو',
  vehicleVariantId: 'تیپ خودرو',
};

function toPersianDigits(value: string): string {
  return value.replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field.trim()] ?? 'فیلد موردنظر';
}

function getStatusFallback(status?: number): string {
  switch (status) {
    case 400:
      return 'اطلاعات ارسال‌شده معتبر نیست.';
    case 401:
      return 'برای انجام این عملیات باید وارد حساب کاربری شوید.';
    case 403:
      return 'اجازه انجام این عملیات را ندارید.';
    case 404:
      return 'اطلاعات درخواستی یافت نشد.';
    case 409:
      return 'اطلاعات هم‌زمان تغییر کرده است. لطفاً دوباره تلاش کنید.';
    case 413:
      return 'حجم فایل ارسال‌شده بیشتر از حد مجاز است.';
    case 415:
      return 'فرمت فایل ارسال‌شده پشتیبانی نمی‌شود.';
    case 422:
      return 'امکان پردازش اطلاعات ارسال‌شده وجود ندارد.';
    case 429:
      return 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.';
    case 500:
      return 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.';
    case 502:
    case 503:
    case 504:
      return 'سرویس موقتاً در دسترس نیست. لطفاً دوباره تلاش کنید.';
    default:
      return 'درخواست با خطا مواجه شد. لطفاً دوباره تلاش کنید.';
  }
}

function localizeValidationMessage(message: string): string | null {
  let match = message.match(/^property (.+) should not exist$/i);
  if (match) {
    return `ارسال ${getFieldLabel(match[1])} مجاز نیست.`;
  }

  match = message.match(/^(.+) should not be empty$/i);
  if (match) {
    return `${getFieldLabel(match[1])} نمی‌تواند خالی باشد.`;
  }

  match = message.match(/^(.+) must not be empty$/i);
  if (match) {
    return `${getFieldLabel(match[1])} نمی‌تواند خالی باشد.`;
  }

  match = message.match(/^(.+) must be a string$/i);
  if (match) {
    return `${getFieldLabel(match[1])} باید متن باشد.`;
  }

  match = message.match(/^(.+) must be an integer number$/i);
  if (match) {
    return `${getFieldLabel(match[1])} باید یک عدد صحیح باشد.`;
  }

  match = message.match(
    /^(.+) must be a number conforming to the specified constraints$/i,
  );
  if (match) {
    return `${getFieldLabel(match[1])} باید یک عدد معتبر باشد.`;
  }

  match = message.match(/^(.+) must be a boolean value$/i);
  if (match) {
    return `${getFieldLabel(match[1])} باید مقدار بله یا خیر داشته باشد.`;
  }

  match = message.match(/^(.+) must be an email$/i);
  if (match) {
    return `${getFieldLabel(match[1])} باید یک ایمیل معتبر باشد.`;
  }

  match = message.match(/^(.+) must be a UUID$/i);
  if (match) {
    return `${getFieldLabel(match[1])} معتبر نیست.`;
  }

  match = message.match(/^(.+) must be one of the following values:/i);
  if (match) {
    return `مقدار انتخاب‌شده برای ${getFieldLabel(match[1])} معتبر نیست.`;
  }

  match = message.match(/^(.+) must match (.+) regular expression$/i);
  if (match) {
    return `فرمت ${getFieldLabel(match[1])} معتبر نیست.`;
  }

  match = message.match(/^(.+) must be longer than or equal to (\d+) characters$/i);
  if (match) {
    return `${getFieldLabel(match[1])} باید حداقل ${toPersianDigits(match[2])} نویسه باشد.`;
  }

  match = message.match(/^(.+) must be shorter than or equal to (\d+) characters$/i);
  if (match) {
    return `${getFieldLabel(match[1])} باید حداکثر ${toPersianDigits(match[2])} نویسه باشد.`;
  }

  match = message.match(/^(.+) must contain exactly (\d+) digits$/i);
  if (match) {
    return `${getFieldLabel(match[1])} باید دقیقاً ${toPersianDigits(match[2])} رقم باشد.`;
  }

  match = message.match(/^(.+) must be a positive number$/i);
  if (match) {
    return `${getFieldLabel(match[1])} باید یک عدد مثبت باشد.`;
  }

  match = message.match(/^(.+) must be a positive integer$/i);
  if (match) {
    return `${getFieldLabel(match[1])} باید یک عدد صحیح مثبت باشد.`;
  }

  match = message.match(/^(.+) must not be less than (\d+)$/i);
  if (match) {
    return `${getFieldLabel(match[1])} باید حداقل ${toPersianDigits(match[2])} باشد.`;
  }

  match = message.match(/^(.+) must not be greater than (\d+)$/i);
  if (match) {
    return `${getFieldLabel(match[1])} باید حداکثر ${toPersianDigits(match[2])} باشد.`;
  }

  return null;
}

export function localizeApiMessage(message: string, status?: number): string {
  const normalizedMessage = message.trim();

  if (!normalizedMessage) {
    return getStatusFallback(status);
  }

  const separatedMessages = normalizedMessage
    .split(/\s+،\s+|\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (separatedMessages.length > 1) {
    return separatedMessages
      .map((part) => localizeApiMessage(part, status))
      .join('، ');
  }

  const withoutTrailingPunctuation = normalizedMessage.replace(/[.!]+$/u, '');
  const exactTranslation =
    ENGLISH_MESSAGE_MAP[normalizedMessage] ??
    ENGLISH_MESSAGE_MAP[withoutTrailingPunctuation];
  if (exactTranslation) {
    return exactTranslation;
  }

  const maximumCartQuantityMatch = normalizedMessage.match(
    /^Maximum quantity per cart item is (\d+)$/i,
  );
  if (maximumCartQuantityMatch) {
    return `حداکثر تعداد مجاز برای هر آیتم سبد خرید ${toPersianDigits(maximumCartQuantityMatch[1])} عدد است.`;
  }

  const requestStatusMatch = normalizedMessage.match(
    /^Request failed with status code (\d+)$/i,
  );
  if (requestStatusMatch) {
    return getStatusFallback(Number(requestStatusMatch[1]));
  }

  const validationTranslation = localizeValidationMessage(normalizedMessage);
  if (validationTranslation) {
    return validationTranslation;
  }

  if (/[\u0600-\u06ff]/u.test(normalizedMessage)) {
    return normalizedMessage;
  }

  if (/[a-z]/i.test(normalizedMessage)) {
    return getStatusFallback(status);
  }

  return normalizedMessage;
}
