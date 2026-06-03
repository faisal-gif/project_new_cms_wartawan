import React from 'react';
import LoginForm from './Partials/LoginForm'; // Sesuaikan path jika berbeda
import { Head } from '@inertiajs/react';

export default function Login({ canResetPassword, status }) {
    return (
        <div className="min-h-screen flex bg-background">
            <Head title="Log in" />

            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 p-12 flex-col justify-center relative overflow-hidden bg-[#313742]">
                <div className="relative z-10 max-w-xl animate-in slide-in-from-left duration-700">
                    <div className="mb-8">
                        <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-1">
                            TIMES
                        </h1>
                        <h1 className="text-5xl xl:text-6xl font-bold text-[#f04343] leading-tight mb-1">
                            INDONESIA
                        </h1>
                        <h1 className="text-5xl xl:text-6xl font-bold text-[#e8b007] leading-tight">
                            NETWORK
                        </h1>
                    </div>

                    <blockquote className="space-y-4 text-gray-300">
                        <p className="text-lg leading-relaxed italic">
                            "Orang boleh pandai setinggi langit, tapi selama ia tidak menulis, ia akan hilang di dalam masyarakat dan dari sejarah. Menulis adalah bekerja untuk keabadian."
                        </p>
                        <footer className="text-sm text-gray-400">
                            — Pramoedya Ananta Toer
                        </footer>
                    </blockquote>

                    <div className="mt-12 pt-8 border-t border-slate-500">
                        <p className="text-sm text-gray-400">
                            Platform berita terpercaya Indonesia
                        </p>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-20 right-20 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-[#272b33] lg:bg-[#272b33]">
                <div className="w-full max-w-md">
                    
                    {/* Pesan Status Flash */}
                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-600 bg-green-500/10 p-3 rounded-md border border-green-500/20">
                            {status}
                        </div>
                    )}

                    <LoginForm canResetPassword={canResetPassword} />

                    {/* Mobile branding */}
                    <div className="lg:hidden mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Times Indonesia Network © {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}