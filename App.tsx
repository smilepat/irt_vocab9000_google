
import React, { useState, useEffect, useMemo } from 'react';
import { QuizType, QUIZ_TYPE_LABELS, QuizQuestion, UserResponse } from './types';
import { generateVocabularyQuestion, evaluateAnswer, listAvailableModels, validateApiKey } from './geminiService';
import { vocabService, ColumnMapping } from './vocabService';
import { DataUploadModal } from './components/DataUploadModal';
import {
  Trophy,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ChevronRight,
  BrainCircuit,
  BarChart3,
  Settings2,
  CheckCircle2,
  XCircle,
  Activity,
  HelpCircle,
  Target,
  Award,
  Play,
  AlertCircle,
  Search,
  Check
} from 'lucide-react';

const MAX_QUESTIONS = 20;
const STORAGE_KEY = 'vocab9000_session';

const DEFAULT_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-1.5-pro-001",
  "gemini-2.0-flash-exp"
];

const App: React.FC = () => {
  const [currentRank, setCurrentRank] = useState<number>(1000);
  const [history, setHistory] = useState<QuizQuestion[]>([]);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [hasSavedSession, setHasSavedSession] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('gemini-1.5-flash');

  // Custom Vocab State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [useCustomData, setUseCustomData] = useState<boolean>(false);
  const [customDataCount, setCustomDataCount] = useState<number>(0);

  // Model checking state
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isCheckingModels, setIsCheckingModels] = useState<boolean>(false);
  const [showModelList, setShowModelList] = useState<boolean>(false);
  const [modelCheckError, setModelCheckError] = useState<string | null>(null);

  // API Key Test State
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [keyTestResult, setKeyTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestKey = async () => {
    if (!apiKey) {
      setKeyTestResult({ success: false, message: "Enter a key first" });
      return;
    }
    setIsTestingKey(true);
    setKeyTestResult(null);
    try {
      const isValid = await validateApiKey(apiKey);
      if (isValid) {
        setKeyTestResult({ success: true, message: "Verified!" });
        // Also update available models while we are at it, quietly
        handleCheckModels();
      } else {
        setKeyTestResult({ success: false, message: "Invalid Key or No Access" });
      }
    } catch (e) {
      setKeyTestResult({ success: false, message: "Error connecting" });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleCheckModels = async () => {
    if (!apiKey) {
      alert("Please enter an API Key first.");
      return;
    }

    setIsCheckingModels(true);
    setModelCheckError(null);
    try {
      const models = await listAvailableModels(apiKey);
      // Filter for gemini models that support generation (usually contain 'generate')
      // or just list them all. API returns 'models/gemini-pro'. We stripped 'models/' in service.
      const geminiModels = models.filter(m => m.includes('gemini'));
      setAvailableModels(geminiModels);
      setShowModelList(true);
    } catch (e: any) {
      setModelCheckError(e.message);
      alert("Failed to list models: " + e.message);
    } finally {
      setIsCheckingModels(false);
    }
  };

  // Check for saved session on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setHasSavedSession(true);
    }
  }, []);

  // Save session state to localStorage whenever it changes
  useEffect(() => {
    if (!showSettings && !isFinished) {
      const sessionData = {
        currentRank,
        history,
        responses,
        currentQuestion,
        streak
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    }

    if (isFinished) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentRank, history, responses, currentQuestion, streak, showSettings, isFinished]);

  const resumeSession = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCurrentRank(data.currentRank || 1000);
        setHistory(data.history || []);
        setResponses(data.responses || []);
        setCurrentQuestion(data.currentQuestion || null);
        setStreak(data.streak || 0);
        setShowSettings(false);
        setIsFinished(false);
        setHasSavedSession(false);

        // If there was no current question but session exists, load one
        if (!data.currentQuestion && data.responses.length < MAX_QUESTIONS) {
          loadNextQuestion(data.currentRank);
        }
      } catch (e) {
        console.error("Failed to parse saved session", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const getRandomQuizType = () => {
    const types = Object.values(QuizType);
    return types[Math.floor(Math.random() * types.length)];
  };

  const calculateNextRank = (current: number, isCorrect: boolean) => {
    let baseStep = 300;
    if (isCorrect) {
      const acceleration = Math.min(3, streak + 1) * 100;
      return Math.min(9000, current + baseStep + acceleration);
    } else {
      return Math.max(1, current - baseStep);
    }
  };

  const loadNextQuestion = async (rank: number) => {
    if (responses.length >= MAX_QUESTIONS) {
      setIsFinished(true);
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    setUserAnswer('');
    setError(null); // Clear previous errors
    try {
      const randomType = getRandomQuizType();

      let wordArgs: string | undefined = undefined;
      // Try to get word from custom data if enabled
      if (useCustomData && vocabService.hasData()) {
        const vocabItem = vocabService.getWordForRank(rank, history.map(h => h.word.toLowerCase()));
        if (vocabItem) {
          wordArgs = vocabItem.word;
          // Adjust current question rank to match the found word to reflect reality? 
          // Or keep requesting rank. The generation will use the word.
        } else {
          console.log("No custom word found for rank " + rank + ". Fallback to AI selection.");
        }
      }

      const question = await generateVocabularyQuestion(randomType, rank, wordArgs, model);
      setCurrentQuestion(question);
    } catch (error: any) {
      console.error("문항 생성 실패:", error);
      setError(error.message || "Failed to generate question. Please check your API usage or network connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = () => {
    localStorage.removeItem(STORAGE_KEY); // Clear old session if starting fresh
    setResponses([]);
    setHistory([]);
    setStreak(0);
    setShowSettings(false);
    setIsFinished(false);
    loadNextQuestion(currentRank);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentQuestion || !userAnswer || feedback) return;

    const isCorrect = await evaluateAnswer(currentQuestion, userAnswer);
    let newStreak = 0;
    if (isCorrect) {
      newStreak = streak + 1;
      setStreak(newStreak);
    } else {
      setStreak(0);
    }

    const response: UserResponse = {
      questionId: currentQuestion.id,
      userAnswer,
      isCorrect,
      timestamp: Date.now()
    };

    const updatedResponses = [...responses, response];
    setResponses(updatedResponses);
    setHistory(prev => [...prev, currentQuestion]);
    setFeedback({
      isCorrect,
      message: isCorrect ? "정답입니다!" : "아쉽네요."
    });

    const nextRank = calculateNextRank(currentRank, isCorrect);
    setCurrentRank(nextRank);
  };

  const handleSkip = () => {
    if (!currentQuestion || feedback) return;

    setStreak(0);
    const response: UserResponse = {
      questionId: currentQuestion.id,
      userAnswer: "[모름]",
      isCorrect: false,
      timestamp: Date.now()
    };

    const updatedResponses = [...responses, response];
    setResponses(updatedResponses);
    setHistory(prev => [...prev, currentQuestion]);
    setFeedback({
      isCorrect: false,
      message: "단어를 모르는 것으로 처리되었습니다."
    });

    const nextRank = calculateNextRank(currentRank, false);
    setCurrentRank(nextRank);
  };

  const resetQuiz = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
    setResponses([]);
    setCurrentQuestion(null);
    setFeedback(null);
    setShowSettings(true);
    setIsFinished(false);
    setCurrentRank(1000);
    setStreak(0);
    setHasSavedSession(false);
  };

  const renderChart = () => {
    const chartHeight = 160;
    const chartWidth = 800;
    const padding = 40;

    const dataPoints = [...history.map(q => q.rank), currentRank];
    if (dataPoints.length < 1) return null;

    const maxVal = 9000;
    const minVal = 1;

    const getX = (idx: number) => (idx / Math.max(1, dataPoints.length - 1)) * (chartWidth - 2 * padding) + padding;
    const getY = (val: number) => chartHeight - ((val - minVal) / (maxVal - minVal) * (chartHeight - 2 * padding) + padding);

    const points = dataPoints.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');

    return (
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700/50 mt-4 backdrop-blur-md shadow-inner">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="text-cyan-400 animate-pulse" size={20} />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
              Difficulty Ups & Downs
            </h3>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              <span className="text-[10px] text-slate-400 uppercase">Rank Progress</span>
            </div>
            <span className="text-lg font-mono font-bold text-cyan-400">Lv. {currentRank}</span>
          </div>
        </div>

        <div className="relative h-40 w-full">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full preserve-3d">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <line
                key={p}
                x1={padding} y1={getY(maxVal * p)} x2={chartWidth - padding} y2={getY(maxVal * p)}
                stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4"
              />
            ))}

            {dataPoints.length > 1 && (
              <path
                d={`M ${padding},${chartHeight - padding} L ${points} L ${getX(dataPoints.length - 1)},${chartHeight - padding} Z`}
                fill="url(#areaGradient)"
                className="transition-all duration-1000"
              />
            )}

            <polyline
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              className="transition-all duration-700"
            />

            {dataPoints.map((val, idx) => (
              <g key={idx} className="group cursor-help">
                <circle
                  cx={getX(idx)}
                  cy={getY(val)}
                  r={idx === dataPoints.length - 1 ? "6" : "4"}
                  fill={idx === dataPoints.length - 1 ? "#fbbf24" : "#22d3ee"}
                  className={`transition-all duration-500 ${idx === dataPoints.length - 1 ? 'animate-bounce' : ''}`}
                />
                <text
                  x={getX(idx)}
                  y={getY(val) - 15}
                  fontSize="10"
                  textAnchor="middle"
                  className="fill-slate-500 opacity-0 group-hover:opacity-100 font-mono transition-opacity"
                >
                  {val}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
          <span>Assessment Start</span>
          <span>Current Position</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2.5 rounded-xl shadow-xl shadow-cyan-500/10">
            <BrainCircuit size={32} className="text-slate-900" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white italic">
              VOCAB <span className="text-cyan-500">9000</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">IRT Adaptive Engine v2.5</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Success Rate</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${responses.length ? (responses.filter(r => r.isCorrect).length / responses.length) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-mono text-cyan-400 font-bold">
                {responses.length ? Math.round((responses.filter(r => r.isCorrect).length / responses.length) * 100) : 0}%
              </span>
            </div>
          </div>
          <button
            onClick={resetQuiz}
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {showSettings ? (
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="bg-slate-900/40 p-10 rounded-3xl border border-slate-800/50 backdrop-blur-xl shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">학습 시작 설정</h2>
              <p className="text-slate-400 text-sm">9000단어 마스터 테이블 기반 적응형 평가</p>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase">Starting Rank</span>
                  <span className="text-3xl font-mono font-black text-cyan-400">{currentRank}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="9000"
                  step="100"
                  value={currentRank}
                  onChange={(e) => setCurrentRank(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-3 font-bold">
                  <span>ELEMENTARY</span>
                  <span>ACADEMIC MASTER</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950/20 rounded-xl border border-slate-800/50 text-center">
                <p className="text-xs text-slate-400 font-medium">총 <span className="text-white font-bold">{MAX_QUESTIONS}문항</span>의 집중 평가가 진행됩니다.</p>
              </div>
            </div>

            {/* Custom Data Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-xl border border-slate-800/50">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${useCustomData ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  onClick={() => {
                    if (vocabService.hasData()) {
                      setUseCustomData(!useCustomData);
                    } else {
                      setShowUploadModal(true);
                    }
                  }}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${useCustomData ? 'translate-x-4' : ''}`}></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">Custom Data Mode</p>
                  <p className="text-[10px] text-slate-500">{customDataCount > 0 ? `${customDataCount} words loaded` : 'No data loaded'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Upload CSV"
              >
                <Settings2 size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={startQuiz}
                className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg rounded-2xl transition-all transform active:scale-95 shadow-2xl shadow-cyan-500/20 flex items-center justify-center gap-3"
              >
                START FRESH
                <ChevronRight size={24} />
              </button>

              {hasSavedSession && (
                <button
                  onClick={resumeSession}
                  className="w-full py-4 border border-slate-700 hover:bg-slate-800/50 text-slate-300 font-bold rounded-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
                >
                  <Play size={18} className="text-cyan-500 fill-cyan-500/20" />
                  RESUME PREVIOUS SESSION
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/50">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gemini API Key (Optional Override)</label>
                <input
                  type="password"
                  placeholder="Enter your API Key here..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    localStorage.setItem('gemini_api_key', e.target.value);
                  }}
                  className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-slate-300 text-xs focus:border-cyan-500 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-600">If you see an API Error, enter a valid key here.</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleTestKey}
                    disabled={!apiKey || isTestingKey}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-2
                      ${keyTestResult?.success
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : keyTestResult?.success === false
                          ? 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                  >
                    {isTestingKey ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : keyTestResult?.success ? (
                      <Check size={14} />
                    ) : (
                      <Activity size={14} />
                    )}
                    {keyTestResult ? keyTestResult.message : "TEST CONNECTION"}
                  </button>

                  <button
                    onClick={handleCheckModels}
                    disabled={!apiKey || isCheckingModels}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors border border-slate-700"
                  >
                    {isCheckingModels ? (
                      <div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    ) : <Search size={14} />}
                    CHECK MODELS
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Model Version</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-slate-300 text-xs focus:border-cyan-500 focus:outline-none font-mono"
                >
                  {(availableModels.length > 0 ? availableModels : DEFAULT_MODELS).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  {/* Ensure current model is shown if not in the list (e.g. manual entry) */}
                  {availableModels.length > 0 && !availableModels.includes(model) && !DEFAULT_MODELS.includes(model) && (
                    <option value={model}>{model}</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-600">If you get a 404 error, try changing the model.</p>
              </div>
            </div>
          </div>
        </div>
      ) : isFinished ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
          <div className="bg-slate-900/40 p-12 rounded-[3rem] border border-slate-800/50 backdrop-blur-3xl shadow-2xl max-w-2xl w-full text-center space-y-10 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

            <div className="space-y-4">
              <div className="inline-flex p-4 rounded-3xl bg-cyan-500/10 text-cyan-500 mb-4 ring-1 ring-cyan-500/20">
                <Award size={48} />
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Assessment Complete</h2>
              <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">IRT Based Final Report</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Estimated Rank</p>
                <p className="text-3xl font-mono font-black text-cyan-400">{currentRank}</p>
              </div>
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Accuracy</p>
                <p className="text-3xl font-mono font-black text-emerald-400">
                  {Math.round((responses.filter(r => r.isCorrect).length / responses.length) * 100)}%
                </p>
              </div>
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Max Streak</p>
                <p className="text-3xl font-mono font-black text-amber-400">{streak} Max</p>
              </div>
            </div>

            <div className="bg-slate-950/30 p-8 rounded-3xl border border-slate-800/50 text-left">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <BrainCircuit size={16} className="text-cyan-500" />
                Expert Evaluation
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed italic">
                {currentRank < 2000 ? "기초 어휘력이 탄탄하며, 일상적인 대화에 필요한 핵심 단어들을 잘 파악하고 있습니다." :
                  currentRank < 5000 ? "중급 이상의 어휘력을 보유하고 있으며, 다양한 문맥에서의 단어 활용 능력이 우수합니다." :
                    "최상위 수준의 어휘력을 갖추고 있습니다. 복잡한 학술적 문맥과 고난도 추론 문항에서도 뛰어난 역량을 보여줍니다."}
              </p>
            </div>

            <button
              onClick={resetQuiz}
              className="w-full py-5 bg-white text-slate-950 font-black text-lg rounded-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
            >
              RESTART EVALUATION
              <RotateCcw size={24} />
            </button>
          </div>

          <div className="w-full mt-10">
            {renderChart()}
          </div>
        </div>
      ) : (
        <main className="flex-1 flex flex-col gap-6 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/40 rounded-3xl border border-slate-800/50 p-8 md:p-12 shadow-2xl min-h-[450px] flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-cyan-500/10 transition-colors"></div>

                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-cyan-500 font-mono text-xs">IRT</div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-slate-300 font-bold">다음 문항을 구성 중입니다...</p>
                      <p className="text-slate-500 text-xs font-mono">Target Difficulty Rank: {currentRank}</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center animate-in fade-in">
                    <div className="p-4 bg-rose-500/10 rounded-full text-rose-500 mb-2">
                      <AlertCircle size={48} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">Error Occurred</h3>
                      <p className="text-rose-400 max-w-md mx-auto">{error}</p>
                    </div>
                    <button
                      onClick={() => loadNextQuestion(currentRank)}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                      <RotateCcw size={18} />
                      Retry
                    </button>
                  </div>
                ) : currentQuestion ? (
                  <div className="flex-1 flex flex-col gap-8 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-1.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-black rounded-full border border-cyan-500/20 uppercase tracking-widest">
                          {QUIZ_TYPE_LABELS[currentQuestion.type]}
                        </div>
                        <div className="text-[10px] text-slate-500 font-black tracking-widest">
                          STEP {responses.length + 1} / {MAX_QUESTIONS}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/50 rounded-lg border border-slate-800">
                        <Trophy size={14} className="text-amber-500" />
                        <span className="text-xs font-mono text-slate-400 uppercase font-bold">Rank {currentQuestion.rank}</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h2
                        className="text-2xl md:text-3xl font-medium leading-relaxed text-slate-100 mb-10"
                        dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }}
                      />

                      {currentQuestion.options ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentQuestion.options.map((option, idx) => (
                            <button
                              key={idx}
                              disabled={!!feedback}
                              onClick={() => {
                                setUserAnswer(option);
                                handleSubmit();
                              }}
                              className={`group relative text-left p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between
                                ${userAnswer === option
                                  ? (feedback
                                    ? (feedback.isCorrect ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-100' : 'bg-rose-500/10 border-rose-500/50 text-rose-100')
                                    : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-100')
                                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                }
                                ${feedback && option === currentQuestion.correctAnswer ? 'ring-2 ring-emerald-500/50 border-emerald-500' : ''}
                              `}
                            >
                              <div className="flex items-center gap-4">
                                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 group-hover:bg-slate-700 text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="font-medium text-lg">{option}</span>
                              </div>
                              {feedback && option === currentQuestion.correctAnswer && <CheckCircle2 size={20} className="text-emerald-500" />}
                              {feedback && userAnswer === option && !feedback.isCorrect && <XCircle size={20} className="text-rose-500" />}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <form onSubmit={handleSubmit} className="relative group">
                            <input
                              autoFocus
                              disabled={!!feedback}
                              value={userAnswer}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              placeholder="정답을 입력하세요..."
                              className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-2xl p-6 text-xl text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-700"
                            />
                            {!feedback && (
                              <button className="absolute right-3 top-3 bottom-3 px-6 bg-cyan-500 text-slate-900 font-black rounded-xl hover:bg-cyan-400 transition-colors">
                                확인
                              </button>
                            )}
                          </form>
                        </div>
                      )}

                      {!feedback && (
                        <div className="mt-8 flex justify-center">
                          <button
                            onClick={handleSkip}
                            className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-800/50 px-6 py-2.5 rounded-xl hover:bg-slate-900/50 hover:border-slate-700"
                          >
                            <HelpCircle size={14} />
                            모름 (Skip)
                          </button>
                        </div>
                      )}
                    </div>

                    {feedback && (
                      <div className={`mt-auto p-6 rounded-2xl border-2 animate-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row gap-6 items-center
                        ${feedback.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}
                      >
                        <div className={`p-4 rounded-full ${feedback.isCorrect ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {feedback.isCorrect ? <ArrowUp size={32} className="animate-bounce" /> : <ArrowDown size={32} className="animate-bounce" />}
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                          <h4 className={`text-xl font-black uppercase italic ${feedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {feedback.isCorrect ? 'Level Up!' : userAnswer === "[모름]" ? "Skipped" : 'Stabilizing Rank...'}
                          </h4>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            <span className="font-bold text-white mr-2">해설:</span>
                            {currentQuestion.explanation}
                          </p>
                        </div>
                        <button
                          onClick={() => loadNextQuestion(currentRank)}
                          className="w-full md:w-auto px-8 py-4 bg-white text-slate-950 font-black rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                        >
                          {responses.length >= MAX_QUESTIONS ? "VIEW RESULTS" : "NEXT"} <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900/40 rounded-3xl border border-slate-800/50 p-6 shadow-2xl space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={18} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Session Stats</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Progress</p>
                    <p className="text-2xl font-mono font-black text-white">{responses.length}/{MAX_QUESTIONS}</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Streak</p>
                    <p className="text-2xl font-mono font-black text-amber-500">{streak}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Performance History</p>
                  <div className="flex flex-wrap gap-2">
                    {responses.slice(-10).map((r, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border
                        ${r.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}
                        title={r.userAnswer}
                      >
                        {r.isCorrect ? 'O' : r.userAnswer === '[모름]' ? '?' : 'X'}
                      </div>
                    ))}
                    {responses.length === 0 && <p className="text-slate-600 text-[10px] italic">기록이 없습니다.</p>}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-3xl border border-cyan-500/10 p-6">
                <p className="text-xs text-cyan-400 font-bold mb-3 uppercase flex items-center gap-2">
                  <Target size={14} /> Evaluation Focus
                </p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {MAX_QUESTIONS}문항 평가 후 실력 측정이 자동 종료됩니다. 정확한 분석을 위해 매 문항 신중히 응시해주세요.
                </p>
              </div>
            </div>
          </div>

          <div className="animate-in slide-in-from-bottom-4 duration-1000 delay-300">
            {renderChart()}
          </div>
        </main>
      )
      }

      <footer className="text-center py-6 text-slate-600 text-[10px] uppercase tracking-widest font-bold">
        &copy; 2025 Adaptive Vocabulary Mastery • Powered by Gemini Flash
      </footer>

      <DataUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onConfirm={async (file, mapping, encoding) => {
          const { count, error } = await vocabService.loadFromCsv(file, mapping, encoding);
          if (error) {
            alert("Error: " + error);
          } else {
            setCustomDataCount(count);
            setUseCustomData(true);
            setShowUploadModal(false);
          }
        }}
      />

      {/* Model List Modal */}
      {showModelList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={20} />
                Available Models
              </h3>
              <button
                onClick={() => setShowModelList(false)}
                className="text-slate-500 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {availableModels.length > 0 ? availableModels.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setModel(m);
                    setShowModelList(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border ${model === m ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800'} transition-colors flex items-center justify-between group`}
                >
                  <span className="font-mono text-xs">{m}</span>
                  {model === m && <Check size={14} />}
                </button>
              )) : (
                <p className="text-slate-500 text-center py-4">No matching models found.</p>
              )}
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              Click a model to select it.
            </p>
          </div>
        </div>
      )}
    </div >
  );
};

export default App;
