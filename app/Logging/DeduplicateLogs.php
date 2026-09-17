<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Handler\DeduplicationHandler;
use Monolog\Handler\WhatFailureGroupHandler;
use Monolog\Level;

/**
 * Tap untuk channel notifikasi (Telegram):
 * - error yang sama hanya dikirim sekali per jam (mis. DB mati tidak membanjiri grup)
 * - kegagalan kirim (token salah, Telegram down) tidak ikut menggagalkan request
 */
class DeduplicateLogs
{
    public function __invoke(Logger $logger): void
    {
        $monolog = $logger->getLogger();

        $monolog->setHandlers(array_map(
            fn($handler) => new DeduplicationHandler(
                new WhatFailureGroupHandler([$handler]),
                storage_path('logs/telegram-dedup.log'),
                Level::Error,
                3600,
            ),
            $monolog->getHandlers(),
        ));
    }
}
