import { Save, Globe, MessageSquare, Image as ImageIcon, Sliders, DollarSign, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Settings() {
    const [config, setConfig] = useState({
        dashboard_logo: '/tripnour_logo.png',
        chat_logo: '/tripnour_logo.png',
        welcome_message: 'Welcome to TripNour! I am your personal luxury travel concierge. To begin curating your perfect getaway, who do I have the pleasure of speaking with today?',
        language: 'English',
        currency: 'GBP (£)',
        agent_tone: 'warm, deeply empathetic, and highly personalized',
        handoff_threshold: 80,
        default_llm: 'gemini-2.5-flash',
        outbound_email_html: 'Hi {name},\n\nWe saw you were looking for luxury travel options. Click here to chat instantly with your concierge: {link}',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'concierge@tripnour.com',
        smtp_pass: '',
        pop_host: 'pop.gmail.com',
        pop_port: 995,
        pop_user: '',
        pop_pass: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/settings`)
            .then(res => res.json())
            .then(data => {
                if (Object.keys(data).length > 0) setConfig(data);
            })
            .catch(err => console.error(err));
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: name === 'handoff_threshold' ? Number(value) : value }));
    };

    const handleSave = async () => {
        setSaving(true);
        await fetch(`${API_URL}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        setTimeout(() => setSaving(false), 500);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Platform Configuration</h1>
                <p className="text-sm text-gray-500 mt-1">Manage global AI behaviors, branding, and system defaults.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Branding & Experience */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-brand-50 rounded-lg text-brand-600"><ImageIcon className="w-5 h-5" /></div>
                        <h2 className="text-lg font-bold text-gray-900">Branding & Experience</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Sales Dashboard Logo URL</label>
                            <input type="text" name="dashboard_logo" value={config.dashboard_logo} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Traveler Chat Logo URL</label>
                            <input type="text" name="chat_logo" value={config.chat_logo} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">AI Welcome Message</label>
                            <textarea name="welcome_message" value={config.welcome_message} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none h-24 resize-none"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Outbound Email HTML Template</label>
                            <textarea name="outbound_email_html" value={config.outbound_email_html} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 font-mono outline-none h-32 resize-none"></textarea>
                            <p className="text-xs text-gray-400 mt-1 flex justify-between"><span>Available variables: {'{name}'}, {'{email}'}, {'{link}'}</span></p>
                        </div>
                    </div>
                </div>

                {/* AI & Routing Engine */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Bot className="w-5 h-5" /></div>
                        <h2 className="text-lg font-bold text-gray-900">AI Personality & Engine</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><Bot className="w-4 h-4 mr-1.5 text-gray-400" /> Primary LLM Model</label>
                            <select name="default_llm" value={config.default_llm || 'gemini-2.5-flash'} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white outline-none">
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><Globe className="w-4 h-4 mr-1.5 text-gray-400" /> Default Language</label>
                            <select name="language" value={config.language} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white outline-none">
                                <option>English</option>
                                <option>French</option>
                                <option>Spanish</option>
                                <option>Arabic</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><DollarSign className="w-4 h-4 mr-1.5 text-gray-400" /> Base Currency</label>
                            <select name="currency" value={config.currency} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white outline-none">
                                <option>GBP (£)</option>
                                <option>USD ($)</option>
                                <option>EUR (€)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><MessageSquare className="w-4 h-4 mr-1.5 text-gray-400" /> Default Agent Tone</label>
                            <input type="text" name="agent_tone" value={config.agent_tone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><Sliders className="w-4 h-4 mr-1.5 text-gray-400" /> HITL Handoff Threshold (%)</label>
                            <div className="flex items-center space-x-4">
                                <input type="range" name="handoff_threshold" value={config.handoff_threshold} onChange={handleChange} min="0" max="100" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                                <span className="text-sm font-bold text-gray-700 w-8">{config.handoff_threshold}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Core Integration */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6 lg:col-span-2">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><MessageSquare className="w-5 h-5" /></div>
                        <h2 className="text-lg font-bold text-gray-900">Email Server Integration (SMTP/POP)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b pb-2">Outbound SMTP</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Host</label>
                                    <input type="text" name="smtp_host" value={config.smtp_host} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Port</label>
                                    <input type="number" name="smtp_port" value={config.smtp_port} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Username / Email</label>
                                <input type="text" name="smtp_user" value={config.smtp_user} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Password / App Key</label>
                                <input type="password" name="smtp_pass" value={config.smtp_pass} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b pb-2">Inbound POP3 Engine</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Host</label>
                                    <input type="text" name="pop_host" value={config.pop_host} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Port</label>
                                    <input type="number" name="pop_port" value={config.pop_port} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Username / Email</label>
                                <input type="text" name="pop_user" value={config.pop_user} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Password / App Key</label>
                                <input type="password" name="pop_pass" value={config.pop_pass} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex justify-end pt-4">
                <button onClick={handleSave} className="flex items-center px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saved Successfully!' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );
}
