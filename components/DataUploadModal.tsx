
import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, X } from 'lucide-react';
import { parseCsv } from '../utils/csvParser';
import { ColumnMapping } from '../vocabService';

interface DataUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (file: File, mapping: ColumnMapping, encoding: string) => void;
}

export const DataUploadModal: React.FC<DataUploadModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({ word: '' });
    const [error, setError] = useState<string>('');
    const [encoding, setEncoding] = useState<string>('UTF-8');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFileForPreview(selectedFile, encoding);
        }
    };

    const parseFileForPreview = (file: File, enc: string) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const { data, headers, error } = parseCsv(content);

            if (error) {
                setError(error);
                return;
            }

            if (headers.length === 0) {
                setError('CSV headers not found');
                return;
            }

            setHeaders(headers);
            setPreviewData(data.slice(0, 3));

            // Auto-detect columns with expanded keywords
            // Prioritize strict matches for the user's specific file format
            const wordCol = headers.find(h => /^word$/i.test(h.trim()) || /english word/i.test(h)) ||
                headers.find(h => /word|english|단어|영어|item|term|vocab|exp/i.test(h)) || headers[0];

            const rankCol = headers.find(h => /cefr|grade|rank|level|난이도|등급|순위/i.test(h));

            const meaningCol = headers.find(h => /korean.*definition|한글.*뜻|meaning|def|equivalent|translation/i.test(h.replace(/\n/g, ' ')));

            setMapping({
                word: wordCol || '',
                rank: rankCol,
                meaning: meaningCol
            });
            setError('');
        };
        reader.readAsText(file, enc);
    };

    const handleSubmit = () => {
        if (!file || !mapping.word) {
            setError('Please select a file and map the "Word" column.');
            return;
        }
        onConfirm(file, mapping, encoding);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Upload size={24} className="text-cyan-500" />
                        Upload Master Data
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                    {/* File Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
              ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-cyan-500 hover:bg-slate-800/50'}
            `}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {file ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-full mb-2">
                                    <FileText size={32} />
                                </div>
                                <p className="text-emerald-400 font-bold">{file.name}</p>
                                <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setHeaders([]); }}
                                    className="mt-2 text-xs text-rose-400 hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Upload size={48} className="mb-2 opacity-50" />
                                <p className="font-bold">Click to upload CSV</p>
                                <p className="text-xs opacity-70">Supports Google Sheets export format</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400">
                            <AlertCircle size={20} />
                            <span className="text-sm font-bold">{error}</span>
                        </div>
                    )}

                    {/* Column Mapping Section */}
                    {headers.length > 0 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Column Mapping</h4>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-slate-500">File Encoding:</label>
                                        <select
                                            value={encoding}
                                            onChange={(e) => {
                                                const newEnc = e.target.value;
                                                setEncoding(newEnc);
                                                if (file) parseFileForPreview(file, newEnc);
                                            }}
                                            className="bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-white text-xs focus:border-cyan-500 focus:outline-none"
                                        >
                                            <option value="UTF-8">UTF-8 / Google Sheets</option>
                                            <option value="EUC-KR">EUC-KR / Excel (KR)</option>
                                            <option value="CP949">CP949</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-cyan-400">Word Column (Required)</label>
                                        <select
                                            value={mapping.word}
                                            onChange={(e) => setMapping({ ...mapping, word: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                                        >
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">Rank/Level (Optional)</label>
                                        <select
                                            value={mapping.rank || ''}
                                            onChange={(e) => setMapping({ ...mapping, rank: e.target.value || undefined })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                                        >
                                            <option value="">(None - Use Default 1000)</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">Meaning (Optional)</label>
                                        <select
                                            value={mapping.meaning || ''}
                                            onChange={(e) => setMapping({ ...mapping, meaning: e.target.value || undefined })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                                        >
                                            <option value="">(None)</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Data Preview Table */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Preview</h4>
                                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                                    <table className="w-full text-sm text-left text-slate-400">
                                        <thead className="bg-slate-900 text-xs uppercase font-bold text-slate-300">
                                            <tr>
                                                {headers.map(h => (
                                                    <th key={h} className={`px-4 py-3 ${h === mapping.word ? 'text-cyan-400 bg-cyan-950/30' :
                                                        h === mapping.rank ? 'text-amber-400 bg-amber-950/30' : ''
                                                        }`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, i) => (
                                                <tr key={i} className="border-b border-slate-800 last:border-0">
                                                    {headers.map(h => (
                                                        <td key={h} className={`px-4 py-3 border-l border-slate-800 first:border-l-0 ${h === mapping.word ? 'bg-cyan-950/10 text-cyan-100 font-medium' :
                                                            h === mapping.rank ? 'bg-amber-950/10 text-amber-100' : ''
                                                            }`}>{row[h]}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!file || !mapping.word}
                        onClick={handleSubmit}
                        className={`px-8 py-3 rounded-xl font-bold text-slate-900 flex items-center gap-2 transition-all transform active:scale-95
              ${!file || !mapping.word
                                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-cyan-500 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'}
            `}
                    >
                        <Check size={20} />
                        Confirm Data
                    </button>
                </div>
            </div>
        </div>
    );
};
