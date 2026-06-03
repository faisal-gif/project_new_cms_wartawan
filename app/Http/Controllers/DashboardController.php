<?php

namespace App\Http\Controllers;

use App\Models\News;
use App\Models\NewsDaerah;
use App\Models\NewsNasional;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
       
        $user = Auth::user();

        try {
            // 1. Ambil 5 Berita Terakhir (beserta relasinya)
            $recentNews = News::where('writer_id', $user->id)
                ->select('id', 'is_code', 'title', 'created_at')
                ->with([
                    'newsDaerah:id,is_code,title,status,cat_id',
                    'newsDaerah.kanal:id,name', // Sesuaikan kolom id & name dengan tabel KanalDaerah
                    'newsNasional:news_id,is_code,news_title,news_status,catnews_id',
                    'newsNasional.kanal:catnews_id,catnews_title' // Sesuaikan kolom tabel KanalNasional
                ])
                ->latest()
                ->take(5)
                ->get();


            $totalMaster = News::where('writer_id', $user->id)->count();
            // 2. Hitung Statistik
            // Ambil semua is_code milik user ini
            $tayangDaerah = 0;
            $tayangNasional = 0;


            // Jika punya is_code, hitung jumlah yang sudah tayang di db masing-masing
            // Asumsi status '1' adalah Publish
            $tayangDaerah = NewsDaerah::where('writer_id', $user->id_daerah)
                ->where('status', 1)
                ->count();

            $tayangNasional = NewsNasional::where('journalist_id', $user->id_nasional)
                ->where('news_status', 1)
                ->count();
        } catch (Exception $e) {
            Log::error('Dashboard Error: ' . $e->getMessage());

            // Jika database relasi mati, kembalikan nilai kosong agar FE tidak crash
            $recentNews = [];
            $totalMaster = News::where('writer_id', $user->id)->count(); // Setidaknya master tetap terhitung
            $tayangDaerah = 0;
            $tayangNasional = 0;
        }

        return Inertia::render('Dashboard', [
            'recentNews' => $recentNews,
            'stats' => [
                'total_master' => $totalMaster,
                'tayang_daerah' => $tayangDaerah,
                'tayang_nasional' => $tayangNasional,
            ]
        ]);
    }
}
