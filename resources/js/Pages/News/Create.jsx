import InputEditor from '@/Components/InputEditor';
import InputImage from '@/Components/InputImage';
import InputTag from '@/Components/InputTag';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import React from 'react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        content: '',
        tag: [],
        image_thumbnail: '',
        image_watermark: true,
        image_caption: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('news.store'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Berita" />

            {/* Tambahan pb-24 di mobile agar konten bawah tidak tertutup oleh sticky bar */}
            <div className="py-6 sm:py-8 bg-muted/30 pb-24 sm:pb-8">
                <div className="mx-auto max-w-7xl">

                    {/* Header Navigasi */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Tulis Berita Baru</h2>
                            <p className="text-muted-foreground text-sm mt-1">Buat dan publikasikan artikel berita terbaru.</p>
                        </div>
                        {/* Tombol Aksi - Hanya tampil di Desktop (sm:flex) */}
                        <div className="hidden sm:flex items-center gap-3">
                            <Button variant="outline" onClick={() => window.history.back()}>
                                <X className="w-4 h-4 mr-2" /> Batal
                            </Button>
                            <Button onClick={submit} disabled={processing}>
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Menyimpan...' : 'Simpan Berita'}
                            </Button>
                        </div>
                    </div>

                    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* KOLOM KIRI (UTAMA) */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-muted shadow-sm">
                                <CardContent className="p-4 sm:p-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-base font-semibold">
                                            Judul Berita <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="Masukkan judul berita di sini..."
                                            className="text-base sm:text-lg font-medium py-5 sm:py-6"
                                            autoFocus
                                        />
                                        {errors?.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="content" className="text-base font-semibold">
                                            Konten Artikel <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="min-h-[400px] sm:min-h-[600px] border rounded-md overflow-hidden">
                                            <InputEditor
                                                value={data.content}
                                                onChange={(newContent) => setData('content', newContent)}
                                                height={typeof window !== 'undefined' && window.innerWidth < 640 ? 450 : 650}
                                            />
                                        </div>
                                        {errors?.content && <p className="text-sm text-destructive mt-1">{errors.content}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* KOLOM KANAN (SIDEBAR) */}
                        <div className="space-y-6">
                            {/* Card Media & Thumbnail */}
                            <Card className="border-muted shadow-sm">
                                <CardHeader className="pb-4 border-b px-4 sm:px-6">
                                    <CardTitle className="text-lg">Media & Cover</CardTitle>
                                    <CardDescription>Gambar utama yang akan tampil di halaman depan.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 space-y-5">
                                    <div className="space-y-2">
                                        <InputImage
                                            value={data.image_thumbnail}
                                            onChange={(file) => setData('image_thumbnail', file)}
                                            label=""
                                        />
                                        {errors?.image_thumbnail && <p className="text-sm text-destructive mt-1">{errors.image_thumbnail}</p>}
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <Label htmlFor="image_caption" className="font-semibold text-sm">Caption / Sumber Gambar</Label>
                                        <Textarea
                                            id="image_caption"
                                            value={data.image_caption}
                                            onChange={(e) => setData('image_caption', e.target.value)}
                                            placeholder="Contoh: Foto dokumentasi oleh Tim Redaksi"
                                            className="resize-none"
                                            rows={3}
                                        />
                                        {errors?.image_caption && <p className="text-sm text-destructive mt-1">{errors.image_caption}</p>}
                                    </div>

                                    <div className="flex items-center space-x-2 pt-2 border-t mt-4">
                                        <Checkbox
                                            id="watermark"
                                            checked={data.image_watermark}
                                            onCheckedChange={(checked) => setData('image_watermark', checked)}
                                        />
                                        <Label htmlFor="watermark" className="text-sm cursor-pointer font-medium leading-tight">
                                            Pasang Watermark pada Thumbnail
                                        </Label>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card Pengaturan SEO / Meta */}
                            <Card className="border-muted shadow-sm">
                                <CardHeader className="pb-4 border-b px-4 sm:px-6">
                                    <CardTitle className="text-lg">Metadata</CardTitle>
                                    <CardDescription>Tag membantu pengelompokan berita dan SEO.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 space-y-4">
                                    <div className='space-y-2'>
                                        <InputTag
                                            label="Topik / Tag"
                                            value={data.tag}
                                            onChange={(tags) => setData('tag', tags)}
                                        />
                                        {errors?.tag && <p className="text-sm text-destructive mt-1">{errors.tag}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </form>

                </div>
            </div>

            {/* STICKY BOTTOM BAR KHUSUS MOBILE */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex gap-3">
                <Button
                    variant="outline"
                    className="flex-1 bg-background"
                    asChild
                >
                    <Link href={route('news.index')}>
                        <X className="w-4 h-4 mr-2" /> Batal
                    </Link>
                </Button>
                <Button
                    className="flex-1"
                    onClick={submit}
                    disabled={processing}
                >
                    <Save className="w-4 h-4 mr-2" />
                    {processing ? 'Menyimpan...' : 'Simpan'}
                </Button>
            </div>

        </AuthenticatedLayout>
    );
}