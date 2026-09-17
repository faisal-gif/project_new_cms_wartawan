# CMS Wartawan

CMS untuk wartawan menulis berita "master" yang kemudian didistribusikan ke portal **Nasional** dan **Daerah**. Wartawan bisa memantau status tayang beritanya di kedua portal.

**Stack:** Laravel 12 · Inertia.js 2 · React 18 · Tailwind 4 / shadcn · MySQL · Laravel Reverb

## Arsitektur singkat

| Bagian | Keterangan |
|---|---|
| DB lokal (`mysql`) | Tabel `writers` (akun login), `news`, `tags`, `news_tags`, `news_notes`, `users` (editor, dengan role spatie), session, cache, jobs |
| DB daerah (`mysql_daerah`) | DB portal daerah, **hanya dibaca**: status & jumlah berita tayang |
| DB nasional (`mysql_nasional`) | DB portal nasional, **hanya dibaca**: status & jumlah berita tayang |
| CDN (`TIN_CDN_URL`) | Upload & konversi gambar (thumbnail dan gambar di editor) |
| Reverb + queue | Notifikasi realtime ke editor saat berita baru masuk |

- Login memakai model `App\Models\Writer`. Model `User` adalah akun **editor** (penerima notifikasi).
- Akun wartawan dibuat oleh admin. **Tidak ada** registrasi publik maupun halaman profil.
- Data dari DB daerah/nasional dimuat **deferred** (setelah halaman tampil) dan koneksinya memakai timeout 5 detik. Jika gagal, UI menampilkan "Data tidak tersedia", bukan angka 0.

## Kebutuhan

- PHP 8.2+ (ekstensi `pdo_mysql`, `curl`, `mbstring`)
- Composer 2
- Node.js 22+
- MySQL/MariaDB
- Akses jaringan ke DB daerah, DB nasional, dan CDN

## Setup lokal

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

Isi `.env`:

| Key | Keterangan |
|---|---|
| `DB_CONNECTION=mysql`, `DB_*` | DB lokal CMS |
| `DB_*_DAERAH` | Koneksi DB portal daerah (read-only) |
| `DB_*_NASIONAL` | Koneksi DB portal nasional (read-only) |
| `TIN_CDN_URL`, `TIN_CDN_API_KEY` | API CDN gambar |
| `PORTAL_NASIONAL_URL` | Domain portal untuk link berita nasional (default `https://timesindonesia.co.id`) |
| `SESSION_DRIVER=database`, `CACHE_STORE=database`, `QUEUE_CONNECTION=database` | Default yang dipakai |
| `BROADCAST_CONNECTION=reverb`, `REVERB_*` | Notifikasi realtime |
| `LOG_STACK`, `LOG_TELEGRAM_*` | Lihat bagian Logging |

> ⚠️ **Skema DB belum ada di repo.** Hanya ada migration `writer_sessions`. Tabel lain (`news`, `tags`, `news_tags`, `writers`, dst.) harus disalin dari DB yang sudah berjalan. Pastikan `news_tags` punya kolom `sort_order`.

Jalankan semua proses dev (server, queue, log, vite) sekaligus:

```bash
composer dev
```

## Production

```bash
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan config:cache
php artisan route:cache
```

Yang wajib berjalan di server:

- **PHP-FPM** (atau LiteSpeed). Notifikasi editor dikirim via `defer()` *setelah* response terkirim. Ini hanya bekerja dengan `fastcgi_finish_request`, **tidak** dengan `php artisan serve`.
- **Queue worker**: `php artisan queue:work`. Broadcast notifikasi editor masuk queue.
- **Reverb**: `php artisan reverb:start`.

## Logging & notifikasi error

- `LOG_STACK=daily,telegram`: log file per hari (disimpan `LOG_DAILY_DAYS`, default 14) plus notifikasi ke grup Telegram.
- Telegram hanya menerima level `LOG_TELEGRAM_LEVEL` (default `error`). Error yang sama dikirim **maksimal 1× per jam**. Jika Telegram gagal, request tidak ikut gagal.
- Setup bot: buat bot di **@BotFather** → masukkan ke grup → ambil `chat.id` dari `https://api.telegram.org/bot<TOKEN>/getUpdates` → isi `LOG_TELEGRAM_BOT_TOKEN` dan `LOG_TELEGRAM_CHAT_ID`.

## Test & CI

```bash
php artisan test
```

GitHub Actions (`.github/workflows/ci.yml`) menjalankan build frontend dan test di setiap push/PR ke `main`.

> Saat ini sebagian besar test bawaan Breeze masih gagal (memakai tabel `users` & skema belum di repo), sehingga langkah test di CI **belum memblokir**. Lihat backlog tech debt #5/#6.

## Catatan migrasi

SSO ke/dari web lama sudah dihapus. Key `SSO_SECRET_KEY` dan kolom `writers.redirect_new_back` di server tidak dipakai lagi dan boleh dihapus.
