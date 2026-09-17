<?php

namespace App\Http\Controllers;

use App\Models\News;
use App\Models\NewsDaerah;
use App\Models\NewsNasional;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Data dari DB remote (daerah & nasional) di-defer: halaman tampil dulu,
        // data menyusul, agar koneksi remote yang lambat tidak menahan halaman.
        return Inertia::render('Dashboard', [
            'recentNews' => Inertia::defer(function () use ($user) {
                try {
                    // 1. Ambil 5 Berita Terakhir (beserta relasinya)
                    return News::where('writer_id', $user->id)
                        ->select('id', 'is_code', 'title', 'created_at')
                        ->with([
                            'newsDaerah:id,is_code,title,status,cat_id',
                            'newsDaerah.kanal:id,name',
                            'newsNasional:news_id,is_code,news_title,news_status,catnews_id',
                            'newsNasional.kanal:catnews_id,catnews_title'
                        ])
                        ->latest()
                        ->take(5)
                        ->get();
                } catch (Exception $e) {
                    report($e);
                    return null; // null = gagal dimuat (beda dengan [] = memang kosong)
                }
            }),

            'stats' => Inertia::defer(function () use ($user) {
                try {
                    // 2. Hitung Statistik, cache 5 menit per user.
                    // Exception di dalam remember tidak ikut di-cache.
                    return Cache::remember("dashboard-stats:{$user->id}", 300, fn() => [
                        'total_master' => News::where('writer_id', $user->id)->count(),
                        // Tanpa id portal jangan query: where(null) jadi IS NULL = hitung berita orang lain
                        'tayang_daerah' => $user->id_daerah
                            ? NewsDaerah::where('writer_id', $user->id_daerah)->where('status', 1)->count()
                            : 0,
                        'tayang_nasional' => $user->id_nasional
                            ? NewsNasional::where('journalist_id', $user->id_nasional)->where('news_status', 1)->count()
                            : 0,
                    ]);
                } catch (Exception $e) {
                    report($e);

                    // DB relasi mati: null = "data tidak tersedia", jangan tampilkan 0 yang menyesatkan
                    return [
                        'total_master' => News::where('writer_id', $user->id)->count(),
                        'tayang_daerah' => null,
                        'tayang_nasional' => null,
                    ];
                }
            }),
        ]);
    }
}
