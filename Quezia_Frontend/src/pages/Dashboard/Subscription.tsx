import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { examSetupService } from '../../services/exam-setup/exam-setup.service';
import type { SubscriptionPack, Subscription, Exam } from '../../services/exam-setup/exam-setup.service';
import { authService } from '../../services/auth/auth.service';
import GlassCard from '../../components/Dashboard/GlassCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CreditCard, CheckCircle, Warning, MagnifyingGlass, Calendar, CurrencyInr, CaretRight } from '@phosphor-icons/react';

import { type AxiosError } from 'axios';

const SubscriptionPage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [exams, setExams] = useState<Exam[]>([]);
    const [packs, setPacks] = useState<SubscriptionPack[]>([]);
    const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Fetch all exams for selection if needed
            const allExams = await examSetupService.getExams();
            setExams(allExams);

            const targetExamId = user?.profile?.targetExamId;

            if (targetExamId) {
                // 2. Check current access
                const access = await examSetupService.checkAccess(targetExamId);
                setActiveSubscription(access);

                // 3. Fetch packs for this exam
                const examPacks = await examSetupService.getPacksByExam(targetExamId);
                setPacks(examPacks);
            }
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            setError(error.response?.data?.message || 'Failed to fetch subscription data');
        } finally {
            setLoading(false);
        }
    }, [user?.profile?.targetExamId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSelectExam = async (examId: string) => {
        try {
            setActionLoading(true);
            await authService.updateContext({ targetExamId: examId, targetExamYear: new Date().getFullYear() + 1 });
            const freshUser = await authService.getMe();
            updateUser(freshUser);
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            setError(error.response?.data?.message || 'Failed to update target exam');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubscribe = async (packId: string) => {
        try {
            setActionLoading(true);
            await examSetupService.subscribe({ packId });
            const freshUser = await authService.getMe();
            updateUser(freshUser);
            await fetchData();
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            setError(error.response?.data?.message || 'Subscription failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <LoadingSpinner fullScreen message="Loading subscription details..." />;

    const targetExam = exams.find(e => e.id === user?.profile?.targetExamId);

    return (
        <div className="min-h-screen bg-[var(--color-bg-base)] px-6 py-8 space-y-8 max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Subscription</h1>
                <p className="text-[var(--color-text-secondary)]">Manage your access and exam goals.</p>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm">
                    <Warning size={20} weight="fill" />
                    {error}
                </div>
            )}

            {/* Target Exam Selection / Display */}
            <GlassCard
                title="Target Exam"
                subtitle={targetExam ? `Currently preparing for ${targetExam.name}` : "Please select an exam to see available packs"}
            >
                {!targetExam ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {exams.filter(e => e.isActive).map(exam => (
                            <button
                                key={exam.id}
                                disabled={actionLoading}
                                onClick={() => handleSelectExam(exam.id)}
                                className="p-4 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] hover:border-[var(--color-text-primary)] transition-all text-left flex items-center justify-between group"
                            >
                                <div>
                                    <h3 className="font-semibold text-[var(--color-text-primary)]">{exam.name}</h3>
                                    <p className="text-xs text-[var(--color-text-disabled)]">{exam.description || 'Standard Exam Pack'}</p>
                                </div>
                                <CaretRight size={18} className="text-[var(--color-text-disabled)] group-hover:text-[var(--color-text-primary)] group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 flex items-center justify-between p-4 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-primary)]">
                                <MagnifyingGlass size={24} weight="bold" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{targetExam.name}</h3>
                                <p className="text-sm text-[var(--color-text-disabled)]">Target Year: {user?.profile?.targetExamYear}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSelectExam('')}
                            className="px-4 py-2 text-xs font-semibold text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            Change Exam
                        </button>
                    </div>
                )}
            </GlassCard>

            {/* Active Subscription Status */}
            {activeSubscription && (
                <GlassCard title="Active Plan" subtitle="You have full access to this exam's content.">
                    <div className="mt-4 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <CheckCircle size={32} weight="fill" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-lg font-bold text-[var(--color-text-primary)] capitalize">
                                    {targetExam?.name} - {activeSubscription.status}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-[var(--color-text-disabled)]">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={16} />
                                        Expires: {new Date(activeSubscription.expiresAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                            Active Access
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Available Packs */}
            {targetExam && !activeSubscription && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <CreditCard size={24} className="text-[var(--color-text-primary)]" />
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Available Packs</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packs.length > 0 ? packs.map((pack) => (
                            <div
                                key={pack.id}
                                className="p-6 rounded-3xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] flex flex-col space-y-6 hover:border-[var(--color-text-primary)] transition-all group"
                            >
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-text-secondary)] transition-colors">
                                        {pack.name}
                                    </h3>
                                    <p className="text-sm text-[var(--color-text-disabled)] leading-relaxed">
                                        Full access to {targetExam?.name} questions, mock tests, and analytics for {pack.durationDays} days.
                                    </p>
                                </div>

                                <div className="flex items-baseline gap-1">
                                    <CurrencyInr size={20} className="text-[var(--color-text-primary)]" />
                                    <span className="text-3xl font-black text-[var(--color-text-primary)]">{pack.price}</span>
                                    <span className="text-sm text-[var(--color-text-disabled)]">/{pack.durationDays} days</span>
                                </div>

                                <button
                                    disabled={actionLoading}
                                    onClick={() => handleSubscribe(pack.id)}
                                    className="w-full py-4 rounded-2xl bg-[var(--color-text-primary)] text-[var(--color-bg-base)] font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? <LoadingSpinner size="sm" /> : 'Subscribe Now'}
                                </button>
                            </div>
                        )) : (
                            <div className="col-span-full p-12 text-center rounded-3xl border border-dashed border-[var(--color-border-default)]">
                                <p className="text-[var(--color-text-disabled)]">No packs available for this exam yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPage;
