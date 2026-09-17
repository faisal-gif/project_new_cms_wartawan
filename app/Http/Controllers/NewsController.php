<?php

namespace App\Http\Controllers;

use App\Http\Requests\NewsFormRequest;
use App\Models\News;
use App\Models\NewsDaerah;
use App\Models\NewsNasional;
use App\Models\Tags;
use App\Models\User;
use App\Notifications\NewsSubmittedNotification;
use App\Services\CdnService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Inertia;

use function Illuminate\Support\defer;


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
            // Hanya data DB lokal (cepat). Data daerah/nasional di-defer di prop 'distribution'.
            $query = News::query()
                ->select('id', 'is_code', 'title', 'writer_id', 'created_at', 'distribution_status')
                ->withCount('notes')
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
        } catch (QueryException $e) {
            report($e);

            // Paginator kosong yang valid untuk frontend Inertia/React, plus toast agar tidak terlihat "belum ada berita"
            $news = new Paginator([], 10);
            $request->session()->now('error', 'Gagal memuat daftar berita. Silakan coba lagi.');
        }

        return Inertia::render('News/Index', [
            'news'    => $news,
            'filters' => $request->only(['search']),

            // Status distribusi dari DB remote, dimuat setelah halaman tampil.
            // Format: [is_code => ['news_daerah' => ..., 'news_nasional' => ...]]
            'distribution' => Inertia::defer(function () use ($news) {
                $codes = collect($news->items())->pluck('is_code')->filter()->values();
                if ($codes->isEmpty()) {
                    return [];
                }

                try {
                    $daerah = NewsDaerah::whereIn('is_code', $codes)
                        ->with('kanal:id,name')
                        ->get(['id', 'is_code', 'title', 'status', 'cat_id'])
                        ->keyBy('is_code');

                    $nasional = NewsNasional::whereIn('is_code', $codes)
                        ->with('kanal:catnews_id,catnews_title')
                        ->get(['news_id', 'is_code', 'news_title', 'news_status', 'catnews_id'])
                        ->keyBy('is_code')
                        ->each(function ($item) {
                            // Tambahkan URL berita nasional
                            $slugKanal = Str::slug($item->kanal->catnews_title ?? 'uncategorized');
                            $slugTitle = Str::slug($item->news_title);
                            $item->url = config('services.portal_nasional.url') . "/{$slugKanal}/{$item->news_id}/{$slugTitle}";
                        });

                    return $codes->mapWithKeys(fn($code) => [$code => [
                        'news_daerah'   => $daerah->get($code),
                        'news_nasional' => $nasional->get($code),
                    ]]);
                } catch (\Exception $e) {
                    report($e);
                    return null; // null = gagal dimuat, frontend tampilkan "Data tidak tersedia"
                }
            }),
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
                report($e);
                return back()->withInput()->withErrors(['error' => 'Gagal mengunggah gambar ke server CDN.']);
            }
        }

        $content = $request->content;
        $tagIds = [];

        // 2. Mulai Transaksi Database (Hanya untuk operasi tulis DB yang cepat)
        DB::beginTransaction();

        try {


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

            if ($request->has('tag') && is_array($request->tag)) {
                $syncData = [];
                foreach ($request->tag as $index => $tagName) {
                    $cleanTagName = strtolower(trim($tagName));

                    $tag = Tags::firstOrCreate(['name' => $cleanTagName]);

                    // Simpan id tag beserta urutan index-nya (0, 1, 2, dst)
                    $syncData[$tag->id] = ['sort_order' => $index];
                }

                // Eksekusi sync menggunakan array berpasangan key-value ini
                $news->tags()->sync($syncData);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            report($e);
            return back()->withInput()->withErrors(['error' => 'Gagal menyimpan berita: Terjadi kesalahan pada sistem.']);
        }

        // 5. Notifikasi Editor dijalankan SETELAH response terkirim (tidak menahan user).
        // Di luar try di atas: jika gagal, berita tetap tersimpan dan user tidak melihat pesan gagal palsu.
        defer(function () use ($news, $user) {
            try {
                $editors = User::role('editor')->get();
                if ($editors->isNotEmpty()) {
                    Notification::send($editors, new NewsSubmittedNotification(
                        $news->id,
                        $news->title,
                        $user->name
                    ));
                }
            } catch (\Exception $e) {
                report($e);
            }
        });

        return redirect()->route('news.index')->with('success', 'Berita berhasil disimpan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(News $news)
    {
        $user = Auth::user();

        // Keamanan: writer hanya boleh melihat berita miliknya
        if ((int) $news->writer_id !== (int) $user->id) {
            return redirect()->route('news.index')->with('error', 'Data berita tidak ditemukan atau Anda tidak memiliki hak akses.');
        }

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
            ]);

            return Inertia::render('News/Show', [
                'news' => $news
            ]);
        } catch (\Exception $e) {
            // Menangani error DB/Relasi lainnya
            report($e);
            return redirect()->route('news.index')->with('error', 'Terjadi kesalahan saat memuat detail berita.');
        }
    }
}
