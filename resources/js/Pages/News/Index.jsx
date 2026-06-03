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
import { Plus, Search } from 'lucide-react';
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

    function getStatusBadge(status) {
        switch (status) {
            case "pending":
            case '0':
            case 0:
                return <Badge variant="secondary">Pending</Badge>;
            case "Review":
            case '2':
            case 2:
                return <Badge className={"bg-yellow-300 text-yellow-700 hover:bg-yellow-300/80"}>Review</Badge>;
            case "On Pro":
            case '3':
            case 3:
                return <Badge variant="destructive">OnPro</Badge>;
            case "Publish":
            case '1':
            case 1:
                return <Badge className={"bg-green-300 text-green-700 hover:bg-green-300/80"}>Publish</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    }

    return (
        <AuthenticatedLayout>
            <Head title="Berita" />

            <div className="py-6 sm:py-12 bg-muted/30 min-h-screen">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader className="px-4 sm:px-6">
                            <CardTitle>Daftar Berita</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-4">

                            {/* Toolbar Pencarian & Tambah Berita */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari judul berita atau ID..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button asChild className="w-full md:w-auto">
                                    <Link href={route('news.create')}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Tambah Berita
                                    </Link>
                                </Button>
                            </div>

                            {/* =========================================
                                TAMPILAN MOBILE (KARTU) - Tampil di layar HP
                            ========================================== */}
                            <div className="flex flex-col gap-4 md:hidden">
                                {news.data.length > 0 ? (
                                    news.data.map((item) => (
                                        <Card key={item.id} className="shadow-sm overflow-hidden">
                                            <CardContent className="p-4 space-y-3">
                                                {/* Header Kartu: ID dan Tanggal */}
                                                <div className="flex justify-between items-start border-b pb-2">
                                                    <span className="text-xs font-semibold text-muted-foreground">ID: #{item.id}</span>
                                                    <span className="text-[11px] text-muted-foreground">{formatDate(item.created_at)}</span>
                                                </div>

                                                {/* Judul Utama Berita */}
                                                <h3 className="font-semibold text-sm leading-snug">{item.title}</h3>

                                                {/* Status Daerah & Nasional */}
                                                <div className="grid grid-cols-1 gap-3 pt-2">
                                                    {/* Blok Daerah */}
                                                    <div className="space-y-1.5">
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Daerah</span>
                                                        {item.news_daerah ? (
                                                            <div className="p-2 border rounded-md bg-muted/20 space-y-2">
                                                                <p className="text-xs font-medium line-clamp-2 leading-tight" title={item.news_daerah.title}>
                                                                    {item.news_daerah.title}
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-1">
                                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                                                        {item.news_daerah.kanal?.name}
                                                                    </Badge>
                                                                    {getStatusBadge(item.news_daerah.status)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="destructive" className="shadow-none text-[10px] w-full justify-center">Belum diproses</Badge>
                                                        )}
                                                    </div>

                                                    {/* Blok Nasional */}
                                                    <div className="space-y-1.5">
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Nasional</span>
                                                        {item.news_nasional ? (
                                                            <div className="p-2 border rounded-md bg-muted/20 space-y-2">
                                                                <p className="text-xs font-medium line-clamp-2 leading-tight" title={item.news_nasional.news_title}>
                                                                    {item.news_nasional.news_title || '-'}
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-1">
                                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                                                        {item.news_nasional.kanal?.catnews_title || 'Nasional'}
                                                                    </Badge>
                                                                    {getStatusBadge(item.news_nasional.news_status)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="destructive" className="shadow-none text-[10px] w-full justify-center">Belum diproses</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground text-sm bg-muted/20">
                                        {searchTerm ? 'Berita tidak ditemukan.' : 'Belum ada berita.'}
                                    </div>
                                )}
                            </div>

                            {/* =========================================
                                TAMPILAN DESKTOP (TABEL) - Tampil di layar besar
                            ========================================== */}
                            <div className="hidden md:block border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">ID</TableHead>
                                            <TableHead className="min-w-[200px]">Judul Berita</TableHead>
                                            <TableHead>Daerah</TableHead>
                                            <TableHead>Nasional</TableHead>
                                            <TableHead className="text-right">Tanggal Dibuat</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {news.data.length > 0 ? (
                                            news.data.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium text-muted-foreground align-top pt-4">
                                                        #{item.id}
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-foreground align-top pt-4">
                                                        {item.title}
                                                    </TableCell>
                                                    
                                                    {/* Kolom Daerah Desktop */}
                                                    <TableCell className="align-top">
                                                        {item.news_daerah ? (
                                                            <Card className="min-w-[200px] max-w-[250px] shadow-sm">
                                                                <CardContent className="p-3 space-y-2.5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="relative flex h-2 w-2">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                                        </span>
                                                                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Terindeks</span>
                                                                    </div>
                                                                    <p className="text-sm font-semibold leading-snug line-clamp-2" title={item.news_daerah.title}>
                                                                        {item.news_daerah.title}
                                                                    </p>
                                                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                                                                            {item.news_daerah.kanal?.name}
                                                                        </Badge>
                                                                        {getStatusBadge(item.news_daerah.status)}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ) : (
                                                            <Card className="min-w-[200px] border-dashed bg-muted/30 shadow-none h-full min-h-[96px]">
                                                                <CardContent className="p-3 flex items-center justify-center h-full">
                                                                    <Badge variant="destructive" className="shadow-none">Belum diproses</Badge>
                                                                </CardContent>
                                                            </Card>
                                                        )}
                                                    </TableCell>

                                                    {/* Kolom Nasional Desktop */}
                                                    <TableCell className="align-top">
                                                        {item.news_nasional ? (
                                                            <Card className="min-w-[200px] max-w-[250px] shadow-sm">
                                                                <CardContent className="p-3 space-y-2.5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="relative flex h-2 w-2">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                                        </span>
                                                                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Terindeks</span>
                                                                    </div>
                                                                    <p className="text-sm font-semibold leading-snug line-clamp-2" title={item.news_nasional.news_title}>
                                                                        {item.news_nasional.news_title || '-'}
                                                                    </p>
                                                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                                                                            {item.news_nasional.kanal?.catnews_title || 'Nasional'}
                                                                        </Badge>
                                                                        {getStatusBadge(item.news_nasional.news_status)}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ) : (
                                                            <Card className="min-w-[200px] border-dashed bg-muted/30 shadow-none h-full min-h-[96px]">
                                                                <CardContent className="p-3 flex items-center justify-center h-full">
                                                                    <Badge variant="destructive" className="shadow-none">Belum diproses</Badge>
                                                                </CardContent>
                                                            </Card>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right text-muted-foreground text-sm align-top pt-4">
                                                        {formatDate(item.created_at)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                    {searchTerm ? 'Berita tidak ditemukan.' : 'Belum ada berita.'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination (Tampil di kedua versi) */}
                            <div className="pt-4 md:border-t mt-4">
                                <Pagination className="justify-between sm:justify-end">
                                    <PaginationContent className="w-full sm:w-auto justify-between">
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href={news.prev_page_url || "#"}
                                                className={!news.prev_page_url ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationNext
                                                href={news.next_page_url || "#"}
                                                className={!news.next_page_url ? "pointer-events-none opacity-50" : ""}
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