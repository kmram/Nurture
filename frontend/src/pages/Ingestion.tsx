import { FileText, Send } from 'lucide-react';
import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Ingestion() {
    const [csvData, setCsvData] = useState(`Name,Email,Intent\nJohn Doe,john@example.com,Maldives Honeymoon\nJane Smith,jane@example.com,Swiss Alps Skiing`);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpload = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/ingest/csv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csvData })
            });
            const data = await res.json();
            setResult(data);
        } catch (e: any) {
            alert('Backend connection failed. Make sure the Node server is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Campaign Ingestion</h1>
                <p className="text-sm text-gray-500 mt-1">Bulk upload outbound leads to automatically generate profiles and fire Magic Link emails.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center"><FileText className="w-4 h-4 mr-2" /> Paste CSV Data</label>
                    <textarea
                        className="w-full h-48 px-4 py-3 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                        value={csvData}
                        onChange={(e) => setCsvData(e.target.value)}
                    ></textarea>
                    <p className="text-xs text-gray-400 mt-2">Required columns: Name,Email,Intent</p>
                </div>

                <div className="flex items-center justify-between">
                    {result ? (
                        <div className="px-4 py-3 bg-green-50 text-green-700 rounded-lg font-bold text-sm tracking-tight border border-green-200">
                            🚀 Successfully ingested {result.ingested_count} leads and queued outbound emails! Check backend terminal.
                        </div>
                    ) : <div></div>}
                    <button
                        onClick={handleUpload}
                        disabled={loading}
                        className="flex items-center px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Send className="w-4 h-4 mr-2" /> {loading ? "Processing..." : "Deploy Campaign"}
                    </button>
                </div>
            </div>
        </div>
    );
}
