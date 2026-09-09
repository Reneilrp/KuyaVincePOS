import React, { useState } from 'react';
import { UploadCloud, FileCheck, AlertCircle } from 'lucide-react';

interface Props {
  onImportBatch: (batchData: any) => void;
}

export const OfflineJsonDropzone: React.FC<Props> = ({ onImportBatch }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setErrorMessage('Please upload a valid .json daily sales batch file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.orders && !parsed.analytics) {
          throw new Error('Unrecognized POS batch JSON schema.');
        }

        onImportBatch(parsed);
        setSuccessMessage(`Successfully imported "${file.name}" (${(parsed.orders?.length || parsed.analytics?.kpis?.total_sales_count || 0)} transactions)!`);
        setErrorMessage(null);
      } catch (err: any) {
        setErrorMessage('Failed to parse JSON file: ' + err.message);
        setSuccessMessage(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            📥 Offline JSON Batch Uploader
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Import .json sales files exported from disconnected Sunmi terminals</p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Zero Server Needed
        </span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-950/20' : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950'
        }`}
      >
        <input
          type="file"
          accept=".json"
          onChange={handleFileInput}
          id="json-file-input"
          className="hidden"
        />
        <label htmlFor="json-file-input" className="cursor-pointer flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UploadCloud className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
            Drag & drop <span className="text-blue-400 font-mono">daily_sales.json</span> here or <span className="text-blue-400 underline">browse file</span>
          </p>
          <p className="text-xs text-slate-500">Supports all Sunmi offline exported bundles</p>
        </label>
      </div>

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-slate-950 border border-emerald-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
          <FileCheck className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-slate-950 border border-rose-200 dark:border-slate-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
