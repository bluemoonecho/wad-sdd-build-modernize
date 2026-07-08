import { listDucks, type CatalogDataSourceOptions, type DuckSummary } from '../catalog/catalog';

type DuckCategory = 'Adventure' | 'Classic' | 'Luxury' | 'Party';

interface QuizOption {
  id: string;
  text: string;
  weights: Partial<Record<DuckCategory, number>>;
}

interface QuizQuestionDefinition {
  id: string;
  prompt: string;
  options: QuizOption[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: Array<{
    id: string;
    text: string;
  }>;
}

export interface QuizAnswer {
  questionId: string;
  optionId: string;
}

export interface QuizResult {
  duck: DuckSummary;
  winningCategory: DuckCategory;
  message: string;
  detailPath: string;
  tieBreakRule: string;
}

export class QuizValidationError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'QuizValidationError';
  }
}

const QUIZ_QUESTIONS: QuizQuestionDefinition[] = [
  {
    id: 'q1',
    prompt: 'Your ideal Saturday sounds like...',
    options: [
      { id: 'q1a', text: 'Charting unknown bubble routes.', weights: { Adventure: 2 } },
      { id: 'q1b', text: 'Hosting a bath disco for friends.', weights: { Party: 2 } },
      { id: 'q1c', text: 'Restoring a vintage clawfoot tub.', weights: { Classic: 2 } },
      { id: 'q1d', text: 'Booking a five-star spa suite.', weights: { Luxury: 2 } },
    ],
  },
  {
    id: 'q2',
    prompt: 'In a group project, you are usually...',
    options: [
      { id: 'q2a', text: 'The scout who finds hidden paths.', weights: { Adventure: 2 } },
      { id: 'q2b', text: 'The host who keeps morale high.', weights: { Party: 2 } },
      { id: 'q2c', text: 'The reliable organizer with neat notes.', weights: { Classic: 2 } },
      { id: 'q2d', text: 'The curator of polished final details.', weights: { Luxury: 2 } },
    ],
  },
  {
    id: 'q3',
    prompt: 'Pick a soundtrack for your duck energy.',
    options: [
      { id: 'q3a', text: 'Epic sea-shanty remixes.', weights: { Adventure: 2, Party: 1 } },
      { id: 'q3b', text: 'Quiet piano and old records.', weights: { Classic: 2, Luxury: 1 } },
      { id: 'q3c', text: 'Sparkly synth pop all day.', weights: { Party: 2 } },
      { id: 'q3d', text: 'Minimal ambient with expensive headphones.', weights: { Luxury: 2 } },
    ],
  },
  {
    id: 'q4',
    prompt: 'How do you solve a stubborn bug?',
    options: [
      { id: 'q4a', text: 'Try bold experiments until it yields.', weights: { Adventure: 2 } },
      { id: 'q4b', text: 'Talk it out with dramatic hand gestures.', weights: { Party: 2 } },
      { id: 'q4c', text: 'Step through methodically, line by line.', weights: { Classic: 2 } },
      { id: 'q4d', text: 'Refactor it elegantly and call it art.', weights: { Luxury: 2 } },
    ],
  },
  {
    id: 'q5',
    prompt: 'Your desk accessory of choice is...',
    options: [
      { id: 'q5a', text: 'A compass that points to fun.', weights: { Adventure: 2 } },
      { id: 'q5b', text: 'A glitter pen and tiny disco ball.', weights: { Party: 2 } },
      { id: 'q5c', text: 'A classic fountain pen.', weights: { Classic: 2 } },
      { id: 'q5d', text: 'A marble coaster set.', weights: { Luxury: 2 } },
    ],
  },
  {
    id: 'q6',
    prompt: 'What does success feel like?',
    options: [
      { id: 'q6a', text: 'A new horizon and salty air.', weights: { Adventure: 2 } },
      { id: 'q6b', text: 'A room cheering your name.', weights: { Party: 2 } },
      { id: 'q6c', text: 'A timeless solution that still works in 10 years.', weights: { Classic: 2 } },
      { id: 'q6d', text: 'Quiet confidence with impeccable style.', weights: { Luxury: 2 } },
    ],
  },
];

const QUIZ_TIE_BREAK_ORDER: DuckCategory[] = ['Adventure', 'Classic', 'Luxury', 'Party'];

export const QUIZ_TIE_BREAK_RULE =
  'Ties are resolved by fixed category order: Adventure, Classic, Luxury, Party.';

const CATEGORY_MESSAGES: Record<DuckCategory, string> = {
  Adventure: 'You are the brave explorer type. Your duck is ready for daring bubbles.',
  Classic: 'You are steady and thoughtful. Your duck keeps things timeless and reliable.',
  Luxury: 'You have elegant taste and calm confidence. Your duck matches your refined vibe.',
  Party: 'You bring joy and energy wherever you go. Your duck is pure celebration.',
};

function getCategoryPriority(category: DuckCategory): number {
  return QUIZ_TIE_BREAK_ORDER.indexOf(category);
}

function chooseWinningCategory(scoreByCategory: Map<DuckCategory, number>): DuckCategory {
  const sortedCategories = [...scoreByCategory.entries()].sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return getCategoryPriority(left[0]) - getCategoryPriority(right[0]);
  });

  const winner = sortedCategories[0]?.[0];

  if (!winner) {
    throw new QuizValidationError('Unable to evaluate quiz result.');
  }

  return winner;
}

function validateAnswers(answers: QuizAnswer[]): Map<string, QuizOption> {
  if (!Array.isArray(answers)) {
    throw new QuizValidationError('answers must be an array.');
  }

  if (answers.length !== QUIZ_QUESTIONS.length) {
    throw new QuizValidationError(`answers must contain exactly ${QUIZ_QUESTIONS.length} responses.`);
  }

  const selectedOptionsByQuestionId = new Map<string, QuizOption>();

  for (const answer of answers) {
    const question = QUIZ_QUESTIONS.find((candidate) => candidate.id === answer.questionId);

    if (!question) {
      throw new QuizValidationError(`Unknown questionId: ${answer.questionId}`);
    }

    if (selectedOptionsByQuestionId.has(question.id)) {
      throw new QuizValidationError(`Duplicate answer for questionId: ${question.id}`);
    }

    const option = question.options.find((candidate) => candidate.id === answer.optionId);

    if (!option) {
      throw new QuizValidationError(
        `Unknown optionId: ${answer.optionId} for questionId: ${question.id}`,
      );
    }

    selectedOptionsByQuestionId.set(question.id, option);
  }

  return selectedOptionsByQuestionId;
}

function selectDuckForCategory(
  winningCategory: DuckCategory,
  options?: CatalogDataSourceOptions,
): DuckSummary {
  const ducksInCategory = listDucks(options)
    .filter((duck) => duck.category === winningCategory)
    .sort((left, right) => left.id.localeCompare(right.id));

  const selectedDuck = ducksInCategory[0];

  if (!selectedDuck) {
    throw new QuizValidationError(`No duck available in winning category: ${winningCategory}`);
  }

  return selectedDuck;
}

export function getQuizQuestions(): QuizQuestion[] {
  return QUIZ_QUESTIONS.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options.map((option) => ({
      id: option.id,
      text: option.text,
    })),
  }));
}

export function evaluateQuiz(
  answers: QuizAnswer[],
  options?: CatalogDataSourceOptions,
): QuizResult {
  const selectedOptionsByQuestionId = validateAnswers(answers);

  const scoreByCategory = new Map<DuckCategory, number>(
    QUIZ_TIE_BREAK_ORDER.map((category) => [category, 0]),
  );

  for (const option of selectedOptionsByQuestionId.values()) {
    for (const [category, weight] of Object.entries(option.weights)) {
      const typedCategory = category as DuckCategory;
      const currentScore = scoreByCategory.get(typedCategory) ?? 0;
      scoreByCategory.set(typedCategory, currentScore + (weight ?? 0));
    }
  }

  const winningCategory = chooseWinningCategory(scoreByCategory);
  const selectedDuck = selectDuckForCategory(winningCategory, options);

  return {
    duck: selectedDuck,
    winningCategory,
    message: CATEGORY_MESSAGES[winningCategory],
    detailPath: `/ducks/${selectedDuck.id}`,
    tieBreakRule: QUIZ_TIE_BREAK_RULE,
  };
}
