import { useState, useEffect, useCallback, useMemo } from 'react'
import { PROMPTS_INICIAIS } from './data/prompts.js'

const STORAGE_KEY = 'prompt-library-imob-v2'

const CATEGORIES = ['Todos','Exterior','Interior','Aéreo','Movimento','Detalhe','Texto/Animação','Geral']
const TOOLS = ['Todos','Kling','Nano Banana','VEO3/VO3','Sora','HeyGen','Grok','Geral']

const CAT_COLORS = {
  Exterior:       { bg: 'var(--cat-exterior-bg)',  color: 'var(--cat-exterior)' },
  Interior:       { bg: 'var(--cat-interior-bg)',  color: 'var(--cat-interior)' },
  Aéreo:          { bg: 'var(--cat-aereo-bg)',      color: 'var(--cat-aereo)' },
  Movimento:      { bg: 'var(--cat-movimento-bg)',  color: 'var(--cat-movimento)' },
  Detalhe:        { bg: 'var(--cat-detalhe-bg)',    color: 'var(--cat-detalhe)' },
  'Texto/Animação':{ bg: 'var(--cat-anim-bg)',      color: 'var(--cat-anim)' },
  Geral:          { bg: 'var(--cat-geral-bg)',      color: 'var(--cat-geral)' },
}

const TOOL_COLORS = {
  Kling:        { bg: 'var(--cat-aereo-bg)',     color: 'var(--cat-aereo)' },
  'Nano Banana':{ bg: 'var(--cat-nano-bg)',       color: 'var(--cat-nano)' },
  'VEO3/VO3':   { bg: 'var(--cat-interior-bg)',  color: 'var(--cat-interior)' },
  Sora:         { bg: 'var(--cat-detalhe-bg)',   color: 'var(--cat-detalhe)' },
  HeyGen:       { bg: 'var(--cat-movimento-bg)', color: 'var(--cat-movimento)' },
  Grok:         { bg: 'var(--cat-exterior-bg)',  color: 'var(--cat-exterior)' },
  Geral:        { bg: 'var(--cat-geral-bg)',     color: 'var(--cat-geral)' },
}

function Badge({ label, map }) {
  const s = map?.[label] || { bg: 'var(--cat-geral-bg)', color: 'var(--cat-geral)' }
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 99,
      background: s.bg, color: s.color, fontWeight: 600,
      letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase'
    }}>{label}</span>
  )
}

function CopyBtn({ text, label = 'Copiar' }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} style={{
      fontSize: 11, padding: '3px 10px',
      color: copied ? 'var(--accent)' : 'var(--text3)',
      borderColor: copied ? 'var(--accent)' : 'var(--border)'
    }}>
      {copied ? '✓ Copiado' : label}
    </button>
  )
}

export default function App() {
  const [prompts, setPrompts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'add'
  const [search, setSearch] = useState('')
  const [selCat, setSelCat] = useState('Todos')
  const [selTool, setSelTool] = useState('Todos')
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [varId, setVarId] = useState(null)
  const [varText, setVarText] = useState('')
  const [newText, setNewText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [analysisErr, setAnalysisErr] = useState(null)

  // Load from localStorage, seed with initial data if empty
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setPrompts(JSON.parse(raw))
      } else {
        setPrompts(PROMPTS_INICIAIS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(PROMPTS_INICIAIS))
      }
    } catch {
      setPrompts(PROMPTS_INICIAIS)
    }
    setLoaded(true)
  }, [])

  const persist = useCallback((data) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
  }, [])

  const update = useCallback((data) => {
    setPrompts(data)
    persist(data)
  }, [persist])

  const analyzePrompt = async () => {
    if (!newText.trim()) return
    setAnalyzing(true)
    setAnalysis(null)
    setAnalysisErr(null)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `Você é especialista em prompts de vídeo/imagem imobiliário com IA (Kling, VEO3, Sora, HeyGen, Grok, Nano Banana). Analise o prompt e retorne APENAS JSON válido, sem texto extra, sem markdown. Estrutura exata:
{"translation":"tradução fiel ao português brasileiro","description":"em 1 ou 2 frases: o que este prompt produz e quando usar","category":"Exterior|Interior|Aéreo|Movimento|Detalhe|Texto/Animação|Geral","tool":"Kling|VEO3/VO3|Sora|HeyGen|Grok|Nano Banana|Geral","tags":["até 5 tags relevantes em português sem #"]}`,
          messages: [{ role: 'user', content: newText.trim() }]
        })
      })
      const data = await res.json()
      const raw = data.content?.[0]?.text || ''
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      setAnalysis(parsed)
    } catch {
      setAnalysisErr('Erro ao analisar. Verifique sua conexão e tente novamente.')
    }
    setAnalyzing(false)
  }

  const saveNew = () => {
    if (!analysis) return
    const np = {
      id: 'u' + Date.now(),
      original: newText.trim(),
      ...analysis,
      variations: [],
      createdAt: new Date().toISOString()
    }
    const updated = [np, ...prompts]
    update(updated)
    setNewText('')
    setAnalysis(null)
    setView('list')
  }

  const deletePrompt = (id) => {
    if (!confirm('Excluir este prompt?')) return
    update(prompts.filter(p => p.id !== id))
    setExpandedId(null)
  }

  const saveEdit = () => {
    update(prompts.map(p => p.id !== editingId ? p : {
      ...p,
      description: editDraft.description,
      category: editDraft.category,
      tool: editDraft.tool,
      tags: editDraft.tags.split(',').map(t => t.trim()).filter(Boolean)
    }))
    setEditingId(null)
  }

  const addVariation = (id) => {
    if (!varText.trim()) return
    update(prompts.map(p => p.id !== id ? p : {
      ...p, variations: [...(p.variations || []), varText.trim()]
    }))
    setVarId(null)
    setVarText('')
  }

  const deleteVariation = (pid, idx) => {
    update(prompts.map(p => p.id !== pid ? p : {
      ...p, variations: p.variations.filter((_, i) => i !== idx)
    }))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return prompts.filter(p => {
      const matchQ = !q ||
        p.description?.toLowerCase().includes(q) ||
        p.original?.toLowerCase().includes(q) ||
        p.translation?.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      return matchQ &&
        (selCat === 'Todos' || p.category === selCat) &&
        (selTool === 'Todos' || p.tool === selTool)
    })
  }, [prompts, search, selCat, selTool])

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text3)' }}>
      Carregando...
    </div>
  )

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 80px' }}>

      {/* HEADER */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: '20px 0 16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Biblioteca de Prompts
              <span style={{ color: 'var(--accent)', marginLeft: 6 }}>·</span>
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, fontWeight: 400 }}>
              {prompts.length} prompts · imóveis com IA
            </p>
          </div>
          <button
            className={view === 'add' ? '' : 'primary'}
            onClick={() => { setView(v => v === 'add' ? 'list' : 'add'); setAnalysis(null); setNewText('') }}
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            {view === 'add' ? 'Cancelar' : '+ Novo prompt'}
          </button>
        </div>

        {view === 'list' && (
          <div>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por descrição, tag ou palavra-chave..."
              style={{ marginBottom: 10 }}
            />
            <FilterRow label="Cat." items={CATEGORIES} sel={selCat} onSel={setSelCat} map={CAT_COLORS} />
            <FilterRow label="Tool" items={TOOLS} sel={selTool} onSel={setSelTool} map={TOOL_COLORS} />
          </div>
        )}
      </div>

      {/* ADD PANEL */}
      {view === 'add' && (
        <div style={{
          marginTop: 20,
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 10, padding: 20
        }}>
          <label style={labelStyle}>Cole o prompt (inglês ou português)</label>
          <textarea
            value={newText} onChange={e => setNewText(e.target.value)}
            placeholder="Paste your prompt here..."
            style={{ minHeight: 140, marginBottom: 12, fontFamily: "'DM Mono', monospace", fontSize: 12 }}
          />
          <button className="primary" onClick={analyzePrompt} disabled={!newText.trim() || analyzing}
            style={{ width: '100%', padding: '10px', fontSize: 13 }}>
            {analyzing ? 'Analisando com IA...' : 'Analisar e traduzir automaticamente'}
          </button>
          {analysisErr && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{analysisErr}</p>}

          {analysis && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <InfoRow label="Tradução" value={analysis.translation} />
              <InfoRow label="Descrição" value={analysis.description} />
              <div style={{ marginBottom: 12 }}>
                <p style={labelStyle}>Categoria · Ferramenta</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge label={analysis.category} map={CAT_COLORS} />
                  <Badge label={analysis.tool} map={TOOL_COLORS} />
                </div>
              </div>
              {analysis.tags?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={labelStyle}>Tags</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {analysis.tags.map(t => <TagPill key={t} tag={t} />)}
                  </div>
                </div>
              )}
              <button className="primary" onClick={saveNew} style={{ width: '100%', padding: 10 }}>
                Salvar na biblioteca
              </button>
            </div>
          )}
        </div>
      )}

      {/* PROMPT LIST */}
      {view === 'list' && (
        <div style={{ marginTop: 20 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
              <p style={{ fontSize: 15, marginBottom: 6 }}>
                {prompts.length === 0 ? 'Nenhum prompt salvo' : 'Nenhum resultado'}
              </p>
              <p style={{ fontSize: 12 }}>
                {prompts.length === 0 ? 'Clique em + Novo prompt para começar.' : 'Tente outros filtros.'}
              </p>
            </div>
          )}

          {filtered.map(prompt => {
            const isExp = expandedId === prompt.id
            const isEdit = editingId === prompt.id
            const isVar = varId === prompt.id

            return (
              <div key={prompt.id} style={{
                background: 'var(--surface)',
                border: `1px solid ${isExp ? 'var(--border2)' : 'var(--border)'}`,
                borderRadius: 10, padding: '14px 16px', marginBottom: 8,
                transition: 'border-color 0.15s'
              }}>
                {/* Card top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                      <Badge label={prompt.category} map={CAT_COLORS} />
                      <Badge label={prompt.tool} map={TOOL_COLORS} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: 'var(--text)', marginBottom: prompt.tags?.length ? 8 : 0 }}>
                      {prompt.description}
                    </p>
                    {prompt.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {prompt.tags.map(t => <TagPill key={t} tag={t} />)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'flex-start' }}>
                    <CopyBtn text={prompt.original} label="Copiar" />
                    <button
                      onClick={() => { setExpandedId(isExp ? null : prompt.id); setEditingId(null); setVarId(null) }}
                      style={{ fontSize: 11, padding: '3px 10px', color: isExp ? 'var(--accent)' : 'var(--text3)', borderColor: isExp ? 'var(--accent)' : 'var(--border)' }}
                    >
                      {isExp ? 'Fechar' : 'Ver'}
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isExp && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>

                    {isEdit ? (
                      <div>
                        <label style={labelStyle}>Descrição</label>
                        <textarea value={editDraft.description} onChange={e => setEditDraft(d => ({ ...d, description: e.target.value }))} rows={2} style={{ marginBottom: 10 }} />
                        <label style={labelStyle}>Categoria</label>
                        <select value={editDraft.category} onChange={e => setEditDraft(d => ({ ...d, category: e.target.value }))} style={{ marginBottom: 10 }}>
                          {CATEGORIES.filter(c => c !== 'Todos').map(c => <option key={c}>{c}</option>)}
                        </select>
                        <label style={labelStyle}>Ferramenta</label>
                        <select value={editDraft.tool} onChange={e => setEditDraft(d => ({ ...d, tool: e.target.value }))} style={{ marginBottom: 10 }}>
                          {TOOLS.filter(t => t !== 'Todos').map(t => <option key={t}>{t}</option>)}
                        </select>
                        <label style={labelStyle}>Tags (separadas por vírgula)</label>
                        <input value={editDraft.tags} onChange={e => setEditDraft(d => ({ ...d, tags: e.target.value }))} style={{ marginBottom: 14 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="primary" onClick={saveEdit}>Salvar</button>
                          <button onClick={() => setEditingId(null)}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Original */}
                        <SectionBlock label="Prompt original" copyText={prompt.original}>
                          <pre>{prompt.original}</pre>
                        </SectionBlock>

                        {/* Translation */}
                        {prompt.translation && prompt.translation !== prompt.original && (
                          <SectionBlock label="Tradução (PT-BR)" copyText={prompt.translation}>
                            <pre>{prompt.translation}</pre>
                          </SectionBlock>
                        )}

                        {/* Variations */}
                        {(prompt.variations || []).length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <p style={labelStyle}>Variações</p>
                            {prompt.variations.map((v, i) => (
                              <SectionBlock key={i} label={`Variação ${i + 1}`} copyText={v}
                                extra={<button onClick={() => deleteVariation(prompt.id, i)} style={{ fontSize: 11, padding: '3px 8px', color: 'var(--danger)', borderColor: 'var(--border)' }}>Excluir</button>}>
                                <pre>{v}</pre>
                              </SectionBlock>
                            ))}
                          </div>
                        )}

                        {/* Add variation */}
                        {isVar && (
                          <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Nova variação</label>
                            <textarea value={varText} onChange={e => setVarText(e.target.value)} placeholder="Digite o prompt variante..." rows={3} style={{ marginBottom: 8 }} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="primary" onClick={() => addVariation(prompt.id)} disabled={!varText.trim()}>Salvar</button>
                              <button onClick={() => { setVarId(null); setVarText('') }}>Cancelar</button>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                          <button onClick={() => { setEditingId(prompt.id); setEditDraft({ description: prompt.description, category: prompt.category, tool: prompt.tool, tags: (prompt.tags || []).join(', ') }) }} style={{ fontSize: 11 }}>
                            Editar
                          </button>
                          {!isVar && (
                            <button onClick={() => { setVarId(prompt.id); setVarText('') }} style={{ fontSize: 11 }}>
                              + Variação
                            </button>
                          )}
                          <button onClick={() => deletePrompt(prompt.id)} style={{ fontSize: 11, color: 'var(--danger)', borderColor: 'var(--border)', marginLeft: 'auto' }}>
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterRow({ label, items, sel, onSel, map }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
      <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 28 }}>{label}</span>
      {items.map(item => {
        const s = map?.[item]
        const active = sel === item
        return (
          <button key={item} onClick={() => onSel(item)} style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 99,
            background: active ? (s?.bg || 'var(--surface2)') : 'transparent',
            color: active ? (s?.color || 'var(--text)') : 'var(--text3)',
            borderColor: active ? (s?.color || 'var(--border2)') : 'var(--border)',
            fontWeight: active ? 600 : 400,
            letterSpacing: '0.03em'
          }}>
            {item}
          </button>
        )
      })}
    </div>
  )
}

function SectionBlock({ label, copyText, extra, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <p style={labelStyle}>{label}</p>
        <div style={{ display: 'flex', gap: 5 }}>
          {extra}
          <CopyBtn text={copyText} />
        </div>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={labelStyle}>{label}</p>
      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{value}</p>
    </div>
  )
}

function TagPill({ tag }) {
  return (
    <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 7px', borderRadius: 99, border: '1px solid var(--border)' }}>
      #{tag}
    </span>
  )
}

const labelStyle = {
  fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase',
  letterSpacing: '0.08em', fontWeight: 600, marginBottom: 5, display: 'block'
}
