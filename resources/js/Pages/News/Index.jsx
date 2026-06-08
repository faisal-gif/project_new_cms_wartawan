import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/Components/ui/pagination";
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

import React, { useState, useEffect } from 'react';
// TAMBAHKAN MessageSquare DI SINI
import { Plus, Search, Eye, MessageSquare } from 'lucide-react'; 
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';

export default function Index({ news, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchTerm !== (filters?.search || '')) {
                router.get(
                    route(route().current()),
                    { search: searchTerm },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true
                    }
                );
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchTerm, filters?.search]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper untuk status Daerah & Nasional
    function getStatusBadge(status) {
        switch (status) {
            case "pending":
            case '0':
            case 0:
                return <Badge variant="secondary" className="shadow-none text-[10px]">Pending</Badge>;
            case "Review":
            case '2':
            case 2:
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 shadow-none border-yellow-200 text-[10px]">Review</Badge>;
            case "On Pro":
            case '3':
            case 3:
                return <Badge variant="destructive" className="shadow-none text-[10px]">OnPro</Badge>;
            case "Publish":
            case '1':
            case 1:
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 shadow-none border-green-200 text-[10px]">Publish</Badge>;
            default:
                return <Badge variant="outline" className="shadow-none text-[10px]">{status}</Badge>;
        }
    }

    // Helper untuk Distribution Status Utama
    function getDistributionBadge(status) {
        switch (Number(status)) {
            case 2:
                return <Badge className="bg-green-500 text-white shadow-none text-[10px] font-medium">Sudah di Semua Jaringan</Badge>;
            case 1:
                return <Badge className="bg-blue-500 text-white shadow-none text-[10px] font-medium">Tayang Parsial</Badge>;
            case 0:
            default:
                return <Badge variant="secondary" className="shadow-none text-[10px] font-medium">Draft / Belum Tayang</Badge>;
        }
    }

    return (
        <AuthenticatedLayout>
            <Head title="Daftar Berita" />

            <div className="py-6 sm:py-12 bg-muted/30 min-h-screen">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Card className="shadow-sm border-muted">
                        <CardHeader className="px-4 sm:px-6 border-b pb-4 bg-muted/10">
                            <CardTitle>Manajemen Berita</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-5">

                            {/* Toolbar Pencarian & Tambah Berita */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari judul berita atau ID..."
                                        className="pl-9 bg-background"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button asChild className="w-full md:w-auto shadow-sm">
                                    <Link href={route('news.create')}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tulis Berita
                                    </Link>
                                </Button>
                            </div>

                            {/* =========================================
                                TAMPILAN MOBILE (KARTU)
                            ========================================== */}
                            <div className="flex flex-col gap-4 md:hidden">
                                {news.data.length > 0 ? (
                                    news.data.map((item) => (
                                        <Card key={item.id} className="shadow-sm overflow-hidden border-muted">
                                            <CardContent className="p-4 space-y-3">
                                                {/* Header Kartu: ID, Tanggal */}
                                                <div className="flex justify-between items-start border-b pb-2">
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold text-muted-foreground">ID: #{item.id}</span>
                                                        <div className="text-[11px] text-muted-foreground flex items-center">
                                                            {formatDate(item.created_at)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Judul Utama Berita -> Tautan ke halaman Show */}
                                                <Link href={route('news.show', item.id)} className="block group">
                                                    <h3 className="font-semibold text-sm leading-snug group-hover:text-blue-600 group-hover:underline transition-colors line-clamp-2">
                                                        {item.title}
                                                    </h3>
                                                </Link>

                                                {/* Status Distribusi & Notifikasi Catatan */}
                                                <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b border-dashed">
                                                    {getDistributionBadge(item.distribution_status)}
                                                    {item.notes_count > 0 && (
                                                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 shadow-none border-orange-200 text-[10px] flex items-center gap-1 font-medium">
                                                            <MessageSquare className="w-3 h-3" /> 
                                                            {item.notes_count} Catatan
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Status Daerah & Nasional */}
                                                <div className="grid grid-cols-2 gap-3 pt-1">
                                                    {/* Blok Daerah */}
                                                    <div className="space-y-1.5">
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Daerah</span>
                                                        {item.news_daerah ? (
                                                            <div className="p-2 border rounded-md bg-muted/10 space-y-1.5 h-full">
                                                                <p className="text-[11px] font-medium line-clamp-2 leading-tight" title={item.news_daerah.title}>
                                                                    {item.news_daerah.title}
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-1">
                                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shadow-none bg-background">
                                                                        {item.news_daerah.kanal?.name}
                                                                    </Badge>
                                                                    {getStatusBadge(item.news_daerah.status)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="destructive" className="shadow-none text-[10px] w-full justify-center">N/A</Badge>
                                                        )}
                                                    </div>

                                                    {/* Blok Nasional */}
                                                    <div className="space-y-1.5">
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Nasional</span>
                                                        {item.news_nasional ? (
                                                            <div className="p-2 border rounded-md bg-muted/10 space-y-1.5 h-full">
                                                                <p className="text-[11px] font-medium line-clamp-2 leading-tight" title={item.news_nasional.news_title}>
                                                                    {item.news_nasional.news_title || '-'}
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-1">
                                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shadow-none bg-background">
                                                                        {item.news_nasional.kanal?.catnews_title || 'Nasional'}
                                                                    </Badge>
                                                                    {getStatusBadge(item.news_nasional.news_status)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="destructive" className="shadow-none text-[10px] w-full justify-center">N/A</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground text-sm bg-muted/10">
                                        {searchTerm ? 'Berita tidak ditemukan.' : 'Belum ada berita.'}
                                    </div>
                                )}
                            </div>

                            {/* =========================================
                                TAMPILAN DESKTOP (TABEL)
                            ========================================== */}
                            <div className="hidden md:block border rounded-md overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead className="w-[80px]">ID</TableHead>
                                            <TableHead className="min-w-[300px]">Judul & Status</TableHead>
                                            <TableHead className="min-w-[200px]">Daerah</TableHead>
                                            <TableHead className="min-w-[200px]">Nasional</TableHead>
                                            <TableHead className="text-right w-[150px]">Tanggal Dibuat</TableHead>
                                            <TableHead className="text-center w-[100px]">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {news.data.length > 0 ? (
                                            news.data.map((item) => (
                                                <TableRow key={item.id} className="group hover:bg-muted/10">
                                                    <TableCell className="font-medium text-muted-foreground align-top pt-5">
                                                        #{item.id}
                                                    </TableCell>
                                                    
                                                    {/* Kolom Judul, Status & Indikator Note */}
                                                    <TableCell className="align-top pt-5">
                                                        <div className="space-y-2.5">
                                                            <Link href={route('news.show', item.id)} className="font-semibold text-foreground leading-snug block hover:text-blue-600 hover:underline transition-colors line-clamp-2">
                                                                {item.title}
                                                            </Link>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {getDistributionBadge(item.distribution_status)}
                                                                
                                                                {/* LOGIKA CATATAN (NOTE COUNT) */}
                                                                {item.notes_count > 0 && (
                                                                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 shadow-none border-orange-200 text-[10px] flex items-center gap-1 font-medium">
                                                                        <MessageSquare className="w-3 h-3" /> 
                                                                        {item.notes_count} Catatan
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Kolom Daerah Desktop */}
                                                    <TableCell className="align-top">
                                                        {item.news_daerah ? (
                                                            <Card className="shadow-none border bg-background group-hover:border-muted-foreground/30 transition-colors">
                                                                <CardContent className="p-3 space-y-2">
                                                                    <p className="text-xs font-medium leading-snug line-clamp-2" title={item.news_daerah.title}>
                                                                        {item.news_daerah.title}
                                                                    </p>
                                                                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t">
                                                                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-medium shadow-none">
                                                                            {item.news_daerah.kanal?.name}
                                                                        </Badge>
                                                                        {getStatusBadge(item.news_daerah.status)}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ) : (
                                                            <div className="h-full min-h-[70px] flex items-center justify-center border border-dashed rounded-md bg-muted/20 text-muted-foreground text-xs italic">
                                                                Tidak didistribusikan
                                                            </div>
                                                        )}
                                                    </TableCell>

                                                    {/* Kolom Nasional Desktop */}
                                                    <TableCell className="align-top">
                                                        {item.news_nasional ? (
                                                            <Card className="shadow-none border bg-background group-hover:border-muted-foreground/30 transition-colors">
                                                                <CardContent className="p-3 space-y-2">
                                                                    <p className="text-xs font-medium leading-snug line-clamp-2" title={item.news_nasional.news_title}>
                                                                        {item.news_nasional.news_title || '-'}
                                                                    </p>
                                                                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t">
                                                                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-medium shadow-none">
                                                                            {item.news_nasional.kanal?.catnews_title || 'Nasional'}
                                                                        </Badge>
                                                                        {getStatusBadge(item.news_nasional.news_status)}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ) : (
                                                            <div className="h-full min-h-[70px] flex items-center justify-center border border-dashed rounded-md bg-muted/20 text-muted-foreground text-xs italic">
                                                                Tidak didistribusikan
                                                            </div>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right text-muted-foreground text-xs align-top pt-5">
                                                        {formatDate(item.created_at)}
                                                    </TableCell>

                                                    {/* Kolom Aksi */}
                                                    <TableCell className="text-center align-top pt-4">
                                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50">
                                                            <Link href={route('news.show', item.id)} title="Lihat Detail">
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground bg-muted/10">
                                                    {searchTerm ? 'Berita tidak ditemukan.' : 'Belum ada berita.'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="pt-2">
                                <Pagination className="justify-between sm:justify-end">
                                    <PaginationContent className="w-full sm:w-auto justify-between shadow-sm rounded-md border bg-background">
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href={news.prev_page_url || "#"}
                                                className={!news.prev_page_url ? "pointer-events-none opacity-50 text-muted-foreground" : "hover:bg-muted"}
                                            />
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationNext
                                                href={news.next_page_url || "#"}
                                                className={!news.next_page_url ? "pointer-events-none opacity-50 text-muted-foreground" : "hover:bg-muted"}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout >
    );
}