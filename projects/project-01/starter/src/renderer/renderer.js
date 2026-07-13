const docListEl = document.getElementById('doc-list');
const docTitleEl = document.getElementById('doc-title');
const docBodyEl = document.getElementById('doc-body');
const qaForm = document.getElementById('qa-form');
const qaInput = document.getElementById('qa-input');
const qaAnswersEl = document.getElementById('qa-answers');

async function loadDocumentList() {
  const documents = await window.api.listDocuments();
  docListEl.innerHTML = '';

  for (const doc of documents) {
    const li = document.createElement('li');
    li.textContent = doc.name;
    li.addEventListener('click', () => openDocument(doc.name));
    docListEl.appendChild(li);
  }
}

async function openDocument(name) {
  const content = await window.api.readDocument(name);
  docTitleEl.textContent = name;
  docBodyEl.textContent = content;
}

qaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = qaInput.value.trim();
  if (!question) return;

  qaAnswersEl.innerHTML = '<p class="loading">Searching...</p>';
  const results = await window.api.askQuestion(question);

  if (results.length === 0) {
    qaAnswersEl.innerHTML = '<p class="empty">No matching content found.</p>';
    return;
  }

  qaAnswersEl.innerHTML = '';
  for (const result of results) {
    const card = document.createElement('div');
    card.className = 'answer-card';
    card.innerHTML = `<div class="answer-source">${result.document}</div><div class="answer-snippet">${result.snippet}</div>`;
    qaAnswersEl.appendChild(card);
  }
});

loadDocumentList();
