import { useState, useRef } from "react";
import { X, Loader2, ImagePlus, Sparkles } from "lucide-react";
import { compressImages } from "@/lib/image-compress";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [compressing, setCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    let toUpload = Array.from(files).slice(0, remaining);

    // Validate
    for (const f of toUpload) {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(f.type)) {
        setError(`Invalid file type: ${f.name}`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError(`File too large: ${f.name}. Max 10MB.`);
        return;
      }
    }

    setUploading(true);
    setCompressing(false);
    setError("");

    try {
      // Compress images before upload
      setCompressing(true);
      const compressed = await compressImages(toUpload, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        format: "image/jpeg",
      });
      setCompressing(false);

      const formData = new FormData();
      compressed.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      onChange([...images, ...(data.urls as string[])]);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setCompressing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-2">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-[#1B2A4A]">
              <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-[#E53935] rounded-full flex items-center justify-center"
              >
                <X size={12} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] bg-[#D4A03C] text-[#1B2A4A] px-1.5 py-0.5 rounded-full font-bold">
                  MAIN
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-20 border-2 border-dashed border-[#8A94A6]/30 rounded-lg flex flex-col items-center justify-center gap-1 text-[#8A94A6] hover:border-[#D4A03C]/50 hover:text-[#D4A03C] transition-colors disabled:opacity-50"
        >
          {uploading ? (
            compressing ? (
              <>
                <Sparkles size={18} className="text-[#D4A03C]" />
                <span className="text-xs">Compressing...</span>
              </>
            ) : (
              <>
                <Loader2 size={18} className="animate-spin text-[#D4A03C]" />
                <span className="text-xs">Uploading...</span>
              </>
            )
          ) : (
            <>
              <ImagePlus size={18} />
              <span className="text-xs">
                {images.length === 0 ? "Add Photos" : `Add More (${images.length}/${maxImages})`}
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-[#E53935] text-xs">{error}</p>}
      <p className="text-[#8A94A6] text-[10px]">
        JPEG, PNG, WebP up to 10MB each. Auto-compressed to 1200px on upload.
      </p>
    </div>
  );
}
