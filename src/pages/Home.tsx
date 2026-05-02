import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Moon, BookOpen, Clock, HelpCircle, ArrowLeft } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { TEACHER_SECRET_CODE } from '@/types';

export default function Home() {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const examStatusQuery = trpc.exam.status.useQuery();
  const examActive = examStatusQuery.data?.active ?? true;

  const handleStartExam = () => {
    const name = studentName.trim();
    if (!name) {
      setShake(true);
      setError('الرجاء إدخال اسمك');
      setTimeout(() => setShake(false), 300);
      return;
    }

    if (!examActive) {
      setError('الاختبار متوقف حالياً. تواصل مع معلمك.');
      return;
    }

    localStorage.setItem('tqr_student_name', name);
    navigate('/exam');
  };

  const handleTeacherLogin = () => {
    if (secretCode.trim() === TEACHER_SECRET_CODE) {
      setShowTeacherModal(false);
      navigate('/teacher');
    } else {
      setShake(true);
      setError('الرمز السري غير صحيح');
      setTimeout(() => setShake(false), 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStartExam();
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTeacherLogin();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f5f0' }}>
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'url(/pattern-bg.jpg)', backgroundSize: '400px' }}
      />

      <header className="relative z-10 h-16 flex items-center justify-between px-6" style={{ background: '#1a5f4a' }}>
        <div className="flex items-center gap-2">
          <Moon className="w-6 h-6 text-[#c49a2c]" />
          <span className="text-white font-tajawal font-bold text-xl">تقريب القرآن</span>
        </div>
        <button
          onClick={() => { setShowTeacherModal(true); setError(''); setSecretCode(''); }}
          className="text-white/80 text-sm hover:text-[#c49a2c] transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          الدخول للمعلمين
        </button>
      </header>

      <main className="flex-1 relative z-10 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-8">
            <img src="/celebration.png" alt="تقريب القرآن" className="w-28 h-28 mx-auto mb-4" />
            <h1 className="font-tajawal font-bold text-3xl mb-2" style={{ color: '#1a5f4a' }}>
              تقريب القرآن
            </h1>
            <p className="text-[#5a5a6e] text-lg">أهلاً بك في اختبار تقريب القرآن</p>
            <p className="text-[#5a5a6e] text-sm mt-1">اختبارك في متناول يدك - ابدأ رحلتك التعليمية</p>
          </div>

          <div className="islamic-card p-5 mb-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <Clock className="w-5 h-5 text-[#1a5f4a]" />
                <span className="text-xs text-[#5a5a6e]">المدة</span>
                <span className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>30 دقيقة</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <HelpCircle className="w-5 h-5 text-[#1a5f4a]" />
                <span className="text-xs text-[#5a5a6e]">النوع</span>
                <span className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>اختيار متعدد</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <BookOpen className="w-5 h-5 text-[#1a5f4a]" />
                <span className="text-xs text-[#5a5a6e]">الأسئلة</span>
                <span className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>غير محدود</span>
              </div>
            </div>
          </div>

          <div className={`${shake ? 'animate-shake' : ''}`}>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="اكتب اسمك هنا"
              value={studentName}
              onChange={(e) => { setStudentName(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              className="input-islamic text-center text-lg mb-4"
              dir="rtl"
            />
            {error && <p className="text-[#c0392b] text-sm text-center mb-3">{error}</p>}
          </div>

          <button
            onClick={handleStartExam}
            disabled={!studentName.trim()}
            className="btn-primary w-full h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            بدء الاختبار
          </button>

          <p className="text-center text-sm text-[#5a5a6e]">
            هل أنت معلم؟{' '}
            <button onClick={() => { setShowTeacherModal(true); setError(''); setSecretCode(''); }} className="text-[#1a5f4a] underline hover:text-[#0d3d2e] transition-colors">
              اضغط هنا للدخول
            </button>
          </p>
        </div>
      </main>

      <footer className="relative z-10 h-12 flex items-center justify-center" style={{ background: '#0d3d2e' }}>
        <p className="text-white/80 text-sm">تقريب القرآن - منصة اختبارات إسلامية</p>
      </footer>

      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className={`islamic-card p-8 w-full max-w-sm mx-4 ${shake ? 'animate-shake' : 'animate-fade-in-up'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-tajawal font-bold text-xl" style={{ color: '#1a5f4a' }}>الدخول للمعلمين</h2>
              <button onClick={() => { setShowTeacherModal(false); setError(''); }} className="text-[#5a5a6e] hover:text-[#1a1a2e] transition-colors">
                <span className="text-xl">×</span>
              </button>
            </div>
            <p className="text-[#5a5a6e] text-sm mb-4">الرجاء إدخال الرمز السري</p>
            <input type="password" placeholder="الرمز السري" value={secretCode} onChange={(e) => { setSecretCode(e.target.value); setError(''); }} onKeyDown={handleCodeKeyDown} className="input-islamic text-center mb-4" dir="rtl" />
            {error && <p className="text-[#c0392b] text-sm text-center mb-3">{error}</p>}
            <button onClick={handleTeacherLogin} className="btn-primary w-full h-11">دخول</button>
          </div>
        </div>
      )}
    </div>
  );
}
