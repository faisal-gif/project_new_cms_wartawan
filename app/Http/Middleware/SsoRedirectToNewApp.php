<?php

namespace App\Http\Middleware;

use App\Services\SsoService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class SsoRedirectToNewApp
{
    protected $ssoService;

    public function __construct(SsoService $ssoService)
    {
        $this->ssoService = $ssoService;
    }

    public function handle(Request $request, Closure $next)
    {
        // 1. Pastikan user sudah login
        if (auth()->check()) {

            $user = auth()->user();

            // 2. Cek apakah kolom redirect_new_web bernilai true untuk user ini
            if ($user->redirect_new_back === true) {

                // 3. Mencegah Infinite Loop: Izinkan user melakukan aksi logout di web lama
                // Sesuaikan 'logout' dengan nama route logout Anda yang sebenarnya
                if ($request->routeIs('logout') || $request->is('logout')) {
                    return $next($request);
                }

                // Generate token SSO
                $token = $this->ssoService->generateToken($user->email);

                // Redirect ke Web Baru (Breeze)
                $newWebUrl = "https://cmsnew.tin.co.id/sso-login?token=" . urlencode($token);

                return Inertia::location($newWebUrl);
            }
        }

        // Lanjutkan request secara normal jika redirect_new_web = false
        return $next($request);
    }
}
