import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Hand, Sparkles, Send, BrainCircuit, Activity, Flame, Loader2, Mail, MessageCircle, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function CommandCenter() {
    const { id } = useParams();
    const [profile, setProfile] = useState<any>(null);
    const [globalConfig, setGlobalConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [agentLang, setAgentLang] = useState('English');
    const [agentTone, setAgentTone] = useState('warm, deeply empathetic, and highly personalized');

    useEffect(() => {
        if (profile?.agent_config) {
            setAgentLang(profile.agent_config.language || 'English');
            setAgentTone(profile.agent_config.tone || 'warm, deeply empathetic, and highly personalized');
        }
    }, [profile?.agent_config]);

    const updateAgentConfig = async (key: string, value: string) => {
        const newLang = key === 'lang' ? value : agentLang;
        const newTone = key === 'tone' ? value : agentTone;
        if (key === 'lang') setAgentLang(value);
        if (key === 'tone') setAgentTone(value);

        try {
            await fetch(`${API_URL}/api/profiles/${id}/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: newLang, tone: newTone })
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleClaim = async () => {
        try {
            await fetch(`${API_URL}/api/profiles/${id}/claim`, { method: 'PUT' });
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const fetchProfile = () => {
            fetch(`${API_URL}/api/profiles/${id}`)
                .then(res => res.json())
                .then(data => { setProfile(data); setLoading(false); })
                .catch(err => console.error(err));
        };

        fetch(`${API_URL}/api/settings`)
            .then(res => res.json())
            .then(data => setGlobalConfig(data))
            .catch(err => console.error(err));

        fetchProfile();
        const interval = setInterval(fetchProfile, 2000);
        return () => clearInterval(interval);
    }, [id]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
    if (!profile) return <div className="flex justify-center p-10 font-bold text-gray-500">Profile Not Found</div>;

    const personal = profile.personal_profile || {};
    const trip = profile.trip_context || {};
    const intent = profile.intent_profile || {};
    const scores = profile.derived_scores || {};
    const messages = profile.recent_interactions || [];

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div className="flex items-center space-x-5">
                    <Link to="/" className="p-2 hover:bg-white border border-transparent hover:border-gray-200 shadow-sm rounded-full text-gray-500 transition-all cursor-pointer bg-gray-50">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center space-x-6">
                        <img src={globalConfig?.dashboard_logo || "/tripnour_logo.png"} alt="TripNour" className="h-[36px] object-contain" />
                        <div className="h-8 w-px bg-gray-300"></div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                                {personal.demographics ? `${personal.demographics} Lead` : 'Anonymous Component'}
                            </h1>
                            <div className="flex items-center mt-1 space-x-2">
                                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{id}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Continue your TripNour conversation here: " + window.location.origin + "/chat/" + id)}`, '_blank')}
                        className="inline-flex items-center justify-center px-3 py-2 font-semibold bg-white border border-gray-300 text-green-700 rounded-xl hover:bg-green-50 transition-all shadow-sm"
                        title="Share via WhatsApp"
                    >
                        <MessageCircle className="w-4 h-4 mr-1.5 text-green-600" />
                        WhatsApp
                    </button>
                    <button
                        onClick={() => window.location.href = `mailto:?subject=Your TripNour Conversation&body=${encodeURIComponent("Continue your TripNour conversation here: " + window.location.origin + "/chat/" + id)}`}
                        className="inline-flex items-center justify-center px-3 py-2 font-semibold bg-white border border-gray-300 text-blue-700 rounded-xl hover:bg-blue-50 transition-all shadow-sm"
                        title="Share via Email"
                    >
                        <Mail className="w-4 h-4 mr-1.5 text-blue-600" />
                        Email
                    </button>
                    <button className="inline-flex items-center justify-center px-4 py-2 font-semibold bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                        <Sparkles className="w-4 h-4 mr-2 text-brand-500" />
                        Gen NBA
                    </button>
                    {profile?.agent_intervention?.claimed_by_agent ? (
                        <button className="inline-flex items-center justify-center px-5 py-2 font-bold bg-gray-100 text-gray-500 rounded-xl transition-all shadow-sm ring-1 ring-gray-200 cursor-default" disabled>
                            <Hand className="w-4 h-4 mr-2" />
                            Claimed by You
                        </button>
                    ) : (
                        <button onClick={handleClaim} className="inline-flex items-center justify-center px-5 py-2 font-bold bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-xl hover:from-red-700 hover:to-rose-600 transition-all shadow-md shadow-red-500/20 ring-1 ring-white/20">
                            <Hand className="w-4 h-4 mr-2" />
                            Intervene & Claim
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                {/* Context Panel */}
                <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-6 flex flex-col min-h-0 overflow-y-auto pr-2 pb-4">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-gray-900"><BrainCircuit className="w-24 h-24" /></div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-5 flex items-center"><Activity className="w-4 h-4 mr-2" />Trip Context</h3>
                        <div className="space-y-5 relative z-10">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="block text-xs font-semibold text-gray-400 mb-0.5 uppercase tracking-wider">Motivation</span>
                                <span className="font-bold text-gray-800 text-lg">{intent.primary_motivation || 'Unknown'}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="block text-xs font-semibold text-gray-400 mb-0.5 uppercase tracking-wider">Budget Target</span>
                                <span className="font-bold text-emerald-700 text-lg">{trip.budget?.value ? `$${trip.budget.value.toLocaleString()}` : 'TBD'}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Destinations</span>
                                <div className="flex flex-wrap gap-2">
                                    {trip.destinations_considered && trip.destinations_considered.map((dest: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-brand-100 text-brand-800 rounded-md border border-brand-200 text-sm font-bold shadow-sm">{dest}</span>
                                    ))}
                                    {!trip.destinations_considered?.length && <span className="text-gray-400 text-sm font-medium">None yet</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Metrics</h3>
                        <div className="space-y-7 flex-1">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-gray-700">Readiness</span>
                                    <span className="font-black text-brand-600">{scores.readiness_score || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 shadow-inner">
                                    <div className="bg-brand-500 h-3 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(20,184,166,0.6)]" style={{ width: `${scores.readiness_score || 0}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-gray-700">Intent Volume</span>
                                    <span className="font-black text-blue-600">{scores.intent_score || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 shadow-inner">
                                    <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${scores.intent_score || 0}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-gray-700">Confidence</span>
                                    <span className="font-black text-amber-500">{scores.confidence_score || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 shadow-inner">
                                    <div className="bg-amber-400 h-3 rounded-full transition-all duration-1000" style={{ width: `${scores.confidence_score || 0}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-orange-200 shadow-sm">
                            <span className="flex items-center text-xs font-black uppercase text-orange-700 tracking-wider">
                                <Flame className="w-4 h-4 mr-1.5 text-orange-500" /> Urgency Flag
                            </span>
                            <p className="text-sm font-medium text-orange-900 mt-2 leading-snug">User isolated budget constraints. Ready to convert on Bali luxury villas.</p>
                        </div>

                        {/* Agent Steering Panel */}
                        <div className="mt-6 flex-1 flex flex-col pt-6 border-t border-gray-100">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center">
                                <Settings className="w-4 h-4 mr-2" />
                                Agent Steering
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Language</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
                                        value={agentLang}
                                        onChange={(e) => updateAgentConfig('lang', e.target.value)}
                                    >
                                        <option value="English">English</option>
                                        <option value="Spanish">Spanish</option>
                                        <option value="French">French</option>
                                        <option value="Mandarin">Mandarin</option>
                                        <option value="Arabic">Arabic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Agent Tone</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
                                        value={agentTone}
                                        onChange={(e) => updateAgentConfig('tone', e.target.value)}
                                    >
                                        <option value="warm, deeply empathetic, and highly personalized">White-Glove Luxury</option>
                                        <option value="fun, energetic, and extremely enthusiastic">Fun & Energetic</option>
                                        <option value="direct, strictly factual, and efficient">Direct & Efficient</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversation Stream */}
                <div className="col-span-12 lg:col-span-8 xl:col-span-9 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col min-h-0 relative overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-white/50 backdrop-blur-xl flex items-center justify-between absolute top-0 left-0 right-0 z-10">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                                <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">Web Chat</h3>
                        </div>
                        {profile?.agent_intervention?.claimed_by_agent ? (
                            <span className="flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-rose-500 mr-2 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                                Human Agent Active
                            </span>
                        ) : (
                            <span className="flex items-center text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-200 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-brand-500 mr-2 animate-pulse"></div>
                                TripNour AI Active
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 pt-24 space-y-6 bg-gray-50/30">
                        {messages.length === 0 && (
                            <div className="flex items-center justify-center p-10 text-gray-400 font-medium h-full">No interactions yet.</div>
                        )}
                        {messages.map((msg: any, i: number) => {
                            const isUser = msg.channel === 'WEB_CHAT';
                            return (
                                <div key={i} className={`flex flex-col space-y-1.5 max-w-[85%] ${isUser ? '' : 'self-end items-end ml-auto'}`}>
                                    {isUser ? (
                                        <span className="text-xs font-semibold text-gray-400 ml-1">
                                            {personal.demographics || 'User'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    ) : (
                                        <div className="flex items-center space-x-1.5 mb-0.5">
                                            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                                            <span className="text-xs text-brand-700 font-bold uppercase tracking-wider">TripNour AI</span>
                                        </div>
                                    )}
                                    <div className={
                                        isUser
                                            ? "bg-white text-gray-800 rounded-2xl p-4 rounded-tl-sm border border-gray-200 shadow-sm text-sm/relaxed font-medium whitespace-pre-wrap"
                                            : "bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-2xl p-4 rounded-tr-sm shadow-md text-sm/relaxed font-medium whitespace-pre-wrap"
                                    }>
                                        {msg.summary.replace(/^(USER|AI):\s*/i, '')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="px-6 py-5 border-t border-gray-100 bg-white z-10 relative">
                        <div className="flex items-center space-x-3">
                            <input
                                disabled
                                type="text"
                                placeholder="Auto-pilot is engaged. Intervene to override."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-inner transition-all text-gray-500"
                            />
                            <button disabled className="p-3.5 bg-gray-100 text-gray-400 rounded-xl transition-colors cursor-not-allowed shadow-sm border border-gray-200">
                                <Send className="w-5 h-5 ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
