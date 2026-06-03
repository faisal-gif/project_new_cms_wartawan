<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class CdnService
{

    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.tin_cdn.url');
        $this->apiKey = config('services.tin_cdn.api_key');
    }

    public function uploadImage(
        UploadedFile $file,
        string $fileNameToCDN,
        int $categoryId = 6,
        string $processType = 'convert',
        bool $addWatermark = false
    ): string {
        $response = Http::timeout(30)
            ->withHeaders([
                'x-api-key' => $this->apiKey
            ])
            ->attach(
                'file',
                file_get_contents($file->getPathname()),
                $file->getClientOriginalName()
            )
            ->post("{$this->baseUrl}/images/upload", [
                'name'          => $fileNameToCDN,
                'category_id'   => $categoryId,
                'process_type'  => $processType,
                'add_watermark' => $addWatermark ? '1' : '0',
            ]);

        if ($response->failed()) {
            // Log detail error ke file log Laravel (storage/logs/laravel.log) 
            // agar memudahkan debugging tanpa mengekspos detail ke user.
            Log::error('CDN Upload API Error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            throw new Exception('Gagal mengunggah gambar ke peladen CDN.');
        }

        $responseData = $response->json();
        $cdnImageUrl = $responseData['data']['url'] ?? $responseData['url'] ?? null;

        if (!$cdnImageUrl) {
            Log::error('CDN Response Invalid', ['response' => $responseData]);
            throw new Exception('Format respons CDN tidak valid atau URL tidak ditemukan.');
        }

        return $cdnImageUrl;
    }
}
