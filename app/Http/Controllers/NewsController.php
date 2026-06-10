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

        try {
            $query = News::query()
                ->select('id', 'is_code', 'title', 'writer_id', 'created_at', 'distribution_status')
                ->withCount('notes')
                ->with([
                    'newsDaerah:id,is_code,title,status,cat_id',
                    'newsDaerah.kanal:id,name',
                    'newsNasional:news_id,is_code,news_title,news_status,catnews_id',
                    'newsNasional.kanal:catnews_id,catnews_title'
                ])
                ->where('writer_id', $user->id);

            // Search Filter
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

            // Transformasi data untuk menambahkan URL pada newsNasional
            $news->through(function ($item) {
                if ($item->newsNasional) {
                    // Ambil title kanal dengan fallback string kosong jika null
                    $kanalName = $item->newsNasional->kanal->catnews_title ?? 'uncategorized';

                    // Generate slugs
                    $slugKanal = Str::slug($kanalName);
                    $slugTitle = Str::slug($item->newsNasional->news_title);

                    // Injeksi properti url ke dalam object newsNasional
                    $item->newsNasional->url = "https://timesindonesia.co.id/{$slugKanal}/{$item->newsNasional->news_id}/{$slugTitle}";
                }

                return $item;
            });
        } catch (QueryException $e) {
            Log::error('DB News/Relasi Error: ' . $e->getMessage());

            // Paginator kosong yang valid untuk frontend Inertia/React
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

        // 1. Eksekusi Upload Jaringan di LUAR Database Transaction
        // Kita tidak ingin menahan koneksi database selama CDN sedang memproses gambar
        $thumbnailUrl = null;
        if ($request->hasFile('image_thumbnail')) {
            try {
                $applyWatermark = $request->boolean('image_watermark') ? '1' : '0';
                $nameThumbnail = Str::limit(Str::slug($request->title), 100, '');;
                $thumbnailUrl = $this->cdnService->uploadImage(
                    $request->file('image_thumbnail'),
                    $nameThumbnail,
                    3,
                    'convert',
                    $applyWatermark
                );
            } catch (\Exception $e) {
                Log::error('CDN Upload Error: ' . $e->getMessage());
                return back()->withInput()->withErrors(['error' => 'Gagal mengunggah gambar ke server CDN.']);
            }
        }

        $content = $request->content;
        $tagIds = [];

        // 2. Mulai Transaksi Database (Hanya untuk operasi tulis DB yang cepat)
        DB::beginTransaction();

        try {
            if ($request->has('tag') && is_array($request->tag)) {
                foreach ($request->tag as $tagName) {
                    $cleanTagName = strtolower(trim($tagName));

                    $tag = Tags::firstOrCreate(['name' => $cleanTagName]);
                    $tagIds[] = $tag->id;

                    // Optimasi Regex
                    $pattern = '/(?!(?:[^<]+>|[^>]+<\/a>))\b(' . preg_quote($tag->name, '/') . ')\b/iu';
                    $tagUrl =  'https://timesindonesia.co.id/tag/' . Str::slug($tag->name);
                    $replacement = '<a href="' . $tagUrl . '" class="text-blue-600 hover:underline font-semibold" title="Baca lebih lanjut tentang $1">$1</a>';

                    $content = preg_replace($pattern, $replacement, $content, 2);
                }
            }

            // 3. Simpan tabel News
            $news = News::create([
                'is_code'             => Str::random(8),
                'writer_id'           => $user->id,
                'title'               => $request->title,
                'image_thumbnail'     => $thumbnailUrl,
                'image_caption'       => $request->image_caption,
                'content'             => $content,
                'distribution_status' => 0,
            ]);

            // 4. Sync Tags
            if (!empty($tagIds)) {
                $news->tags()->sync($tagIds);
            }

            DB::commit();

            // 5. Notifikasi Editor (Wajib menggunakan Queue)
            $editors = User::role('editor')->get();
            if ($editors->isNotEmpty()) {
                // Notifikasi ini harus dilempar ke queue worker agar tidak memblokir response
                Notification::send($editors, new NewsSubmittedNotification(
                    $news->id,
                    $news->title,
                    $user->name
                ));
            }

            return redirect()->route('news.index')->with('success', 'Berita berhasil disimpan!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error saving news: ' . $e->getMessage());
            return back()->withInput()->withErrors(['error' => 'Gagal menyimpan berita: Terjadi kesalahan pada sistem.']);
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
                'newsNasional.kanal:catnews_id,catnews_title',
                'notes.user:id,full_name',
                'notes.user.roles:id,name'
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
