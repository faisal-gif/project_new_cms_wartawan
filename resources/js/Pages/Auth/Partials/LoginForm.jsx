import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';

// Import komponen shadcn/ui
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';

export default function LoginForm() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    // State untuk toggle lihat password
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    // Class standar untuk input agar mirip dengan gambar (background abu-abu terang)
    const customInputClass = "bg-[#f4f6f9] border-gray-300 focus-visible:ring-[#473bea] focus-visible:border-[#473bea] text-base py-6 rounded-lg";

    return (
        <Card className="rounded-[1.5rem] shadow-2xl p-4 lg:p-6 border-none bg-white">
            <CardHeader className="mb-4">
                <CardTitle className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    Selamat Datang
                </CardTitle>
                <CardDescription className="text-base text-gray-500 font-medium mt-1">
                    Masuk ke akun Anda untuk melanjutkan
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={submit} className="space-y-6">
                    {/* Field Email / Username */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-500 font-normal">
                            Username atau Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoComplete="username"
                            placeholder="bagus.satria23@gmail.com"
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            className={`${customInputClass} ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        />
                        {errors.email && (
                            <p className="text-sm font-medium text-red-500 mt-1">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Field Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-500 font-normal">
                            Password
                        </Label>
                        <div className="relative flex items-center">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={data.password}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                onChange={(e) => setData('password', e.target.value)}
                                // pr-16 agar teks tidak tertutup tombol mata
                                className={`${customInputClass} pr-16 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                            />
                            
                            {/* Tombol Eye (Lihat Password) dengan Garis Pemisah */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-0 top-0 bottom-0 px-4 border-l border-gray-300 bg-[#f4f6f9] rounded-r-lg text-gray-600 hover:text-gray-900 focus:outline-none flex items-center justify-center transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm font-medium text-red-500 mt-1">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Field Remember Me */}
                    <div className="flex items-center space-x-3 pt-2">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', checked)}
                            // Membuat checkbox sedikit lebih bulat sesuai desain modern
                            className="rounded-sm border-gray-400 data-[state=checked]:bg-[#473bea] data-[state=checked]:border-[#473bea]"
                        />
                        <Label
                            htmlFor="remember"
                            className="text-sm font-normal text-gray-600 cursor-pointer"
                        >
                            Remember me
                        </Label>
                    </div>

                    {/* Button Submit */}
                    <Button 
                        type="submit" 
                        // Warna background ungu/biru spesifik sesuai gambar
                        className="w-full rounded-xl text-base font-semibold py-6 mt-4 bg-[#473bea] hover:bg-[#382dd0] text-white shadow-md transition-all" 
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            "Log in"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}