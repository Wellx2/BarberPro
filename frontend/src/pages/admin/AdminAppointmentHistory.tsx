import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar, Clock, User, Scissors, DollarSign, Package, X,
    ChevronDown, ChevronUp, Search, Filter, TrendingUp,
    CheckCircle, XCircle, CalendarX, BarChart2, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AptService {
    id: string;
    service?: { id: string; name: string; price: number };
    name?: string;
    price?: number;
}

interface AptProduct {
    id: string;
    name?: string;
    price?: number;
    quantity?: number;
    product?: { id: string; name: string; price: number };
}

interface AptBarber {
    id: string;
    name: string;
    user?: { name: string };
}

interface AptClient {
    id: string;
    name?: string;
    user?: { name: string };
}

interface Apt {
    id: string;
    date?: string;
    scheduledFor?: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'CANCELLED_BY_BARBER';
    barber?: AptBarber;
    client?: AptClient;
    services?: AptService[];
    products?: AptProduct[];
    totalPrice?: number;
    cancelReason?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDate = (a: Apt): Date | null => {
    const raw = a.date || a.scheduledFor;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
};

const fmtDt = (d: Date | null) =>
    d
        ? new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        }).format(d)
        : '—';

const fmtCur = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const STATUS_LABEL: Record<string, string> = {
    SCHEDULED: 'Agendado',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
    CANCELLED_BY_BARBER: 'Cancelado pelo Barbeiro',
};

const STATUS_COLOR: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    CANCELLED_BY_BARBER: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
};

const SP = (s: string) => (s === 'SCHEDULED' ? 0 : s === 'COMPLETED' ? 1 : 2);

// ─── Component ───────────────────────────────────────────────────────────────

type Period = 'TODAY' | 'WEEK' | 'MONTH' | 'RANGE';

export const AdminAppointmentHistory: React.FC = () => {
    const [appointments, setAppointments] = useState<Apt[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [period, setPeriod] = useState<Period>('TODAY');
    const [rangeStart, setRangeStart] = useState(new Date().toISOString().split('T')[0]);
    const [rangeEnd, setRangeEnd] = useState(new Date().toISOString().split('T')[0]);

    const [barberFilter, setBarberFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // ── Fetch data ──────────────────────────────────────────────────────────────

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get<Apt[]>('/appointments');
            setAppointments(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Erro ao carregar agendamentos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ── Filter + Sort ───────────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        const nãow = new Date();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const inPeriod = (apt: Apt): boolean => {
            const d = getDate(apt);
            if (!d) return period !== 'TODAY';

            if (period === 'TODAY') {
                return d >= startOfToday && d <= endOfToday;
            }
            if (period === 'WEEK') {
                const wStart = new Date(startOfToday);
                wStart.setDate(wStart.getDate() - 6);
                return d >= wStart && d <= endOfToday;
            }
            if (period === 'MONTH') {
                const mStart = new Date(startOfToday);
                mStart.setDate(1);
                return d >= mStart && d <= endOfToday;
            }
            if (period === 'RANGE') {
                const rs = new Date(`${rangeStart}T00:00:00`);
                const re = new Date(`${rangeEnd}T23:59:59`);
                return d >= rs && d <= re;
            }
            return true;
        };

        return appointments
            .filter(apt => {
                if (!inPeriod(apt)) return false;
                if (statusFilter && apt.status !== statusFilter) return false;
                const barberName = (apt.barber?.name || apt.barber?.user?.name || '').toLowerCase();
                if (barberFilter && !barberName.includes(barberFilter.toLowerCase())) return false;
                const clientName = (apt.client?.name || apt.client?.user?.name || '').toLowerCase();
                const search = searchTerm.toLowerCase();
                if (search && !clientName.includes(search) && !barberName.includes(search)) return false;
                return true;
            })
            .sort((a, b) => {
                // Nova regra de ordenação: Agendado primeiro, depois concluído/cancelado
                const sp = (s: string) => {
                    if (s === 'SCHEDULED') return 0;
                    if (s === 'COMPLETED') return 1;
                    return 2;
                };
                const spDiff = sp(a.status) - sp(b.status);
                if (spDiff !== 0) return spDiff;

                const da = getDate(a)?.getTime() ?? 0;
                const db = getDate(b)?.getTime() ?? 0;

                // Se agendado, mais cedo primeiro
                if (a.status === 'SCHEDULED') return da - db;
                // Se outros, mais recente primeiro
                return db - da;
            });
    }, [appointments, period, rangeStart, rangeEnd, barberFilter, statusFilter, searchTerm]);

    // ── Summary stats ───────────────────────────────────────────────────────────

    const stats = useMemo(() => {
        const total = filtered.length;
        const completed = filtered.filter(a => a.status === 'COMPLETED').length;
        const scheduled = filtered.filter(a => a.status === 'SCHEDULED').length;
        const cancelled = filtered.filter(a => a.status.includes('CANCELLED')).length;
        const revenue = filtered
            .filter(a => a.status === 'COMPLETED')
            .reduce((s, a) => s + (a.totalPrice ?? 0), 0);
        return { total, completed, scheduled, cancelled, revenue };
    }, [filtered]);

    // ── Unique barbers for filter dropdown ──────────────────────────────────────

    const barbers = useMemo(() => {
        const map = new Map<string, string>();
        appointments.forEach(a => {
            const id = a.barber?.id;
            const name = a.barber?.name || a.barber?.user?.name;
            if (id && name) map.set(id, name);
        });
        return Array.from(map.entries());
    }, [appointments]);

    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Histórico de Agendamentos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Controle diário, semanal e mensal de todos os atendimentos
                    </p>
                </div>
                <button onClick={load} className="p-2 text-gray-500 hover:text-tenant-primary transition-colors" title="Atualizar">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Period selector */}
            <div className="flex flex-wrap gap-2">
                {([['TODAY', 'hoje'], ['WEEK', '7 Dias'], ['MONTH', 'Este Mês'], ['RANGE', 'Período']] as [Period, string][]).map(([id, label]) => (
                    <button
                        key={id}
                        onClick={() => setPeriod(id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-all ${period === id
                            ? 'bg-tenant-primary border-tenant-primary text-white shadow'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-tenant-primary/40'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {period === 'RANGE' && (
                <div className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">De</label>
                        <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Até</label>
                        <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Total', value: stats.total, icon: <BarChart2 size={18} />, color: 'text-gray-600 dark:text-gray-400' },
                    { label: 'Agendados', value: stats.scheduled, icon: <CalendarX size={18} />, color: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Concluídos', value: stats.completed, icon: <CheckCircle size={18} />, color: 'text-green-600 dark:text-green-400' },
                    { label: 'Cancelados', value: stats.cancelled, icon: <XCircle size={18} />, color: 'text-red-600 dark:text-red-400' },
                    { label: 'Receita', value: fmtCur(stats.revenue), icon: <TrendingUp size={18} />, color: 'text-tenant-primary dark:text-tenant-primary', wide: true },
                ].map((card, i) => (
                    <div key={i} className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm ${(card as any).wide ? 'col-span-2 md:col-span-1' : ''}`}>
                        <div className={`flex items-center gap-2 mb-1 ${card.color}`}>
                            {card.icon}
                            <span className="text-xs font-bold uppercase tracking-wide">{card.label}</span>
                        </div>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[160px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cliente ou barbeiro..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tenant-primary focus:outline-nãone"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tenant-primary focus:outline-nãone"
                >
                    <option value="">Todos os Status</option>
                    <option value="SCHEDULED">Agendado</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="CANCELLED">Cancelado</option>
                    <option value="CANCELLED_BY_BARBER">Cancel. p/ Barbeiro</option>
                </select>
                <select
                    value={barberFilter}
                    onChange={e => setBarberFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tenant-primary focus:outline-nãone"
                >
                    <option value="">Todos os Barbeiros</option>
                    {barbers.map(([id, name]) => (
                        <option key={id} value={name}>{name}</option>
                    ))}
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200 text-sm">
                    {error}
                </div>
            )}

            {/* Table / List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tenant-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum agendamento encontrado</p>
                    <p className="text-xs text-gray-400 mt-1">Ajuste os filtros ou o período selecionado</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(apt => {
                        const d = getDate(apt);
                        const barberName = apt.barber?.name || apt.barber?.user?.name || '—';
                        const clientName = apt.client?.name || apt.client?.user?.name || '—';
                        const isExpanded = expandedId === apt.id;
                        const isCancelled = apt.status.includes('CANCELLED');

                        return (
                            <div
                                key={apt.id}
                                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all ${isCancelled ? 'opacity-60' : ''}`}
                            >
                                {/* Row header */}
                                <button
                                    className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : apt.id)}
                                >
                                    {/* Date/time pill */}
                                    <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 bg-tenant-primary/5 dark:bg-tenant-primary/10 rounded-xl border border-tenant-primary/10 dark:border-tenant-primary/30">
                                        <Clock className="w-3 h-3 text-tenant-primary mb-0.5" />
                                        <span className="text-sm font-black text-tenant-primary dark:text-tenant-primary/80 leading-nãone">
                                            {d ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '--:--'}
                                        </span>
                                        <span className="text-[8px] text-tenant-primary dark:text-tenant-primary font-bold">
                                            {d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` : ''}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[apt.status]}`}>
                                                {STATUS_LABEL[apt.status]}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-700 dark:text-gray-300">
                                            <span className="flex items-center gap-1 font-semibold">
                                                <User size={13} className="text-gray-400" /> {clientName}
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-500">
                                                <Scissors size={13} className="text-gray-400" /> {barberName}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <p className="text-lg font-black text-tenant-primary dark:text-tenant-primary">{fmtCur(apt.totalPrice ?? 0)}</p>
                                        <p className="text-xs text-gray-400">{apt.services?.length ?? 0} serviço(s)</p>
                                    </div>

                                    <div className="shrink-0 text-gray-400">
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </button>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 space-y-3">
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1">
                                            <Calendar size={12} /> {fmtDt(d)}
                                        </p>

                                        {apt.services && apt.services.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1">
                                                    <Scissors size={12} /> Serviços
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {apt.services.map(s => (
                                                        <span key={s.id} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg font-medium">
                                                            {s.service?.name || s.name} — {fmtCur(s.service?.price ?? s.price ?? 0)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {apt.products && apt.products.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1">
                                                    <Package size={12} /> Produtos
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {apt.products.map(p => {
                                                        const name = p.product?.name || p.name || '—';
                                                        const price = p.product?.price ?? p.price ?? 0;
                                                        const qty = p.quantity ?? 1;
                                                        return (
                                                            <span key={p.id} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-lg font-medium">
                                                                {name} x{qty} — {fmtCur(price * qty)}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {apt.cancelReason && (
                                            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                <p className="text-xs text-red-700 dark:text-red-300">
                                                    <span className="font-bold">Motivo:</span> {apt.cancelReason}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
                                            <span className="text-xs text-gray-500">Total do atendimento</span>
                                            <span className="text-base font-black text-gray-900 dark:text-white">{fmtCur(apt.totalPrice ?? 0)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminAppointmentHistory;
