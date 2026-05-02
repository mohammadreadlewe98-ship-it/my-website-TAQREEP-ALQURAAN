import type { Question, StudentResult, ExamStatus, CurrentExam } from '@/types';

const STORAGE_KEYS = {
  QUESTIONS: 'tqr_questions',
  STUDENTS: 'tqr_students',
  EXAM_STATUS: 'tqr_exam_status',
  CURRENT_EXAM: 'tqr_current_exam',
};

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'كم عدد سور القرآن الكريم؟',
    options: { A: '114', B: '112', C: '113', D: '115' },
    correctAnswer: 'A',
  },
  {
    id: 'q2',
    text: 'ما هي أطول سورة في القرآن الكريم؟',
    options: { A: 'البقرة', B: 'آل عمران', C: 'النساء', D: 'المائدة' },
    correctAnswer: 'A',
  },
  {
    id: 'q3',
    text: 'ما هي أقصر سورة في القرآن الكريم؟',
    options: { A: 'الكوثر', B: 'العصر', C: 'الفيل', D: 'النصر' },
    correctAnswer: 'A',
  },
  {
    id: 'q4',
    text: 'في أي عام نزل الوحي على النبي محمد ﷺ؟',
    options: { A: '610م', B: '612م', C: '615م', D: '620م' },
    correctAnswer: 'A',
  },
  {
    id: 'q5',
    text: 'ما هي السورة التي تسمى بقلب القرآن؟',
    options: { A: 'يس', B: 'الرحمن', C: 'الواقعة', D: 'الملك' },
    correctAnswer: 'A',
  },
  {
    id: 'q6',
    text: 'كم عدد آيات سورة البقرة؟',
    options: { A: '286', B: '285', C: '288', D: '284' },
    correctAnswer: 'A',
  },
  {
    id: 'q7',
    text: 'ما هي السورة التي تبدأ بـ "الر"؟',
    options: { A: 'النحل', B: 'الآية', C: 'يونس', D: 'هود' },
    correctAnswer: 'A',
  },
  {
    id: 'q8',
    text: 'في أي ليلة نزل القرآن الكريم؟',
    options: { A: 'ليلة القدر', B: 'ليلة النصف من شعبان', C: 'ليلة الإسراء', D: 'ليلة المعراج' },
    correctAnswer: 'A',
  },
  {
    id: 'q9',
    text: 'ما هو عدد أجزاء القرآن الكريم؟',
    options: { A: '30', B: '25', C: '40', D: '35' },
    correctAnswer: 'A',
  },
  {
    id: 'q10',
    text: 'ما هي السورة التي ختمت باسم سورة من سور القرآن؟',
    options: { A: 'الفاتحة', B: 'الإخلاص', C: 'الفلق', D: 'الناس' },
    correctAnswer: 'A',
  },
];

export const storage = {
  getQuestions(): Question[] {
    const data = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS));
      return DEFAULT_QUESTIONS;
    }
    return JSON.parse(data);
  },

  setQuestions(questions: Question[]) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  },

  addQuestion(question: Question) {
    const questions = this.getQuestions();
    questions.push(question);
    this.setQuestions(questions);
  },

  updateQuestion(question: Question) {
    const questions = this.getQuestions();
    const index = questions.findIndex(q => q.id === question.id);
    if (index !== -1) {
      questions[index] = question;
      this.setQuestions(questions);
    }
  },

  deleteQuestion(id: string) {
    const questions = this.getQuestions();
    const filtered = questions.filter(q => q.id !== id);
    this.setQuestions(filtered);
  },

  getStudents(): StudentResult[] {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return data ? JSON.parse(data) : [];
  },

  addStudentResult(result: StudentResult) {
    const students = this.getStudents();
    students.push(result);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  getExamStatus(): ExamStatus {
    const data = localStorage.getItem(STORAGE_KEYS.EXAM_STATUS);
    if (!data) {
      const defaultStatus: ExamStatus = { active: true };
      localStorage.setItem(STORAGE_KEYS.EXAM_STATUS, JSON.stringify(defaultStatus));
      return defaultStatus;
    }
    return JSON.parse(data);
  },

  setExamStatus(status: ExamStatus) {
    localStorage.setItem(STORAGE_KEYS.EXAM_STATUS, JSON.stringify(status));
  },

  getCurrentExam(): CurrentExam | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_EXAM);
    return data ? JSON.parse(data) : null;
  },

  setCurrentExam(exam: CurrentExam | null) {
    if (exam) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_EXAM, JSON.stringify(exam));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_EXAM);
    }
  },

  clearCurrentExam() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_EXAM);
  },

  clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};

export function generateId(): string {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
