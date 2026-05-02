import { getDb } from "../api/queries/connection";
import { questions, examStatus } from "./schema";

async function seed() {
  const db = getDb();

  const existing = await db.query.questions.findMany({ limit: 1 });
  if (existing.length === 0) {
    const defaultQuestions = [
      {
        text: "كم عدد سور القرآن الكريم؟",
        optionA: "114",
        optionB: "112",
        optionC: "113",
        optionD: "115",
        correctAnswer: "A",
      },
      {
        text: "ما هي أطول سورة في القرآن الكريم؟",
        optionA: "البقرة",
        optionB: "آل عمران",
        optionC: "النساء",
        optionD: "المائدة",
        correctAnswer: "A",
      },
      {
        text: "ما هي أقصر سورة في القرآن الكريم؟",
        optionA: "الكوثر",
        optionB: "العصر",
        optionC: "الفيل",
        optionD: "النصر",
        correctAnswer: "A",
      },
      {
        text: "في أي عام نزل الوحي على النبي محمد ﷺ؟",
        optionA: "610م",
        optionB: "612م",
        optionC: "615م",
        optionD: "620م",
        correctAnswer: "A",
      },
      {
        text: "ما هي السورة التي تسمى بقلب القرآن؟",
        optionA: "يس",
        optionB: "الرحمن",
        optionC: "الواقعة",
        optionD: "الملك",
        correctAnswer: "A",
      },
      {
        text: "كم عدد آيات سورة البقرة؟",
        optionA: "286",
        optionB: "285",
        optionC: "288",
        optionD: "284",
        correctAnswer: "A",
      },
      {
        text: 'ما هي السورة التي تبدأ بـ "الر"؟',
        optionA: "النحل",
        optionB: "الآية",
        optionC: "يونس",
        optionD: "هود",
        correctAnswer: "A",
      },
      {
        text: "في أي ليلة نزل القرآن الكريم؟",
        optionA: "ليلة القدر",
        optionB: "ليلة النصف من شعبان",
        optionC: "ليلة الإسراء",
        optionD: "ليلة المعراج",
        correctAnswer: "A",
      },
      {
        text: "ما هو عدد أجزاء القرآن الكريم؟",
        optionA: "30",
        optionB: "25",
        optionC: "40",
        optionD: "35",
        correctAnswer: "A",
      },
      {
        text: "ما هي السورة التي ختمت باسم سورة من سور القرآن؟",
        optionA: "الفاتحة",
        optionB: "الإخلاص",
        optionC: "الفلق",
        optionD: "الناس",
        correctAnswer: "A",
      },
    ];

    await db.insert(questions).values(defaultQuestions);
    console.log(`Seeded ${defaultQuestions.length} questions.`);
  } else {
    console.log("Questions already seeded.");
  }

  const existingStatus = await db.query.examStatus.findFirst();
  if (!existingStatus) {
    await db.insert(examStatus).values({ active: 1 });
    console.log("Seeded exam status as active.");
  } else {
    console.log("Exam status already exists.");
  }
}

(async () => {
  try {
    await seed();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
