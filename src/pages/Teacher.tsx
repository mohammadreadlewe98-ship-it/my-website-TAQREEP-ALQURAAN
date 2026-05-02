import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Moon, Plus, Pencil, Trash2, Download, ChevronLeft,
  UserCheck, HelpCircle, BarChart3, Settings, LogOut,
  ChevronDown, ChevronUp, CheckCircle, XCircle, ArrowRight
} from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { OPTION_LABELS } from '@/types';
import type { Question as QuestionType } from '@db/schema';

export default function Teacher() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<'questions' | 'results' | 'report' | 'settings'>('questions');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // tRPC queries
  const questionsQuery = trpc.question.list.useQuery();
  const resultsQuery = trpc.result.list.useQuery();
  const examStatusQuery = trpc.exam.status.useQuery();

  // tRPC mutations
  const createQuestion = trpc.question.create.useMutation({
    onSuccess: () => { utils.question.list.invalidate(); setShowForm(false); }
  });
  const updateQuestion = trpc.question.update.useMutation({
    onSuccess: () => { utils.question.list.invalidate(); setShowForm(false); }
  });
  const deleteQuestion = trpc.question.delete.useMutation({
    onSuccess: () => { utils.question.list.invalidate(); }
  });
  const updateExamStatus = trpc.exam.updateStatus.useMutation({
    onSuccess: () => { utils.exam.status.invalidate(); }
  });

  const questions = questionsQuery.data ?? [];
  const students = resultsQuery.data ?? [];
  const examActive = examStatusQuery.data?.active ?? true;

  // Question form state
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionType | null>(null);
  const [formText, setFormText] = useState('');
  const [formOptions, setFormOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [formCorrect, setFormCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Report detail
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const handleToggleExam = () => {
    updateExamStatus.mutate({ active: !examActive });
  };

  const openAddForm = () => {
    setEditingQuestion(null);
    setFormText('');
    setFormOptions({ A: '', B: '', C: '', D: '' });
    setFormCorrect('A');
    setShowForm(true);
  };

  const openEditForm = (q: QuestionType) => {
    setEditingQuestion(q);
    setFormText(q.text);
    setFormOptions({ A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD });
    setFormCorrect(q.correctAnswer as 'A' | 'B' | 'C' | 'D');
    setShowForm(true);
  };

  const handleSaveQuestion = () => {
    if (!formText.trim() || !formOptions.A.trim() || !formOptions.B.trim() || !formOptions.C.trim() || !formOptions.D.trim()) return;

    const data = {
      text: formText.trim(),
      optionA: formOptions.A.trim(),
      optionB: formOptions.B.trim(),
      optionC: formOptions.C.trim(),
      optionD: formOptions.D.trim(),
      correctAnswer: formCorrect,
    };

    if (editingQuestion) {
      updateQuestion.mutate({ id: editingQuestion.id, ...data });
    } else {
      createQuestion.mutate(data);
    }
  };

  const handleDeleteQuestion = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
      deleteQuestion.mutate({ id });
    }
  };

  const exportToExcel = () => {
    if (students.length === 0) {
      alert('لا توجد نتائج للتصدير');
      return;
    }

    const summaryData = students.map((s: any) => ({
      'الطالب': s.name,
      'عدد الأسئلة': s.totalQuestions,
      'الإجابات الصحيحة': s.correctCount,
      'الإجابات الخاطئة': s.wrongCount,
      'النسبة': s.score + '%',
      'الوقت المستغرق (دقيقة)': Math.floor(s.timeSpent / 60),
      'التاريخ': new Date(s.createdAt).toLocaleDateString('ar-SA'),
    }));

    const detailData: any[] = [];
    students.forEach((s: any) => {
      let answers: Record<string, string> = {};
      try { answers = JSON.parse(s.answersJson); } catch { }
      questions.forEach((q: any) => {
        const studentAnswer = answers[String(q.id)];
        detailData.push({
          'الطالب': s.name,
          'السؤال': q.text,
          'إجابة الطالب': studentAnswer ? OPTION_LABELS[studentAnswer] : 'لم يجب',
          'الإجابة الصحيحة': OPTION_LABELS[q.correctAnswer as string],
          'الحالة': studentAnswer === q.correctAnswer ? 'صحيحة' : 'خاطئة',
        });
      });
    });

    import('xlsx').then(XLSX => {
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      const ws2 = XLSX.utils.json_to_sheet(detailData);
      ws1['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 14 }];
      ws2['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'ملخص النتائج');
      XLSX.utils.book_append_sheet(wb, ws2, 'إجابات مفصلة');
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `تقريب_القرآن_نتائج_${dateStr}.xlsx`);
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#e67e22';
    return '#c0392b';
  };

  const menuItems = [
    { key: 'questions' as const, label: 'الأسئلة', icon: HelpCircle },
    { key: 'results' as const, label: 'نتائج الطلاب', icon: UserCheck },
    { key: 'report' as const, label: 'تقرير مفصل', icon: BarChart3 },
    { key: 'settings' as const, label: 'إعدادات الاختبار', icon: Settings },
  ];

  if (questionsQuery.isLoading || resultsQuery.isLoading || examStatusQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f5f0' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1a5f4a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5a5a6e]">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8f5f0' }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'url(/pattern-bg.jpg)', backgroundSize: '400px' }} />

      <header className="lg:hidden relative z-30 h-14 flex items-center justify-between px-4" style={{ background: '#1a5f4a' }}>
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-[#c49a2c]" />
          <span className="text-white font-tajawal font-bold text-lg">تقريب القرآن</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
          {sidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />}
        </button>
      </header>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-20" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 lg:top-0 ${sidebarOpen ? 'right-0' : '-right-72'} lg:right-0 w-72 h-full z-30 transition-transform duration-300 lg:transition-none flex flex-col`} style={{ background: '#1a5f4a' }}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Moon className="w-7 h-7 text-[#c49a2c]" />
            <span className="text-white font-tajawal font-bold text-xl">تقريب القرآن</span>
          </div>
          <p className="text-white/60 text-sm">لوحة المعلم</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button key={item.key} onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 ${isActive ? 'bg-white/10 text-[#c49a2c]' : 'text-white/80 hover:bg-white/5'}`} style={isActive ? { borderRight: '3px solid #c49a2c' } : {}}>
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/80 text-sm">حالة الاختبار</span>
            <button onClick={handleToggleExam} className={`w-12 h-6 rounded-full transition-all duration-300 relative ${examActive ? 'bg-[#27ae60]' : 'bg-white/20'}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-300 ${examActive ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="text-center">
            <span className={`text-sm font-bold ${examActive ? 'text-[#27ae60]' : 'text-[#c0392b]'}`}>
              {examActive ? 'مفعل' : 'متوقف'}
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
            <LogOut className="w-5 h-5" />
            <span>خروج</span>
          </button>
        </div>
      </aside>

      <main className="lg:mr-72 relative z-10 min-h-screen">
        {activeTab === 'questions' && (
          <div className="p-4 lg:p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-tajawal font-bold text-2xl" style={{ color: '#1a1a2e' }}>إدارة الأسئلة</h2>
              <button onClick={openAddForm} className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                إضافة سؤال جديد
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="islamic-card p-8 text-center">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 text-[#d4c9b5]" />
                <p className="text-[#5a5a6e]">لا توجد أسئلة بعد. أضف سؤالك الأول!</p>
              </div>
            ) : (
              <div className="islamic-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#e8f5ee' }}>
                        <th className="text-right px-4 py-3 text-sm font-bold" style={{ color: '#1a1a2e' }}>#</th>
                        <th className="text-right px-4 py-3 text-sm font-bold" style={{ color: '#1a1a2e' }}>نص السؤال</th>
                        <th className="text-right px-4 py-3 text-sm font-bold" style={{ color: '#1a1a2e' }}>الإجابة الصحيحة</th>
                        <th className="text-right px-4 py-3 text-sm font-bold" style={{ color: '#1a1a2e' }}>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q: any, i: number) => (
                        <tr key={q.id} className="border-t border-[#e8f5ee] hover:bg-[#f8f5f0] transition-colors">
                          <td className="px-4 py-3 text-sm text-[#5a5a6e]">{i + 1}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#1a1a2e' }}>{q.text}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-3 py-1 rounded-full text-sm font-bold text-white bg-[#1a5f4a]">
                              {OPTION_LABELS[q.correctAnswer]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEditForm(q)} className="p-2 rounded-lg bg-[#e8f5ee] text-[#1a5f4a] hover:bg-[#1a5f4a] hover:text-white transition-all">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 rounded-lg bg-red-50 text-[#c0392b] hover:bg-[#c0392b] hover:text-white transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="mt-4 text-sm text-[#5a5a6e]">إجمالي الأسئلة: <span className="font-bold">{questions.length}</span></div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="p-4 lg:p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-tajawal font-bold text-2xl" style={{ color: '#1a1a2e' }}>نتائج الطلاب</h2>
              <button onClick={exportToExcel} className="btn-gold flex items-center gap-2">
                <Download className="w-5 h-5" />
                تصدير Excel
              </button>
            </div>

            {students.length === 0 ? (
              <div className="islamic-card p-8 text-center">
                <UserCheck className="w-12 h-12 mx-auto mb-3 text-[#d4c9b5]" />
                <p className="text-[#5a5a6e]">لا توجد نتائج بعد.</p>
              </div>
            ) : (
              <div className="islamic-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#e8f5ee' }}>
                        <th className="text-right px-4 py-3 text-sm font-bold" style={{ color: '#1a1a2e' }}>الطالب</th>
                        <th className="text-right px-4 py-3 text-sm font-bold" style={{ color: '#1a1a2e' }}>الأسئلة</th>
                        <th className="text-right px-4 py-3 text-sm font-bold" style={{ color: '#1a1a2e' }}>صحيح</th>
                        <th className="text-right px-4 py-3 text-sm font-bold" style={{ color: '#1a1a2e' }}>خاطئ</th>
                        <th className="text-right px-4 py-3 text-sm font-bold" style={{ color: '#1a1a2e' }}>النسبة</th>
                        <th className="text-right px-4 py-3 text-sm font-bold" style={{ color: '#1a1a2e' }}>الوقت</th>
                        <th className="text-right px-4 py-3 text-sm font-bold" style={{ color: '#1a1a2e' }}>التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s: any) => (
                        <tr key={s.id} className="border-t border-[#e8f5ee] hover:bg-[#f8f5f0] transition-colors cursor-pointer" onClick={() => setSelectedStudent(s)}>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: '#1a1a2e' }}>{s.name}</td>
                          <td className="px-4 py-3 text-sm text-[#5a5a6e]">{s.totalQuestions}</td>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: '#27ae60' }}>{s.correctCount}</td>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: '#c0392b' }}>{s.wrongCount}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold" style={{ color: getScoreColor(s.score) }}>{s.score}%</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#5a5a6e]">{Math.floor(s.timeSpent / 60)} د</td>
                          <td className="px-4 py-3 text-sm text-[#5a5a6e]">{new Date(s.createdAt).toLocaleDateString('ar-SA')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="p-4 lg:p-8 animate-fade-in-up">
            <h2 className="font-tajawal font-bold text-2xl mb-6" style={{ color: '#1a1a2e' }}>التقرير المفصل</h2>
            {students.length === 0 ? (
              <div className="islamic-card p-8 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-[#d4c9b5]" />
                <p className="text-[#5a5a6e]">لا توجد نتائج لعرض التقرير.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((s: any) => {
                  let answers: Record<string, string> = {};
                  try { answers = JSON.parse(s.answersJson); } catch { }
                  return (
                    <div key={s.id} className="islamic-card overflow-hidden">
                      <button onClick={() => setSelectedStudent(selectedStudent?.id === s.id ? null : s)} className="w-full p-4 flex items-center justify-between hover:bg-[#f8f5f0] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: getScoreColor(s.score) }}>
                            {s.score}%
                          </div>
                          <div className="text-right">
                            <p className="font-bold" style={{ color: '#1a1a2e' }}>{s.name}</p>
                            <p className="text-sm text-[#5a5a6e]">{s.correctCount} صحيحة | {s.wrongCount} خاطئة | {s.totalQuestions} إجمالي</p>
                          </div>
                        </div>
                        {selectedStudent?.id === s.id ? <ChevronUp className="w-5 h-5 text-[#5a5a6e]" /> : <ChevronDown className="w-5 h-5 text-[#5a5a6e]" />}
                      </button>

                      {selectedStudent?.id === s.id && (
                        <div className="border-t border-[#e8f5ee] p-4 animate-fade-in-up">
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="p-3 rounded-xl text-center" style={{ background: '#e8f5ee' }}>
                              <CheckCircle className="w-6 h-6 text-[#27ae60] mx-auto mb-1" />
                              <p className="text-lg font-bold text-[#27ae60]">{s.correctCount}</p>
                              <p className="text-xs text-[#5a5a6e]">صحيحة</p>
                            </div>
                            <div className="p-3 rounded-xl text-center" style={{ background: '#fdeaea' }}>
                              <XCircle className="w-6 h-6 text-[#c0392b] mx-auto mb-1" />
                              <p className="text-lg font-bold text-[#c0392b]">{s.wrongCount}</p>
                              <p className="text-xs text-[#5a5a6e]">خاطئة</p>
                            </div>
                            <div className="p-3 rounded-xl text-center" style={{ background: '#f4e8c1' }}>
                              <BarChart3 className="w-6 h-6 text-[#c49a2c] mx-auto mb-1" />
                              <p className="text-lg font-bold" style={{ color: '#c49a2c' }}>{s.score}%</p>
                              <p className="text-xs text-[#5a5a6e]">النسبة</p>
                            </div>
                          </div>

                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {questions.map((q: any, i: number) => {
                              const studentAns = answers[String(q.id)];
                              const isCorrect = studentAns === q.correctAnswer;
                              return (
                                <div key={q.id} className={`p-3 rounded-lg ${isCorrect ? 'bg-[#e8f5ee]' : 'bg-[#fdeaea]'}`}>
                                  <div className="flex items-start gap-2">
                                    {isCorrect ? <CheckCircle className="w-5 h-5 text-[#27ae60] flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-[#c0392b] flex-shrink-0 mt-0.5" />}
                                    <div className="flex-1">
                                      <p className="text-sm font-medium" style={{ color: '#1a1a2e' }}>{i + 1}. {q.text}</p>
                                      <div className="flex gap-4 mt-1 text-xs">
                                        <span>إجابة الطالب: <strong style={{ color: isCorrect ? '#27ae60' : '#c0392b' }}>{studentAns ? OPTION_LABELS[studentAns] : 'لم يجب'}</strong></span>
                                        <span>الصحيحة: <strong style={{ color: '#27ae60' }}>{OPTION_LABELS[q.correctAnswer]}</strong></span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 lg:p-8 animate-fade-in-up">
            <h2 className="font-tajawal font-bold text-2xl mb-6" style={{ color: '#1a1a2e' }}>إعدادات الاختبار</h2>
            <div className="max-w-lg">
              <div className="islamic-card p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: '#1a1a2e' }}>حالة الاختبار</h3>
                    <p className="text-sm text-[#5a5a6e]">يمكنك تفعيل أو إيقاف الاختبار للطلاب</p>
                  </div>
                  <button onClick={handleToggleExam} className={`w-14 h-8 rounded-full transition-all duration-300 relative ${examActive ? 'bg-[#27ae60]' : 'bg-gray-300'}`}>
                    <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all duration-300 shadow ${examActive ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <div className="mt-3 text-sm">
                  <span className={`font-bold ${examActive ? 'text-[#27ae60]' : 'text-[#c0392b]'}`}>
                    {examActive ? 'الاختبار مفعل - يمكن للطلاب الدخول' : 'الاختبار متوقف - لا يمكن للطلاب الدخول'}
                  </span>
                </div>
              </div>

              <div className="islamic-card p-6 mb-4">
                <h3 className="font-bold text-lg mb-1" style={{ color: '#1a1a2e' }}>معلومات الاختبار</h3>
                <div className="space-y-2 mt-3 text-sm">
                  <div className="flex justify-between"><span className="text-[#5a5a6e]">مدة الاختبار:</span><span className="font-bold">30 دقيقة</span></div>
                  <div className="flex justify-between"><span className="text-[#5a5a6e]">نوع الأسئلة:</span><span className="font-bold">اختيار من متعدد</span></div>
                  <div className="flex justify-between"><span className="text-[#5a5a6e]">عدد الأسئلة الحالية:</span><span className="font-bold">{questions.length}</span></div>
                  <div className="flex justify-between"><span className="text-[#5a5a6e]">عدد الطلاب:</span><span className="font-bold">{students.length}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="islamic-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="p-6">
              <h3 className="font-tajawal font-bold text-xl mb-4" style={{ color: '#1a1a2e' }}>
                {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1a1a2e' }}>نص السؤال</label>
                  <textarea value={formText} onChange={(e) => setFormText(e.target.value)} className="input-islamic min-h-[80px] resize-none" dir="rtl" placeholder="اكتب السؤال هنا..." />
                </div>
                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <div key={opt}>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1a1a2e' }}>الخيار {OPTION_LABELS[opt]}</label>
                    <input type="text" value={formOptions[opt]} onChange={(e) => setFormOptions(prev => ({ ...prev, [opt]: e.target.value }))} className="input-islamic" dir="rtl" placeholder={`اكتب الخيار ${OPTION_LABELS[opt]}`} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1a1a2e' }}>الإجابة الصحيحة</label>
                  <select value={formCorrect} onChange={(e) => setFormCorrect(e.target.value as 'A' | 'B' | 'C' | 'D')} className="input-islamic" dir="rtl">
                    <option value="A">أ</option>
                    <option value="B">ب</option>
                    <option value="C">ج</option>
                    <option value="D">د</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="btn-outline flex-1 h-11">إلغاء</button>
                <button onClick={handleSaveQuestion} disabled={!formText.trim() || !formOptions.A.trim() || !formOptions.B.trim() || !formOptions.C.trim() || !formOptions.D.trim()} className="btn-primary flex-1 h-11 disabled:opacity-50">
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && activeTab === 'results' && (
        <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setSelectedStudent(null)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-islamic-lg overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-tajawal font-bold text-xl" style={{ color: '#1a1a2e' }}>تقرير {selectedStudent.name}</h3>
                <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-lg hover:bg-[#f8f5f0] transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-4 rounded-xl text-center" style={{ background: '#e8f5ee' }}>
                  <CheckCircle className="w-8 h-8 text-[#27ae60] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#27ae60]">{selectedStudent.correctCount}</p>
                  <p className="text-xs text-[#5a5a6e]">صحيحة</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ background: '#fdeaea' }}>
                  <XCircle className="w-8 h-8 text-[#c0392b] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#c0392b]">{selectedStudent.wrongCount}</p>
                  <p className="text-xs text-[#5a5a6e]">خاطئة</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ background: '#f4e8c1' }}>
                  <BarChart3 className="w-8 h-8 text-[#c49a2c] mx-auto mb-2" />
                  <p className="text-2xl font-bold" style={{ color: '#c49a2c' }}>{selectedStudent.score}%</p>
                  <p className="text-xs text-[#5a5a6e]">النسبة</p>
                </div>
              </div>

              <div className="space-y-3">
                {(() => {
                  let answers: Record<string, string> = {};
                  try { answers = JSON.parse(selectedStudent.answersJson); } catch { }
                  return questions.map((q: any, i: number) => {
                    const studentAns = answers[String(q.id)];
                    const isCorrect = studentAns === q.correctAnswer;
                    return (
                      <div key={q.id} className={`p-4 rounded-xl ${isCorrect ? 'bg-[#e8f5ee]' : 'bg-[#fdeaea]'}`}>
                        <p className="font-medium mb-2" style={{ color: '#1a1a2e' }}>{i + 1}. {q.text}</p>
                        <div className="flex gap-4 text-sm">
                          <span>إجابة الطالب: <strong style={{ color: isCorrect ? '#27ae60' : '#c0392b' }}>{studentAns ? OPTION_LABELS[studentAns] : 'لم يجب'}</strong></span>
                          <span>الصحيحة: <strong style={{ color: '#27ae60' }}>{OPTION_LABELS[q.correctAnswer]}</strong></span>
                        </div>
                        <div className="mt-2">
                          <span className={`text-sm font-bold ${isCorrect ? 'text-[#27ae60]' : 'text-[#c0392b]'}`}>{isCorrect ? '✓ صحيحة' : '✗ خاطئة'}</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
