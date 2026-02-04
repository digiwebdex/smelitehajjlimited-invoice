import { useState, useRef } from "react";
import { Upload, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  currentLogo?: string;
  onLogoChange: (logo: string | undefined) => void;
  companyName?: string;
}

export function LogoUpload({ currentLogo, onLogoChange, companyName }: LogoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Max size 2MB
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onLogoChange(result);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Company Logo</label>
      
      {currentLogo ? (
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentLogo}
              alt={companyName || "Company logo"}
              className="h-20 w-20 rounded-xl object-cover border border-border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={handleRemoveLogo}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Logo uploaded</p>
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => fileInputRef.current?.click()}
            >
              Change logo
            </button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50 hover:bg-muted/30",
            isLoading && "opacity-50 pointer-events-none"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isLoading ? "Uploading..." : "Upload logo"}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 2MB
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
