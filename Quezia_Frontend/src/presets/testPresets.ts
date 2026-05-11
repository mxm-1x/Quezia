import { type TestInstructionsPreset } from '../components/Dashboard/Tests/preview/TestPreviewRulesCard'

export const JEE_FULL_MOCK_PRESET: TestInstructionsPreset = {
  title: 'JEE Full Mock Test',
  subtitle: 'Simulated under real exam conditions',
  duration: '3 Hours',
  sections: ['Physics', 'Chemistry', 'Mathematics'],
  marking: {
    correct: '+4 marks',
    incorrect: '−1 mark (MCQs only)',
    unattempted: '0 marks',
  },
  rules: [
    'All questions are compulsory unless stated otherwise.',
    'Only one option is correct for multiple-choice questions.',
    'No negative marking applies to numerical value questions.',
    'You may navigate freely between questions.',
    'Answers can be changed before final submission.',
    'The test will auto-submit when the timer ends.',
    'Avoid refreshing or leaving the test window.',
  ],
  queziaNote:
    'Quezia will analyze accuracy, time distribution, and conceptual gaps after submission.',
}

export const CUSTOM_TEST_PRESET: TestInstructionsPreset = {
  title: 'Custom Test',
  duration: '30 mins',
  marking: {
    correct: '+4 marks',
    incorrect: '−1 mark',
    unattempted: '0 marks',
  },
  rules: [
    'All questions are compulsory.',
    'You may navigate freely between questions.',
    'Answers can be changed before final submission.',
  ],
  queziaNote:
    'Quezia will analyze your performance after submission.',
}
