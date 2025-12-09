// quiz.js
// Vanilla JS interactive quiz about Stoke City history.
// - Shuffle questions & choices
// - Keyboard support (1-4 to select, Enter to confirm, N for next)
// - Optional per-question timer
// - High score stored in localStorage

// Question data: text, 4 choices, index of correct (0-3), optional explanation
const QUESTIONS = [
  {
    text: "In what year was Stoke City (originally Stoke Ramblers) founded?",
    choices: ["1863", "1878", "1888", "1900"],
    correctIndex: 0,
    explanation: "Stoke City traces its origins to 1863 and is one of the oldest professional football clubs."
  },
  {
    text: "What is Stoke City's widely-known nickname?",
    choices: ["The Potters", "The Blades", "The Irons", "The Rams"],
    correctIndex: 0,
    explanation: "Stoke is known as 'The Potters' due to the area's pottery industry."
  },
  {
    text: "What are Stoke City's traditional home colours?",
    choices: ["Red and white stripes", "Blue and white halves", "Green and black", "Yellow and red hoops"],
    correctIndex: 0,
    explanation: "Stoke's classic kit features red and white vertical stripes."
  },
  {
    text: "Which legendary English winger began his professional career at Stoke and later returned to the club?",
    choices: ["Stanley Matthews", "Bobby Charlton", "Tom Finney", "Jimmy Greaves"],
    correctIndex: 0,
    explanation: "Sir Stanley Matthews started at Stoke and later returned; he's one of the club's icons."
  },
  {
    text: "Stoke City were founder members of which major football competition in 1888?",
    choices: ["The Football League", "The Premier League", "The FA Cup", "UEFA Cup"],
    correctIndex: 0,
    explanation: "Stoke was one of the 12 founder members of the Football League in 1888."
  },
  {
    text: "In which year did Stoke move from the Victoria Ground to the new stadium (then called the Britannia Stadium)?",
    choices: ["1997", "1986", "2005", "1972"],
    correctIndex: 0,
    explanation: "The club moved to the Britannia Stadium (now the bet365 Stadium) in 1997."
  },
  {
    text: "Stoke City won their first major domestic cup competition in which decade?",
    choices: ["1970s", "1950s", "1990s", "2010s"],
    correctIndex: 0,
    explanation: "Stoke's major domestic success came in the early 1970s."
  },
  {
    text: "Which former England goalkeeper was a Stoke City player and is remembered as part of the club's history?",
    choices: ["Gordon Banks", "Peter Shilton", "David Seaman", "Joe Hart"],
    correctIndex: 0,
    explanation: "Gordon Banks played for Stoke and is a legendary figure in English football."
  },
  {
    text: "What is the name of Stoke City's stadium as of the mid-2020s (sponsored name)?",
    choices: ["bet365 Stadium", "Old Trafford", "Anfield", "St James' Park"],
    correctIndex: 0,
    explanation: "The club's stadium is currently known as the bet365 Stadium."
  },
  {
    text: "Which local industry is most associated with Stoke's identity and nickname?",
    choices: ["Pottery (ceramics)", "Shipbuilding", "Textiles", "Mining"],
    correctIndex: 0,
    explanation: "Stoke-on-Trent is famous for pottery; the club's nickname 'The Potters' comes from that heritage."
  }
];

// ---- Utility functions ----
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function qs(sel){ return document.querySelector(sel) }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)) }

// ---- App state ----
let state = {
  questions: [],
  currentIndex: 0,
  score: 0,
  selectedChoice: null,
  timerEnabled: false,
  timerRemaining: 0,
  timerId: null
};

// ---- DOM refs ----
const startBtn = qs('#startBtn');
const restartBtn = qs('#restartBtn');
const playAgainBtn = qs('#playAgainBtn');
const nextBtn = qs('#nextBtn');
const questionText = qs('#questionText');
const choicesEl = qs('#choices');
const progressEl = qs('#progress');
const scoreEl = qs('#score');
const feedbackEl = qs('#feedback');
const quizSection = qs('#quiz');
const introSection = qs('#intro');
const summarySection = qs('#summary');
const summaryText = qs('#summaryText');
const finalScore = qs('#finalScore');
const timerToggle = qs('#timerToggle');
const timerEl = qs('#timer');
const highscoreEl = qs('#highscore');

// ---- Initialization ----
function init() {
  updateHighScoreUI();
  attachEvents();
}
function attachEvents() {
  startBtn.addEventListener('click', startQuiz);
  restartBtn.addEventListener('click', () => { resetAndStart() });
  playAgainBtn.addEventListener('click', resetAndStart);
  nextBtn.addEventListener('click', nextQuestion);

  timerToggle.addEventListener('change', (e) => {
    state.timerEnabled = e.target.checked;
  });

  // Keyboard shortcuts: 1-4 to select, Enter to confirm, N to next
  document.addEventListener('keydown', (e) => {
    if (quizSection.classList.contains('hidden')) return;
    const key = e.key;
    if (['1','2','3','4'].includes(key)) {
      const idx = parseInt(key,10) - 1;
      const choiceEl = choicesEl.children[idx];
      if (choiceEl) {
        // select but do NOT auto-submit (user can press Enter to confirm)
        selectChoice(choiceEl, idx, false);
      }
    } else if (key === 'Enter') {
      // If answer already revealed, Enter should move to next
      if (feedbackEl.dataset.revealed === "true") {
        nextQuestion();
      } else {
        // If a choice is selected, submit it
        if (state.selectedChoice !== null) {
          submitAnswer();
        }
      }
    } else if (key.toLowerCase() === 'n') {
      if (!nextBtn.disabled) nextQuestion();
    }
  });
}

function resetAndStart() {
  summarySection.classList.add('hidden');
  introSection.classList.remove('hidden');
  restartBtn.classList.add('hidden');
  startBtn.classList.remove('hidden');
  startQuiz();
}

function startQuiz() {
  state.questions = prepareQuestions();
  state.currentIndex = 0;
  state.score = 0;
  state.selectedChoice = null;
  state.timerEnabled = timerToggle.checked;
  state.timerRemaining = 0;
  updateScoreUI();

  introSection.classList.add('hidden');
  quizSection.classList.remove('hidden');
  restartBtn.classList.remove('hidden');
  startBtn.classList.add('hidden');
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  feedbackEl.dataset.revealed = "false";

  showQuestion();
}

function prepareQuestions(){
  const qCopy = QUESTIONS.map(q => ({
    text: q.text,
    explanation: q.explanation || '',
    choices: q.choices.map((c, idx) => ({ text: c, originalIndex: idx })),
    correctIndex: q.correctIndex
  }));
  const shuffled = shuffleArray(qCopy);
  for (const q of shuffled) {
    q.choices = shuffleArray(q.choices);
    q.correctIndex = q.choices.findIndex(c => c.originalIndex === q.correctIndex);
  }
  return shuffled;
}

function showQuestion() {
  clearTimer();
  const q = state.questions[state.currentIndex];
  const total = state.questions.length;
  progressEl.textContent = `Question ${state.currentIndex + 1} / ${total}`;
  questionText.textContent = q.text;

  choicesEl.innerHTML = '';
  q.choices.forEach((c, idx) => {
    const li = document.createElement('li');
    li.className = 'choice';
    li.tabIndex = 0;
    li.dataset.index = idx;

    li.innerHTML = `
      <div class="label">${idx+1}</div>
      <div class="text">${c.text}</div>
    `;

    // Click submits immediately for mouse users
    li.addEventListener('click', () => selectChoice(li, idx, true));

    // Keyboard on focused li - Enter/Space submits immediately
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectChoice(li, idx, true);
      }
    });

    choicesEl.appendChild(li);
  });

  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  feedbackEl.dataset.revealed = "false";
  nextBtn.disabled = true;
  state.selectedChoice = null;

  if (state.timerEnabled) {
    startTimer(20);
  } else {
    timerEl.textContent = '';
  }

  updateScoreUI();
}

function selectChoice(choiceEl, idx, autoSubmit = false) {
  qsa('.choice').forEach(el => el.classList.remove('selected'));
  choiceEl.classList.add('selected');
  state.selectedChoice = idx;
  choiceEl.focus();

  // If autoSubmit (mouse click or Enter on focused choice), submit immediately
  if (autoSubmit) {
    submitAnswer();
  }
}

function submitAnswer() {
  if (state.selectedChoice === null) return;
  const q = state.questions[state.currentIndex];
  const chosen = state.selectedChoice;
  const isCorrect = chosen === q.correctIndex;

  qsa('.choice').forEach((el, idx) => {
    el.classList.remove('selected');
    if (idx === q.correctIndex) el.classList.add('correct');
    if (idx === chosen && idx !== q.correctIndex) el.classList.add('incorrect');
    el.style.pointerEvents = 'none';
  });

  if (isCorrect) {
    state.score += 1;
    feedbackEl.textContent = `Correct! ${q.explanation || ''}`;
    feedbackEl.classList.add('correct');
  } else {
    const correctText = q.choices[q.correctIndex].text;
    feedbackEl.textContent = `Incorrect. Correct answer: "${correctText}". ${q.explanation || ''}`;
    feedbackEl.classList.add('incorrect');
  }
  feedbackEl.dataset.revealed = "true";
  nextBtn.disabled = false;
  updateScoreUI();
  clearTimer();

  if (state.currentIndex === state.questions.length - 1) {
    nextBtn.textContent = 'Finish';
  } else {
    nextBtn.textContent = 'Next (N)';
  }
}

function nextQuestion() {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex += 1;
    showQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  clearTimer();
  quizSection.classList.add('hidden');
  summarySection.classList.remove('hidden');
  summaryText.textContent = `You answered ${state.score} out of ${state.questions.length} correctly.`;
  finalScore.textContent = `Final score: ${state.score}`;

  const key = 'stoke_quiz_highscore_v1';
  const prev = Number(localStorage.getItem(key) || '0');
  if (state.score > prev) {
    localStorage.setItem(key, String(state.score));
    summaryText.textContent += ' New high score — well done!';
  }
  updateHighScoreUI();
}

function updateScoreUI(){
  scoreEl.textContent = `Score: ${state.score}`;
}

function updateHighScoreUI(){
  const key = 'stoke_quiz_highscore_v1';
  const prev = localStorage.getItem(key);
  highscoreEl.textContent = prev ? `High score: ${prev}` : 'No high score yet — be the first!';
}

// ---- Timer logic ----
function startTimer(seconds) {
  state.timerRemaining = seconds;
  timerEl.textContent = `Time: ${state.timerRemaining}s`;
  state.timerId = setInterval(() => {
    state.timerRemaining--;
    timerEl.textContent = `Time: ${state.timerRemaining}s`;
    if (state.timerRemaining <= 0) {
      clearTimer();
      if (state.selectedChoice === null) {
        feedbackEl.textContent = `Time's up!`;
        feedbackEl.classList.add('incorrect');
        const q = state.questions[state.currentIndex];
        qsa('.choice').forEach((el, idx) => {
          if (idx === q.correctIndex) el.classList.add('correct');
          el.style.pointerEvents = 'none';
        });
        feedbackEl.dataset.revealed = "true";
        nextBtn.disabled = false;
        nextBtn.textContent = (state.currentIndex === state.questions.length -1) ? 'Finish' : 'Next (N)';
      } else {
        submitAnswer();
      }
    }
  }, 1000);
}

function clearTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  timerEl.textContent = '';
}

// ---- Kick off ----
init();
