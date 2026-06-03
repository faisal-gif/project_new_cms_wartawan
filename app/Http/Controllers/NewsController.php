<?php

namespace App\Http\Controllers;

use App\Http\Requests\NewsFormRequest;
use App\Models\News;
use App\Models\Tags;
use App\Models\User;
use App\Notifications\NewsSubmittedNotification;
use App\Services\CdnService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Inertia;

class NewsController extends Controller
{

    public function __construct(
        protected CdnService $cdnService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        $user = Auth::user();
        // 1. Ambil data berita (DB 1 & Relasi DB 2/3)
        try {
            $query = News::query()
                ->select('id', 'is_code', 'title', 'writer_id', 'created_at')
                ->with([
                    'newsDaerah:id,is_code,title,status,cat_id',
                    'newsDaerah.kanal:id,name', // Sesuaikan kolom id & name dengan tabel KanalDaerah
                    'newsNasional:news_id,is_code,news_title,news_status,catnews_id',
                    'newsNasional.kanal:catnews_id,catnews_title' // Sesuaikan kolom tabel KanalNasional
                ])
                ->where('writer_id', $user->id);

            // Search
            if ($request->search) {
                $query->where(function ($q) use ($request) {
                    $search = $request->search;
                    if (is_numeric($search)) {
                        $q->where('id', $search);
                    } else {
                        $q->where('title', 'like', "%{$search}%");
                    }
                });
            }

            $news = $query->latest()->simplePaginate(10)->withQueryString();
        } catch (QueryException $e) {
            // Jika DB News atau relasinya mati, kembalikan data kosong yang valid untuk frontend
            Log::error('DB News/Relasi Error: ' . $e->getMessage());

            // Paginator kosong agar Inertia/Vue tidak error saat loop/render
            $news = new Paginator([], 10);
        }


        return Inertia::render('News/Index', [
            'news'    => $news,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('News/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(NewsFormRequest $request)
    {

        $user = Auth::user();
        // Memulai Database Transaction
        DB::beginTransaction();

        try {


            $applyWatermark = $request->boolean('image_watermark') ? '1' : '0';

            // 2. Proses Upload image_thumbnail ke CDN
            $thumbnailUrl = null;

            // Pastikan input dari frontend (React) bernama 'image_thumbnail'
            if ($request->hasFile('image_thumbnail')) {
                $file = $request->file('image_thumbnail');
                $nameThumbnail = Str::slug($request->title, '-Thumbnail');
                // Ambil URL dari response JSON CDN
                $thumbnailUrl = $this->cdnService->uploadImage($file, $nameThumbnail, 1, 'convert', $applyWatermark) ?? null;
            }
            // 1. Simpan tabel News
            $news = News::create([
                'is_code'     => Str::random(8),
                'writer_id'   => $user->id,
                'title'       => $request->title,
                'image_thumbnail' => $thumbnailUrl, // Simpan URL thumbnail dari CDN
                'image_caption' => $request->image_caption,
                'content'     => $request->content,
            ]);

            // 3. Proses Tags
            if ($request->has('tag')) {
                $tagIds = collect($request->tag)->map(function ($tagName) {
                    return Tags::firstOrCreate([
                        'name' => strtolower(trim($tagName))
                    ])->id;
                });

                $news->tags()->sync($tagIds);
            }

            // Jika semua sukses, simpan permanen ke database
            DB::commit();

            $editors = User::role('editor')->get();

            if ($editors->isNotEmpty()) {
                Notification::send(
                    $editors,
                    new NewsSubmittedNotification(
                        $news->id,
                        $news->title,
                        Auth::user()->name // Mengambil nama wartawan yang sedang login
                    )
                );
            }

            return redirect()->route('news.index')->with('success', 'Berita berhasil disimpan!');
        } catch (\Exception $e) {
            // Jika ada error (termasuk dari CDN), batalkan insert ke database
            DB::rollBack();

            return back()->withInput()->withErrors(['error' => 'Gagal menyimpan berita: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(News $news)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(News $news)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, News $news)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(News $news)
    {
        //
    }
}
