import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Clock, ChevronRight, ChevronLeft, Send, CheckCircle, User, AlertTriangle, BookOpen } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { EXAM_DURATION_MS, OPTION_LABELS } from '@/types';

export default function Exam() {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [examLoaded, setExamLoaded] = useState(false);

  const questionsQuery = trpc.question.list.useQuery();
  const examStatusQuery = trpc.exam.status.useQuery();
  const submitResult = trpc.result.create.useMutation();

  useEffect(() => {
    const name = localStorage.getItem('tqr_student_name');
    if (!name) {
      navigate('/');
      return;
    }
    setStudentName(name);

    const savedStart = localStorage.getItem('tqr_exam_start');
    const savedAnswers = localStorage.getItem('tqr_exam_answers');
    const savedCurrent = localStorage.getItem('tqr_exam_current');

    if (savedStart) {
      setStartTime(Number(savedStart));
    } else {
      const now = Date.now();
      setStartTime(now);
      localStorage.setItem('tqr_exam_start', String(now));
    }

    if (savedAnswers) {
      try { setAnswers(JSON.parse(savedAnswers)); } catch { }
    }
    if (savedCurrent) {
      setCurrentQuestion(Number(savedCurrent));
    }
  }, [navigate]);

  useEffect(() => {
    if (questionsQuery.data) {
      setQuestions(questionsQuery.data);
      setExamLoaded(true);
    }
  }, [questionsQuery.data]);

  useEffect(() => {
    if (!examStatusQuery.data) return;
    if (!examStatusQuery.data.active && !submitted) {
      submitExam();
    }
  }, [examStatusQuery.data]);

  const submitExam = useCallback(() => {
    if (questions.length === 0 || submitting) return;
    setSubmitting(true);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const timeSpentClamped = Math.min(timeSpent, EXAM_DURATION_MS / 1000);

    let correctCount = 0;
    questions.forEach((q: any) => {
      if (answers[String(q.id)] === q.correctAnswer) {
        correctCount++;
      }
    });

    const total = questions.length;
    const wrongCount = total - correctCount;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const payload = {
      name: studentName,
      answersJson: JSON.stringify(answers),
      score,
      totalQuestions: total,
      correctCount,
      wrongCount,
      timeSpent: timeSpentClamped,
    };

    submitResult.mutate(payload, {
      onSuccess: () => {
        setSubmitting(false);
        setSubmitted(true);
        setResult(payload);
        localStorage.removeItem('tqr_exam_start');
        localStorage.removeItem('tqr_exam_answers');
        localStorage.removeItem('tqr_exam_current');
      },
      onError: (err) => {
        console.error(err);
        setSubmitting(false);
        alert('حدث خطأ في إرسال الاختبار. يرجى المحاولة مرة أخرى.');
      },
    });
  }, [questions, answers, startTime, studentName, submitting]);

  useEffect(() => {
    if (startTime === 0 || submitted) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, EXAM_DURATION_MS - elapsed);
      const seconds = Math.floor(remaining / 1000);
      setTimeLeft(seconds);

      if (remaining <= 0) {
        clearInterval(interval);
        submitExam();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, submitted, submitExam]);

  useEffect(() => {
    localStorage.setItem('tqr_exam_answers', JSON.stringify(answers));
    localStorage.setItem('tqr_exam_current', String(currentQuestion));
  }, [answers, currentQuestion]);

  const handleAnswer = (option: 'A' | 'B' | 'C' | 'D') => {
    if (!questions[currentQuestion]) return;
    setAnswers(prev => ({ ...prev, [String(questions[currentQuestion].id)]: option }));
  };

  const goNext = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion(prev => prev + 1);
  };

  const goPrev = () => {
    if (currentQuestion > 0) setCurrentQuestion(prev => prev - 1);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 120) return '#c0392b';
    if (timeLeft <= 300) return '#e67e22';
    return '#1a5f4a';
  };

  const getTimerBg = () => {
    if (timeLeft <= 120) return 'rgba(192, 57, 43, 0.1)';
    if (timeLeft <= 300) return 'rgba(230, 126, 34, 0.1)';
    return 'rgba(26, 95, 74, 0.1)';
  };

  if (questionsQuery.isLoading || !examLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f5f0' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1a5f4a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5a5a6e]">جاري تحميل الأسئلة...</p>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#f8f5f0' }}>
        <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'url(/pattern-bg.jpg)', backgroundSize: '400px' }} />
        <div className="relative z-10 text-center animate-fade-in-up">
          <div className="w-16 h-16 border-4 border-[#1a5f4a] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-tajawal font-bold text-2xl mb-2" style={{ color: '#1a5f4a' }}>جاري إرسال إجاباتك...</h2>
          <p className="text-[#5a5a6e]">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    const minutes = Math.floor(result.timeSpent / 60);
    const seconds = result.timeSpent % 60;
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#f8f5f0' }}>
        <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'url(/pattern-bg.jpg)', backgroundSize: '400px' }} />
        <header className="relative z-10 h-16 flex items-center justify-center px-6" style={{ background: '#1a5f4a' }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#c49a2c]" />
            <span className="text-white font-tajawal font-bold text-xl">تقريب القرآن</span>
          </div>
        </header>
        <main className="flex-1 relative z-10 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="islamic-card p-8 text-center">
              <CheckCircle className="w-16 h-16 text-[#27ae60] mx-auto mb-4" />
              <h2 className="font-tajawal font-bold text-2xl mb-2" style={{ color: '#1a5f4a' }}>تم إرسال اختبارك بنجاح!</h2>
              <p className="text-[#5a5a6e] mb-6">شكراً {result.name} على إتمام الاختبار. سيتم مراجعة إجاباتك.</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl" style={{ background: '#e8f5ee' }}>
                  <p className="text-sm text-[#5a5a6e]">الوقت</p>
                  <p className="font-bold text-lg" style={{ color: '#1a1a2e' }}>{minutes}:{String(seconds).padStart(2, '0')}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: '#e8f5ee' }}>
                  <p className="text-sm text-[#5a5a6e]">الأسئلة</p>
                  <p className="font-bold text-lg" style={{ color: '#1a1a2e' }}>{result.totalQuestions}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: '#e8f5ee' }}>
                  <p className="text-sm text-[#5a5a6e]">الإجابات</p>
                  <p className="font-bold text-lg" style={{ color: '#1a1a2e' }}>{Object.keys(answers).length}</p>
                </div>
              </div>
              <button onClick={() => navigate('/')} className="btn-primary w-full h-11">العودة للصفحة الرئيسية</button>
            </div>
          </div>
        </main>
        <footer className="relative z-10 h-12 flex items-center justify-center" style={{ background: '#0d3d2e' }}>
          <p className="text-white/80 text-sm">تقريب القرآن - منصة اختبارات إسلامية</p>
        </footer>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const timerColor = getTimerColor();
  const timerBg = getTimerBg();
  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f5f0' }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url(/pattern-bg.jpg)', backgroundSize: '400px' }} />

      <header className="relative z-10 sticky top-0 bg-white border-b border-[#d4c9b5] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#1a5f4a]" />
            <span className="text-sm font-medium" style={{ color: '#1a1a2e' }}>مرحباً، {studentName}</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${timeLeft <= 120 ? 'animate-blink' : ''}`} style={{ background: timerBg, color: timerColor }}>
            <Clock className="w-5 h-5" />
            <span className="font-tajawal font-bold text-xl" dir="ltr">{formatTime(timeLeft)}</span>
          </div>
          <div className="text-sm" style={{ color: '#5a5a6e' }}>
            سؤال <span className="font-bold" style={{ color: '#1a1a2e' }}>{currentQuestion + 1}</span> من {questions.length}
          </div>
        </div>
        <div className="w-full h-1.5 bg-[#e8f5ee]">
          <div className="h-full transition-all duration-300 ease-out" style={{ width: `${progress}%`, background: '#1a5f4a' }} />
        </div>
      </header>

      <main className="flex-1 relative z-10 px-4 py-6">
        <div className="max-w-3xl mx-auto animate-fade-in-up">
          <div className="islamic-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-bold text-white" style={{ background: '#1a5f4a' }}>
                السؤال {currentQuestion + 1}
              </span>
            </div>
            <h2 className="font-tajawal font-bold text-xl leading-relaxed mb-6" style={{ color: '#1a1a2e' }}>
              {question.text}
            </h2>
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((option) => {
                const isSelected = answers[String(question.id)] === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-right transition-all duration-200 hover:scale-[1.01] ${isSelected ? 'border-[#1a5f4a] bg-[#e8f5ee]' : 'border-[#d4c9b5] bg-white hover:border-[#1a5f4a]'}`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? 'bg-[#1a5f4a] text-white' : 'bg-[#f8f5f0] text-[#1a5f4a]'}`}>
                      {OPTION_LABELS[option]}
                    </span>
                    <span className="text-base" style={{ color: '#1a1a2e' }}>
                      {question[`option${option}` as keyof typeof question]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <button onClick={goPrev} disabled={currentQuestion === 0} className="btn-outline flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-5 h-5" />
              السؤال السابق
            </button>
            {isLastQuestion ? (
              <button onClick={() => setShowConfirm(true)} className="btn-primary flex items-center gap-2" style={{ background: '#27ae60' }}>
                <CheckCircle className="w-5 h-5" />
                إنهاء الاختبار
              </button>
            ) : (
              <button onClick={goNext} className="btn-primary flex items-center gap-2">
                السؤال التالي
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button onClick={() => setShowConfirm(true)} className="btn-danger flex items-center gap-2 px-8 h-12 shadow-islamic-lg hover:scale-105">
          <Send className="w-5 h-5" />
          إرسال الاختبار
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="islamic-card p-6 w-full max-w-sm mx-4 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-[#e67e22]" />
              <h3 className="font-tajawal font-bold text-xl" style={{ color: '#1a1a2e' }}>تأكيد الإرسال</h3>
            </div>
            <p className="text-[#5a5a6e] mb-6">هل أنت متأكد من إرسال الاختبار؟ لا يمكنك التراجع بعد الإرسال.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-outline flex-1 h-11">إلغاء</button>
              <button onClick={() => { setShowConfirm(false); submitExam(); }} className="btn-danger flex-1 h-11">إرسال</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
