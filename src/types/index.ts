export interface Question {
  id: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface StudentAnswer {
  [questionId: string]: 'A' | 'B' | 'C' | 'D';
}

export interface StudentResult {
  id: string;
  name: string;
  answers: StudentAnswer;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  timeSpent: number; // in seconds
  date: string;
}

export interface ExamStatus {
  active: boolean;
}

export interface CurrentExam {
  studentName: string;
  answers: StudentAnswer;
  startTime: number;
  currentQuestion: number;
  submitted: boolean;
}

export const OPTION_LABELS: Record<string, string> = {
  A: 'أ',
  B: 'ب',
  C: 'ج',
  D: 'د',
};

export const TEACHER_SECRET_CODE = '000999';
export const EXAM_DURATION_MINUTES = 30;
export const EXAM_DURATION_MS = EXAM_DURATION_MINUTES * 60 * 1000;
