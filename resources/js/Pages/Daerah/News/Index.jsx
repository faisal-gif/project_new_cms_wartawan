import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/Components/ui/pagination";
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Eye, Calendar, Tag, AlertCircle } from 'lucide-react';

export default function Index({ newsDaerah, error }) {
    // Memastikan data aman saat looping jika terjadi error query (fallback array kosong)
    const newsData = newsDaerah?.data || [];

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper badge status khusus daerah (pada controller Anda memfilter status = 1 / Publish)
    function getStatusBadge(status) {
        if (Number(status) === 1) {
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 shadow-none border-green-200 text-[10px]">Publish</Badge>;
        }
        return <Badge variant="outline" className="shadow-none text-[10px]">{status}</Badge>;
    }

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Berita Daerah" />

            <div className="py-6 sm:py-12 bg-muted/30 min-h-screen">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    {/* Alert jika terjadi Error Database */}
                    {error && (
                        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <Card className="shadow-sm border-muted">
                        <CardHeader className="px-4 sm:px-6 border-b pb-4 bg-muted/10">
                            <CardTitle>Manajemen Berita Daerah</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-5">

                            {/* =========================================
                                TAMPILAN MOBILE (KARTU)
                            ========================================== */}
                            <div className="flex flex-col gap-4 md:hidden">
                                {newsData.length > 0 ? (
                                    newsData.map((item) => (
                                        <Card key={item.id} className="shadow-sm overflow-hidden border-muted">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex justify-between items-start border-b pb-2">
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold text-muted-foreground">ID: #{item.id}</span>
                                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(item.datepub)}
                                                        </div>
                                                    </div>
                                                    {getStatusBadge(item.status)}
                                                </div>

                                                {/* Judul Berita */}
                                                <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                                                    {item.title}
                                                </h3>

                                                <div className="flex items-center justify-between pt-2 border-t border-dashed">
                                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-medium shadow-none">
                                                        <Tag className="w-2.5 h-2.5 mr-1" />
                                                        {item.kanal?.name || 'Uncategorized'}
                                                    </Badge>

                                                    <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-muted-foreground hover:text-blue-600">
                                                        {/* <Link href={route('news-daerah.show', item.id)}>
                                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                                            Detail
                                                        </Link> */}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground text-sm bg-muted/10">
                                        Belum ada berita daerah yang dipublikasikan.
                                    </div>
                                )}
                            </div>

                            {/* =========================================
                                TAMPILAN DESKTOP (TABEL)
                            ========================================== */}
                            <div className="hidden md:block border rounded-md overflow-hidden shadow-sm bg-background">
                                <Table className="w-full table-fixed">
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead className="w-[8%]">ID</TableHead>
                                            <TableHead className="w-[12%]">Kode Berita</TableHead>
                                            <TableHead className="w-[45%]">Judul Berita</TableHead>
                                            <TableHead className="w-[15%]">Kanal / Kategori</TableHead>
                                            <TableHead className="w-[12%]">Tanggal Publish</TableHead>
                                            <TableHead className="w-[8%] text-center">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {newsData.length > 0 ? (
                                            newsData.map((item) => (
                                                <TableRow key={item.id} className="group hover:bg-muted/5">
                                                    <TableCell className="font-medium text-muted-foreground">
                                                        #{item.id}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-mono text-muted-foreground">
                                                        {item.is_code || '-'}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div className="space-y-1.5">
                                                            <p className="text-sm text-foreground leading-snug whitespace-normal break-words">
                                                                {item.title}
                                                            </p>
                                                            {getStatusBadge(item.status)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-medium text-xs bg-muted/20">
                                                            {item.kanal?.name || 'Uncategorized'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {formatDate(item.datepub)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50">
                                                            {/* Sesuaikan nama route detail daerah Anda */}
                                                            {/* <Link href={route('news-daerah.show', item.id)} title="Lihat Detail">
                                                                <Eye className="h-4 w-4" />
                                                            </Link> */}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground bg-muted/10">
                                                    Belum ada berita daerah yang dipublikasikan.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination (Simple Paginator dari Laravel) */}
                            {newsData.length > 0 && (
                                <div className="pt-2">
                                    <Pagination className="justify-between sm:justify-end">
                                        <PaginationContent className="w-full sm:w-auto justify-between shadow-sm rounded-md border bg-background">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href={newsDaerah.prev_page_url || "#"}
                                                    className={!newsDaerah.prev_page_url ? "pointer-events-none opacity-50 text-muted-foreground" : "hover:bg-muted"}
                                                />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationNext
                                                    href={newsDaerah.next_page_url || "#"}
                                                    className={!newsDaerah.next_page_url ? "pointer-events-none opacity-50 text-muted-foreground" : "hover:bg-muted"}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}