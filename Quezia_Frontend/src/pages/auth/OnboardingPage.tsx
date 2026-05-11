import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    GraduationCap,
    Target,
    CheckCircle,
    CaretRight
} from '@phosphor-icons/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuthContext } from '../../hooks/useAuthContext';
import { authService, type PreparationStage } from '../../services/auth/auth.service';
import { examSetupService, type Exam } from '../../services/exam-setup/exam-setup.service';

const OnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuthContext();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState<Exam[]>([]);

    // Step 1: Profile
    const [displayName, setDisplayName] = useState('');
    const [country, setCountry] = useState('');

    // Step 2: Exam
    const [targetExamId, setTargetExamId] = useState('');
    const [targetExamYear, setTargetExamYear] = useState<number>(new Date().getFullYear() + 1);

    // Step 3: Preparation
    const [prepStage, setPrepStage] = useState<PreparationStage>('BEGINNER');
    const [studyGoal, setStudyGoal] = useState('');

    useEffect(() => {
        if (user?.profile?.onboardingCompleted) {
            navigate('/dashboard/home');
        }

        const fetchExams = async () => {
            try {
                const data = await examSetupService.getExams();
                setExams(data.filter(e => e.isActive));
            } catch (err) {
                // Failed to fetch exams - handle silently
            }
        };
        fetchExams();
    }, [user, navigate]);

    const handleNext = async () => {
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        // Final Save
        setLoading(true);
        try {
            const updatedUser = await authService.updateProfile({
                displayName,
                country,
                targetExamId,
                targetExamYear,
                preparationStage: prepStage,
                studyGoal,
                onboardingCompleted: true,
            });
            updateUser(updatedUser);
            navigate('/dashboard/home');
        } catch (err) {
            // Onboarding update failed - handle silently
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User size={32} className="text-[#EC2801]" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Let's get to know you</h2>
                            <p className="text-gray-500 mt-2">Personalize your Quezia experience</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="What should we call you?"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#EC2801] focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    placeholder="Where are you from?"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#EC2801] focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <GraduationCap size={32} className="text-[#EC2801]" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Select your target exam</h2>
                            <p className="text-gray-500 mt-2">We'll tailor the content to your goal</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {exams.map(exam => (
                                <button
                                    key={exam.id}
                                    onClick={() => setTargetExamId(exam.id)}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${targetExamId === exam.id
                                        ? 'border-[#EC2801] bg-red-50 shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <span className="font-medium text-gray-900">{exam.name}</span>
                                    {targetExamId === exam.id && <CheckCircle weight="fill" className="text-[#EC2801]" />}
                                </button>
                            ))}
                        </div>

                        <div className="pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Year</label>
                            <select
                                value={targetExamYear}
                                onChange={(e) => setTargetExamYear(parseInt(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#EC2801] focus:ring-2 focus:ring-red-100 outline-none transition-all bg-white"
                            >
                                {[2025, 2026, 2027, 2028].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target size={32} className="text-[#EC2801]" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Define your strategy</h2>
                            <p className="text-gray-500 mt-2">Help us optimize your study plan</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3 ml-1">Current level</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as PreparationStage[]).map(stage => (
                                        <button
                                            key={stage}
                                            onClick={() => setPrepStage(stage)}
                                            className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${prepStage === stage
                                                ? 'border-[#EC2801] bg-red-50 text-[#EC2801]'
                                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {stage}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Study Goal</label>
                                <textarea
                                    rows={3}
                                    value={studyGoal}
                                    onChange={(e) => setStudyGoal(e.target.value)}
                                    placeholder="e.g. Master physics section in 3 months"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#EC2801] focus:ring-2 focus:ring-red-100 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 items-center justify-center p-6 font-sans">
            <div className="w-full max-w-lg bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden relative">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 flex">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`flex-1 transition-all duration-500 ${step >= i ? 'bg-[#EC2801]' : 'bg-transparent'}`}
                        />
                    ))}
                </div>

                <div className="p-8 md:p-12">
                    {renderStep()}

                    <div className="mt-12 flex items-center justify-between gap-4">
                        <button
                            onClick={() => step > 1 && setStep(step - 1)}
                            disabled={step === 1}
                            className={`text-sm font-semibold py-3 px-6 rounded-xl transition-all ${step === 1 ? 'text-gray-300' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            Back
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={loading || (step === 2 && !targetExamId)}
                            className="group flex-1 bg-[#EC2801] text-white py-4 px-8 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                        >
                            {loading ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <>
                                    {step === 3 ? 'Finish Setup' : 'Continue'}
                                    <CaretRight weight="bold" className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;
