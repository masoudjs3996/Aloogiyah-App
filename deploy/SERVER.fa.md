# راه‌اندازی روی سرور لینوکسی

این بسته شامل API، وب کاربران، پنل مدیریت و تنظیمات انتشار است. اپ موبایل روی سرور اجرا نمی‌شود.

## آماده‌سازی

Docker Engine و افزونه Docker Compose و Nginx باید روی سرور نصب باشند. سه دامنه وب، API و پنل را به سرور متصل کنید و برای آن‌ها گواهی HTTPS بگیرید.

```sh
mkdir -p aloogiyah
tar -xzf aloogiyah-server.tar.gz -C aloogiyah
cd aloogiyah
cp .env.example .env
chmod 600 .env
```

فایل `.env` را با دامنه‌های واقعی، رمز دیتابیس، کلید JWT تصادفی حداقل ۳۲ بایتی و کد وضعیت اولیه محصول از دیتابیس تکمیل کنید. تنظیمات ایمیل و اطلاعات حقوقی را نیز وارد کنید. فایل نمونه، رمز واقعی ندارد. برای تولید کلید می‌توانید از `openssl rand -hex 48` استفاده کنید.

## ساخت و انتقال داده

```sh
docker compose config --quiet
docker compose build --pull
docker compose up -d --wait database
```

از دیتابیس قبلی با `pg_dump --no-owner --no-acl` خروجی متنی بگیرید و آن را با نام `backup.sql` روی سرور بگذارید. سپس:

```sh
docker compose exec -T database sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backup.sql
docker compose run --rm api --migrate
docker compose create api
```

پوشه‌های فایل قبلی را نیز منتقل کنید. اگر آن‌ها را در پوشه `restore` گذاشته‌اید:

```sh
docker compose cp restore/uploads/. api:/app/uploads/
docker compose cp restore/ChatFiles/. api:/app/ChatFiles/
docker compose cp restore/BusinessDocuments/. api:/app/BusinessDocuments/
docker compose run --rm --user root --entrypoint sh api -c 'chown -R app:app /app/uploads /app/ChatFiles /app/BusinessDocuments'
docker compose up -d --wait api web admin
docker compose ps
curl --fail http://127.0.0.1:5056/health/live
curl --fail http://127.0.0.1:5056/health/ready
```

اگر فایل قبلی ندارید، دستورات کپی را اجرا نکنید. دیتابیس خالی به داده پایه معتبر نیاز دارد؛ مهاجرت فقط جایگزین انتقال داده نیست.

## دامنه و HTTPS

در `deploy/nginx.example.conf` دامنه‌ها و مسیر گواهی‌ها را جایگزین کنید و تنظیمات را در Nginx میزبان قرار دهید. پس از `sudo nginx -t` سرویس را reload کنید. فقط پورت‌های 80 و 443 برای دسترسی عمومی لازم‌اند؛ پورت‌های برنامه روی loopback و دیتابیس فقط در شبکه Docker هستند. مقدار `TRUSTED_PROXY_IP` باید IP واقعی و مورد اعتماد پراکسی از دید کانتینر باشد.

تمام سرویس‌ها عضو شبکه `aloogiyah-network` هستند. چهار volume مجزا برای دیتابیس، آپلود عمومی، فایل گفت‌وگو و مدارک کسب‌وکار استفاده می‌شود. چند volume برای جدا نگه‌داشتن داده‌ها عمدی است.

## نگهداری

```sh
docker compose logs --tail=100 api web admin
docker compose exec -T database sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl' > backup.sql
```

از هر سه volume فایل نیز پشتیبان بگیرید. دستور `docker compose down -v` داده‌های پایدار را حذف می‌کند. برای ارتقا، پس از پشتیبان‌گیری build، مهاجرت و `up -d` را اجرا کنید. تغییر دامنه عمومی به build مجدد وب و پنل نیاز دارد.

وجود سه Dockerfile طبیعی است: API، وب و پنل محیط اجرای متفاوت دارند. Compose از هرکدام image و container مستقل می‌سازد؛ PostgreSQL از image آماده استفاده می‌کند.

ساخت و اجرای Docker در سیستم آماده‌سازی بسته تأیید نشده است. ورود، ثبت سفارش، آپلود، گفت‌وگو و بازیابی پشتیبان باید روی سرور آزمایشی بررسی شوند. اتصال درگاه و پیامک مطابق گزارش قبلی هنوز نیازمند تکمیل و آزمون واقعی است.
