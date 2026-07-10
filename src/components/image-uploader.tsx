import { useRef, useState } from "react";
import { AlertCircle, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 flex items-start gap-1 text-xs text-rose-700">
      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

async function uploadImage(file: File, bucket: Bucket, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", bucket);
  if (folder) fd.append("folder", folder);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: fd,
    credentials: "include",
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

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("That file type isn't supported. Use JPG, PNG, WEBP or GIF.");
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
      toast.error(err instanceof Error ? err.message : "Failed to upload image.");
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
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "mt-1 flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition",
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
                <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Uploading…
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
          {description || "Drag & drop or click to upload. JPG, PNG, WEBP or GIF, up to 1.4 MB."}
        </p>
      </div>
      {value && (
        <p className="mt-1 truncate text-xs text-stone-500" title={value}>
          {value}
        </p>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
