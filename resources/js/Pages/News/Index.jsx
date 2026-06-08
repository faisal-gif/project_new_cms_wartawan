import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Select from "react-select";
import { Plus, Search } from 'lucide-react';

// Components
import Card from '@/Components/Card';
import InputWithPrefix from '@/Components/InputWithPrefix';
import PaginationDaisy from '@/Components/PaginationDaisy';
import { Badge } from '@/Components/ui/badge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

/* ==============================================================================
   HELPER FUNCTIONS 
   (Dipindah ke luar agar tidak re-render di setiap lifecycle komponen)
============================================================================== */
const getStatusBadge = (status) => {
    switch (String(status).toLowerCase()) {
        case "pending":
        case "0":
            return <Badge variant="secondary">Pending</Badge>;
        case "review":
        case "2":
            return <Badge className="bg-yellow-300 text-yellow-700 hover:bg-yellow-400">Review</Badge>;
        case "on pro":
        case "3":
            return <Badge variant="destructive">OnPro</Badge>;
        case "publish":
        case "1":
            return <Badge className="bg-green-300 text-green-700 hover:bg-green-400">Publish</Badge>;
        default:
            return <Badge variant="neutral">{status}</Badge>;
    }
};

const getDistributionBadge = (status) => {
    switch (Number(status)) {
        case 2:
            return <Badge className="badge bg-success text-white border-none">Sudah di Semua Jaringan</Badge>;
        case 1:
            return <Badge className="badge bg-info text-white border-none">Tayang Parsial</Badge>;
        case 0:
        default:
            return <Badge className="badge bg-secondary text-gray-500 border-none">Draft / Belum Tayang</Badge>;
    }
};

/* ==============================================================================
   SUB-COMPONENTS (Idealnya bisa dipisah ke file terpisah di folder components)
============================================================================== */

// --- 1. Mobile Card View ---
const NewsMobileCard = ({ item, hasPermission }) => (
    <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
        <div className="card-body p-4 sm:p-5 gap-0">
            {/* Header: Title */}
            <div className="flex justify-between items-start gap-3 mb-2">
                <h3 className="text-xs font-medium leading-snug whitespace-normal break-words">
                    {item.title}
                </h3>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-base-content/70 mb-4">
                <span className="font-semibold text-primary">{item.writer?.name || 'Unknown'}</span>
            </div>

            {/* Integration Status */}
            <div className="bg-base-200/50 rounded-lg p-3 flex flex-col gap-4 mb-4">
                {/* Daerah */}
                {hasPermission('import daerah news master') && (
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-base-content/80">Distribusi Daerah</span>
                        {item.news_daerah ? (
                            <div className="flex justify-between items-center bg-base-100 p-2 rounded border border-base-200">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-success flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Terindeks
                                    </span>
                                    <span className="text-[11px] text-base-content/70 truncate max-w-[150px]">
                                        {item.news_daerah.kanal?.name || 'Daerah'}
                                    </span>
                                </div>
                                <Link href={route('admin.daerah.news.edit', item.news_daerah.id)} className="btn btn-xs btn-warning btn-outline">
                                    Edit
                                </Link>
                            </div>
                        ) : (
                            <Link href={route('admin.news.import.daerah', item.is_code)} className="btn btn-xs btn-info btn-outline self-start">
                                + Daerah
                            </Link>
                        )}
                    </div>
                )}

                <div className="border-t border-base-300"></div>

                {/* Nasional */}
                {hasPermission('import nasional news master') && (
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-base-content/80">Distribusi Nasional</span>
                        {item.news_nasional ? (
                            <div className="flex justify-between items-center bg-base-100 p-2 rounded border border-base-200">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-success flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Terindeks
                                    </span>
                                    <span className="text-[11px] text-base-content/70 truncate max-w-[150px]">
                                        {item.news_nasional.kanal?.catnews_title || 'Nasional'}
                                    </span>
                                </div>
                                <Link href={route('admin.nasional.news.edit', item.news_nasional.news_id)} className="btn btn-xs btn-warning btn-outline">
                                    Edit
                                </Link>
                            </div>
                        ) : (
                            <Link href={route('admin.news.import.nasional', item.is_code)} className="btn btn-xs btn-info btn-outline self-start">
                                + Nasional
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-base-content/70 mb-2">
                {getDistributionBadge(item.distribution_status)}
            </div>

            {/* Actions */}
            <div className="card-actions justify-end mt-2">
                <Link href={route('admin.news.show', item.id)} className="btn btn-sm btn-primary w-full sm:w-auto">
                    Detail Berita
                </Link>
            </div>
        </div>
    </div>
);

// --- 2. Desktop Table Row View ---
const NewsDesktopRow = ({ item, hasPermission }) => (
    <tr>
        <th>{item.id}</th>
        <td>{item.writer?.name || 'Unknown'}</td>
        <td>
            <p className="font-medium truncate max-w-xs" title={item.title}>{item.title}</p>
        </td>

        {/* Kolom Daerah */}
        {hasPermission('import daerah news master') && (
            <td>
                {item.news_daerah ? (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-success">Terindeks</span>
                            <Link href={route('admin.daerah.news.edit', item.news_daerah.id)} className="btn btn-xs btn-warning btn-outline h-6 min-h-0">
                                Edit
                            </Link>
                        </div>
                        <span className="text-[11px] leading-tight text-base-content/80 truncate max-w-[150px]" title={item.news_daerah.title}>
                            {item.news_daerah.title}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="badge badge-xs badge-ghost italic">{item.news_daerah.kanal?.name}</span>
                            {getStatusBadge(item.news_daerah.status)}
                        </div>
                    </div>
                ) : (
                    <Link href={route('admin.news.import.daerah', item.is_code)} className="btn btn-xs btn-info btn-outline">
                        + Daerah
                    </Link>
                )}
            </td>
        )}

        {/* Kolom Nasional */}
        {hasPermission('import nasional news master') && (
            <td>
                {item.news_nasional ? (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-success">Terindeks</span>
                            <Link href={route('admin.nasional.news.edit', item.news_nasional.news_id)} className="btn btn-xs btn-warning btn-outline h-6 min-h-0">
                                Edit
                            </Link>
                        </div>
                        <span className="text-[11px] leading-tight text-base-content/80 truncate max-w-[150px]">
                            {item.news_nasional.news_title || '-'}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="badge badge-xs badge-ghost italic">{item.news_nasional.kanal?.catnews_title || 'Nasional'}</span>
                            {getStatusBadge(item.news_nasional.news_status)}
                        </div>
                    </div>
                ) : (
                    <Link href={route('admin.news.import.nasional', item.is_code)} className="btn btn-xs btn-info btn-outline">
                        + Nasional
                    </Link>
                )}
            </td>
        )}

        <td className="text-center">
            {getDistributionBadge(item.distribution_status)}
        </td>

        {hasPermission('edit news master') && (
            <td>
                <div className="flex justify-end gap-2">
                    <Link href={route('admin.news.show', item.id)} className="btn btn-sm btn-primary btn-outline">Detail</Link>
                </div>
            </td>
        )}
    </tr>
);


/* ==============================================================================
   MAIN COMPONENT
============================================================================== */
export default function Index({ news, writers, kanals, filters }) {
    const { auth } = usePage().props;
    const userPermissions = auth.permissions || [];
    const isFirst = useRef(true);
    
    // State Filters
    const [search, setSearch] = useState(() => filters.search || '');
    const [writer, setWriter] = useState(() => filters.writer || '');

    const INDEX_ROUTE = route('admin.news.index');

    // Helper: Cek Permisi User
    const hasPermission = (permissions) => {
        if (Array.isArray(permissions)) {
            return permissions.some(permission => userPermissions.includes(permission));
        }
        return userPermissions.includes(permissions);
    };

    // Effect: Handle Pencarian & Filtering (Debounced)
    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                INDEX_ROUTE,
                { search, writer, page: 1 },
                { preserveState: true, replace: true }
            );
        }, search !== filters.search ? 400 : 0); // Hanya debounce untuk ketikan search

        return () => clearTimeout(timeout);
    }, [search, writer]);

    // Handle Reset Filter
    const handleReset = () => {
        setSearch('');
        setWriter('');
        router.get(INDEX_ROUTE, { search: '', writer: '', page: 1 }, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="News Management" />
            
            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header & Breadcrumbs */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <h1 className="text-3xl font-bold text-foreground">Daftar News</h1>
                        <div className="breadcrumbs text-sm">
                            <ul>
                                <li><Link href="#">Home</Link></li>
                                <li>News</li>
                            </ul>
                        </div>
                    </div>

                    {/* Tombol Aksi Utama */}
                    {hasPermission('create news master') && (
                        <div className="flex justify-end md:justify-start">
                            <Link href={route('admin.news.create')} className="btn btn-primary rounded-lg">
                                <Plus size={16} /> Tambah News
                            </Link>
                        </div>
                    )}

                    {/* Filter Section */}
                    <Card>
                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                            <div className="w-full md:w-96">
                                <InputWithPrefix
                                    prefix={<Search size={16} />}
                                    placeholder="Search Title and Id..."
                                    className="w-full"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-48 z-20">
                                <Select
                                    options={writers}
                                    value={writers.find(w => w.value === writer) || null}
                                    placeholder="Penulis"
                                    onChange={(e) => setWriter(e ? e.value : '')}
                                    isClearable
                                />
                            </div>
                            <button type="button" className="btn btn-neutral w-full md:w-auto md:ml-2" onClick={handleReset}>
                                Reset
                            </button>
                        </div>
                    </Card>

                    {/* Content Section (Table & Cards) */}
                    <Card>
                        {/* Mobile View */}
                        <div className="md:hidden flex flex-col gap-4">
                            {news.data.length > 0 ? (
                                news.data.map((n) => (
                                    <NewsMobileCard key={n.id} item={n} hasPermission={hasPermission} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-base-content/50">Data tidak ditemukan.</div>
                            )}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto min-h-[400px]">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Penulis</th>
                                        <th className="w-1/3">Judul</th>
                                        {hasPermission('import daerah news master') && <th>Daerah</th>}
                                        {hasPermission('import nasional news master') && <th>Nasional</th>}
                                        <th className="text-center">Status Distribusi</th>
                                        {hasPermission('edit news master') && <th className="text-right">Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {news.data.length > 0 ? (
                                        news.data.map((n) => (
                                            <NewsDesktopRow key={n.id} item={n} hasPermission={hasPermission} />
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-base-content/50">
                                                Data tidak ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Pagination */}
                    <PaginationDaisy data={news} />

                </div>
            </div>
        </AuthenticatedLayout>
    );
}