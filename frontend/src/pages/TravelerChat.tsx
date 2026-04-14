import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, MapPin, Sparkles, User, Wallet, Heart, Users, Calendar, ShieldAlert } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type Message = { role: 'user' | 'ai', content: string };

const INITIAL_MESSAGES: Message[] = [
    { role: 'ai', content: "Welcome to TripNour! I am your personal luxury travel concierge. To begin curating your perfect getaway, who do I have the pleasure of speaking with today?" }
];

export default function TravelerChat() {
    const { id } = useParams();
    const [userId] = useState(() => id || 'visitor_' + Math.floor(Math.random() * 1000000).toString(16));
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [globalConfig, setGlobalConfig] = useState<any>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const [profile, setProfile] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);

    const getImageUrl = (rec: any) => {
        const region = rec.region.toLowerCase();
        const type = rec.package_type.toLowerCase();

        const beaches = [
            "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2",
            "https://images.unsplash.com/photo-1506929562872-bb421503ef21",
            "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57",
            "https://images.unsplash.com/photo-1519046904884-53103b34b206",
            "https://images.unsplash.com/photo-1544644181-1484b3fdfc62"
        ];
        const safaris = [
            "https://images.unsplash.com/photo-1516426122078-c23e76319801",
            "https://images.unsplash.com/photo-1547471080-7cb2cb6a5a36",
            "https://images.unsplash.com/photo-1521651201144-634f700b36ef",
            "https://images.unsplash.com/photo-1552086576-f3ccbdf9ae77"
        ];
        const ski = [
            "https://images.unsplash.com/photo-1551524164-687a55dd1126",
            "https://images.unsplash.com/photo-1548777123-e216912df7d8",
            "https://images.unsplash.com/photo-1523720760434-d3369a19cff7"
        ];
        const city = [
            "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df",
            "https://images.unsplash.com/photo-1502602881462-f22e2827e1f4",
            "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad"
        ];
        const generic = [
            "https://images.unsplash.com/photo-1540541338287-41700207dee6",
            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd"
        ];

        let pool = generic;
        if (region.includes('bali') || region.includes('maldives') || region.includes('fiji') || region.includes('bora') || region.includes('caribbean') || region.includes('seychelles') || type.includes('honeymoon')) {
            pool = beaches;
        } else if (region.includes('africa') || region.includes('kenya') || region.includes('south africa') || type.includes('safari')) {
            pool = safaris;
        } else if (type.includes('ski') || region.includes('alps') || region.includes('swiss') || region.includes('aspen') || region.includes('whistler')) {
            pool = ski;
        } else if (region.includes('paris') || region.includes('rome') || region.includes('london') || region.includes('tokyo') || type.includes('family')) {
            pool = city;
        }

        let hash = 0;
        for (let i = 0; i < rec.resort_name.length; i++) {
            hash = rec.resort_name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const idx = Math.abs(hash) % pool.length;

        return `${pool[idx]}?auto=format&fit=crop&w=600&q=80`;
    };

    useEffect(() => {
        fetch(`${API_URL}/api/settings`)
            .then(res => res.json())
            .then(data => {
                setGlobalConfig(data);
                if (!id) {
                    setMessages([{ role: 'ai', content: data.welcome_message || INITIAL_MESSAGES[0].content }]);
                }
            })
            .catch(console.error);

        if (!id) return;

        const fetchData = async () => {
            try {
                const profileRes = await fetch(`${API_URL}/api/profiles/${id}`);
                const data = await profileRes.json();
                setProfile(data);

                if (data && data.recent_interactions && data.recent_interactions.length > 0) {
                    const formattedMsgs = data.recent_interactions
                        .filter((msg: any) => msg.channel === 'WEB_CHAT' || msg.channel === 'AI_AGENT')
                        .map((msg: any) => ({
                            role: msg.channel === 'WEB_CHAT' ? 'user' : 'ai',
                            content: msg.summary.replace(/^(USER|AI):\s*/i, '')
                        }));
                    if (formattedMsgs.length > 0) {
                        setMessages(formattedMsgs);
                    }
                }

                const recRes = await fetch(`${API_URL}/api/products/recommendations?userId=${id}`);
                const recData = await recRes.json();
                setRecommendations(recData);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue;
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInputValue('');
        setIsTyping(true);

        try {
            const res = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, message: userMessage })
            });
            const data = await res.json();

            setIsTyping(false);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: data.reply
            }]);
        } catch (error) {
            setIsTyping(false);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't reach the backend server right now." }]);
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-50 relative selection:bg-brand-100 selection:text-brand-900 overflow-hidden text-gray-900">
            {/* Decorative Background */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

            {/* Global Brand Header */}
            <header className="w-full bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between z-20 shadow-sm relative">
                <div className="flex items-center space-x-6">
                    <img src={globalConfig?.chat_logo || "/tripnour_logo.png"} alt="Brand" className="h-[72px] object-contain cursor-pointer" />
                    <div className="h-12 w-px bg-gray-200"></div>
                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Powered by TripNour</span>
                </div>
            </header>

            <div className="w-full h-full flex flex-1 shadow-2xl bg-white overflow-hidden border-t border-gray-100">

                {/* Left Sidebar - Inspiration Panel Placeholder */}
                <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-8 hidden lg:flex flex-col relative z-10 overflow-y-auto">
                    <div className="space-y-6 flex-1">
                        <h3 className="font-bold text-gray-900">Your Active Trip Vision</h3>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <div className="flex items-start">
                                <MapPin className="w-4 h-4 text-brand-500 mr-3 mt-0.5 shrink-0" />
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Destinations</span>
                                    <span className="font-bold text-gray-800 text-sm leading-tight block">{profile?.trip_context?.destinations_considered?.length ? profile.trip_context.destinations_considered.join(', ') : 'Discovering your dream...'}</span>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Wallet className="w-4 h-4 text-emerald-600 mr-3 mt-0.5 shrink-0" />
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Budget Target</span>
                                    <span className="font-black text-emerald-700 text-sm">{profile?.trip_context?.budget?.value ? `$${profile.trip_context.budget.value.toLocaleString()}` : 'TBD'}</span>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Heart className="w-4 h-4 text-rose-500 mr-3 mt-0.5 shrink-0" />
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Vibe / Intent</span>
                                    <span className="font-bold text-gray-800 text-sm leading-tight block">{profile?.intent_profile?.primary_motivation || 'Seeking Inspiration'}</span>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Users className="w-4 h-4 text-blue-500 mr-3 mt-0.5 shrink-0" />
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Companions</span>
                                    <span className="font-bold text-gray-800 text-sm leading-tight block">{profile?.personal_profile?.travel_companions || 'TBD'}</span>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Calendar className="w-4 h-4 text-purple-500 mr-3 mt-0.5 shrink-0" />
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Duration</span>
                                    <span className="font-bold text-gray-800 text-sm leading-tight block">{profile?.trip_context?.date_range?.fixed_duration ? `${profile.trip_context.date_range.fixed_duration} Days` : 'TBD'}</span>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <ShieldAlert className="w-4 h-4 text-amber-500 mr-3 mt-0.5 shrink-0" />
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Requirements</span>
                                    <span className="font-bold text-gray-800 text-sm leading-tight block">{profile?.intent_profile?.deal_breakers?.length ? profile.intent_profile.deal_breakers.join(', ') : 'None specified'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-5 border-t border-gray-200 mt-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Suggested Options</span>
                                <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-xs font-bold">{recommendations.length}</span>
                            </div>

                            <div className="space-y-4">
                                {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                                    <div key={idx} className="w-full bg-white rounded-xl overflow-hidden relative group cursor-pointer border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                        <div className="h-32 bg-gray-200 relative overflow-hidden">
                                            <img src={getImageUrl(rec)} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" alt={rec.resort_name} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                                <div>
                                                    <span className="font-bold text-white text-sm block leading-tight">{rec.resort_name}</span>
                                                    <span className="text-white/90 text-xs font-medium">{rec.region}</span>
                                                </div>
                                                <span className="text-white font-black text-sm">£{rec.price_gbp.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-sm text-gray-400 italic text-center p-4">Loading curated options...</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col relative bg-white">
                    <header className="p-6 border-b border-gray-100 flex items-center justify-between z-10 bg-white/80 backdrop-blur-md">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                <Sparkles className="w-5 h-3 text-brand-500 mr-2" />
                                Your Personal Concierge
                            </h2>
                            <p className="text-sm text-gray-500 font-medium">Online & ready to curate</p>
                        </div>
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 border border-gray-200">
                            <User className="w-5 h-5" />
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex max-w-[85%] ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}>
                                {msg.role === 'ai' && (
                                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 mr-3 flex-shrink-0 mt-auto shadow-sm ring-1 ring-brand-200">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                )}
                                <div className={`p-4 shadow-sm text-[22px] leading-relaxed ${msg.role === 'user'
                                    ? 'bg-gray-900 text-white rounded-2xl rounded-br-sm font-medium border border-gray-800 shadow-md'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-sm shadow-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex max-w-[80%] mr-auto justify-start">
                                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 mr-3 flex-shrink-0 shadow-sm">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="p-4 bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm flex space-x-1.5 items-center">
                                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"></div>
                                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div className="p-6 bg-white border-t border-gray-100 relative z-10 w-full">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about destinations, budgets, or specific hotels..."
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 shadow-inner transition-all placeholder:text-gray-400"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isTyping}
                                className="absolute right-2 p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:bg-gray-300 shadow-sm flex items-center justify-center"
                            >
                                <Send className="w-5 h-5 ml-0.5" />
                            </button>
                        </div>
                        <div className="mt-4 flex justify-center space-x-6">
                            <span className="text-xs text-gray-400 font-medium hover:text-brand-600 transition-colors">
                                Fully Curated Journeys
                            </span>
                            <span className="text-xs text-gray-400 font-medium hover:text-brand-600 transition-colors">
                                Luxury Accommodations
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
