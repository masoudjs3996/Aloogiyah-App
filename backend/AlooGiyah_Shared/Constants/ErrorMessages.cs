
namespace AlooGiyah_Shared.Constants;

public static class ErrorMessages
{
    // 🧾 User Errors (1000 - 1100)
    public const string RegisterFailed = "1001: ثبت‌نام کاربر انجام نشد. لطفاً دوباره امتحان کنید.";
    public const string InvalidLogin = "1002: نام کاربری یا رمز عبور اشتباه است.";
    public const string UserNotFound = "1003: کاربری یافت نشد.";
    public const string UsernameChangeFailed = "1004: تغییر نام کاربری انجام نشد.";
    public const string PasswordChangeFailed = "1005: تغییر رمز عبور انجام نشد.";
    public const string VerificationCodeFailed = "1006: ارسال کد تأیید ناموفق بود.";
    public const string EmailVerificationFailed = "1007: کد تأیید نامعتبر یا منقضی شده است.";
    public const string PasswordResetCodeFailed = "1008: کاربری با این مشخصات یافت نشد.";
    public const string PasswordResetFailed = "1009: کد بازیابی رمز عبور نامعتبر است یا منقضی شده است.";

    // File Errors (1101 - 1200)
    public const string ErrorAddFile = "فایل ذخیره نشد ";

    //Address Errors (1201 - 1300)
    public const string ErrorNullAddress = "1201: آدرسی وجود تدارد";
    public const string ErrorAddressUpdate = "1202: آدرس برای ویرایش پیدا نشد";

    //service Request Errors (1301 - 1400)
    public const string ErrorNullServiceRequest = "1301: درخواست کاربر یافت نشد";

    //category Errors (1401 - 1500)
    public const string ErrorNullCategory = "1401: دسته‌بندی یافت نشد.";
    public const string ErrorCategoryAlreadyExists = "1402: دسته‌بندی با این نام یا کد قبلاً وجود دارد.";
    public const string ErrorCategoryNotFound = "1403: دسته‌بندی با این کد یافت نشد.";
    public const string ErrorCategoryUpdateFailed = "1404: دسته‌بندی برای ویرایش پیدا نشد.";
    public const string ErrorCategoryDeleteFailed = "1405: دسته‌بندی برای حذف پیدا نشد.";
    public const string ErrorCategoryCodeExists = "1406: کد دسته‌بندی تکراری است.";

    //Article Errors (1501 - 1600)
    public const string ErrorArticleUpdate = "1501: مقاله برای ویرایش پیدا نشد";
    public const string ErrorNullArticle = "1502: مقاله با این کد پیدا نشد";
    public const string ErrorDeleteArticle = "1503: مقاله برای حذف پیدا نشد";
    public const string ErrorNullFilterArticle = "1504: مقاله ای با این فیلتر پیدا نشد";


    public const string ErrorNullOrder = "سفارش پیدا نشد";
    public const string ErrorOrderUpdate = "خطا در ویرایش سفارش";
    public const string ErrorNullOrderItem = "آیتم سفارش پیدا نشد";
    public const string ErrorOrderItemUpdate = "خطا در ویرایش آیتم سفارش";
    public const string ErrorOrderItemDelete = "خطا در حذف آیتم سفارش";

    public const string ErrorNullProduct = "محصول پیدا نشد";
    public const string ErrorProductUpdate = "خطا در ویرایش محصول";
    public const string ErrorProductDelete = "خطا در حذف محصول";

    public const string ErrorNullDiscount = "تخفیف پیدا نشد";
    public const string ErrorDiscountUpdate = "خطا در ویرایش تخفیف";
    public const string ErrorDiscountDelete = "خطا در حذف تخفیف";


    public const string ErrorNullStatusChangeLog = "لاگ تغییر وضعیت پیدا نشد";
    public const string ErrorStatusChangeLogUpdate = "خطا در ویرایش لاگ تغییر وضعیت";
    public const string ErrorStatusChangeLogDelete = "خطا در حذف لاگ تغییر وضعیت";


    public const string ErrorNullComment = "نظر پیدا نشد";
    public const string ErrorCommentUpdate = "خطا در ویرایش نظر";
    public const string ErrorCommentDelete = "خطا در حذف نظر";

    public const string ErrorNullQualityAssessment = "ارزیابی کیفیت پیدا نشد";
    public const string ErrorQualityAssessmentUpdate = "خطا در ویرایش ارزیابی کیفیت";
    public const string ErrorQualityAssessmentDelete = "خطا در حذف ارزیابی کیفیت";

    public const string ErrorNullChatMessage = "پیام پیدا نشد";
    public const string ErrorChatMessageUpdate = "خطا در ویرایش پیام";
    public const string ErrorChatMessageDelete = "خطا در حذف پیام";

    public const string ErrorNullAgriculturalProduct = "محصول کشاورزی پیدا نشد";
    public const string ErrorAgriculturalProductUpdate = "خطا در ویرایش محصول کشاورزی";
    public const string ErrorAgriculturalProductDelete = "خطا در حذف محصول کشاورزی";

    public const string ErrorNullAgriculturalOrder = "سفارش کشاورزی پیدا نشد";
    public const string ErrorAgriculturalOrderUpdate = "خطا در ویرایش سفارش کشاورزی";
    public const string ErrorAgriculturalOrderDelete = "خطا در حذف سفارش کشاورزی";

    public const string ErrorNullAgriculturalOrderItem = "آیتم سفارش کشاورزی پیدا نشد";
    public const string ErrorAgriculturalOrderItemUpdate = "خطا در ویرایش آیتم سفارش کشاورزی";
    public const string ErrorAgriculturalOrderItemDelete = "خطا در حذف آیتم سفارش کشاورزی";

    public const string ErrorNullAuction = "حراج پیدا نشد";
    public const string ErrorAuctionUpdate = "خطا در ویرایش حراج";
    public const string ErrorAuctionDelete = "خطا در حذف حراج";
    public const string ErrorAuctionFinalize = "خطا در نهایی‌سازی حراج";
    public const string ErrorNullAuctionBid = "پیشنهاد حراج پیدا نشد";
    public const string ErrorAuctionBidUpdate = "خطا در ویرایش پیشنهاد حراج";
    public const string ErrorAuctionBidDelete = "خطا در حذف پیشنهاد حراج";

    public const string ErrorNullStatus = "وضعیت پیدا نشد";
    public const string ErrorStatusUpdate = "خطا در ویرایش وضعیت";
    public const string ErrorStatusDelete = "خطا در حذف وضعیت";

    public const string ErrorNullWarehouse = "انبار پیدا نشد";
    public const string ErrorWarehouseUpdate = "خطا در ویرایش انبار";
    public const string ErrorWarehouseDelete = "خطا در حذف انبار";
    public const string ErrorNullWarehouseInventory = "موجودی انبار پیدا نشد";
    public const string ErrorWarehouseInventoryUpdate = "خطا در ویرایش موجودی انبار";
    public const string ErrorWarehouseInventoryDelete = "خطا در حذف موجودی انبار";

    public const string ErrorNullFarm = "مزرعه پیدا نشد";
    public const string ErrorFarmUpdate = "خطا در ویرایش مزرعه";



    // 🔐 Auth Errors (2000 - 2999)
    public const string UnauthorizedAccess = "2001: دسترسی غیرمجاز.";

    // 📦 Common / General
    public const string SomethingWentWrong = "9001: خطایی رخ داده است. لطفاً بعداً دوباره تلاش کنید.";
}
