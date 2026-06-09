<?php

namespace App\Http\Controllers;

use App\Services\SsoService;
use App\Models\Writer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SsoController extends Controller
{
    public function handleSso(Request $request, SsoService $ssoService)
    {
        $token = $request->query('token');

        if (!$token) {
            abort(403, 'Akses ditolak: Token tidak ada.');
        }

        $email = $ssoService->decryptAndValidateToken($token);

        if (!$email) {
            abort(403, 'Akses ditolak: Token tidak valid atau sudah kedaluwarsa.');
        }

        // Cari user di database web baru karena dipastikan datanya sudah ada
        $user = Writer::where('email', $email)->first();

        if (!$user) {
            // Fallback jika ternyata data belum tersinkronisasi
            abort(404, 'Akun Anda belum tersinkronisasi ke sistem baru.');
        }

        // Parameter kedua adalah $remember (boolean)
        $rememberMe = true;

        // Login user dengan instruksi "Remember Me"
        Auth::login($user, $rememberMe);

        // Redirect ke halaman utama SPA Inertia/React Anda
        return redirect()->route('dashboard');
    }
}
