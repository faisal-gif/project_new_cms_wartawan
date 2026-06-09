<?php

namespace App\Http\Controllers;

use App\Models\NewsNasional;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NewsNasionalController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        try {
            $newsDaerah = NewsNasional::query()
                ->select('news_id', 'is_code', 'news_title', 'writer_id','cat_id', 'datepub', 'status')
                ->with([
                    'kanal:id,name',
                ])
                ->where('writer_id', $user->id_daerah)
                ->where('status',  1);

            $newsDaerah = $newsDaerah->latest()->simplePaginate(10)->withQueryString();

            return Inertia::render('Daerah/News/Index', [
                'newsDaerah' => $newsDaerah,
            ]);
        } catch (QueryException $e) {
            Log::error('Error fetching news daerah: ' . $e->getMessage());
            return Inertia::render('Daerah/News/Index', [
                'newsDaerah' => [],
                'error' => 'Terjadi kesalahan saat mengambil data news daerah.',
            ]);
        }
    }
}
