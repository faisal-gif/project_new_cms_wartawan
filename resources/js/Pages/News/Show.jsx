import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, CheckCircle2, Clock, Globe, MapPin, Tag } from 'lucide-react';

export default function Show({ news }) {
    // Helper untuk merender status distribusi yang lebih elegan
    const renderDistributionStatus = (status) => {
        switch (Number(status)) {
            case 2:
                return <Badge className="badge bg-success text-white">Sudah di Semua Jaringan</Badge>;
            case 1:
                return <Badge className="badge bg-info text-white">Tayang Parsial (Salah Satu)</Badge>;
            case 0:
            default:
                return <Badge className="badge bg-secondary text-gray-500">Draft / Belum Tayang</Badge>;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Detail Berita: ${news.title}`} />

            <div className="py-6 sm:py-8 bg-muted/30 min-h-screen">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Header Navigasi */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                        <div className="flex flex-col gap-2">
                            <Link href={route('news.index')} className="text-sm text-muted-foreground hover:text-primary flex items-center transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar
                            </Link>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
                                {news.title}
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                                {renderDistributionStatus(news.distribution_status)}
                                <span className="text-xs text-muted-foreground">
                                    Kode: {news.is_code}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Button asChild variant="outline">
                                <Link href={route('news.edit', news.id)}>Edit Berita</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Layout Grid Utama */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                        {/* KOLOM KIRI: Konten Artikel */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-muted shadow-sm overflow-hidden">
                                {news.image_thumbnail && (
                                    <div className="w-full bg-muted/50 border-b">
                                        <img
                                            src={news.image_thumbnail}
                                            alt={news.image_caption || 'Thumbnail berita'}
                                            className="w-full h-auto max-h-[400px] object-cover"
                                        />
                                        {news.image_caption && (
                                            <p className="text-xs text-center p-2 text-muted-foreground italic bg-muted/20">
                                                {news.image_caption}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <CardContent className="p-6 sm:p-8">
                                    {/* Render Konten HTML dengan aman */}
                                    <div
                                        className="prose prose-slate max-w-none prose-img:rounded-lg prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-headings:font-bold prose-p:leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: news.content }}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* KOLOM KANAN: Metadata & Distribusi */}
                        <div className="space-y-6">

                            {/* Card Status Distribusi Platform */}
                            <Card className="border-muted shadow-sm">
                                <CardHeader className="pb-4 border-b px-6 bg-muted/10">
                                    <CardTitle className="text-lg">Jejaring Distribusi</CardTitle>
                                    <CardDescription>Status penayangan di berbagai portal</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-5">

                                    {/* Distribusi Daerah */}
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-semibold text-foreground">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                            Portal Daerah
                                        </div>
                                        {news.news_daerah ? (
                                            <div className="pl-6 text-sm text-muted-foreground space-y-1">
                                                <p>Status: <span className="font-medium text-foreground">{news.news_daerah.status || 'Pending'}</span></p>
                                                <p>Kanal: <span className="font-medium text-foreground">{news.news_daerah.kanal?.name || '-'}</span></p>
                                            </div>
                                        ) : (
                                            <p className="pl-6 text-sm text-muted-foreground italic">Tidak didistribusikan ke Daerah</p>
                                        )}
                                    </div>

                                    {/* Distribusi Nasional */}
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-semibold text-foreground">
                                            <Globe className="w-4 h-4 mr-2 text-emerald-500" />
                                            Portal Nasional
                                        </div>
                                        {news.news_nasional ? (
                                            <div className="pl-6 text-sm text-muted-foreground space-y-1">
                                                <p>Status: <span className="font-medium text-foreground">{news.news_nasional.news_status || 'Pending'}</span></p>
                                                <p>Kanal: <span className="font-medium text-foreground">{news.news_nasional.kanal?.catnews_title || '-'}</span></p>
                                            </div>
                                        ) : (
                                            <p className="pl-6 text-sm text-muted-foreground italic">Tidak didistribusikan ke Nasional</p>
                                        )}
                                    </div>

                                </CardContent>
                            </Card>

                            {/* Card Tags */}
                            <Card className="border-muted shadow-sm">
                                <CardHeader className="pb-4 border-b px-6 bg-muted/10">
                                    <CardTitle className="text-lg flex items-center">
                                        <Tag className="w-4 h-4 mr-2" /> Topik / Tags
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {news.tags && news.tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {news.tags.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground"
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Belum ada tag yang ditambahkan.</p>
                                    )}
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}