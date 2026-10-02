import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Layers3, Menu, Pause, Play, RotateCcw, Search, X } from 'lucide-react';
import { AnatomyScene } from './three/AnatomyScene';
import { AnatomyPart, muscleParts, partById, parts, partMatchesQuery, regions, skeletalParts, SystemMode } from './anatomy/data';
import { downloadProject } from './utils/downloadProject';

function useMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => { const resize = () => setMobile(window.innerWidth < 768); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);
  return mobile;
}

function Mark() {
  return <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>;
}

export default function App() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mode, setMode] = useState<SystemMode>('skeleton');
  const [exploded, setExploded] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [view, setView] = useState(0);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All regions');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Bone' | 'Muscle'>('All');
  const [assetStatus, setAssetStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [webgl] = useState(() => { try { const canvas = document.createElement('canvas'); return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')); } catch { return false; } });
  const mobile = useMobile();
  const onModelReady = useCallback((ready: boolean) => setAssetStatus(ready ? 'ready' : 'fallback'), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setSelected(null); setSearchOpen(false); setBrowseOpen(false); }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); }
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);

  const choose = (id: string) => {
    const part = partById[id.split(':')[0]];
    if (!part) return;
    if (part.category === 'Muscle' && mode === 'skeleton') setMode('muscles');
    if (part.category === 'Bone' && mode === 'muscles') setMode('skeleton');
    setSelected(id); setExploded(false); setBrowseOpen(false); setSearchOpen(false); setHovered(null); document.body.style.cursor = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const changeMode = (next: SystemMode) => {
    setMode(next);
    setHovered(null);
    document.body.style.cursor = '';
    if (selected && ((next === 'skeleton' && partById[selected.split(':')[0]].category === 'Muscle') || (next === 'muscles' && partById[selected.split(':')[0]].category === 'Bone'))) setSelected(null);
  };
  const results = useMemo(() => parts.filter(part => {
    const matchesRegion = region === 'All regions' || region === part.region;
    const matchesCategory = categoryFilter === 'All' || categoryFilter === part.category;
    const q = query.trim().toLowerCase();
    return matchesRegion && matchesCategory && partMatchesQuery(part, q);
  }), [categoryFilter, query, region]);
  const searchResults = useMemo(() => parts.filter(part => partMatchesQuery(part, query)), [query]);
  const detail: AnatomyPart | null = selected ? partById[selected.split(':')[0]] : null;
  const selectedSide = selected?.split(':')[1];

  return <div className="site-shell">
    <section className={`hero${selected ? ' has-selection' : ''}`} id="top" aria-label="Anatomy explorer">
      <div className="canvas-wrap" aria-label="Interactive three-dimensional anatomy model">
        {webgl ? <AnatomyScene selected={selected} hovered={hovered} setHovered={setHovered} onSelect={choose} mode={mode} exploded={exploded} view={view} rotate={rotating} mobile={mobile} onReady={onModelReady} /> : <div className="webgl-fallback">3D viewing is not available on this device.<br />Use the anatomy index to explore every structure.</div>}
      </div>
      <div className="hero-shade" />
      <div className="grain" />

      <header className="site-header">
        <button className="header-brand" onClick={() => { setSelected(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Anatomica home"><Mark /><span>ANATOMICA<span className="brand-dot">.</span></span></button>
        <nav className="header-nav" aria-label="Main navigation">
          <button onClick={() => setBrowseOpen(true)}>Explore anatomy</button>
          <a href="#approach">The experience</a>
          <a href="#index">The atlas</a>
        </nav>
        <div className="header-actions">
          <button className="header-search" onClick={() => setSearchOpen(true)} aria-label="Search anatomy"><Search size={19} strokeWidth={1.6} /><span>Search</span><kbd>⌘ K</kbd></button>
          <button className="mobile-menu" onClick={() => setBrowseOpen(true)} aria-label="Open menu"><Menu size={23} /></button>
        </div>
      </header>

      {detail && <aside className="detail-panel" key={detail.id} aria-label={`${detail.name} details`}>
        <div className="detail-top"><span className="eyebrow"><span className="green-dot" /> {detail.category.toUpperCase()} / {detail.region.toUpperCase()}</span><button className="close-detail" onClick={() => setSelected(null)} aria-label="Close details"><X size={20} strokeWidth={1.5} /></button></div>
        <div className="detail-main"><span className="detail-index">STRUCTURE / {String(parts.indexOf(detail) + 1).padStart(2, '0')}{selectedSide ? ` / ${selectedSide.toUpperCase()}` : ''}</span><h2>{detail.name}</h2><span className="detail-rule" /><p className="detail-description">{detail.description}</p>
          <div className="detail-facts"><div><span>PRIMARY FUNCTION</span><p>{detail.function}</p></div><div><span>CONNECTED TO</span><p>{detail.connects}</p></div></div>
          <a className="detail-source" href={detail.source} target="_blank" rel="noreferrer">ANATOMY REFERENCE · OPENSTAX <ArrowUpRight size={14} /></a>
        </div>
        <div className="detail-bottom"><button onClick={() => { const current = parts.indexOf(detail); choose(parts[(current - 1 + parts.length) % parts.length].id); }} aria-label="Previous structure"><ArrowLeft size={19} /></button><span>EXPLORE STRUCTURES</span><button onClick={() => { const current = parts.indexOf(detail); choose(parts[(current + 1) % parts.length].id); }} aria-label="Next structure"><ArrowRight size={19} /></button></div>
      </aside>}

      <div className="hero-bottom">
        <div className="control-bar" role="toolbar" aria-label="3D anatomy controls">
          <div className="mode-switch" aria-label="Anatomy display mode">{(['skeleton', 'muscles', 'combined'] as SystemMode[]).map(item => <button key={item} className={mode === item ? 'active' : ''} onClick={() => changeMode(item)} aria-pressed={mode === item}>{item}</button>)}</div>
          <span className="control-divider" />
          <button className={`tool-button ${exploded ? 'tool-active' : ''}`} onClick={() => { setExploded(!exploded); setSelected(null); }} title={exploded ? 'Reset exploded anatomy' : 'Explode anatomy'} aria-label={exploded ? 'Reset exploded anatomy' : 'Explode anatomy'}><Layers3 size={19} strokeWidth={1.5} /></button>
          <button className="tool-button" onClick={() => { setSelected(null); setExploded(false); setView(v => v + 1); }} title="Flip view" aria-label="Flip view"><RotateCcw size={18} strokeWidth={1.5} /></button>
          <button className={`tool-button ${rotating ? 'tool-active' : ''}`} onClick={() => setRotating(!rotating)} title={rotating ? 'Pause rotation' : 'Auto rotate'} aria-label={rotating ? 'Pause rotation' : 'Auto rotate'}>{rotating ? <Pause size={17} /> : <Play size={17} />}</button>
        </div>
      </div>
      {webgl && assetStatus !== 'ready' && <span className="model-status" role="status">{assetStatus === 'loading' ? 'Loading detailed skeleton…' : 'Offline study model'}</span>}
    </section>

    <section className="approach-section" id="approach"><div className="section-number">01 / THE EXPERIENCE</div><div className="approach-content"><span className="small-caps">A CLOSER LOOK AT OURSELVES</span><h2>Not just a body.<br /><em>A world to explore.</em></h2><p>Anatomy is more than a diagram. Move around the human form, isolate the structures beneath the surface, and see how everything connects.</p><button className="inline-link" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setBrowseOpen(true); }}>Start exploring <ArrowUpRight size={18} /></button></div><div className="approach-visual"><div className="orbit-graphic"><span className="orbit-center"><Mark /></span><span className="orbit-1" /><span className="orbit-2" /><span className="orbit-3" /></div><span className="visual-caption">PERSPECTIVE CHANGES EVERYTHING</span></div></section>

    <section className="index-section" id="index"><div className="index-header"><div><span className="section-number">02 / ANATOMY INDEX</span><h2>Every part has<br /><em>a purpose.</em></h2></div><p>{skeletalParts.length} skeletal structures and {muscleParts.length} muscle groups. Select any structure to focus it in the model.</p></div><div className="anatomy-catalog">
      <section className="catalog-system" aria-labelledby="skeletal-index-heading"><header><span className="catalog-kicker">01 / SKELETAL SYSTEM</span><h3 id="skeletal-index-heading">Skeletal parts <span>{String(skeletalParts.length).padStart(2, '0')}</span></h3></header><div className="catalog-parts">{skeletalParts.map((part, index) => <button key={part.id} onClick={() => choose(part.id)}><span className="catalog-number">{String(index + 1).padStart(2, '0')}</span><span className="catalog-part-name">{part.name}</span><ArrowUpRight size={16} strokeWidth={1.4} /></button>)}</div></section>
      <section className="catalog-system" aria-labelledby="muscle-index-heading"><header><span className="catalog-kicker">02 / MUSCULAR SYSTEM</span><h3 id="muscle-index-heading">Muscles <span>{String(muscleParts.length).padStart(2, '0')}</span></h3></header><div className="catalog-parts">{muscleParts.map((part, index) => <button key={part.id} onClick={() => choose(part.id)}><span className="catalog-number">{String(index + 1).padStart(2, '0')}</span><span className="catalog-part-name">{part.name}</span><ArrowUpRight size={16} strokeWidth={1.4} /></button>)}</div></section>
    </div></section>
    <footer className="footer"><div className="footer-brand"><Mark /> ANATOMICA<span>.</span></div><p>A new perspective on the human form.</p><span>3D skeleton: <a href="https://anatomytool.org/open3dmodel-create" target="_blank" rel="noreferrer">Open 3D Model / AnatomyTOOL</a> (CC BY-SA). Anatomy descriptions reference <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction" target="_blank" rel="noreferrer">OpenStax Anatomy & Physiology 2e</a>. Muscle meshes are a stylized study visualization, not a clinical model.</span><div className="footer-actions"><button onClick={downloadProject}>DOWNLOAD PROJECT ZIP ↗</button><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>BACK TO TOP ↑</button></div></footer>

    {browseOpen && <div className="overlay-backdrop" onMouseDown={() => setBrowseOpen(false)}><aside className="browse-drawer" onMouseDown={e => e.stopPropagation()} aria-label="Browse anatomy"><div className="drawer-head"><div><span className="small-caps">THE HUMAN ATLAS</span><h2>Explore anatomy<span>.</span></h2></div><button onClick={() => setBrowseOpen(false)} aria-label="Close anatomy browser"><X size={22} /></button></div><div className="drawer-filter drawer-systems" aria-label="Filter by system"><button className={categoryFilter === 'All' ? 'chosen' : ''} onClick={() => setCategoryFilter('All')}>All systems</button><button className={categoryFilter === 'Bone' ? 'chosen' : ''} onClick={() => setCategoryFilter('Bone')}>Skeletal · {skeletalParts.length}</button><button className={categoryFilter === 'Muscle' ? 'chosen' : ''} onClick={() => setCategoryFilter('Muscle')}>Muscular · {muscleParts.length}</button></div><div className="drawer-filter drawer-regions" aria-label="Filter by region"><button className={region === 'All regions' ? 'chosen' : ''} onClick={() => setRegion('All regions')}>All regions</button>{regions.map(item => <button key={item} className={region === item ? 'chosen' : ''} onClick={() => setRegion(item)}>{item}</button>)}</div><div className="drawer-list">{results.map(part => <button key={part.id} onClick={() => choose(part.id)}><span className="drawer-item-main">{part.name}<small>{part.category} · {part.region}</small></span><ArrowUpRight size={18} strokeWidth={1.4} /></button>)}</div><div className="drawer-foot">{results.length} STRUCTURES IN VIEW <span>SELECT TO EXPLORE <ArrowUpRight size={13} /></span></div></aside></div>}

    {searchOpen && <div className="search-backdrop" onMouseDown={() => setSearchOpen(false)}><div className="search-dialog" onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="Search anatomy"><div className="search-input-wrap"><Search size={24} strokeWidth={1.5} /><input autoFocus placeholder="Search the human body..." value={query} onChange={e => setQuery(e.target.value)} /><button onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={20} /></button></div><div className="search-results"><span className="search-label">{query ? `${searchResults.length} MATCHING STRUCTURES` : 'START EXPLORING'}</span>{searchResults.length ? searchResults.slice(0, 8).map(part => <button key={part.id} onClick={() => choose(part.id)}><span>{part.name}<small>{part.region} / {part.category}</small></span><ArrowUpRight size={18} /></button>) : <p>No structures found. Try another search.</p>}</div><div className="search-footer">TIP: SELECT A RESULT TO FOCUS THE 3D MODEL <kbd>ESC TO CLOSE</kbd></div></div></div>}
  </div>;
}
