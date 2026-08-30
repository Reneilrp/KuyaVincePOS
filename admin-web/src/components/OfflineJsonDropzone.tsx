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
        setSuccessMessage(`✅ Successfully imported "${file.name}" (${(parsed.orders?.length || parsed.analytics?.kpis?.total_sales_count || 0)} transactions)!`);
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            📥 Offline JSON Batch Uploader
          </h3>
          <p className="text-xs text-slate-400">Import `.json` sales files exported from disconnected Sunmi terminals</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900">
          Zero Server Needed
        </span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
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
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-200">
            Drag & drop <span className="text-blue-400">daily_sales.json</span> here or <span className="text-blue-400 underline">browse file</span>
          </p>
          <p className="text-[10px] text-slate-500">Supports all Sunmi offline exported bundles</p>
        </label>
      </div>

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs flex items-center gap-2">
          <FileCheck className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
