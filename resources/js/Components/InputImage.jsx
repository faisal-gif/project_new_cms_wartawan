import { useRef, useState, useEffect } from "react";
import { ImageIcon, XIcon, Loader2 } from "lucide-react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import imageCompression from "browser-image-compression";

// Komponen shadcn/ui (Sesuaikan path import jika perlu)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// --- Helper: Ekstrak area crop ---
const getCroppedImg = async (image, crop, fileName, targetWidth, targetHeight) => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, targetWidth, targetHeight);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Canvas is empty"));
            resolve(new File([blob], fileName, { type: "image/jpeg" }));
        }, "image/jpeg", 1);
    });
};

export default function InputImage({
    label = "Upload Image",
    value = null,          
    existingImage = null,  
    onChange,
    onRemove,              
    className = "",
    enableCrop = true,
    targetWidth = 1200,
    targetHeight = 800,
}) {
    const inputRef = useRef(null);
    const imgRef = useRef(null);

    const [preview, setPreview] = useState(null);
    const [isDeleted, setIsDeleted] = useState(false);
    const [cropData, setCropData] = useState({ src: null, fileName: "", originalFile: null });
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const ASPECT_RATIO = targetWidth / targetHeight;

    // Manajemen State Preview
    useEffect(() => {
        if (value instanceof File || value instanceof Blob) {
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }

        if (!value && existingImage && !isDeleted) {
            setPreview(existingImage);
            return;
        }

        setPreview(null);
    }, [value, existingImage, isDeleted]);

    const handleSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsDeleted(false);

        if (!enableCrop) {
            processOriginalImage(file);
            if (inputRef.current) inputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setCropData({
                src: reader.result?.toString() || "",
                fileName: file.name,
                originalFile: file,
            });
        });
        reader.readAsDataURL(file);

        if (inputRef.current) inputRef.current.value = "";
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        imgRef.current = e.currentTarget;
        const initialCrop = centerCrop(
            makeAspectCrop({ unit: "%", width: 90 }, ASPECT_RATIO, width, height),
            width, height
        );
        setCrop(initialCrop);
    };

    const closeCropModal = () => {
        if (!isProcessing) {
            setCropData({ src: null, fileName: "", originalFile: null });
        }
    };

    const processOriginalImage = async (fileToProcess = cropData.originalFile) => {
        if (!fileToProcess) return;
        setIsProcessing(true);
        try {
            const compressedFile = await imageCompression(fileToProcess, {
                maxSizeMB: 1.8,
                maxWidthOrHeight: Math.max(targetWidth, targetHeight, 1920),
                useWebWorker: true,
            });
            onChange?.(compressedFile);
            closeCropModal();
        } catch (error) {
            console.error("Gagal kompresi:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveCrop = async () => {
        if (!completedCrop || !imgRef.current) return;
        setIsProcessing(true);
        try {
            const croppedFile = await getCroppedImg(imgRef.current, completedCrop, cropData.fileName, targetWidth, targetHeight);
            const compressedFile = await imageCompression(croppedFile, {
                maxSizeMB: 1.5,
                maxWidthOrHeight: Math.max(targetWidth, targetHeight),
                useWebWorker: true,
            });
            onChange?.(compressedFile);
            closeCropModal();
        } catch (error) {
            console.error("Gagal crop/kompresi:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const removeImage = () => {
        onChange?.(null);       
        setIsDeleted(true);     
        onRemove?.();           
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className={cn("w-full space-y-2", className)}>
            {label && <Label className="text-base font-medium">{label}</Label>}

            {preview ? (
                <div className="relative w-full rounded-xl overflow-hidden border bg-background shadow-sm group">
                    <img
                        src={preview}
                        alt="preview"
                        style={{ aspectRatio: `${targetWidth} / ${targetHeight}` }}
                        className="w-full h-auto object-cover cursor-pointer bg-muted transition-opacity group-hover:opacity-90"
                        onClick={() => inputRef.current?.click()}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer pointer-events-none">
                        <span className="text-white font-medium drop-shadow-md">Klik untuk ganti gambar</span>
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                        }}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg opacity-90 hover:opacity-100"
                    >
                        <XIcon className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div
                    className="w-full border-2 border-dashed border-muted-foreground/25 bg-muted/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-muted-foreground/50 transition-all"
                    style={{ aspectRatio: `${targetWidth} / ${targetHeight}` }}
                    onClick={() => inputRef.current?.click()}
                >
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2 opacity-70" />
                    <div className="text-sm text-muted-foreground font-medium">Klik untuk upload gambar</div>
                </div>
            )}

            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />

            {/* Modal Crop shadcn/ui */}
            <Dialog open={!!cropData.src} onOpenChange={(open) => !open && closeCropModal()}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Sesuaikan Gambar</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex justify-center items-center bg-muted/50 p-4 rounded-lg overflow-auto">
                        <ReactCrop 
                            crop={crop} 
                            onChange={(_, p) => setCrop(p)} 
                            onComplete={(c) => setCompletedCrop(c)} 
                            aspect={ASPECT_RATIO}
                        >
                            <img 
                                src={cropData.src} 
                                alt="Crop" 
                                onLoad={onImageLoad} 
                                // Catatan: object-contain dihapus agar crop box akurat, diganti w-auto
                                className="max-h-[55vh] w-auto max-w-full block mx-auto rounded-sm" 
                            />
                        </ReactCrop>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2 mt-2 sm:justify-between w-full">
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full sm:w-auto" 
                            onClick={() => processOriginalImage()} 
                            disabled={isProcessing}
                        >
                            {isProcessing && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                            Gunakan Gambar Asli
                        </Button>

                        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                className="w-full sm:w-auto" 
                                onClick={closeCropModal} 
                                disabled={isProcessing}
                            >
                                Batal
                            </Button>
                            <Button 
                                type="button" 
                                className="w-full sm:w-auto" 
                                onClick={handleSaveCrop} 
                                disabled={isProcessing || !completedCrop?.width}
                            >
                                {isProcessing && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                                Crop & Kompres
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}