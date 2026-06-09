import { useEffect, useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Loader2, UploadCloud, Image as ImageIcon } from "lucide-react";
import axios from "axios"; // Gunakan Axios bawaan Laravel/Inertia

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/Components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/tabs";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Checkbox } from "@/Components/ui/checkbox";
import { Progress } from "@/Components/ui/progress"; // Komponen baru shadcn
import heic2any from "heic2any";

export default function EditorImageModal() {
    const [show, setShow] = useState(false);
    const [editor, setEditor] = useState(null);
    const [tab, setTab] = useState("upload");

    const [file, setFile] = useState(null);
    const [originalFileName, setOriginalFileName] = useState("");
    const [imageName, setImageName] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // State untuk progress bar
    const [watermark, setWatermark] = useState(true);
    const [error, setError] = useState("");
    const [isDragging, setIsDragging] = useState(false); // State untuk Drag & Drop

    // --- State & Ref untuk react-image-crop ---
    const [previewUrl, setPreviewUrl] = useState(null);
    const imgRef = useRef(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            setEditor(e.detail.editor);
            setShow(true);
        };
        window.addEventListener("open-editor-image-modal", handler);
        return () => window.removeEventListener("open-editor-image-modal", handler);
    }, []);

    const resetAndClose = () => {
        setShow(false);
        setFile(null);
        setOriginalFileName("");
        setImageUrl("");
        setImageName("");
        setTab("upload");
        setError("");
        setCrop(undefined);
        setCompletedCrop(null);
        setUploadProgress(0);

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    const countImages = () => {
        if (!editor) return 0;
        const content = editor.getContent();
        const doc = new DOMParser().parseFromString(content, "text/html");
        return doc.querySelectorAll("img").length;
    };

    const insertImage = (src, name) => {
        if (countImages() >= 2) {
            editor.notificationManager.open({
                text: "Maksimal 2 gambar dalam artikel",
                type: "warning",
            });
            return;
        }

        editor.insertContent(
            `<figure class="image">
                <img src="${src}" alt="${name}" title="${name}" />
                <figcaption>${name}</figcaption>
            </figure>`
        );
    };

    const getCroppedImg = async (imageElement, crop, fileNameToUse) => {
        const canvas = document.createElement('canvas');
        const scaleX = imageElement.naturalWidth / imageElement.width;
        const scaleY = imageElement.naturalHeight / imageElement.height;
        const actualWidth = crop.width * scaleX;
        const actualHeight = crop.height * scaleY;

        canvas.width = actualWidth;
        canvas.height = actualHeight;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            imageElement,
            crop.x * scaleX, crop.y * scaleY, actualWidth, actualHeight,
            0, 0, actualWidth, actualHeight
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Canvas is empty'));
                resolve(new File([blob], fileNameToUse, { type: 'image/webp', lastModified: Date.now() }));
            }, 'image/webp', 1.0);
        });
    };

    // Fungsi pemrosesan file gabungan (dari Drop atau Klik)
    const processSelectedFile = async (selectedFile) => {
        if (!selectedFile) return;

        setLoading(true);
        setError("");

        try {
            let fileToProcess = selectedFile;

            // Cek format HEIC/HEIF
            const isHeic = selectedFile.type === "image/heic"
                || selectedFile.type === "image/heif"
                || selectedFile.name.toLowerCase().endsWith(".heic");

            if (isHeic) {
                try {
                    const convertedBlob = await heic2any({
                        blob: selectedFile,
                        toType: "image/jpeg",
                        quality: 0.9
                    });
                    const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                    const newFileName = selectedFile.name.replace(/\.heic|\.heif/gi, ".jpg");
                    fileToProcess = new File([finalBlob], newFileName, { type: "image/jpeg" });
                } catch (heicError) {
                    console.error("HEIC Conversion failed:", heicError);
                    throw new Error("Format HEIC/iPhone tidak didukung oleh browser ini atau file rusak.");
                }
            }

            // Validasi format dasar
            if (!fileToProcess.type.startsWith("image/")) {
                setError("Harap pilih file gambar yang valid.");
                setLoading(false);
                return;
            }

            // PROSES KOMPRESI DENGAN STRATEGI CADANGAN (FALLBACK)
            let compressedFile;
            try {
                // Coba kompresi menggunakan WebWorker (Lebih cepat)
                const options = { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true };
                compressedFile = await imageCompression(fileToProcess, options);
            } catch (compressionError) {
                console.warn("WebWorker gagal/crash, mencoba metode cadangan tanpa WebWorker...", compressionError);
                // Jika browser perangkat crash mendadak, jalankan tanpa WebWorker (Failsafe)
                const fallbackOptions = { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: false };
                compressedFile = await imageCompression(fileToProcess, fallbackOptions);
            }

            setFile(compressedFile);
            setOriginalFileName(fileToProcess.name);
            setPreviewUrl(URL.createObjectURL(compressedFile));

        } catch (err) {
            console.error(err);
            setError(err.message || "Gagal memproses gambar. Silakan coba file lain.");
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processSelectedFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const upload = async () => {
        if (!file || !editor) return;
        if (!imageName.trim()) return setError("Nama gambar wajib diisi");

        setError("");
        setLoading(true);
        setUploadProgress(0);

        if (countImages() >= 2) {
            editor.notificationManager.open({ text: "Maksimal 2 gambar dalam artikel", type: "warning" });
            setLoading(false);
            return;
        }

        try {
            let finalFileToUpload = file;
            if (completedCrop?.width && completedCrop?.height && imgRef.current) {
                finalFileToUpload = await getCroppedImg(imgRef.current, completedCrop, originalFileName);
            }

            const formData = new FormData();
            formData.append("file", finalFileToUpload, originalFileName);
            formData.append("watermark", watermark ? "1" : "0");
            formData.append("name", imageName);

            // Menggunakan Axios untuk memantau progress bar
            const res = await axios.post("/upload-image", formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            if (res.data?.location) {
                insertImage(res.data.location, imageName);
                resetAndClose();
            }
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.message || "Terjadi kesalahan saat mengunggah gambar.");
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const insertFromUrl = () => {
        if (!imageUrl || !editor) return;
        insertImage(imageUrl, imageName);
        resetAndClose();
    };

    return (
        <Dialog open={show} onOpenChange={(open) => { if (!open && !loading) resetAndClose(); }}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Gambar</DialogTitle>
                </DialogHeader>

                <Tabs value={tab} onValueChange={setTab} className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload" disabled={loading}>Upload File</TabsTrigger>
                        <TabsTrigger value="url" disabled={loading}>Dari URL</TabsTrigger>
                    </TabsList>

                    {/* TAB UPLOAD */}
                    <TabsContent value="upload" className="space-y-4 mt-4">
                        {previewUrl ? (
                            <div className="space-y-4">
                                {/* Container untuk crop: Diberi background gelap sedikit agar batas gambar terlihat jelas */}
                                <div className="border rounded-lg bg-black/5 flex justify-center items-center p-4">
                                    <ReactCrop
                                        crop={crop}
                                        // Hapus baris aspect di bawah ini jika ingin rasio potong bebas
                                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                                        onComplete={(c) => setCompletedCrop(c)}
                                    >
                                        <img
                                            ref={imgRef}
                                            src={previewUrl}
                                            alt="Crop preview"
                                            // KUNCI UTAMA: max-h-[55vh] membatasi tinggi gambar maksimal 55% layar.
                                            // w-auto menjaga proporsi agar tidak gepeng (meniru efek object-fit: contain).
                                            className="max-h-[55vh] w-auto max-w-full block mx-auto rounded-sm shadow-sm"
                                            onLoad={(e) => {
                                                setCrop({
                                                    unit: '%',
                                                    x: 10,
                                                    y: 10,
                                                    width: 80,
                                                    height: 80,
                                                });
                                            }}
                                        />
                                    </ReactCrop>
                                </div>

                                <div className="flex justify-between items-center gap-2 bg-muted/50 p-2 rounded-md">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <p className="text-sm font-medium truncate">{originalFileName}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        URL.revokeObjectURL(previewUrl);
                                        setPreviewUrl(null);
                                        setFile(null);
                                        setCrop(undefined);
                                        setCompletedCrop(null);
                                    }} disabled={loading}>
                                        Ganti File
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50"}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('hidden-file-input').click()}
                            >
                                <input
                                    id="hidden-file-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => processSelectedFile(e.target.files[0])}
                                    disabled={loading}
                                />
                                {loading ? (
                                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                                ) : (
                                    <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
                                )}
                                <h3 className="font-semibold text-sm">Klik atau Drag & Drop gambar di sini</h3>
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (Max. 1.5MB sebelum kompresi)</p>
                            </div>
                        )}

                        {error && <p className="text-destructive text-sm font-medium">{error}</p>}

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="watermark" checked={watermark} onCheckedChange={setWatermark} disabled={loading} />
                            <Label htmlFor="watermark" className="cursor-pointer">Berikan watermark pada foto</Label>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imageNameUpload">Nama Gambar / Alt Text <span className="text-destructive">*</span></Label>
                            <Input id="imageNameUpload" type="text" placeholder="Contoh: Suasana pelantikan gubernur" value={imageName} onChange={(e) => setImageName(e.target.value)} disabled={loading} />
                        </div>

                        {loading && uploadProgress > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Mengunggah...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        )}

                        <Button className="w-full" onClick={upload} disabled={!file || loading}>
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {uploadProgress > 0 ? "Mengunggah..." : "Memproses..."}</>
                            ) : "Upload & Sisipkan Gambar"}
                        </Button>
                    </TabsContent>

                    {/* TAB URL */}
                    <TabsContent value="url" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">URL Gambar</Label>
                            <Input id="imageUrl" type="text" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imageNameUrl">Nama Gambar / Alt Text <span className="text-destructive">*</span></Label>
                            <Input id="imageNameUrl" type="text" placeholder="Contoh: Suasana pelantikan gubernur" value={imageName} onChange={(e) => setImageName(e.target.value)} disabled={loading} />
                        </div>
                        <Button variant="secondary" className="w-full" onClick={insertFromUrl} disabled={!imageUrl || loading}>
                            Gunakan URL & Sisipkan
                        </Button>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6 flex sm:justify-between items-center border-t pt-4">
                    <p className="text-xs text-muted-foreground w-full">Maksimal 2 gambar dalam 1 artikel</p>
                    <Button variant="ghost" onClick={resetAndClose} disabled={loading}>Batal</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}