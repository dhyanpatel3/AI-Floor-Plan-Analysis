import React, { useRef } from "react";
import {
  Upload,
  FileText,
  X,
  Image as ImageIcon,
  RefreshCw,
  ChevronRight,
  BarChart3,
} from "lucide-react";

interface FileUploadProps {
  file: File | null;
  previewUrl: string | null;
  isAnalyzing: boolean;
  error: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  onClear: () => void;
  variant?: "default" | "hero";
  hideClearButton?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  file,
  previewUrl,
  isAnalyzing,
  error,
  onFileChange,
  onAnalyze,
  onClear,
  variant = "default",
  hideClearButton = false,
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
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${
        variant === "default" ? "h-full flex flex-col" : ""
      }`}
    >
      <div
        className={`p-4 ${
          variant === "default" ? "flex-1 min-h-0 flex flex-col" : ""
        }`}
      >
        <div
          className={`relative border-2 border-dashed rounded-xl ${
            previewUrl ? "p-4" : "p-8"
          } text-center transition-all duration-200 ${
            previewUrl
              ? "border-indigo-200 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-900/20"
              : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700/30"
          } ${
            variant === "default"
              ? "flex-1 min-h-0 flex flex-col justify-center"
              : ""
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
            <div
              className={`relative z-20 ${
                variant === "default" ? "h-full flex flex-col min-h-0" : ""
              }`}
            >
              {!isAnalyzing && !hideClearButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-slate-700 rounded-full shadow-md text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all z-30 ring-1 ring-slate-200 dark:ring-slate-600"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

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
                <div
                  className={`relative rounded-lg overflow-hidden shadow-sm bg-white dark:bg-slate-800 p-2 ${
                    variant === "default"
                      ? "flex-1 min-h-0 flex flex-col justify-center"
                      : ""
                  }`}
                >
                  <div className="relative mx-auto max-h-full">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className={`mx-auto rounded-md object-contain ${
                        variant === "default"
                          ? "max-h-[50vh] lg:max-h-full"
                          : "max-h-40"
                      } ${isAnalyzing ? "blur-[2px] scale-[1.01]" : ""}`}
                    />

                    {/* Scanning Animation Overlay */}
                    {isAnalyzing && (
                      <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none z-10">
                        {/* Pulse Background */}
                        <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-400/5 animate-pulse"></div>

                        {/* Scanning Line & Beam */}
                        <div className="absolute left-0 w-full h-24 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent -top-24 animate-scan"></div>
                        <div className="absolute left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] -top-24 animate-scan"></div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate shrink-0 text-center">
                    {file?.name}
                  </div>
                </div>
              )}
            </div>
          ) : variant === "hero" ? (
            <div className="py-12 space-y-6 flex flex-col items-center justify-center">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-slate-50 dark:bg-slate-800/50 text-indigo-600 dark:text-indigo-400 mb-2 shadow-inner ring-1 ring-slate-200 dark:ring-slate-700">
                  <Upload className="w-10 h-10 transition-transform duration-300 group-hover:-translate-y-1" />
                </div>
              </div>

              <div className="pt-4 text-center">
                <p className="text-lg font-medium text-slate-900 dark:text-white">
                  Click to upload or drag & drop
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-light">
                  Supports JPG, PNG, PDF (Max 10MB)
                </p>
              </div>
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

        {file && !isAnalyzing && variant === "hero" && (
          <button
            type="button"
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
            type="button"
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
