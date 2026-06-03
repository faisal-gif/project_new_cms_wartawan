import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    FileText,
    Globe,
    MapPin,
    Plus,
    Activity
} from 'lucide-react';

export default function Dashboard({ auth, recentNews, stats: dbStats }) {
    // Statistik disesuaikan: Fokus pada distribusi ke portal turunan
    const stats = [
        {
            title: "Total Berita Master",
            value: dbStats?.total_master || 0,
            icon: FileText,
            color: "text-blue-500",
            desc: "Berita yang Anda tulis"
        },
        {
            title: "Tayang Nasional",
            value: dbStats?.tayang_nasional || 0,
            icon: Globe,
            color: "text-indigo-500",
            desc: "Berhasil tembus pusat"
        },
        {
            title: "Tayang Daerah",
            value: dbStats?.tayang_daerah || 0,
            icon: MapPin,
            color: "text-green-500",
            desc: "Terindeks di portal lokal"
        },
    ];

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Fungsi Helper Badge (Sama seperti di Index)
    function getStatusBadge(status) {
        switch (status) {
            case "pending":
            case '0':
            case 0:
                return <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Pending</Badge>;
            case "Review":
            case '2':
            case 2:
                return <Badge className="bg-yellow-300 text-yellow-700 hover:bg-yellow-300/80 text-[10px] h-5 px-1.5">Review</Badge>;
            case "On Pro":
            case '3':
            case 3:
                return <Badge variant="destructive" className="text-[10px] h-5 px-1.5">OnPro</Badge>;
            case "Publish":
            case '1':
            case 1:
                return <Badge className="bg-green-300 text-green-700 hover:bg-green-300/80 text-[10px] h-5 px-1.5">Publish</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px] h-5 px-1.5">{status}</Badge>;
        }
    }

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="py-8 bg-muted/30 min-h-screen">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* Header & Quick Action */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                Halo, {auth?.user?.name || 'Redaktur'}! 👋
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Pantau distribusi berita Anda di seluruh jaringan.
                            </p>
                        </div>
                        <Button asChild size="lg" className="shadow-md">
                            <Link href={route('news.create')}>
                                <Plus className="w-5 h-5 mr-2" /> Tulis Berita Baru
                            </Link>
                        </Button>
                    </div>

                    {/* Top Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <Card key={index} className="border-none shadow-sm bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between space-y-0 pb-2">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {stat.title}
                                            </p>
                                            <div className={`p-2 bg-muted rounded-full ${stat.color}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-3xl font-bold tracking-tight">
                                                {stat.value}
                                            </span>
                                            <span className="text-xs text-muted-foreground mt-1">
                                                {stat.desc}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Kiri: Recent Activity (Porsi lebih besar) */}
                        <Card className="lg:col-span-2 shadow-sm border-none bg-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center">
                                        <Activity className="w-5 h-5 mr-2 text-primary" />
                                        Pantauan Berita Terakhir
                                    </CardTitle>
                                    <CardDescription>
                                        Status distribusi berita master Anda di portal Nasional dan Daerah.
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={route('news.index')}>Lihat Semua</Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {recentNews.map((item) => (
                                        <div key={item.id} className="p-4 sm:px-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                            {/* Judul & Waktu */}
                                            <div className="space-y-1.5 flex-1 pr-4">
                                                <p className="font-semibold text-sm leading-snug text-foreground line-clamp-2">
                                                    {item.title}
                                                </p>
                                                <p className="text-[11px] font-medium text-muted-foreground">
                                                    ID: #{item.id} • Dibuat: {formatDate(item.created_at)}
                                                </p>
                                            </div>

                                            {/* Status Distribusi */}
                                            <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-lg border shrink-0">
                                                {/* Status Daerah */}
                                                <div className="flex flex-col gap-1 items-start w-[100px]">
                                                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Daerah</span>
                                                    {item.news_daerah ? (
                                                        <div className="flex items-center gap-1">
                                                            {getStatusBadge(item.news_daerah.status)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-destructive font-medium border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 rounded-md">Belum</span>
                                                    )}
                                                </div>

                                                {/* Garis Pemisah */}
                                                <div className="w-[1px] h-8 bg-border"></div>

                                                {/* Status Nasional */}
                                                <div className="flex flex-col gap-1 items-start w-[100px]">
                                                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Nasional</span>
                                                    {item.news_nasional ? (
                                                        <div className="flex items-center gap-1">
                                                            {getStatusBadge(item.news_nasional.news_status)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-destructive font-medium border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 rounded-md">Belum</span>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Kanan: Pengumuman / Target */}
                        <Card className="shadow-sm border-none bg-gradient-to-br from-primary/5 to-primary/10 h-fit">
                            <CardHeader>
                                <CardTitle className="text-lg">Info Redaksi</CardTitle>
                                <CardDescription>Catatan penting untuk penulis</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* <div className="space-y-3 pt-2">
                                    <div className="p-3 bg-white/60 rounded-md border border-white/40 shadow-sm backdrop-blur-sm">
                                        <p className="text-sm font-semibold text-foreground mb-1">📌 Aturan Gambar Baru</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Mulai bulan ini, semua gambar liputan lapangan wajib diunggah beserta watermark resmi TIMES.
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white/60 rounded-md border border-white/40 shadow-sm backdrop-blur-sm">
                                        <p className="text-sm font-semibold text-foreground mb-1">🚀 Prioritas Nasional</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Liputan investigatif seputar dampak cuaca ekstrem sedang dinaikkan ke pusat. Ajukan draft Anda!
                                        </p>
                                    </div>
                                </div> */}
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}