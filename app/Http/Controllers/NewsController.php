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
                ->select('id', 'is_code', 'title', 'writer_id', 'created_at', 'distribution_status')
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
        DB::beginTransaction();

        try {
            $applyWatermark = $request->boolean('image_watermark') ? '1' : '0';
            $thumbnailUrl = null;

            // 1. Proses Upload image_thumbnail ke CDN
            if ($request->hasFile('image_thumbnail')) {
                $file = $request->file('image_thumbnail');
                $nameThumbnail = Str::slug($request->title, '-Thumbnail');
                $thumbnailUrl = $this->cdnService->uploadImage($file, $nameThumbnail, 1, 'convert', $applyWatermark) ?? null;
            }

            // Inisialisasi variabel untuk konten dan penampung ID tag
            $content = $request->content;
            $tagIds = [];

            // 2. Proses Auto-Link Tag ke dalam Konten
            // 2. Proses Auto-Link Tag ke dalam Konten
            if ($request->has('tag') && is_array($request->tag)) {
                foreach ($request->tag as $tagName) {
                    $cleanTagName = strtolower(trim($tagName));

                    // Simpan atau ambil tag dari database
                    $tag = Tags::firstOrCreate([
                        'name' => $cleanTagName
                    ]);
                    $tagIds[] = $tag->id;

                    // REGEX: Memastikan tidak merusak HTML yang sudah ada
                    $pattern = '/(?!(?:[^<]+>|[^>]+<\/a>))\b(' . preg_quote($tag->name, '/') . ')\b/iu';

                    // Route untuk tag (sesuaikan dengan nama route Anda)
                    $tagSlug = Str::slug($tag->name);
                    $tagUrl =  'https://timesindonesia.co.id/tag/' . $tagSlug;

                    // Template HTML Anchor
                    $replacement = '<a href="' . $tagUrl . '" class="text-blue-600 hover:underline font-semibold" title="Baca lebih lanjut tentang $1">$1</a>';

                    // PERUBAHAN DI SINI:
                    // Ubah angka 1 menjadi 2 pada parameter ke-4 ($limit)
                    // Jika kata tersebut muncul 5 kali, hanya 2 yang pertama yang akan menjadi link.
                    // Jika hanya muncul 1 kali, fungsi tetap aman dan hanya mengubah 1 kata tersebut.
                    $content = preg_replace($pattern, $replacement, $content, 2);
                }
            }

            // 3. Simpan tabel News dengan konten yang sudah termodifikasi
            $news = News::create([
                'is_code'         => Str::random(8),
                'writer_id'       => $user->id,
                'title'           => $request->title,
                'image_thumbnail' => $thumbnailUrl,
                'image_caption'   => $request->image_caption,
                'content'         => $content, // Menggunakan konten hasil Regex
                'distribution_status'          => 0,
            ]);

            // 4. Sync Tags
            if (!empty($tagIds)) {
                $news->tags()->sync($tagIds);
            }

            DB::commit();

            // 5. Notifikasi Editor
            $editors = User::role('editor')->get();
            if ($editors->isNotEmpty()) {
                Notification::send(
                    $editors,
                    new NewsSubmittedNotification(
                        $news->id,
                        $news->title,
                        $user->name
                    )
                );
            }

            return redirect()->route('news.index')->with('success', 'Berita berhasil disimpan!');
        } catch (\Exception $e) {
            DB::rollBack();
            // Lebih baik menambahkan log untuk mempermudah tracing error di production
            Log::error('Error saving news: ' . $e->getMessage());
            return back()->withInput()->withErrors(['error' => 'Gagal menyimpan berita: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(News $news)
    {
        $user = Auth::user();

        try {
            // Menggunakan Eager Loading (with) untuk mencegah N+1 Query Problem
            $news->load([
                'tags:id,name', // Hanya ambil id dan name dari tabel tags
                'newsDaerah:id,is_code,title,status,cat_id',
                'newsDaerah.kanal:id,name',
                'newsNasional:news_id,is_code,news_title,news_status,catnews_id',
                'newsNasional.kanal:catnews_id,catnews_title'
            ])
                ->where('writer_id', $user->id) // Keamanan: Pastikan writer hanya bisa melihat miliknya
                ->firstOrFail(); // Jika tidak ditemukan, akan otomatis masuk ke catch block


            return Inertia::render('News/Show', [
                'news' => $news
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // Menangani error jika ID tidak ditemukan atau bukan milik user
            return redirect()->route('news.index')->withErrors(['error' => 'Data berita tidak ditemukan atau Anda tidak memiliki hak akses.']);
        } catch (\Exception $e) {
            // Menangani error DB/Relasi lainnya
            Log::error('DB Show News Error: ' . $e->getMessage());
            return redirect()->route('news.index')->withErrors(['error' => 'Terjadi kesalahan saat memuat detail berita.']);
        }
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
