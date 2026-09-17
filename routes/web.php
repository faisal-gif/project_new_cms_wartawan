<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\NewsDaerahController;
use App\Http\Controllers\TextEditorController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::post('/upload-image', [TextEditorController::class, 'upload']);
    // Edit/update/hapus belum ada: tambahkan ke only() saat fiturnya dibuat (dengan cek pemilik)
    Route::resource('/news', NewsController::class)->only(['index', 'create', 'store', 'show']);
});

Route::middleware('auth')->prefix('daerah')->name('daerah.')->group(function () {
    Route::get('/news', [NewsDaerahController::class, 'index'])->name('news.index');
});

require __DIR__ . '/auth.php';
