
import React, { useState, useEffect } from 'react';
import { Clock, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Barber } from '../../types';

interface AgendaLockModalProps {
    memberId: string; // Pode ser barberId ou teamMemberId
    selectedDate: Date | string;
    shop: any;
    onClose: () => void;
    onConfirm: (data: { date: string; startTime: string; endTime: string; reason: string; forceOverride: boolean }) => Promise<void>;
    onCheckConflicts: (data: any) => Promise<{ hasConflicts: boolean; conflictCount?: number; conflictingAppointments: any[] }>;
}

export const AgendaLockModal: React.FC<AgendaLockModalProps> = ({ memberId, selectedDate, shop, onClose, onConfirm, onCheckConflicts }) => {
    const initialDate = typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0];
    const [date, setDate] = useState(initialDate);
    const [startTime, setStartTime] = useState(shop?.openingTime || '08:00');
    const [endTime, setEndTime] = useState(shop?.closingTime || '18:00');
    const [isFullDay, setIsFullDay] = useState(false);
    const [reason, setReason] = useState('');
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [forceOverride, setForceOverride] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Sincroniza com shop hours se for dia inteiro
    useEffect(() => {
        if (isFullDay && shop) {
            setStartTime(shop.openingTime);
            setEndTime(shop.closingTime);
        }
    }, [isFullDay, shop]);

    useEffect(() => {
        if (!memberId) return;

        const timer = setTimeout(async () => {
            setIsChecking(true);
            try {
                const res = await onCheckConflicts({
                    barberId: memberId,
                    teamMemberId: memberId,
                    date,
                    startTime: isFullDay ? shop?.openingTime : startTime,
                    endTime: isFullDay ? shop?.closingTime : endTime
                });
                const appointments = res.conflictingAppointments || (res as any).conflicts || [];
                setConflicts(appointments);
            } catch (e) {
                console.error('Erro ao checar conflitos:', e);
            } finally {
                setIsChecking(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [startTime, endTime, date, memberId, isFullDay, shop, onCheckConflicts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        if (conflicts.length > 0 && !forceOverride) {
            alert(`Existem ${conflicts.length} agendamento(s) ${isFullDay ? 'neste dia' : 'neste período'}. Marque "Cancelar e trancar" para prosseguir.`);
            return;
        }

        // Validação de horário não frontend
        const lockDate = new Date(date + 'T' + startTime);
        const nãow = new Date();
        if (lockDate < nãow) {
            alert('Não é possível bloquear um horário não passado.');
            return;
        }

        setSubmitting(true);
        try {
            await onConfirm({
                date,
                startTime: isFullDay ? shop?.openingTime : startTime,
                endTime: isFullDay ? shop?.closingTime : endTime,
                reason,
                conflictingAppointmentIds: forceOverride ? conflicts.map(c => c.id) : [],
                forceOverride, // Keep it if the parent needs it, but parent BarberDashboard doesn't pass it to API
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-tenant-primary" />
                        Trancar Agenda
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tenant-primary outline-nãone"
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2 py-2">
                            <input
                                type="checkbox"
                                id="isFullDay"
                                checked={isFullDay}
                                onChange={e => setIsFullDay(e.target.checked)}
                                className="w-4 h-4 text-tenant-primary border-gray-300 rounded focus:ring-tenant-primary cursor-pointer"
                            />
                            <label htmlFor="isFullDay" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                                Trancar o dia inteiro ({shop?.openingTime || '--:--'} - {shop?.closingTime || '--:--'})
                            </label>
                        </div>

                        {!isFullDay && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Início</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tenant-primary outline-nãone"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Términão</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tenant-primary outline-nãone"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo / Título</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Ex: Reunião, Horário de Almoço..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tenant-primary outline-nãone"
                            required
                        />
                    </div>

                    {/* Área de Conflitos */}
                    {isChecking ? (
                        <p className="text-xs text-gray-400 animate-pulse">Verificando agendamentos...</p>
                    ) : conflicts.length > 0 ? (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
                            <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                CONFLITOS DETECTADOS ({conflicts.length})
                            </p>
                            <ul className="text-[10px] space-y-1 text-red-700 dark:text-red-300 max-h-24 overflow-y-auto">
                                {conflicts.map(c => (
                                    <li key={c.id}>• {c.client?.name || c.clientName || 'Cliente'} ({c.startTime || '—'})</li>
                                ))}
                            </ul>
                            <div className="flex items-center gap-2 mt-3 p-2 bg-white/50 dark:bg-black/20 rounded-lg border border-red-200 dark:border-red-700">
                                <input
                                    type="checkbox"
                                    id="forceOverride"
                                    checked={forceOverride}
                                    onChange={e => setForceOverride(e.target.checked)}
                                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                                />
                                <label htmlFor="forceOverride" className="text-xs font-bold text-red-700 dark:text-red-400 cursor-pointer">
                                    Cancelar agendamentos e notificar clientes
                                </label>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 font-medium bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                            <CheckCircle className="w-3 h-3" />
                            Nenhum conflito neste horário
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || (conflicts.length > 0 && !forceOverride)}
                        className="w-full py-3 bg-tenant-primary hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        {submitting ? 'Trancando...' : 'Confirmar Bloqueio'}
                    </button>
                </form>
            </div>
        </div>
    );
};
