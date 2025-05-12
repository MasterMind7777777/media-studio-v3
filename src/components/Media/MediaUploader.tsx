
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useUploadMedia } from "@/hooks/api";

interface MediaUploaderProps {
  onMediaSelected?: (mediaAsset: any) => void;
  contentPackId?: string;
}

export function MediaUploader({ onMediaSelected, contentPackId }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadMedia, isPending } = useUploadMedia();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      validateAndAddFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      validateAndAddFiles(files);
    }
  };

  const validateAndAddFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      // Check file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      // Check file size (100MB max)
      const isValidSize = file.size <= 100 * 1024 * 1024;
      
      if (!isImage && !isVideo) {
        toast.error(`File type not supported: ${file.name}`, {
          description: "Only images and videos are allowed."
        });
        return false;
      }
      
      if (!isValidSize) {
        toast.error(`File too large: ${file.name}`, {
          description: "Maximum file size is 100MB."
        });
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast.error("No files selected", {
        description: "Please select files to upload."
      });
      return;
    }

    // Upload each file
    selectedFiles.forEach(file => {
      const fileName = file.name.replace(/\s+/g, '-').toLowerCase();
      
      uploadMedia({
        file,
        name: fileName,
        contentPackId
      }, {
        onSuccess: (mediaAsset) => {
          toast.success(`Uploaded: ${file.name}`, {
            description: "File uploaded successfully."
          });
          
          // Remove from selectedFiles
          setSelectedFiles(prevFiles => prevFiles.filter(f => f.name !== file.name));
          
          // Notify parent component if callback provided
          if (onMediaSelected) {
            onMediaSelected(mediaAsset);
          }
        },
        onError: (error) => {
          toast.error(`Failed to upload: ${file.name}`, {
            description: error.message
          });
        }
      });
    });
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-md transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <Upload className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg">Drop files to upload</h3>
        <p className="text-muted-foreground mb-4">or click to browse files</p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleFileSelect}
          accept="image/*, video/*"
        />
        <p className="text-xs text-muted-foreground mt-4">
          Supported: JPG, PNG, WebP, MP4, MOV up to 100MB
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center mr-2">
                    {file.type.startsWith('image/') ? 
                      <img src={URL.createObjectURL(file)} className="max-w-full max-h-full rounded" alt="" /> :
                      <div className="w-full h-full bg-primary/20 rounded" />
                    }
                  </div>
                  <div>
                    <div className="text-sm font-medium truncate max-w-[250px]">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Uploading..." : "Upload Files"}
          </Button>
        </div>
      )}
    </div>
  );
}
