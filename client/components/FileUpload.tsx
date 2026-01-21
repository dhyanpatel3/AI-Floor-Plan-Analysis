import React, { useRef } from "react";
import {
  Upload,
  FileText,
  X,
  Image as ImageIcon,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

interface FileUploadProps {
  file: File | null;
  previewUrl: string | null;
  isAnalyzing: boolean;
  error: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  onClear: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  file,
  previewUrl,
  isAnalyzing,
  error,
  onFileChange,
  onAnalyze,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Create a synthetic event to reuse the handler logic if possible,
      // or just call the handler directly if we refactor.
      // For now, let's keep it simple and assume the parent uses the input.
      // Ideally, the parent should handle the file object directly.
      // Accessing the input ref to manually set files is tricky.
      // Let's just create a data transfer object.
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(e.dataTransfer.files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const event = {
          target: fileInputRef.current,
        } as React.ChangeEvent<HTMLInputElement>;
        onFileChange(event);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center">
          <Upload className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
          Upload Plan
        </h2>
      </div>

      <div className="p-6">
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            previewUrl
              ? "border-indigo-200 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-900/20"
              : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700/30"
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={onFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isAnalyzing}
          />

          {previewUrl ? (
            <div className="relative z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="absolute -top-4 -right-4 bg-white dark:bg-slate-700 rounded-full p-1 shadow-md border border-slate-200 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/50 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Remove file"
              >
                <X size={16} />
              </button>

              {file?.type.includes("pdf") ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-3">
                    <FileText className="w-10 h-10 text-red-500 dark:text-red-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    PDF Document
                  </span>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden shadow-sm bg-white dark:bg-slate-800 p-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-md object-contain"
                  />
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                    {file?.name}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 space-y-4">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 text-indigo-500 dark:text-indigo-300 rounded-full flex items-center justify-center mx-auto shadow-sm ring-1 ring-indigo-100 dark:ring-slate-600">
                <ImageIcon size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports JPG, PNG, PDF (Max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex items-start text-red-700 dark:text-red-300 text-sm">
            <span className="mr-2 mt-0.5">⚠️</span>
            {error}
          </div>
        )}

        {file && !isAnalyzing && (
          <button
            onClick={onAnalyze}
            className="mt-6 w-full flex items-center justify-center py-3 px-4 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg font-medium shadow-md shadow-indigo-200 dark:shadow-none transition-all transform active:scale-[0.98]"
          >
            Analyze Floor Plan
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        )}

        {isAnalyzing && (
          <button
            disabled
            className="mt-6 w-full flex items-center justify-center py-3 px-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium cursor-wait"
          >
            <RefreshCw className="animate-spin w-4 h-4 mr-2" />
            Processing AI Analysis...
          </button>
        )}
      </div>
    </div>
  );
};
