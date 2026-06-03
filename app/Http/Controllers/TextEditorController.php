<?php

namespace App\Http\Controllers;

use App\Services\CdnService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TextEditorController extends Controller
{
      public function __construct(
        protected CdnService $cdnService
    ) {}

   public function upload(Request $request)
    {
        // 1. Validasi input dari frontend
        $request->validate([
            'file'      => 'required|image|max:8192', 
            'name'      => 'required|string|min:3|max:120',
            'watermark' => 'sometimes|boolean',
        ]);

        try {
            $file = $request->file('file');
            $nameImage = Str::slug($request->input('name'), '-Body');
            $applyWatermark = $request->boolean('watermark') ? '1' : '0';

            // 2. Kirim ke CDN
            $imageUrl = $this->cdnService->uploadImage($file, $nameImage, 4, 'convert', $applyWatermark);

            // Jika service CDN me-return null/gagal diam-diam
            if (!$imageUrl) {
                return response()->json(['message' => 'Gagal mendapatkan URL dari server CDN.'], 500);
            }

            // 3. Return URL untuk TinyMCE
            return response()->json([
                'location' => $imageUrl,
                'name'     => $request->name
            ]);

        } catch (\Exception $e) {
            // Tangkap error dari CDN (misal: timeout, auth error)
            // Bisa juga ditambahkan Log::error($e->getMessage()); untuk debugging backend
            return response()->json([
                'message' => 'Terjadi kesalahan pada server CDN saat mengunggah gambar.'
            ], 500);
        }
    }
}
