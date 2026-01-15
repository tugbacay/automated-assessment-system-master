import Mistake from '../models/Mistake.js';
import Evaluation from '../models/Evaluation.js';
import Submission from '../models/Submission.js';
import { ERROR_TYPES, SEVERITY_LEVELS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Mistake Detection Service (FR6 & FR7)
 * Identifies errors and challenges in submissions
 */
class MistakeDetectionService {
  /**
   * Detect mistakes in evaluation (FR6)
   */
  async detectMistakes(evaluationId) {
    try {
      const evaluation = await Evaluation.findById(evaluationId).populate('submissionId');

      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      const submission = evaluation.submissionId;
      let mistakes = [];

      // Detect mistakes based on content type
      switch (submission.contentType) {
        case 'speaking':
          mistakes = await this.detectSpeakingMistakes(submission, evaluation);
          break;
        case 'writing':
          mistakes = await this.detectWritingMistakes(submission, evaluation);
          break;
        case 'quiz':
          mistakes = await this.detectQuizMistakes(submission, evaluation);
          break;
      }

      // Save all detected mistakes
      const savedMistakes = await Promise.all(
        mistakes.map((mistake) =>
          Mistake.create({
            evaluationId: evaluation._id,
            ...mistake,
          })
        )
      );

      logger.info(
        `Detected ${savedMistakes.length} mistakes for evaluation ${evaluation.evaluationId}`
      );

      return savedMistakes;
    } catch (error) {
      logger.error(`Mistake detection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect speaking mistakes (pronunciation, fluency)
   */
  async detectSpeakingMistakes(submission, evaluation) {
    const mistakes = [];
    const transcript = submission.content.transcript || '';

    if (!transcript) {
      // If no transcript, generate generic pronunciation feedback
      if (evaluation.pronunciationScore < 70) {
        mistakes.push({
          errorType: ERROR_TYPES.PRONUNCIATION,
          description: 'Pronunciation clarity needs improvement',
          suggestion: 'Focus on clear articulation of consonants and vowels',
          severity: SEVERITY_LEVELS.MAJOR,
          isPossibleError: true,
        });
      }

      if (submission.content.duration < 60) {
        mistakes.push({
          errorType: ERROR_TYPES.PRONUNCIATION,
          description: 'Response too short for comprehensive evaluation',
          suggestion: 'Aim for at least 1-2 minutes of speaking time',
          severity: SEVERITY_LEVELS.MINOR,
          isPossibleError: false,
        });
      }

      return mistakes;
    }

    // Detect common pronunciation issues based on transcript
    const pronunciationPatterns = [
      {
        pattern: /\b(th|the|that|this)\b/gi,
        error: 'TH sound pronunciation',
        suggestion: "Practice 'th' sound - tongue between teeth",
        severity: SEVERITY_LEVELS.MAJOR,
      },
      {
        pattern: /\b(r|right|read|run)\b/gi,
        error: 'R sound clarity',
        suggestion: "Ensure clear 'r' sound without 'l' substitution",
        severity: SEVERITY_LEVELS.MINOR,
      },
      {
        pattern: /\b(v|very|have|voice)\b/gi,
        error: 'V sound pronunciation',
        suggestion: "Distinguish 'v' from 'w' - teeth touch lower lip",
        severity: SEVERITY_LEVELS.MINOR,
      },
    ];

    pronunciationPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern.pattern);
      if (matches && matches.length > 3 && evaluation.pronunciationScore < 75) {
        mistakes.push({
          errorType: ERROR_TYPES.PRONUNCIATION,
          description: `Possible issue with ${pattern.error}`,
          suggestion: pattern.suggestion,
          severity: pattern.severity,
          isPossibleError: true,
        });
      }
    });

    return mistakes;
  }

  /**
   * Detect writing mistakes (grammar, vocabulary, spelling)
   */
  async detectWritingMistakes(submission, evaluation) {
    const mistakes = [];
    const text = submission.content.text;

    // Grammar error patterns
    const grammarPatterns = [
      {
        pattern: /\b(he|she|it)\s+(am|are)\b/gi,
        error: 'subject-verb agreement',
        suggestion: "Use 'is' with third-person singular (he/she/it)",
        severity: SEVERITY_LEVELS.CRITICAL,
      },
      {
        pattern: /\b(I|you|we|they)\s+is\b/gi,
        error: 'subject-verb agreement',
        suggestion: "Use 'am' with I, 'are' with you/we/they",
        severity: SEVERITY_LEVELS.CRITICAL,
      },
      {
        pattern: /\ba\s+([aeiou]\w*)/gi,
        error: 'article usage',
        suggestion: "Use 'an' before vowel sounds",
        severity: SEVERITY_LEVELS.MAJOR,
      },
      {
        pattern: /\ban\s+([^aeiou]\w*)/gi,
        error: 'article usage',
        suggestion: "Use 'a' before consonant sounds",
        severity: SEVERITY_LEVELS.MAJOR,
      },
      {
        pattern: /\b(don't|doesn't|won't)\s+\w+ed\b/gi,
        error: 'verb form after negative',
        suggestion: 'Use base form after negative auxiliary verbs',
        severity: SEVERITY_LEVELS.MAJOR,
      },
      {
        pattern: /\bmore\s+\w+er\b/gi,
        error: 'double comparative',
        suggestion: "Use either 'more' or '-er', not both",
        severity: SEVERITY_LEVELS.MAJOR,
      },
      {
        pattern: /[a-z]\.[A-Z]/g,
        error: 'punctuation spacing',
        suggestion: 'Add space after period',
        severity: SEVERITY_LEVELS.MINOR,
      },
      {
        pattern: /\s{2,}/g,
        error: 'extra spacing',
        suggestion: 'Use single space between words',
        severity: SEVERITY_LEVELS.MINOR,
      },
    ];

    grammarPatterns.forEach((pattern) => {
      let match;
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        mistakes.push({
          errorType: ERROR_TYPES.GRAMMAR,
          description: `Grammar error: ${pattern.error}`,
          suggestion: pattern.suggestion,
          positionStart: match.index,
          positionEnd: match.index + match[0].length,
          severity: pattern.severity,
          originalText: match[0],
          correctedText: this.generateCorrection(match[0], pattern.error),
          isPossibleError: false,
        });
      }
    });

    // Spelling patterns (common mistakes)
    const spellingPatterns = [
      { wrong: /\brecieve\b/gi, correct: 'receive' },
      { wrong: /\boccured\b/gi, correct: 'occurred' },
      { wrong: /\bseperate\b/gi, correct: 'separate' },
      { wrong: /\bdefinately\b/gi, correct: 'definitely' },
      { wrong: /\bthier\b/gi, correct: 'their' },
      { wrong: /\byour\s+(a|an|the|is|are)\b/gi, correct: "you're" },
    ];

    spellingPatterns.forEach((pattern) => {
      let match;
      const regex = new RegExp(pattern.wrong.source, pattern.wrong.flags);

      while ((match = regex.exec(text)) !== null) {
        mistakes.push({
          errorType: ERROR_TYPES.SPELLING,
          description: 'Spelling error',
          suggestion: `Correct spelling: "${pattern.correct}"`,
          positionStart: match.index,
          positionEnd: match.index + match[0].length,
          severity: SEVERITY_LEVELS.MAJOR,
          originalText: match[0],
          correctedText: pattern.correct,
          isPossibleError: false,
        });
      }
    });

    // Check for repetitive vocabulary
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFrequency = {};
    words.forEach((word) => {
      if (word.length > 4) {
        // Only count substantial words
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });

    Object.entries(wordFrequency).forEach(([word, count]) => {
      if (count > 5 && words.length > 50) {
        // Word used too frequently
        mistakes.push({
          errorType: ERROR_TYPES.VOCABULARY,
          description: `Word "${word}" is overused (${count} times)`,
          suggestion: 'Use synonyms for variety',
          severity: SEVERITY_LEVELS.MINOR,
          isPossibleError: true,
        });
      }
    });

    return mistakes;
  }

  /**
   * Detect quiz mistakes (incorrect answers)
   */
  async detectQuizMistakes(submission, evaluation) {
    const mistakes = [];
    const activity = await submission.populate('activityId');
    const questions = activity.activityId.questions;
    const answers = submission.content.answers;

    answers.forEach((studentAnswer, index) => {
      const question = questions[index];
      const isCorrect =
        studentAnswer.answer.toLowerCase().trim() ===
        question.correctAnswer.toLowerCase().trim();

      if (!isCorrect) {
        mistakes.push({
          errorType: ERROR_TYPES.LOGIC,
          description: `Incorrect answer to question ${index + 1}`,
          suggestion: `Correct answer: ${question.correctAnswer}`,
          severity: SEVERITY_LEVELS.MAJOR,
          originalText: studentAnswer.answer,
          correctedText: question.correctAnswer,
          isPossibleError: false,
        });
      }
    });

    return mistakes;
  }

  /**
   * Generate correction suggestion
   */
  generateCorrection(originalText, errorType) {
    // Simple correction suggestions based on error type
    const corrections = {
      'subject-verb agreement': originalText.replace(/\b(he|she|it)\s+(am|are)\b/gi, '$1 is'),
      'article usage': originalText.replace(/\ba\s+([aeiou])/gi, 'an $1'),
    };

    return corrections[errorType] || originalText;
  }

  /**
   * Detect recurring challenges (FR7)
   * Analyze patterns across multiple submissions
   */
  async detectChallenges(studentId, limit = 10) {
    try {
      // Get recent evaluations for student
      const submissions = await Submission.find({ studentId })
        .sort({ submittedAt: -1 })
        .limit(limit);

      const evaluationIds = await Promise.all(
        submissions.map(async (sub) => {
          const eval = await Evaluation.findOne({ submissionId: sub._id });
          return eval?._id;
        })
      );

      // Get all mistakes for these evaluations
      const mistakes = await Mistake.find({
        evaluationId: { $in: evaluationIds.filter((id) => id) },
      });

      // Analyze patterns
      const errorTypeCounts = {};
      const challengeAreas = [];

      mistakes.forEach((mistake) => {
        errorTypeCounts[mistake.errorType] = (errorTypeCounts[mistake.errorType] || 0) + 1;
      });

      // Identify recurring challenges (appears in 30%+ of submissions)
      const threshold = limit * 0.3;

      Object.entries(errorTypeCounts).forEach(([errorType, count]) => {
        if (count >= threshold) {
          challengeAreas.push({
            challengeType: errorType,
            frequency: count,
            percentage: Math.round((count / limit) * 100),
            severity: count >= threshold * 2 ? 'high' : 'medium',
            recommendation: this.getRecommendation(errorType),
          });
        }
      });

      logger.info(`Detected ${challengeAreas.length} recurring challenges for student ${studentId}`);

      return challengeAreas;
    } catch (error) {
      logger.error(`Challenge detection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get personalized recommendation based on challenge type
   */
  getRecommendation(errorType) {
    const recommendations = {
      [ERROR_TYPES.GRAMMAR]: 'Review grammar rules and practice with exercises',
      [ERROR_TYPES.VOCABULARY]: 'Expand vocabulary through reading and word lists',
      [ERROR_TYPES.PRONUNCIATION]: 'Practice pronunciation with audio resources',
      [ERROR_TYPES.SPELLING]: 'Use spell-check tools and memorize common patterns',
      [ERROR_TYPES.PUNCTUATION]: 'Study punctuation rules and apply consistently',
      [ERROR_TYPES.LOGIC]: 'Improve analytical thinking and problem-solving skills',
    };

    return recommendations[errorType] || 'Continue practicing and reviewing fundamentals';
  }
}

export default new MistakeDetectionService();
