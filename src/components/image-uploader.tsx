import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ImagePlus,
  ImageUp,
  Images,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const MAX_BYTES = 1400 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Bucket = "hikes" | "equipment";

type ImageUploaderProps = {
  fieldId: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  onBlur?: () => void;
  bucket: Bucket;
  folder: string;
  error?: string;
  errorId?: string;
  description?: string;
  optional?: boolean;
  fullWidth?: boolean;
};

type BrowseImage = {
  name: string;
  url: string;
  slug: string | null;
  updatedAt: string;
};

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 flex items-start gap-1 text-xs text-rose-700"
    >
      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

async function uploadImage(
  file: File,
  bucket: Bucket,
  folder: string,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", bucket);
  if (folder) fd.append("folder", folder);

  const headers: Record<string, string> = {};
  try {
    const { data } = await supabase().auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // No Supabase session — let the server enforce auth.
  }

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: fd,
    credentials: "include",
    headers,
  });
  const text = await res.text();
  let body: { url?: string; error?: string } = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }
  if (!res.ok) {
    throw new Error(body.error || `Upload failed (${res.status})`);
  }
  if (!body.url) {
    throw new Error("Upload succeeded but no URL was returned.");
  }
  return body.url;
}

export function ImageUploader({
  fieldId,
  label,
  value,
  onChange,
  onBlur,
  bucket,
  folder,
  error,
  errorId,
  description,
  optional = false,
  fullWidth = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<"upload" | "browse">("upload");

  // Browse state
  const [images, setImages] = useState<BrowseImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setLoadingImages(true);
    setBrowseError(null);
    try {
      const headers: Record<string, string> = {};
      try {
        const { data } = await supabase().auth.getSession();
        const token = data.session?.access_token;
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch { /* noop */ }

      const res = await fetch(`/api/admin/images?kind=${bucket}`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load images (${res.status})`);
      }
      const body = await res.json();
      setImages(body.images ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load images";
      setBrowseError(msg);
      toast.error(msg);
    } finally {
      setLoadingImages(false);
    }
  }, [bucket]);

  // Fetch when switching to browse mode
  useEffect(() => {
    if (mode === "browse" && images.length === 0 && !loadingImages && !browseError) {
      fetchImages();
    }
  }, [mode, fetchImages, images.length, loadingImages, browseError]);

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error(
        "That file type isn't supported. Use JPG, PNG, WEBP or GIF.",
      );
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image is too large (max 1.4 MB). Try resizing it.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file, bucket, folder);
      onChange(url);
      onBlur?.();
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload image.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <Label htmlFor={fieldId}>
        {label}
        {optional ? " (optional)" : ""}
      </Label>

      {/* Mode tabs */}
      <div className="mt-1 flex gap-1 rounded-md border border-stone-200 bg-stone-100 p-0.5">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition",
            mode === "upload"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700",
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload new
        </button>
        <button
          type="button"
          onClick={() => setMode("browse")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition",
            mode === "browse"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700",
          )}
        >
          <Images className="h-3.5 w-3.5" />
          Browse existing
        </button>
      </div>

      {mode === "upload" ? (
        /* Upload mode — drag & drop / click to upload */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "mt-2 flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition",
            dragOver
              ? "border-emerald-500 bg-emerald-50"
              : "border-stone-300 bg-stone-50 hover:border-stone-400",
            error && "border-rose-400 bg-rose-50/30",
          )}
        >
          {value ? (
            <div className="w-full">
              <img
                src={value}
                alt="Preview"
                className="mx-auto max-h-48 rounded-md object-contain"
              />
            </div>
          ) : (
            <ImagePlus className="h-8 w-8 text-stone-400" />
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <input
              ref={fileInputRef}
              id={`${fieldId}-file`}
              type="file"
              accept={ACCEPTED.join(",")}
              onChange={onFileInput}
              className="hidden"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />{" "}
                  Uploading…
                </>
              ) : value ? (
                <>
                  <Upload className="mr-1 h-4 w-4" /> Replace image
                </>
              ) : (
                <>
                  <Upload className="mr-1 h-4 w-4" /> Upload image
                </>
              )}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => {
                  onChange("");
                  onBlur?.();
                }}
                className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                <X className="mr-1 h-4 w-4" /> Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-stone-500">
            {description ||
              "Drag & drop or click to upload. JPG, PNG, WEBP or GIF, up to 1.4 MB."}
          </p>
        </div>
      ) : (
        /* Browse mode — pick from existing images */
        <div className="mt-2">
          {loadingImages ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-stone-200 px-4 py-10 text-stone-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Loading images…</span>
            </div>
          ) : browseError ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50/30 px-4 py-8 text-center">
              <AlertCircle className="h-6 w-6 text-rose-400" />
              <p className="text-xs text-rose-700">{browseError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchImages}
              >
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Try again
              </Button>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-stone-200 px-4 py-8 text-center">
              <ImageUp className="h-6 w-6 text-stone-400" />
              <p className="text-xs text-stone-500">
                No images in this bucket yet. Switch to "Upload new" to add
                one.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  {images.length} image{images.length !== 1 ? "s" : ""}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={fetchImages}
                  disabled={loadingImages}
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw
                    className={cn(
                      "mr-1 h-3 w-3",
                      loadingImages && "animate-spin",
                    )}
                  />
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((img) => (
                  <button
                    key={img.name}
                    type="button"
                    onClick={() => {
                      onChange(img.url);
                      onBlur?.();
                    }}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-md border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                      value === img.url
                        ? "border-emerald-600 ring-1 ring-emerald-600"
                        : "border-transparent hover:border-stone-300",
                    )}
                    title={img.name}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {value === img.url && (
                      <span className="absolute right-1 top-1 rounded bg-emerald-600 px-1 py-0.5 text-[9px] font-semibold text-white">
                        Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <FieldError id={errorId} message={error} />
    </div>
  );
}
