import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  BookOpen, 
  Clock, 
  LogOut,
  Award,
  ListChecks,
  AlertCircle
} from 'lucide-react';
import { questions } from './data';

type ViewState = 'splash' | 'exam' | 'results' | 'review';

type ModalConfig = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  onConfirm?: () => void;
};

export default function App() {
  const [view, setView] = useState<ViewState>('splash');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [timeLeft, setTimeLeft] = useState(1 * 3600 + 30 * 60); // 1:30:00
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [modal, setModal] = useState<ModalConfig>({ isOpen: false, title: '', message: '', type: 'alert' });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save & load
  useEffect(() => {
    const saved = localStorage.getItem('examState');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.answers) setAnswers(parsed.answers);
      if (parsed.timeLeft) setTimeLeft(parsed.timeLeft);
      if (parsed.currentIndex) setCurrentIndex(parsed.currentIndex);
      if (parsed.view) setView(parsed.view);
    }
  }, []);

  useEffect(() => {
    if (view === 'exam') {
      localStorage.setItem('examState', JSON.stringify({ answers, timeLeft, currentIndex, view }));
    } else if (view === 'splash') {
      localStorage.removeItem('examState');
    }
  }, [answers, timeLeft, currentIndex, view]);

  // Timer logic
  useEffect(() => {
    if (view === 'exam' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startExam = () => {
    setView('exam');
  };

  const handleAnswer = (optionIndex: number) => {
    if (showFeedback) return; // Prevent changing answer after feedback is shown
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (answers[currentIndex] === -1) {
      setModal({
        isOpen: true,
        title: 'Atención',
        message: 'Por favor, selecciona una alternativa antes de continuar.',
        type: 'alert'
      });
      return;
    }
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowFeedback(false);
      stopAudio();
    } else {
      confirmFinish();
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowFeedback(answers[currentIndex - 1] !== -1);
      stopAudio();
    }
  };

  const confirmFinish = () => {
    const unanswered = answers.filter(a => a === -1).length;
    const msg = unanswered > 0 
      ? `Tienes ${unanswered} preguntas sin responder. ¿Seguro que deseas finalizar?`
      : '¿Deseas concluir el simulacro y ver tus resultados?';
      
    setModal({
      isOpen: true,
      title: 'Finalizar Examen',
      message: msg,
      type: 'confirm',
      onConfirm: () => {
        setModal(m => ({ ...m, isOpen: false }));
        finishExam();
      }
    });
  };

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopAudio();
    setView('results');
  };

  const restartExam = () => {
    setModal({
      isOpen: true,
      title: 'Reiniciar Examen',
      message: '¿Estás seguro de reiniciar? Se perderá todo tu progreso.',
      type: 'confirm',
      onConfirm: () => {
        setModal(m => ({ ...m, isOpen: false }));
        setAnswers(new Array(questions.length).fill(-1));
        setTimeLeft(1 * 3600 + 30 * 60);
        setCurrentIndex(0);
        setView('splash');
        stopAudio();
        localStorage.removeItem('examState');
      }
    });
  };

  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    
    if (isSpeaking) {
      stopAudio();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const bestVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('es')) || voices.find(v => v.name.includes('Microsoft') && v.lang.includes('es')) || voices.find(v => v.name.includes('Natural') && v.lang.includes('es')) || voices.find(v => v.lang.includes('es-MX') || v.lang.includes('es-US')) || voices.find(v => v.lang.includes('es'));
        if (bestVoice) utterance.voice = bestVoice;
        utterance.lang = bestVoice ? bestVoice.lang : 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
    
    utterance.onend = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const currentQ = questions[currentIndex];
  const correctCount = answers.filter((a, i) => a === questions[i].answer).length;
  const incorrectCount = questions.length - correctCount;
  const scorePct = Math.round((correctCount / questions.length) * 100);

  return (
    <div className="min-h-screen bg-[#082f49] text-zinc-100 font-sans selection:bg-[#0ea5e9]/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-[#0369a1] via-[#082f49] to-[#0c4a6e] -z-10"></div>
      
      <div className="max-w-5xl mx-auto p-4 sm:p-8 min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* SPLASH SCREEN */}
          {view === 'splash' && (
            <motion.div 
              key="splash"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto w-full text-center"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-12 rounded-3xl shadow-2xl">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#0ea5e9]/30">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">Simulador Docente</h1>
                <p className="text-lg text-zinc-300 mb-10">Prepárate para el éxito en tu examen de nombramiento con nuestra casuística actualizada.</p>
                
                <div className="grid gap-4 max-w-sm mx-auto">
                  <button 
                    onClick={startExam}
                    className="w-full py-4 bg-[#0ea5e9] hover:bg-[#0ea5e9] text-white font-bold rounded-2xl transition-all text-xl flex items-center justify-center gap-3 shadow-xl shadow-[#0ea5e9]/20 group"
                  >
                    <span>Iniciar Simulacro</span>
                    <ChevronRight className="w-6 h-6 group-hover:tranzinc-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => setModal({
                      isOpen: true,
                      title: 'Instrucciones',
                      message: '1. Tienes 1:30:00 horas.\n2. 50 preguntas de casuística.\n3. Puedes navegar libremente.\n4. Al finalizar tendrás retroalimentación detallada.',
                      type: 'alert'
                    })}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <ListChecks className="w-5 h-5" />
                    Instrucciones
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* EXAM SCREEN */}
          {view === 'exam' && (
            <motion.div 
              key="exam"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <header className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="w-full sm:w-1/2">
                  <div className="flex justify-between text-xs font-bold mb-3 tracking-wider text-[#7dd3fc] uppercase">
                    <span>Pregunta {currentIndex + 1} de {questions.length}</span>
                    <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] h-full rounded-full transition-all duration-500"
                      style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-zinc-800/50 border border-white/5 rounded-2xl">
                  <Clock className="w-6 h-6 text-[#f97316]" />
                  <span className="font-mono text-2xl font-bold text-white tracking-tighter">{formatTime(timeLeft)}</span>
                </div>
              </header>

              <div className="bg-white rounded-3xl p-8 sm:p-12 min-h-[500px] flex flex-col text-zinc-800 shadow-2xl relative">
                <div className="mb-8 flex justify-end">
                  <button 
                    onClick={() => speakText(`Atención. Situación número ${currentIndex + 1}. El análisis pedagógico sugiere que: ${currentQ.explanation}`)}
                    className="inline-flex items-center gap-3 bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0284c7] font-bold py-3 px-6 rounded-2xl transition-all border border-[#bae6fd] group"
                  >
                    {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span>{isSpeaking ? 'Detener Audio' : 'Escuchar Análisis IA'}</span>
                  </button>
                </div>

                <div className="flex-grow">
                  {currentQ.context && (
                    <div className="mb-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-200 text-zinc-600 whitespace-pre-line">
                      {currentQ.context}
                    </div>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#082f49] mb-10 leading-tight">
                    {currentQ.text}
                  </h2>
                  
                  <div className="grid gap-4 mb-8">
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = answers[currentIndex] === idx;
                      const isCorrect = idx === currentQ.answer;
                      
                      let optClass = "border-zinc-200 hover:border-[#7dd3fc] hover:bg-zinc-50";
                      let letterClass = "border-zinc-300 text-zinc-500 bg-white";
                      
                      if (showFeedback) {
                        if (isCorrect) {
                          optClass = "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10";
                          letterClass = "bg-emerald-600 border-emerald-600 text-white";
                        } else if (isSelected) {
                          optClass = "border-[#f97316] bg-[#f97316]\/10 shadow-md shadow-[#f97316]/10";
                          letterClass = "bg-[#f97316] border-[#f97316] text-white";
                        } else {
                          optClass = "border-zinc-200 opacity-50";
                        }
                      } else if (isSelected) {
                        optClass = "border-[#0ea5e9] bg-[#f0f9ff] shadow-md shadow-[#0ea5e9]/10";
                        letterClass = "bg-[#0ea5e9] border-[#0ea5e9] text-white";
                      }

                      return (
                        <label 
                          key={idx}
                          className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${optClass} ${showFeedback ? 'pointer-events-none' : ''}`}
                        >
                          <input 
                            type="radio" 
                            name="option" 
                            className="hidden" 
                            checked={isSelected}
                            onChange={() => handleAnswer(idx)}
                            disabled={showFeedback}
                          />
                          <span className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center mr-5 font-bold transition-colors shrink-0 ${letterClass}`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-zinc-700 text-lg font-medium leading-snug">{opt.substring(3)}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Immediate Feedback Section */}
                  <AnimatePresence>
                    {showFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-2xl border mb-8 ${
                          answers[currentIndex] === currentQ.answer 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-[#f97316]\/10 border-[#f97316]\/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {answers[currentIndex] === currentQ.answer ? (
                            <>
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                              <h3 className="text-lg font-bold text-emerald-800">¡Muy bien! Respuesta correcta.</h3>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-6 h-6 text-[#f97316]" />
                              <h3 className="text-lg font-bold text-[#ea580c]">Respuesta incorrecta.</h3>
                            </>
                          )}
                        </div>
                        
                        {answers[currentIndex] !== currentQ.answer && (
                          <div className="mb-4 p-4 bg-white/60 rounded-xl">
                            <p className="text-sm font-bold text-zinc-500 mb-1 uppercase tracking-wider">La respuesta correcta es:</p>
                            <p className="text-zinc-800 font-medium">{currentQ.options[currentQ.answer]}</p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm font-bold text-zinc-500 mb-1 uppercase tracking-wider">Explicación:</p>
                          <p className="text-zinc-700 leading-relaxed">{currentQ.explanation}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-8 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex gap-4 w-full sm:w-auto">
                    <button 
                      onClick={prevQuestion}
                      disabled={currentIndex === 0}
                      className="flex-1 sm:flex-none px-8 py-4 bg-zinc-100 text-zinc-500 font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" /> Anterior
                    </button>
                    <button 
                      onClick={nextQuestion}
                      className="flex-1 sm:flex-none px-10 py-4 bg-[#0ea5e9] text-white font-bold rounded-xl hover:bg-[#0284c7] transition-all shadow-lg shadow-[#0ea5e9]/20 flex items-center justify-center gap-2"
                    >
                      {currentIndex === questions.length - 1 ? 'Finalizar' : 'Siguiente'} <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <button 
                    onClick={confirmFinish}
                    className="w-full sm:w-auto px-6 py-4 text-[#f97316] font-bold border-2 border-[#f97316]\/20 rounded-xl hover:bg-[#f97316]\/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" /> Finalizar Examen
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULTS SCREEN */}
          {view === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto w-full text-center"
            >
              <div className="bg-white rounded-3xl p-10 text-zinc-800 shadow-2xl">
                <Award className="w-20 h-20 text-[#0ea5e9] mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-[#082f49] mb-8">¡Simulacro Completado!</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <p className="text-xs text-emerald-600 font-black uppercase tracking-widest mb-1">Aciertos</p>
                    <p className="text-5xl font-black text-emerald-600">{correctCount}</p>
                  </div>
                  <div className="p-6 bg-[#f97316]\/10 border border-[#f97316]\/20 rounded-2xl">
                    <p className="text-xs text-[#f97316] font-black uppercase tracking-widest mb-1">Errores</p>
                    <p className="text-5xl font-black text-[#f97316]">{incorrectCount}</p>
                  </div>
                </div>
                
                <div className="mb-10 p-10 bg-[#f0f9ff] rounded-3xl relative overflow-hidden border border-[#e0f2fe]">
                  <div className="relative z-10">
                    <p className="text-zinc-500 font-medium mb-2 uppercase text-sm tracking-widest">Puntaje Obtenido</p>
                    <p className="text-7xl font-black text-[#0ea5e9] mb-3">{correctCount}/{questions.length}</p>
                    <p className="text-2xl font-bold text-[#0369a1]">{scorePct}% de éxito</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setView('review')}
                    className="flex-1 py-5 bg-[#082f49] text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                    <ListChecks className="w-6 h-6" /> Revisar Respuestas
                  </button>
                  <button 
                    onClick={restartExam}
                    className="flex-1 py-5 bg-[#0ea5e9] text-white font-bold rounded-2xl hover:bg-[#0284c7] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#0ea5e9]/20"
                  >
                    <RotateCcw className="w-6 h-6" /> Nuevo Intento
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* REVIEW SCREEN */}
          {view === 'review' && (
            <motion.div 
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto w-full"
            >
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl mb-8 flex justify-between items-center border border-white/10 sticky top-4 z-10">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <ListChecks className="w-8 h-8 text-[#0ea5e9]" /> Detalle de Revisión
                </h3>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setView('results')}
                    className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10"
                  >
                    Volver
                  </button>
                </div>
              </div>
              
              <div className="space-y-8 pb-20">
                {questions.map((q, idx) => {
                  const userAns = answers[idx];
                  const isCorrect = userAns === q.answer;
                  const isUnanswered = userAns === -1;
                  
                  return (
                    <div key={idx} className={`bg-white p-8 rounded-3xl text-zinc-800 border-l-[12px] shadow-xl ${isCorrect ? 'border-l-emerald-500' : (isUnanswered ? 'border-l-amber-500' : 'border-l-[#f97316]')}`}>
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Pregunta {idx + 1}</p>
                        {isCorrect ? (
                          <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> CORRECTA</span>
                        ) : isUnanswered ? (
                          <span className="px-4 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1"><AlertCircle className="w-4 h-4"/> SIN RESPONDER</span>
                        ) : (
                          <span className="px-4 py-1.5 bg-[#f97316]\/20 text-rose-700 text-xs font-bold rounded-full flex items-center gap-1"><XCircle className="w-4 h-4"/> INCORRECTA</span>
                        )}
                      </div>
                      
                      {q.context && (
                        <div className="mb-6 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-sm text-zinc-600 whitespace-pre-line">
                          {q.context}
                        </div>
                      )}
                      
                      <p className="text-xl font-bold text-[#082f49] mb-8">{q.text}</p>
                      
                      <div className="space-y-4 mb-8">
                        {q.options.map((opt, oIdx) => {
                          let optClass = "bg-zinc-50 text-zinc-600 border-zinc-200";
                          let icon = null;
                          
                          if (oIdx === q.answer) {
                            optClass = "bg-emerald-50 text-emerald-900 border-emerald-200 ring-2 ring-emerald-500/20";
                            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto shrink-0" />;
                          } else if (oIdx === userAns) {
                            optClass = "bg-[#f97316]\/10 text-[#c2410c] border-[#f97316]\/30";
                            icon = <XCircle className="w-5 h-5 text-[#f97316] ml-auto shrink-0" />;
                          }
                          
                          return (
                            <div key={oIdx} className={`p-5 rounded-2xl text-base flex gap-4 border ${optClass}`}>
                              <span className="font-bold shrink-0">{String.fromCharCode(65 + oIdx)})</span>
                              <span className="font-medium">{opt.substring(3)}</span>
                              {icon}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="bg-[#f0f9ff] p-6 rounded-2xl border border-[#e0f2fe]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-[#0284c7] font-bold uppercase tracking-wider text-xs">
                            <BookOpen className="w-4 h-4" /> Retroalimentación Técnica
                          </div>
                          <button 
                            onClick={() => speakText(q.explanation)}
                            className="text-[#0ea5e9] hover:text-[#0369a1] p-2 rounded-lg hover:bg-[#e0f2fe] transition-colors"
                            title="Escuchar explicación"
                          >
                            <Volume2 className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-zinc-700 leading-relaxed font-medium">{q.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* CUSTOM MODAL */}
        <AnimatePresence>
          {modal.isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f49]/80 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-zinc-800"
              >
                <h3 className="text-2xl font-bold text-[#082f49] mb-4">{modal.title}</h3>
                <p className="text-zinc-600 mb-8 whitespace-pre-line">{modal.message}</p>
                <div className="flex gap-4 justify-end">
                  {modal.type === 'confirm' && (
                    <button 
                      onClick={() => setModal(m => ({ ...m, isOpen: false }))}
                      className="px-6 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (modal.type === 'confirm' && modal.onConfirm) {
                        modal.onConfirm();
                      } else {
                        setModal(m => ({ ...m, isOpen: false }));
                      }
                    }}
                    className="px-6 py-3 bg-[#0ea5e9] text-white font-bold rounded-xl hover:bg-[#0284c7] transition-colors"
                  >
                    Aceptar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
