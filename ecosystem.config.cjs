// Proses latar belakang CMS Wartawan untuk pm2.
// Web dilayani nginx + PHP-FPM (bukan pm2). Aplikasi ini tidak menjalankan Reverb server;
// broadcast notifikasi dikirim ke Reverb milik aplikasi editor lewat queue di bawah.
//
//   pm2 start ecosystem.config.cjs      # pertama kali
//   pm2 save && pm2 startup             # jalan otomatis setelah server reboot
//   pm2 restart ecosystem.config.cjs    # setiap selesai deploy (worker memuat kode baru)

module.exports = {
    apps: [
        {
            name: 'cms-wartawan-queue',
            cwd: __dirname,
            script: 'artisan',
            interpreter: 'php',
            // --timeout harus < retry_after queue database (90 detik, config/queue.php)
            // --max-time: worker keluar tiap jam lalu dihidupkan ulang pm2 (mencegah memory leak)
            args: 'queue:work --sleep=3 --tries=3 --timeout=60 --max-time=3600',
            exec_mode: 'fork',
            instances: 1,
            autorestart: true,
            restart_delay: 5000,
            // Berhenti dengan rapi: beri waktu job yang sedang jalan untuk selesai (> --timeout)
            kill_signal: 'SIGTERM',
            kill_timeout: 65000,
        },
    ],
};
