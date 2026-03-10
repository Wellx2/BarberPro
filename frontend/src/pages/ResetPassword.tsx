import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { authService } from '../services';
import { useNotification } from '../context/NotificationContext';
import { Key, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { addNotification } = useNotification();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            addNotification('error', 'Token de recuperação inválido ou ausente.');
            navigate('/login');
        }
    }, [token, navigate, addNotification]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            addNotification('error', 'As senhas não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            addNotification('error', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true);
        try {
            await authService.resetPassword({ token, newPassword });
            addNotification('success', 'Senha redefinida com sucesso!');
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (error: any) {
            addNotification('error', error.message || 'Erro ao redefinir senha.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center animate-fade-in">
                    <div className="inline-block p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sucesso!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Sua senha foi alterada com sucesso. Você será redirecionado para a tela de login em instantes.
                    </p>
                    <Button onClick={() => navigate('/login')} variant="primary" fullWidth>
                        Ir para Login Agora
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-50 dark:border-gray-700">
                <div className="bg-gray-900 p-8 text-center">
                    <div className="inline-block p-4 rounded-2xl bg-amber-500/10 mb-4">
                        <Key className="h-8 w-8 text-amber-500" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                        Nova Senha
                    </h2>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-2">
                        Crie uma nova credencial de acesso
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <Input
                        label="Nova Senha"
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        fullWidth
                        icon={<Lock size={18} />}
                    />
                    <Input
                        label="Confirmar Nova Senha"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        fullWidth
                        icon={<Lock size={18} />}
                    />

                    <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
                        {isLoading ? 'Redefinindo...' : 'Atualizar Senha'}
                    </Button>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full text-center text-[10px] font-black uppercase text-gray-500 hover:text-amber-600 transition-colors"
                    >
                        Voltar para o Login
                    </button>
                </form>
            </div>
        </div>
    );
};
