import { useState, useMemo, useEffect } from 'react'
import './App.css'
import { tools, formulas as initialFormulas } from './data'
import type { Formula } from './data'
import { generateCheatSheet, translateCode, refineCheatSheet } from './geminiService'

function App() {
  const [appMode, setAppMode] = useState<'search' | 'translate'>('search')
  const [selectedTool, setSelectedTool] = useState<string>(tools[0].id)
  const [sourceTool, setSourceTool] = useState<string>(tools[1].id)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash')
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceCode, setSourceCode] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [dynamicFormulas, setDynamicFormulas] = useState<Formula[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestAiResultId, setLatestAiResultId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('analyst_copilot_dynamic_formulas');
    if (saved) {
      try {
        setDynamicFormulas(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved formulas", e);
      }
    }
  }, []);

  // Save to LocalStorage whenever dynamicFormulas changes
  useEffect(() => {
    localStorage.setItem('analyst_copilot_dynamic_formulas', JSON.stringify(dynamicFormulas));
  }, [dynamicFormulas]);

  const activeTool = useMemo(() => 
    tools.find(t => t.id === selectedTool) || tools[0]
  , [selectedTool])

  const allFormulas = useMemo(() => {
    return [...initialFormulas, ...dynamicFormulas]
  }, [dynamicFormulas])

  const filteredFormulas = useMemo(() => {
    const query = submittedQuery.trim().toLowerCase();

    // In rest state (no query), show only favorites for the active tool
    if (!query) {
      return allFormulas.filter(f => f.toolId === selectedTool && f.isFavorite);
    }

    const queryWords = query.split(/\s+/).filter(w => w.length > 1);

    const results = allFormulas.filter(f => {
      if (f.toolId !== selectedTool) return false;

      const content = `${f.name} ${f.concept} ${f.category} ${f.syntax} ${f.explanation}`.toLowerCase();

      // If query is one word, use simple includes
      let matches = false;
      if (queryWords.length <= 1) {
        matches = content.includes(query);
      } else {
        matches = queryWords.every(word => content.includes(word)) || content.includes(query);
      }

      return matches;
    });

    // Handle typo correction: If a new AI result was just added and doesn't appear
    // in the filtered list, it's likely due to a typo. Add it to the results.
    if (latestAiResultId && !results.some(f => f.id === latestAiResultId)) {
      const newCard = allFormulas.find(f => f.id === latestAiResultId);
      if (newCard) {
        results.unshift(newCard); // Prepend the AI result
      }
    }

    return results.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
  }, [selectedTool, submittedQuery, allFormulas, latestAiResultId])

  const toggleFavorite = (id: string) => {
    if (dynamicFormulas.some(f => f.id === id)) {
      setDynamicFormulas(prev => prev.map(f => 
        f.id === id ? { ...f, isFavorite: !f.isFavorite } : f
      ));
    } else {
      const formula = initialFormulas.find(f => f.id === id);
      if (formula) {
        setDynamicFormulas(prev => [...prev, { ...formula, isFavorite: true }]);
      }
    }
  };

  const deleteFormula = (id: string) => {
    setDynamicFormulas(prev => prev.filter(f => f.id !== id));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setLatestAiResultId(null);
    setSubmittedQuery(query);
    setError(null);

    // Check if we have local results first
    const findLocalMatch = (q: string) => allFormulas.some(f => {
      const matchesTool = f.toolId === selectedTool
      const matchesSearch =
        f.name.toLowerCase().includes(q.toLowerCase()) ||
        f.concept.toLowerCase().includes(q.toLowerCase()) ||
        f.category.toLowerCase().includes(q.toLowerCase())
      return matchesTool && matchesSearch;
    });

    const hasLocalResults = findLocalMatch(query);

    if (!hasLocalResults) {
      setLoading(true);
      try {
        const newFormula = await generateCheatSheet(activeTool.name, query, selectedModel);
        setLatestAiResultId(newFormula.id);

        // Final duplicate check before adding (by name)
        const isDuplicate = allFormulas.some(f =>
          f.toolId === newFormula.toolId &&
          f.name.toLowerCase() === newFormula.name.toLowerCase()
        );

        if (!isDuplicate) {
          setDynamicFormulas(prev => [newFormula, ...prev]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to generate AI answer. Check your API key.");
      } finally {
        setLoading(false);
      }
    }
  }

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCode.trim()) return;

    setLoading(true);
    setError(null);
    setSubmittedQuery(`Translation from ${sourceTool}`);

    try {
      const targetToolName = tools.find(t => t.id === selectedTool)?.name || selectedTool;
      const sourceToolName = tools.find(t => t.id === sourceTool)?.name || sourceTool;
      
      const newFormula = await translateCode(sourceToolName, targetToolName, sourceCode, selectedModel);
      setDynamicFormulas(prev => [newFormula, ...prev]);
    } catch (err: any) {
      setError(err.message || "Translation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async (id: string, instruction: string) => {
    // Check dynamic formulas first
    let formula = dynamicFormulas.find(f => f.id === id);
    
    // If not found in dynamic, check initial formulas
    if (!formula) {
      formula = initialFormulas.find(f => f.id === id);
    }
    
    if (!formula) return;

    setLoading(true);
    setError(null);

    try {
      const updatedFormula = await refineCheatSheet(formula, instruction, selectedModel);
      
      // Update dynamic formulas
      if (dynamicFormulas.some(f => f.id === id)) {
        setDynamicFormulas(prev => prev.map(f => f.id === id ? updatedFormula : f));
      } else {
        // If it was an initial formula, it now becomes dynamic
        setDynamicFormulas(prev => [updatedFormula, ...prev]);
      }
    } catch (err: any) {
      setError(err.message || "Refinement failed.");
    } finally {
      setLoading(false);
    }
  };

  // Group by category for better organization
  const groupedFormulas = useMemo(() => {
    const groups: Record<string, Formula[]> = {};
    filteredFormulas.forEach(f => {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    });
    return groups;
  }, [filteredFormulas]);

  return (
    <div className="app-container">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo">
            Analyst Copilot
          </div>
          <div className="active-tool-display" style={{ color: activeTool.color }}>
            {activeTool.name}
          </div>
        </div>

        <div className="tool-list">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className={`tool-item ${selectedTool === tool.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedTool(tool.id);
                setSearchQuery('');
                setSubmittedQuery('');
                setError(null);
                setIsSidebarOpen(false);
              }}
              style={selectedTool === tool.id ? { 
                borderLeft: `4px solid ${tool.color}`,
                backgroundColor: `${tool.color}15`,
                color: tool.color 
              } : {}}
            >
              {tool.name}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-top">
            <button className="mobile-nav-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              ☰
            </button>
            <div className="model-selector">
              <div className="mode-tabs">
                <button 
                  className={`mode-tab ${appMode === 'search' ? 'active' : ''}`}
                  onClick={() => setAppMode('search')}
                >
                  🔍 Search
                </button>
                <button 
                  className={`mode-tab ${appMode === 'translate' ? 'active' : ''}`}
                  onClick={() => setAppMode('translate')}
                >
                  🔄 Translate
                </button>
              </div>
              <div className="toggle-group">
                <button 
                  type="button" 
                  className={`toggle-btn ${selectedModel === 'gemini-2.5-flash' ? 'active' : ''}`}
                  onClick={() => setSelectedModel('gemini-2.5-flash')}
                >
                  Flash
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${selectedModel === 'gemini-2.5-pro' ? 'active' : ''}`}
                  onClick={() => setSelectedModel('gemini-2.5-pro')}
                >
                  Pro
                </button>
              </div>
            </div>

            <button 
              className="theme-toggle" 
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Toggle Theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
          
          {appMode === 'search' ? (
            <form className="search-container single-line" onSubmit={handleSearch}>
              <div className="search-row">
                <div className="search-wrapper">
                  <input
                    type="text"
                    className="search-input"
                    placeholder={`Ask for any library or syntax...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {loading && <div className="loading-indicator">Thinking...</div>}
                </div>
                <div className="search-actions">
                  <button type="submit" className="primary-button" disabled={loading || !searchQuery.trim()}>
                    Search
                  </button>
                  <button 
                    type="button" 
                    className="secondary-button" 
                    onClick={() => {
                      setSearchQuery('');
                      setSubmittedQuery('');
                      setError(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form className="search-container" onSubmit={handleTranslate}>
              <div className="translator-inputs">
                <div className="input-group">
                  <label>From:</label>
                  <select 
                    value={sourceTool} 
                    onChange={(e) => setSourceTool(e.target.value)}
                    className="tool-select"
                  >
                    {tools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>To:</label>
                  <div className="target-label" style={{ color: activeTool.color, fontWeight: 700 }}>{activeTool.name}</div>
                </div>
              </div>
              
              <div className="search-wrapper">
                <textarea
                  className="search-input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder={`Paste your code here...`}
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                />
                {loading && <div className="loading-indicator">Translating...</div>}
              </div>
              
              <div className="search-actions">
                <button type="submit" className="primary-button" disabled={loading || !sourceCode.trim()}>
                  Translate Code
                </button>
                <button 
                  type="button" 
                  className="secondary-button" 
                  onClick={() => {
                    setSourceCode('');
                    setSubmittedQuery('');
                    setError(null);
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="error-box">
              ⚠️ {error}
            </div>
          )}
        </header>

        <section className="results-container">
          {Object.keys(groupedFormulas).length > 0 ? (
            Object.keys(groupedFormulas).sort().map(category => (
              <div key={category} className="category-section">
                <h2 className="category-heading">{category}</h2>
                <div className="results-grid">
                  {groupedFormulas[category].map((formula) => (
                    <FormulaCard 
                      key={formula.id} 
                      formula={formula} 
                      color={activeTool.color}
                      onToggleFavorite={toggleFavorite}
                      onDelete={deleteFormula}
                      onRefine={handleRefine}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            submittedQuery.trim() && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                {loading ? (
                  <div className="ai-status">
                    <span style={{ fontSize: '2rem' }}>🤖</span>
                    <p>The AI is searching for <strong>"{submittedQuery}"</strong> in {activeTool.name}...</p>
                  </div>
                ) : (
                  <div className="no-results">
                    <p>No local match found for <strong>"{submittedQuery}"</strong>.</p>
                    <p style={{ fontSize: '0.9rem' }}>Try searching for a broader term or check your spelling.</p>
                  </div>
                )}
              </div>
            )
          )}
        </section>
      </main>
    </div>
  )
}

function FormulaCard({ 
  formula, 
  color, 
  onToggleFavorite, 
  onDelete,
  onRefine
}: { 
  formula: Formula; 
  color: string;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onRefine: (id: string, instruction: string) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refineText, setRefineText] = useState('');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const submitRefine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineText.trim()) return;
    onRefine(formula.id, refineText);
    setRefineText('');
    setIsRefining(false);
  };

  return (
    <article className="formula-card" style={{ borderTopColor: color }}>
      <div className="card-actions">
        <button 
          className={`action-btn favorite ${formula.isFavorite ? 'active' : ''}`}
          onClick={() => onToggleFavorite(formula.id)}
          title={formula.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          {formula.isFavorite ? '★' : '☆'}
        </button>
        <button 
          className="action-btn refine"
          onClick={() => setIsRefining(!isRefining)}
          title="Refine with AI"
        >
          🪄
        </button>
        <button 
          className="action-btn delete"
          onClick={() => onDelete(formula.id)}
          title="Delete Card"
        >
          🗑️
        </button>
      </div>

      <div className="formula-header">
        <h3 className="formula-name">{formula.name}</h3>
      </div>

      {isRefining && (
        <form className="refine-box" onSubmit={submitRefine}>
          <input 
            type="text" 
            placeholder="How should I improve this? (e.g. 'More advanced')" 
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            autoFocus
          />
          <button type="submit">Update</button>
        </form>
      )}

      <div className="concept-box">
        {formula.concept}
      </div>

      <div className="syntax-block">
        <code>{formula.syntax}</code>
      </div>

      {formula.explanation && (
        <div className="explanation-box">
          {formula.explanation}
        </div>
      )}

      <div className="examples-container">
        {formula.examples.map((ex, idx) => (
          <div key={idx} className="example-card">
            <div className="example-title">{ex.title}</div>
            <div className="example-code-wrapper">
              <code className="example-code">
                {ex.code}
              </code>
              <button 
                className="copy-btn-mini" 
                onClick={() => copyToClipboard(ex.code, `ex-${idx}`)}
              >
                {copied === `ex-${idx}` ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="example-desc">{ex.description}</p>
          </div>
        ))}
      </div>
    </article>
  )
}

export default App
