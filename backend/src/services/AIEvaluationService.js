import Evaluation from '../models/Evaluation.js';
import Submission from '../models/Submission.js';
import EvaluationRepository from '../repositories/EvaluationRepository.js';
import SubmissionRepository from '../repositories/SubmissionRepository.js';
import MistakeDetectionService from './MistakeDetectionService.js';
import FeedbackGenerationService from './FeedbackGenerationService.js';
import NotificationService from './NotificationService.js';
import { SUBMISSION_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Mock AI Evaluation Service (FR5)
 * Rule-based evaluation system simulating AI assessment
 */
class AIEvaluationService {
  /**
   * Evaluate a submission
   */
  async evaluateSubmission(submissionId) {
    try {
      // Update submission status
      await SubmissionRepository.updateStatus(submissionId, SUBMISSION_STATUS.EVALUATING);

      const submission = await SubmissionRepository.findById(submissionId);

      if (!submission) {
        throw new Error('Submission not found');
      }

      let evaluationData;

      // Route to appropriate evaluation based on content type
      switch (submission.contentType) {
        case 'speaking':
          evaluationData = await this.evaluateSpeaking(submission);
          break;
        case 'writing':
          evaluationData = await this.evaluateWriting(submission);
          break;
        case 'quiz':
          evaluationData = await this.evaluateQuiz(submission);
          break;
        default:
          throw new Error(`Unknown content type: ${submission.contentType}`);
      }

      // Create evaluation record
      const evaluation = await EvaluationRepository.create({
        submissionId: submission._id,
        ...evaluationData,
      });

      // Detect mistakes (FR6)
      await MistakeDetectionService.detectMistakes(evaluation._id);

      // Generate feedback (FR8)
      await FeedbackGenerationService.generateFeedback(evaluation._id);

      // Update submission status to completed
      await SubmissionRepository.updateStatus(submissionId, SUBMISSION_STATUS.COMPLETED);

      // Send notification
      await NotificationService.notifyEvaluationCompleted(submission.studentId, evaluation._id);

      logger.info(`Evaluation completed for submission ${submission.submissionId}`);

      return evaluation;
    } catch (error) {
      logger.error(`Evaluation failed for submission ${submissionId}: ${error.message}`);

      // Update submission status to failed
      await SubmissionRepository.updateStatus(submissionId, SUBMISSION_STATUS.FAILED);

      throw error;
    }
  }

  /**
   * Evaluate speaking submission
   * Mock pronunciation, fluency, vocabulary assessment
   */
  async evaluateSpeaking(submission) {
    const content = submission.content;

    // Mock pronunciation score (based on duration and random factors)
    const durationScore = Math.min(100, (content.duration / 120) * 50 + 30); // Longer = better
    const pronunciationScore = Math.round(
      durationScore * (0.8 + Math.random() * 0.2) // Add randomness
    );

    // Mock vocabulary score
    const vocabularyScore = Math.round(60 + Math.random() * 35);

    // Mock grammar score (for transcript if available)
    const grammarScore = content.transcript
      ? await this.calculateGrammarScore(content.transcript)
      : Math.round(65 + Math.random() * 30);

    // Calculate overall score
    const overallScore = Math.round(
      pronunciationScore * 0.4 + vocabularyScore * 0.3 + grammarScore * 0.3
    );

    return {
      overallScore,
      pronunciationScore,
      vocabularyScore,
      grammarScore,
      aiConfidence: 0.75 + Math.random() * 0.2, // 0.75-0.95
      evaluatedAt: new Date(),
      scoreBreakdown: {
        fluency: Math.round(70 + Math.random() * 25),
        clarity: pronunciationScore,
        pace: Math.round(65 + Math.random() * 30),
      },
    };
  }

  /**
   * Evaluate writing submission
   * Mock grammar, vocabulary, structure assessment
   */
  async evaluateWriting(submission) {
    const text = submission.content.text;
    const wordCount = submission.content.wordCount;

    // Grammar score based on common error patterns
    const grammarScore = await this.calculateGrammarScore(text);

    // Vocabulary score based on word diversity and complexity
    const vocabularyScore = this.calculateVocabularyScore(text, wordCount);

    // Structure score based on length and paragraphs
    const structureScore = this.calculateStructureScore(text, wordCount);

    // Calculate overall score
    const overallScore = Math.round(
      grammarScore * 0.4 + vocabularyScore * 0.35 + structureScore * 0.25
    );

    return {
      overallScore,
      grammarScore,
      vocabularyScore,
      aiConfidence: 0.85 + Math.random() * 0.12, // 0.85-0.97
      evaluatedAt: new Date(),
      scoreBreakdown: {
        structure: structureScore,
        coherence: Math.round(70 + Math.random() * 25),
        mechanics: grammarScore,
        creativity: Math.round(65 + Math.random() * 30),
      },
    };
  }

  /**
   * Evaluate quiz submission
   * Exact and fuzzy answer matching
   */
  async evaluateQuiz(submission) {
    const activity = await submission.populate('activityId');
    const questions = activity.activityId.questions;
    const answers = submission.content.answers;

    let correctCount = 0;
    let partialCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    // Evaluate each answer
    answers.forEach((studentAnswer, index) => {
      const question = questions[index];
      totalPoints += question.points || 1;

      const score = this.evaluateAnswer(
        studentAnswer.answer,
        question.correctAnswer,
        question.questionType
      );

      if (score === 1) {
        correctCount++;
        earnedPoints += question.points || 1;
      } else if (score > 0) {
        partialCount++;
        earnedPoints += score * (question.points || 1);
      }
    });

    const logicScore = Math.round((earnedPoints / totalPoints) * 100);
    const overallScore = logicScore;

    return {
      overallScore,
      logicScore,
      aiConfidence: 0.95, // High confidence for quiz
      evaluatedAt: new Date(),
      scoreBreakdown: {
        correctAnswers: correctCount,
        partialCredit: partialCount,
        totalQuestions: questions.length,
        accuracy: Math.round((correctCount / questions.length) * 100),
      },
    };
  }

  /**
   * Calculate grammar score using rule-based error detection
   */
  async calculateGrammarScore(text) {
    // Common grammar error patterns
    const grammarRules = [
      { pattern: /\b(he|she|it)\s+(am|are)\b/gi, weight: 3 }, // Subject-verb agreement
      { pattern: /\b(I|you|we|they)\s+is\b/gi, weight: 3 },
      { pattern: /\ba\s+[aeiou]/gi, weight: 2 }, // Article usage
      { pattern: /\ban\s+[^aeiou]/gi, weight: 2 },
      { pattern: /\bthere\s+is\s+\w+\s+(are|were)\b/gi, weight: 2 },
      { pattern: /\b(don't|doesn't|didn't)\s+\w+ed\b/gi, weight: 3 }, // Double negatives
      { pattern: /\s{2,}/g, weight: 1 }, // Extra spaces
      { pattern: /[a-z]\.[A-Z]/g, weight: 2 }, // Missing space after period
    ];

    let errorCount = 0;
    let totalWeight = 0;

    grammarRules.forEach((rule) => {
      const matches = text.match(rule.pattern);
      if (matches) {
        errorCount += matches.length * rule.weight;
        totalWeight += rule.weight;
      }
    });

    // Calculate score: fewer errors = higher score
    const baseScore = 100;
    const deduction = Math.min(40, errorCount * 2); // Max 40 points deduction

    return Math.max(60, baseScore - deduction);
  }

  /**
   * Calculate vocabulary score
   */
  calculateVocabularyScore(text, wordCount) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);

    // Lexical diversity (unique words / total words)
    const lexicalDiversity = uniqueWords.size / wordCount;

    // Check for advanced vocabulary (words > 7 letters)
    const advancedWords = words.filter((word) => word.length > 7).length;
    const advancedRatio = advancedWords / wordCount;

    // Base score
    let score = 60;

    // Add points for diversity (max 25 points)
    score += lexicalDiversity * 50;

    // Add points for advanced vocabulary (max 15 points)
    score += advancedRatio * 100;

    return Math.round(Math.min(95, score));
  }

  /**
   * Calculate structure score
   */
  calculateStructureScore(text, wordCount) {
    // Count paragraphs
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    // Count sentences
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;

    let score = 60;

    // Length adequacy (100-500 words ideal)
    if (wordCount >= 100 && wordCount <= 500) {
      score += 15;
    } else if (wordCount >= 50 && wordCount < 100) {
      score += 10;
    }

    // Paragraph structure (2-5 paragraphs ideal)
    if (paragraphCount >= 2 && paragraphCount <= 5) {
      score += 15;
    } else if (paragraphCount >= 1) {
      score += 8;
    }

    // Sentence variety
    const avgSentenceLength = wordCount / sentenceCount;
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) {
      score += 10;
    }

    return Math.round(Math.min(95, score));
  }

  /**
   * Evaluate quiz answer
   */
  evaluateAnswer(studentAnswer, correctAnswer, questionType) {
    if (questionType === 'multiple-choice' || questionType === 'true-false') {
      // Exact match
      return studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim() ? 1 : 0;
    }

    if (questionType === 'short-answer') {
      // Fuzzy matching using Levenshtein-like similarity
      const similarity = this.calculateStringSimilarity(
        studentAnswer.toLowerCase().trim(),
        correctAnswer.toLowerCase().trim()
      );

      if (similarity >= 0.9) return 1; // Full credit
      if (similarity >= 0.7) return 0.75; // Partial credit
      if (similarity >= 0.5) return 0.5; // Half credit
      return 0;
    }

    return 0;
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance algorithm
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Batch evaluate pending submissions
   */
  async startBatchEvaluation(limit = 10) {
    const pendingSubmissions = await SubmissionRepository.findPending(limit);

    logger.info(`Starting batch evaluation for ${pendingSubmissions.length} submissions`);

    const results = [];

    for (const submission of pendingSubmissions) {
      try {
        const evaluation = await this.evaluateSubmission(submission._id);
        results.push({ submissionId: submission._id, success: true, evaluation });
      } catch (error) {
        logger.error(`Batch evaluation failed for ${submission._id}: ${error.message}`);
        results.push({ submissionId: submission._id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Retry failed evaluation
   */
  async retryEvaluation(submissionId) {
    logger.info(`Retrying evaluation for submission ${submissionId}`);
    return await this.evaluateSubmission(submissionId);
  }
}

export default new AIEvaluationService();
