import { Link } from 'react-router-dom';
import { ArrowUpRight, Flame, Clock, MapPin, Loader2, Users, Sparkles, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function LeadMatrix() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalConfig, setGlobalConfig] = useState<any>(null);

    useEffect(() => {
        const fetchLeads = () => {
            fetch(`${API_URL}/api/profiles`)
                .then(res => res.json())
                .then(data => { setLeads(data); setLoading(false); })
                .catch(err => console.error(err));
        };
        fetchLeads();
        fetch(`${API_URL}/api/settings`)
            .then(res => res.json())
            .then(data => setGlobalConfig(data))
            .catch(console.error);
        const interval = setInterval(fetchLeads, 3000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="flex flex-col h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;

    const hitlLeads = leads.filter(l => l.agent_intervention?.requires_intervention);
    const clearIntentLeads = leads.filter(l => l.derived_scores?.intent_score > 50 && !l.agent_intervention?.requires_intervention);
    const highlyReadyLeads = leads.filter(l => l.derived_scores?.readiness_score > 50 && l.derived_scores?.intent_score <= 50 && !l.agent_intervention?.requires_intervention);
    const discoveryLeads = leads.filter(l => !l.agent_intervention?.requires_intervention && (l.derived_scores?.intent_score || 0) <= 50 && (l.derived_scores?.readiness_score || 0) <= 50);

    const LeadCard = ({ lead }: { lead: any }) => {
        const readiness = lead.derived_scores?.readiness_score || 0;
        const isUrgent = readiness > 80 || lead.agent_intervention?.requires_intervention;
        const destinations = lead.trip_context?.destinations_considered || [];
        const dealValue = lead.trip_context?.budget?.value ? `$${lead.trip_context.budget.value.toLocaleString()}` : 'TBD';
        const leadName = lead.personal_profile?.demographics ? `${lead.personal_profile.demographics} Lead` : 'Anonymous Traveler';

        return (
            <Link
                to={`/profile/${lead.external_user_id}`}
                className="group w-[350px] min-w-[350px] bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-xl hover:border-brand-400 transition-all cursor-pointer relative overflow-hidden flex flex-col snap-start shrink-0 mr-5"
            >
                {isUrgent && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-400" />
                )}
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-brand-600 transition-colors w-48 truncate">{leadName}</h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{lead.external_user_id}</p>
                    </div>
                    <div className="flex items-center space-x-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-sm border border-emerald-100 shadow-sm">
                        {dealValue}
                    </div>
                </div>

                <div className="space-y-4 flex-1">
                    <div className="flex items-center text-sm font-medium text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 whitespace-nowrap overflow-hidden text-ellipsis">
                        <MapPin className="w-4 h-4 mr-2 text-brand-500 shrink-0" />
                        {destinations.length > 0 ? destinations.join(' vs ') : 'Undecided'}
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="font-bold text-gray-500 uppercase tracking-widest">{lead.state_machine?.current_stage || 'CURIOSITY'}</span>
                            <span className={`font-bold ${readiness > 80 ? 'text-brand-600' : 'text-amber-500'}`}>
                                {readiness}% Ready
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 shadow-inner">
                            <div
                                className={`h-2.5 rounded-full transition-all duration-1000 ${readiness > 80 ? 'bg-brand-500 shadow-[0_0_10px_rgba(20,184,166,0.4)]' : 'bg-amber-400'}`}
                                style={{ width: `${Math.min(readiness, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center text-xs font-medium text-gray-400">
                        <Clock className="w-4 h-4 mr-1.5" /> {new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="p-1.5 rounded-full bg-gray-50 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                    </div>
                </div>
            </Link>
        );
    };

    const LeadStrip = ({ title, icon: Icon, leads, colorClass }: { title: string, icon: any, leads: any[], colorClass: string }) => {
        if (leads.length === 0) return null;
        return (
            <div className="mb-10 w-full">
                <h2 className={`text-lg font-bold mb-4 flex items-center pl-1 ${colorClass}`}>
                    <Icon className="w-5 h-5 mr-2" />
                    {title} <span className="ml-3 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">{leads.length}</span>
                </h2>
                {/* Horizontal scroll container with hidden scrollbars for clean Netflix effect */}
                <div className="flex overflow-x-auto pb-4 pt-1 px-1 snap-x snap-mandatory hide-scrollbar -mx-1 w-full pl-1 pr-8">
                    {leads.map(l => <LeadCard key={l.external_user_id} lead={l} />)}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-2 animate-in fade-in duration-500 max-w-[100vw] overflow-x-hidden min-h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between mb-8 pr-8">
                <div className="flex items-center space-x-6">
                    <img src={globalConfig?.dashboard_logo || "/tripnour_logo.png"} alt="TripNour" className="h-[48px] object-contain cursor-pointer" />
                    <div className="h-10 w-px bg-gray-300"></div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Sales Operations</h1>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">Live streaming AI-nurtured profiles prioritized by actionability.</p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm border border-red-200">
                        <Flame className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                        {hitlLeads.length} Requires Intervention
                    </span>
                </div>
            </div>

            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

            <div className="space-y-4 w-full">
                <LeadStrip title="HITL Intervention Required" icon={Flame} leads={hitlLeads} colorClass="text-red-700" />
                <LeadStrip title="Clear Intent (>50 Score)" icon={Navigation} leads={clearIntentLeads} colorClass="text-brand-700" />
                <LeadStrip title="High Readiness (>50 Score)" icon={Sparkles} leads={highlyReadyLeads} colorClass="text-emerald-700" />
                <LeadStrip title="Active Discovery" icon={Users} leads={discoveryLeads} colorClass="text-gray-700" />
            </div>
        </div>
    );
}
