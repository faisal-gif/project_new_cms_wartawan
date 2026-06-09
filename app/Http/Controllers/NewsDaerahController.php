<?php

namespace App\Http\Controllers;

use App\Models\NewsDaerah;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class NewsDaerahController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        try {
            $newsDaerah = NewsDaerah::query()
                ->select('id', 'is_code', 'title', 'writer_id','cat_id', 'datepub', 'status')
                ->with([
                    'kanal:id,name',
                ])
                ->where('writer_id', $user->id_daerah)
                ->where('status',  1);

            $newsDaerah = $newsDaerah->latest()->simplePaginate(10)->withQueryString();
dd($newsDaerah);
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
