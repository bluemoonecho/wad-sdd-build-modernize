import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { evaluateQuiz, getQuizQuestions, QUIZ_TIE_BREAK_RULE, QuizValidationError } from './quiz';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

function createIsolatedCatalogFilePath(): { tempDirectoryPath: string; catalogFilePath: string } {
  const tempDirectoryPath = mkdtempSync(join(tmpdir(), 'duck-emporium-story-8-'));
  const catalogFilePath = join(tempDirectoryPath, 'catalog-data.json');
  const sourceCatalogFilePath = join(currentDirectory, '..', 'catalog', 'catalog-data.json');

  copyFileSync(sourceCatalogFilePath, catalogFilePath);

  return {
    tempDirectoryPath,
    catalogFilePath,
  };
}

describe('personality quiz', () => {
  const tempDirectoryPaths: string[] = [];

  afterEach(() => {
    while (tempDirectoryPaths.length > 0) {
      const tempDirectoryPath = tempDirectoryPaths.pop();

      if (!tempDirectoryPath) {
        continue;
      }

      rmSync(tempDirectoryPath, { recursive: true, force: true });
    }
  });

  it('provides 6 multiple-choice questions', () => {
    const questions = getQuizQuestions();

    expect(questions).toHaveLength(6);

    for (const question of questions) {
      expect(question.id).toEqual(expect.any(String));
      expect(question.prompt).toEqual(expect.any(String));
      expect(question.options.length).toBeGreaterThanOrEqual(2);

      for (const option of question.options) {
        expect(option.id).toEqual(expect.any(String));
        expect(option.text).toEqual(expect.any(String));
      }
    }
  });

  it('returns a deterministic duck recommendation and detail link for the same answers', () => {
    const { tempDirectoryPath, catalogFilePath } = createIsolatedCatalogFilePath();
    tempDirectoryPaths.push(tempDirectoryPath);

    const answers = [
      { questionId: 'q1', optionId: 'q1a' },
      { questionId: 'q2', optionId: 'q2a' },
      { questionId: 'q3', optionId: 'q3a' },
      { questionId: 'q4', optionId: 'q4a' },
      { questionId: 'q5', optionId: 'q5a' },
      { questionId: 'q6', optionId: 'q6a' },
    ];

    const firstResult = evaluateQuiz(answers, { catalogFilePath });
    const secondResult = evaluateQuiz(answers, { catalogFilePath });

    expect(firstResult.duck.id).toBe(secondResult.duck.id);
    expect(firstResult.winningCategory).toBe('Adventure');
    expect(firstResult.detailPath).toBe(`/ducks/${firstResult.duck.id}`);
    expect(firstResult.message.length).toBeGreaterThan(0);
  });

  it('uses documented deterministic tie-break order', () => {
    const { tempDirectoryPath, catalogFilePath } = createIsolatedCatalogFilePath();
    tempDirectoryPaths.push(tempDirectoryPath);

    const tiedAnswers = [
      { questionId: 'q1', optionId: 'q1a' },
      { questionId: 'q2', optionId: 'q2c' },
      { questionId: 'q3', optionId: 'q3c' },
      { questionId: 'q4', optionId: 'q4d' },
      { questionId: 'q5', optionId: 'q5a' },
      { questionId: 'q6', optionId: 'q6c' },
    ];

    const result = evaluateQuiz(tiedAnswers, { catalogFilePath });

    expect(result.tieBreakRule).toBe(QUIZ_TIE_BREAK_RULE);
    expect(result.winningCategory).toBe('Adventure');
  });

  it('does not modify catalog persistence when evaluating results', () => {
    const { tempDirectoryPath, catalogFilePath } = createIsolatedCatalogFilePath();
    tempDirectoryPaths.push(tempDirectoryPath);

    const before = readFileSync(catalogFilePath, 'utf8');

    evaluateQuiz(
      [
        { questionId: 'q1', optionId: 'q1b' },
        { questionId: 'q2', optionId: 'q2b' },
        { questionId: 'q3', optionId: 'q3c' },
        { questionId: 'q4', optionId: 'q4b' },
        { questionId: 'q5', optionId: 'q5b' },
        { questionId: 'q6', optionId: 'q6b' },
      ],
      { catalogFilePath },
    );

    const after = readFileSync(catalogFilePath, 'utf8');
    expect(after).toBe(before);
  });

  it('rejects invalid answer sets with clear errors', () => {
    expect(() =>
      evaluateQuiz([
        { questionId: 'q1', optionId: 'q1a' },
        { questionId: 'q2', optionId: 'q2a' },
      ]),
    ).toThrowError(QuizValidationError);
  });
});
