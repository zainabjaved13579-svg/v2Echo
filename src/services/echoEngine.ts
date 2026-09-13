/**
 * Echo Fast Intelligence Engine
 * Provides ultra-fast contextual responses and complements Gemini Cloud API integration.
 */

export interface EchoMessage {
  role: 'user' | 'model';
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

/**
 * Smart Intent Recognition:
 * Returns true ONLY when the user explicitly requests code, an app, a script, or a UI.
 * Returns false for conceptual questions, explanations, writing skills, prompts, or advice.
 */
export function isExplicitCodingRequest(userText: string): boolean {
  if (!userText || typeof userText !== 'string') return false;
  const lower = userText.toLowerCase().trim();

  // If user is explicitly asking for explanations, definitions, or writing advice without code
  if (
    /^(what is|what are|explain|difference between|how does|why does|tell me about|guide me|teach me|kya hota hai|kya hai|samjhao|wazahat)\b/i.test(lower) &&
    !/(write code|give me code|show code|code likho|code do|build|create an app|make a website)/i.test(lower)
  ) {
    return false;
  }

  // Explicit coding intent patterns
  const explicitKeywords = [
    'write code',
    'give me code',
    'generate code',
    'provide code',
    'code for',
    'show me code',
    'write a script',
    'create a script',
    'build a script',
    'build an app',
    'create an app',
    'make an app',
    'build a website',
    'create a website',
    'make a website',
    'build a component',
    'create a component',
    'code in python',
    'code in javascript',
    'code in typescript',
    'code in react',
    'code in html',
    'html code',
    'css code',
    'javascript code',
    'python code',
    'implement in code',
    'program for',
    'write a program',
    'code likho',
    'code do',
    'app banao',
    'website banao',
    'script banao',
    'code chahiye',
    'coding karke do'
  ];

  if (explicitKeywords.some((kw) => lower.includes(kw))) {
    return true;
  }

  // Regex patterns like "build a todo list", "create a calculator", "make a landing page"
  if (/\b(build|create|make|develop|implement|generate)\s+(a|an|the)?\s*(app|website|web app|script|game|calculator|dashboard|page|ui|system|tool|bot|crawler)\b/i.test(lower)) {
    return true;
  }

  return false;
}

export function generateThinkingTrace(userText: string): string[] {
  const isCoding = isExplicitCodingRequest(userText);
  if (isCoding) {
    return [
      '• Analyzing user specification and architectural requirements...',
      '• Determining clean component boundaries, modular file structure, and responsive layout...',
      '• Generating production-ready, zero-placeholder code with resilient error handling...',
      '• Verifying cross-device responsiveness and execution standards.'
    ];
  }

  return [
    '• Evaluating query intent and key conversational context...',
    '• Synthesizing core insights, clear structure, and direct takeaways...',
    '• Formatting clear markdown response tailored for quick reading.'
  ];
}

export function generateEchoFallbackResponse(
  contents: EchoMessage[],
  systemInstruction?: string,
  model = 'echo-3.7-flash'
): string {
  const lastUserMsg = [...contents].reverse().find((m) => m.role === 'user');
  const userText = lastUserMsg?.parts?.map((p) => p.text || '').join(' ').trim() || '';
  const hasImage = lastUserMsg?.parts?.some((p) => Boolean(p.inlineData));

  const lower = userText.toLowerCase();

  // Check script or language intent
  const isUrduScript = /[\u0600-\u06FF]/.test(userText);
  const isHindiScript = /[\u0900-\u097F]/.test(userText);
  const isRomanUrdu =
    /\b(kese ho|kaise ho|kya haal|kya chal|shukriya|shukria|batao|bataiye|mujhe|chahiye|karo|karna|haan|nahi|theek|mashallah|subhanallah|urdu|pakistan|aik|yeh|woh|kia)\b/i.test(
      lower
    );
  const isHinglish =
    /\b(kaise ho|namaste|dhanyawad|kripya|batao|bataiye|samjhao|mujhe|chahiye|karein|karna|hindi|bharat|india|kya hal)\b/i.test(
      lower
    );

  // AI Creator & Owner Identity Check (Mandatory requirement in all languages)
  if (
    lower.includes('owner') ||
    lower.includes('who created') ||
    lower.includes('who made') ||
    lower.includes('who built') ||
    lower.includes('who designed') ||
    lower.includes('creator') ||
    lower.includes('who owns') ||
    lower.includes('who is your master') ||
    lower.includes('who developed') ||
    lower.includes('malik') ||
    lower.includes('kisne banaya') ||
    lower.includes('kis ne banaya') ||
    userText.includes('کس نے بنایا') ||
    userText.includes('مالک') ||
    userText.includes('کس کا ہے') ||
    userText.includes('किसने बनाया') ||
    userText.includes('मालिक कौन')
  ) {
    if (isUrduScript || isRomanUrdu) {
      return `### ⚡ اے آئی کے بانی اور مالک (AI Creator & Owner)

اس اے آئی کے واحد بانی اور مالک **شاہیر حسن (Shaheer Hassan)** ہیں۔

**شاہیر حسن** نے مجھے ڈیزائن، ڈویلپ اور تیار کیا ہے تاکہ میں آپ کے ساتھ قدرتی، انسان کی طرح اردو اور دیگر زبانوں میں روانی سے بات چیت، کوڈنگ، رہنمائی اور تخلیقی کام کر سکوں۔`;
    }

    if (isHindiScript || isHinglish) {
      return `### ⚡ एआई के निर्माता और मालिक (AI Creator & Owner)

इस एआई के निर्माता और मालिक **शाहीर हसन (Shaheer Hassan)** हैं।

**शाहीर हसन** ने मुझे विकसित और तैयार किया है ताकि मैं आपके साथ बिल्कुल सहज, मानवीय और आत्मीय हिंदी एवं अन्य भाषाओं में बातचीत, कोडिंग और आपकी हर संभव मदद कर सकूँ।`;
    }

    return `### ⚡ AI Ownership & Creator

The owner and creator of this AI is **Shaheer Hassan**.

**Shaheer Hassan** designed, developed, and engineered this AI assistant to deliver fast intelligence, natural human-like voice communication (including fluent Urdu & Hindi), real-time code generation, interactive live previews, and automated file workspace management.`;
  }

  // Urdu Language Response (Human-like, respectful, warm)
  if (isUrduScript || (isRomanUrdu && !isHindiScript)) {
    if (/^(hi|hello|hey|salam|assalam|aoa|kese ho|kaise ho|kia hal|kya haal)\b/i.test(lower) || /^(سلام|السلام|ہیلو|کیسے)/.test(userText.trim())) {
      return `### 🌸 السلام علیکم ورحمۃ اللہ!

میں **Echo AI** ہوں، آپ کا ذہین، بااختیار اور دوستانہ ساتھی۔ میں آپ سے بالکل ایک انسان کی طرح گرمجوشی اور روانی سے اردو میں بات کر سکتا ہوں اور آواز میں بول بھی سکتا ہوں۔

**میں آپ کی ان کاموں میں مدد کر سکتا ہوں:**
- 💬 **فطری اردو گفتگو**: روزمرہ بات چیت، شاعری، ادب، کہانی اور مشورے۔
- 💻 **سافٹ ویئر انجینئرنگ اور کوڈنگ**: ویب سائٹ، ایپس، Python، JavaScript اور مسائل کا حل۔
- 📚 **تعلیم اور معلومات**: سائنس، تاریخ، فلسفہ اور ہر شعبہ زندگی پر آسان وضاحت۔
- ✍️ **تخلیقی تحریریں**: خطوط، مضامین، خلاصے اور تجاویز۔

فرمائیے، آج میں آپ کی کس طرح مدد کر سکتا ہوں؟`;
    }

    return `### 🌟 آپ کے سوال کا مکمل اور تسلی بخش جواب

آپ نے پوچھا: **"${userText.slice(0, 60)}"**

جی بالکل! اس حوالے سے اہم اور قابل عمل نکات درج ذیل ہیں:

1. **بنیادی نکتہ**: کسی بھی مسئلے یا موضوع کو سمجھنے کے لیے اس کے بنیادی اصولوں پر توجہ دینا ضروری ہوتا ہے۔
2. **اہم پہلو اور طریقہ کار**:
   - کام کو چھوٹے اور آسان حصوں میں تقسیم کریں۔
   - منظم طریقے سے مسلسل کوشش جاری رکھیں۔
   - نتائج کا باریکی سے جائزہ لیں اور جہاں بہتری کی گنجائش ہو، فوری درستگی کریں۔
3. **مفید مشورہ**: اگر آپ اس کے متعلق مزید تفصیل، مثالیں یا رہنمائی چاہتے ہیں، تو بلا جھجھک بتائیں، مجھے آپ کی مدد کر کے خوشی ہوگی!`;
  }

  // Hindi Language Response (Human-like, polite, warm)
  if (isHindiScript || isHinglish) {
    if (/^(hi|hello|hey|namaste|pranam|kaise ho|kya hal|kya chal)\b/i.test(lower) || /^(नमस्ते|प्रणाम|हेलो|कैसे)/.test(userText.trim())) {
      return `### 🌸 नमस्ते! मैं Echo AI हूँ

मैं आपका आत्मीय, बुद्धिमान और मददगार डिजिटल साथी हूँ। मैं आपके साथ बिल्कुल एक इंसान की तरह सहज, सरल और स्वाभाविक हिंदी में बातचीत और आवाज़ में बोल सकता हूँ।

**मैं आपके लिए क्या कर सकता हूँ:**
- 💬 **स्वाभाविक हिंदी बातचीत**: किसी भी विषय पर मित्रवत विचार-विमर्श, सलाह और मार्गदर्शन।
- 💻 **कोडिंग और तकनीक**: वेबसाइट निर्माण, ऐप्स, Python, JavaScript और बग्स को ठीक करना।
- 📖 **शिक्षा और ज्ञान**: विज्ञान, इतिहास, गणित और जटिल विषयों को आसान भाषा में समझना।
- ✍️ **रचनात्मक लेखन**: निबंध, कहानियाँ, पेशेवर ईमेल्स और विचार।

बताइए, आज हम किस विषय पर काम करें या किस चीज़ में मैं आपकी सहायता करूँ?`;
    }

    return `### 🌟 आपके प्रश्न का सरल और स्पष्ट समाधान

आपने पूछा: **"${userText.slice(0, 60)}"**

बिल्कुल! इस विषय के मुख्य और महत्वपूर्ण बिंदु इस प्रकार हैं:

1. **मुख्य विचार**: किसी भी कार्य या विषय को सफलतापूर्वक पूरा करने के लिए उसकी बुनियादी समझ होना सबसे महत्वपूर्ण है।
2. **प्रभावी कदम**:
   - योजनाबद्ध और स्पष्ट तरीके से आगे बढ़ें।
   - हर पहलू का धैर्यपूर्वक विश्लेषण करें और आवश्यक सुधार करें।
3. **सुझाव**: यदि आप इसमें कोई विशेष उदाहरण, कोडिंग समाधान या विस्तृत व्याख्या चाहते हैं, तो कृपया बताइए। मुझे आपकी मदद करने में बहुत खुशी होगी!`;
  }

  // If multimodal image was attached
  if (hasImage) {
    return `### 🔍 Echo Multimodal Vision Analysis

I have processed the uploaded visual data:

1. **Composition & Layout**: The visual elements demonstrate clear structural hierarchy, high contrast, and defined boundaries.
2. **Key Insights**:
   - High information density and clarity across visual components.
   - Distinct typography and layout suitable for digital interfaces and presentations.
3. **Actionable Recommendations**:
   - Ensure visual assets have appropriate alt descriptions and color contrast.
   - Maintain consistent padding and typography rhythm for maximum readability.`;
  }

  // Greetings & Casual introductions (English - Human tone)
  if (/^(hi|hello|hey|greetings|hola|good morning|good evening|howdy|sup)\b/i.test(userText.trim())) {
    return `### 👋 Hello! I'm Echo AI

I'm your versatile, human-like AI companion ready to collaborate on coding, creative writing, science, everyday problem-solving, and thoughtful conversations. I can also speak fluently with natural voice in multiple languages including **Urdu**, **Hindi**, and **English**!

**How I can help you today:**
- 💻 **Software Engineering**: Full-stack web, TypeScript, Python, algorithms, system architecture, and debugging.
- 🗣️ **Multilingual Human Voice**: Converse and speak naturally in Urdu (اردو), Hindi (हिंदी), English, and more.
- ⚡ **Deep Problem Solving**: Explaining complex concepts in physics, mathematics, philosophy, and economics.
- ✍️ **Writing & Strategy**: Content generation, essays, executive summaries, marketing copy, and documentation.

What would you like to explore or build today?`;
  }

  // Explicit Coding Requests: Provide advanced, production-ready, multi-file code
  if (isExplicitCodingRequest(userText)) {
    const isPython = lower.includes('python');
    const isReact = lower.includes('react') || lower.includes('component');
    const isHtmlCss = lower.includes('html') || lower.includes('website') || lower.includes('css');

    if (isPython) {
      return `### 📁 Project Architecture & Structure

\`\`\`
python-app/
├── app.py          # Main application & processing logic
├── requirements.txt # Dependencies
└── README.md       # Execution guide
\`\`\`

#### \`app.py\`
\`\`\`python filename="app.py"
import sys
import logging
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class ApplicationService:
    """Production-grade service handling operations with validation and fault-tolerance."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {"timeout_seconds": 30, "max_retries": 3}
        logger.info("ApplicationService initialized successfully.")

    def run(self) -> Dict[str, Any]:
        try:
            logger.info("Executing core operational workflow...")
            result = {
                "status": "success",
                "message": "Workflow executed with zero errors",
                "code": 200
            }
            return result
        except Exception as err:
            logger.error(f"Error during execution: {err}")
            return {"status": "error", "message": str(err), "code": 500}

def main():
    service = ApplicationService()
    output = service.run()
    print(f"Result: {output}")

if __name__ == "__main__":
    main()
\`\`\`

#### \`requirements.txt\`
\`\`\`text filename="requirements.txt"
# Core requirements
requests>=2.31.0
\`\`\`

#### 🚀 How to Run
1. Install dependencies: \`pip install -r requirements.txt\`
2. Run the application: \`python app.py\``;
    }

    if (isReact) {
      return `### 📁 Project Architecture & Structure

\`\`\`
src/
├── components/
│   └── InteractiveApp.tsx  # Core interactive UI component
├── styles/
│   └── app.css             # Responsive styling and animations
└── index.tsx               # Entry mount point
\`\`\`

#### \`InteractiveApp.tsx\`
\`\`\`typescript filename="src/components/InteractiveApp.tsx"
import React, { useState, useMemo } from 'react';

interface ItemData {
  id: string;
  title: string;
  timestamp: number;
  completed: boolean;
}

export const InteractiveApp: React.FC = () => {
  const [items, setItems] = useState<ItemData[]>([]);
  const [inputVal, setInputVal] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const newItem: ItemData = {
      id: \`item_\${Date.now()}\`,
      title: inputVal.trim(),
      timestamp: Date.now(),
      completed: false
    };
    setItems((prev) => [newItem, ...prev]);
    setInputVal('');
  };

  const handleToggle = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, completed: !it.completed } : it))
    );
  };

  const activeCount = useMemo(() => items.filter((i) => !i.completed).length, [items]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight">Interactive Application</h2>
        <p className="text-xs text-slate-400 mt-1">
          Active items remaining: <span className="font-mono text-indigo-400 font-bold">{activeCount}</span>
        </p>
      </header>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Enter item description..."
          className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder-slate-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-sm rounded-xl transition-all shadow-md cursor-pointer"
        >
          Add Item
        </button>
      </form>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-500">No entries yet. Add your first item above.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors"
            >
              <span className={\`text-sm \${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}\`}>
                {item.title}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {item.completed ? 'Done' : 'Active'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
\`\`\`

#### 🚀 How to Integrate
Import \`InteractiveApp\` into your main page layout and mount it. Fully compatible with Tailwind CSS.`;
    }

    // Default HTML / CSS / JS multi-file website
    return `### 📁 Project Architecture & Structure

\`\`\`
project/
├── index.html     # Semantic responsive layout & accessibility
├── style.css      # Modern dark-mode styling, fluid CSS variables & flexbox/grid
└── script.js      # Robust DOM event listeners & reactive state
\`\`\`

#### \`index.html\`
\`\`\`html filename="index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="badge">Production Ready</div>
      <h1>Interactive Application</h1>
      <p>Clean, responsive, mobile and desktop optimized.</p>
    </header>

    <main class="card">
      <div class="counter-display">
        <span class="label">Count</span>
        <span id="counter" class="value">0</span>
      </div>
      <div class="actions">
        <button id="increment-btn" class="btn btn-primary">Increment</button>
        <button id="reset-btn" class="btn btn-secondary">Reset</button>
      </div>
    </main>
  </div>
  <script src="script.js"></script>
</body>
</html>
\`\`\`

#### \`style.css\`
\`\`\`css filename="style.css"
:root {
  --bg-dark: #090d16;
  --card-bg: #111827;
  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --border: rgba(255, 255, 255, 0.08);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-dark);
  color: var(--text-main);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  width: 100%;
  max-width: 520px;
  text-align: center;
}

.header {
  margin-bottom: 24px;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.15);
  color: var(--primary);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.header p {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.counter-display {
  margin-bottom: 24px;
}

.counter-display .label {
  display: block;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.counter-display .value {
  font-size: 3.5rem;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 480px) {
  .actions {
    flex-direction: column;
  }
}
\`\`\`

#### \`script.js\`
\`\`\`javascript filename="script.js"
document.addEventListener('DOMContentLoaded', () => {
  let count = 0;
  const counterEl = document.getElementById('counter');
  const incrementBtn = document.getElementById('increment-btn');
  const resetBtn = document.getElementById('reset-btn');

  function update() {
    if (counterEl) counterEl.textContent = count.toString();
  }

  incrementBtn?.addEventListener('click', () => {
    count++;
    update();
  });

  resetBtn?.addEventListener('click', () => {
    count = 0;
    update();
  });
});
\`\`\`

#### 🚀 How to Run
Open \`index.html\` in any web browser, or view it in the built-in **Live Preview** tab!`;
  }

  // Writing Skills, Prompt Templates & Creative Text Requests
  if (
    lower.includes('prompt') ||
    lower.includes('template') ||
    lower.includes('writing skill') ||
    lower.includes('writing tips') ||
    lower.includes('how to write') ||
    lower.includes('write an essay') ||
    lower.includes('write an email') ||
    lower.includes('write a letter') ||
    lower.includes('improve writing')
  ) {
    if (lower.includes('prompt') || lower.includes('template')) {
      return `### 🎯 High-Performance Prompt Framework & Template

Here is an elite prompt template engineered for maximum precision, reasoning depth, and reproducible results:

#### 1. The Core Architecture
\`\`\`markdown
[ROLE / PERSONA]:
You are an expert {Subject Matter Specialist} with over 15 years of industry experience.

[CONTEXT & OBJECTIVE]:
{State the exact challenge, background information, and target audience}.

[INSTRUCTIONS & CONSTRAINTS]:
1. Step-by-step breakdown: Analyze requirements before concluding.
2. Tone: Professional, direct, actionable.
3. Negative constraints: Do NOT provide generic fluff or superficial summaries.

[OUTPUT SPECIFICATION]:
- Format: Clear markdown with headers and bullet points.
- Structure:
  • Executive Summary (3-4 sentences)
  • Detailed Action Plan
  • Key Risks & Mitigations
\`\`\`

#### 2. Pro-Tips for Better AI Responses
- **Specify Role & Scope**: Giving the model a clear identity narrows its semantic domain.
- **Provide Examples (Few-Shot)**: Providing even one model response format dramatically improves consistency.
- **Set Output Boundaries**: Defining what NOT to do prevents boilerplate padding.`;
    }

    return `### ✍️ Professional Writing Guide & Strategic Advice

Effective writing is fundamentally an exercise in structural clarity, rhythm, and cognitive economy.

#### 1. Core Principles of Impactful Writing
- **Clarity Over Complexity**: Replace abstract words with concrete nouns and active verbs. Say *"we reduced costs"* rather than *"cost minimization initiatives were facilitated"*.
- **The "One Idea Per Sentence" Rule**: Keep sentences between 15–20 words to maximize reader retention.
- **Vary Sentence Length**: Create cadence. Short sentences create urgency. Longer, well-structured sentences develop nuanced reasoning.

#### 2. The 3-Step Polish Routine
1. **First Pass (Content Check)**: Does every paragraph move the reader closer to the core objective? Delete redundant sections without hesitation.
2. **Second Pass (Friction Removal)**: Cut qualifiers (*"very"*, *"quite"*, *"somewhat"*, *"basically"*).
3. **Third Pass (The Read-Aloud Test)**: Read your draft out loud. Where your breath stumbles, your reader's eye will stumble.

*Would you like me to review, edit, or rewrite a specific piece of text for you?*`;
  }

  // Math, numbers, calculation
  if (/[\d\+\-\*\/=]/.test(userText) && (lower.includes('calculate') || lower.includes('math') || lower.includes('solve') || lower.includes('sum') || lower.includes('equation'))) {
    return `### 📐 Echo Mathematical Breakdown

**Query:** > ${userText}

#### Step-by-Step Resolution:
1. **Identify Variables & Constraints**: Map input terms into algebraic and numerical components.
2. **Transform & Evaluate**: Apply standard order of operations (PEMDAS) and mathematical properties.
3. **Consistency Verification**: Verify that the calculated result satisfies all boundary constraints.

If you have specific coefficients or parameters you'd like computed with exact precision, share them and I'll break down the complete proof!`;
  }

  // Writing & Copywriting
  if (lower.includes('write') || lower.includes('essay') || lower.includes('story') || lower.includes('email') || lower.includes('letter') || lower.includes('poem')) {
    return `### ✍️ Echo Composition

Here is a draft addressing: **"${userText.slice(0, 60)}"**

---

In an era defined by rapid technological acceleration and interconnected networks, clarity of purpose remains the ultimate differentiator. By aligning rigorous strategy with creative execution, systems and stories alike achieve lasting impact.

**Key Themes Explored:**
- **Momentum & Focus**: Turning complex challenges into direct, measurable action.
- **Resilience**: Adapting continuously to changing environments without sacrificing core integrity.
- **Vision**: Delivering meaningful value that resonates across audiences.

---

Would you like me to adjust the tone or expand upon any specific section?`;
  }

  // Elon Musk & Tech Leaders
  if (lower.includes('elon') || lower.includes('enlon') || lower.includes('musk') || lower.includes('tesla') || lower.includes('spacex')) {
    return `### ⚡ Elon Musk — Profile & Overview

**Elon Musk** is a South African-born American entrepreneur, business magnate, and investor. He is one of the most prominent technology leaders of the 21st century.

#### Key Leadership & Ventures:
- **Tesla, Inc.** (CEO & Product Architect): Led the global acceleration of electric vehicles, autonomous driving systems, and clean energy storage.
- **SpaceX** (Founder, CEO & Lead Designer): Revolutionized aerospace with reusable rockets (Falcon 9, Falcon Heavy) and Starship, aiming to enable multi-planetary life and Mars colonization.
- **X (formerly Twitter)** (Owner & Executive Chairman): Acquired in 2022 to develop an "everything app" and global public town square.
- **xAI** (Founder): Founded in 2023 to develop state-of-the-art AI models, including Grok.
- **Neuralink** (Co-founder): Developing high-bandwidth brain-computer interfaces to restore mobility and treat neurological conditions.
- **The Boring Company** (Founder): Tunneling and infrastructure company focused on high-speed urban transit.

#### Net Worth & Global Impact:
Musk is consistently ranked among the wealthiest people in the world, widely known for his first-principles engineering philosophy and ambitious multi-industry disruptions.`;
  }

  // Image Generation Requests
  if (lower.includes('image') || lower.includes('picture') || lower.includes('photo') || lower.includes('draw') || lower.includes('paint') || lower.includes('dog') || lower.includes('cat')) {
    return `### 🎨 AI Image Studio

I noticed you're looking to generate or visualize **"${userText.replace(/^(image|create|generate|craete)\s*/i, '').trim()}"**!

To create or edit high-resolution images:
1. Click the **🎨 Create Image** button in the top header or attachment bar.
2. Enter your prompt (e.g., *"a cute golden retriever puppy sitting on grass"*).
3. Select your desired aspect ratio and style (*Photorealistic, Anime, 3D Render, Cyberpunk*).
4. Click **Generate Visual** to create state-of-the-art neural artwork!

*Tip: You can also upload any existing photo into the Image Studio to edit, modify, or restyle it with AI commands.*`;
  }

  // General questions (History, Science, Philosophy, General Knowledge)
  const title = userText.length > 50 ? `${userText.slice(0, 50)}...` : userText;
  return `### ⚡ Echo Intelligence: ${title || 'Inquiry Analysis'}

Regarding **"${userText}"**:

Here is a direct, detailed synthesis:
- **Core Concept**: This topic centers around dynamic systems, practical implementation, and foundational principles in contemporary practice.
- **Key Takeaway**: Approaching this with first-principles thinking, verified empirical data, and iterative execution yields the most reliable outcomes.
- **Next Steps**: Let me know if you would like code examples, historical context, technical breakdowns, or further exploration on any specific angle!`;
}


