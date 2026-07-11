import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { QaAnswer } from '../../shared/types';

export function QuestionPanel() {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<QaAnswer[]>([]);
  const [asked, setAsked] = useState(false);

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed) return;
    const results = await window.knowledgeBase.qa.ask(trimmed);
    setAnswers(results);
    setAsked(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      handleAsk();
    }
  }

  return (
    <section className="question-panel">
      <div className="question-input-row">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your documents..."
        />
        <button onClick={handleAsk}>Ask</button>
      </div>
      {asked && answers.length === 0 && <p className="empty-state">No matching content found.</p>}
      {answers.map((answer, index) => (
        <div className="answer-card" key={`${answer.documentId}-${index}`}>
          <div className="answer-source">{answer.documentName}</div>
          <div className="answer-snippet">{answer.snippet}</div>
        </div>
      ))}
    </section>
  );
}
