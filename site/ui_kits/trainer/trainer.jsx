const { useState, useRef, useEffect, useCallback } = React;

/* ── Go syntax highlighter ─────────────────────────────────────────────── */
const KW = new Set(['func','go','chan','select','for','range','if','else','switch','case','default','return','defer','var','const','type','struct','interface','map','package','import','break','continue','nil','true','false']);
const BUILTIN = new Set(['make','len','cap','append','copy','close','delete','new','panic','recover']);
const TYPES = new Set(['int','int8','int16','int32','int64','uint','uint32','uint64','float32','float64','byte','rune','string','bool','error','any']);
function hl(code) {
  const re = /(\/\/[^\n]*)|(`[^`]*`|"(?:[^"\\]|\\.)*")|(\b\d[\d_.eExX]*\b)|([A-Za-z_]\w*)|(\s+)|([^\s\w])/g;
  const out = []; let m, i = 0;
  while ((m = re.exec(code))) {
    let c = null, t = m[0];
    if (m[1]) c = 'var(--code-comment)';
    else if (m[2]) c = 'var(--code-string)';
    else if (m[3]) c = 'var(--code-number)';
    else if (m[4]) {
      if (KW.has(t)) c = 'var(--code-keyword)';
      else if (BUILTIN.has(t)) c = 'var(--code-builtin)';
      else if (TYPES.has(t)) c = 'var(--code-type)';
      else c = code[re.lastIndex] === '(' ? 'var(--code-func)' : 'var(--code-text)';
    } else if (m[6]) c = 'var(--code-punct)';
    out.push(c ? <span key={i} style={{color:c}}>{t}</span> : t); i++;
  }
  return out;
}

/* ── Icons ─────────────────────────────────────────────────────────────── */
const Ic = {
  play: (p)=><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}><polygon points="6 4 20 12 6 20 6 4"/></svg>,
  reset: (p)=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>,
  chevL: (p)=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="m15 18-6-6 6-6"/></svg>,
  chevR: (p)=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="m9 18 6-6-6-6"/></svg>,
  panel: (p)=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>,
  lock: (p)=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
  check: (p)=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="10" fill="var(--success)" opacity="0.16"/><path d="M7.5 12.5l3 3 6-6.5" stroke="var(--success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  search: (p)=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>,
  doc: (p)=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
  book: (p)=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  key: (p)=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2Z"/></svg>,
};

/* ── Data ──────────────────────────────────────────────────────────────── */
const TOPICS = [
  { n:'01', name:'Каналы и select', tasks:[
    {id:1,t:'Небуферизованный пинг-понг',d:'easy',s:'solved'},
    {id:2,t:'Мультиплексор на select',d:'medium',s:'solved'},
    {id:3,t:'Таймаут на select',d:'medium',s:'solved'},
    {id:4,t:'Закрытие канала-сигнала',d:'easy',s:'solved'},
  ]},
  { n:'02', name:'Синхронизация и sync', tasks:[
    {id:5,t:'Потокобезопасный счётчик',d:'easy',s:'solved'},
    {id:6,t:'sync.Once для инициализации',d:'medium',s:'solved'},
    {id:7,t:'RWMutex-кэш',d:'medium',s:'attempted'},
    {id:8,t:'WaitGroup без утечки',d:'medium',s:'todo'},
  ]},
  { n:'03', name:'Паттерны конкурентности', tasks:[
    {id:9,t:'Generator',d:'easy',s:'solved'},
    {id:10,t:'Fan-out / fan-in',d:'medium',s:'solved'},
    {id:11,t:'Tee-канал',d:'hard',s:'todo'},
    {id:12,t:'Семафор на канале',d:'medium',s:'todo'},
  ]},
  { n:'04', name:'Управление контекстом', tasks:[
    {id:13,t:'Отмена по context',d:'medium',s:'todo'},
    {id:14,t:'context.WithTimeout',d:'medium',s:'todo'},
    {id:15,t:'Проброс значений',d:'easy',s:'todo'},
  ]},
  { n:'05', name:'Highload-задачи', tasks:[
    {id:16,t:'Rate limiter (token bucket)',d:'hard',s:'todo'},
    {id:17,t:'Дедупликация запросов',d:'hard',s:'todo'},
    {id:18,t:'Шардированный счётчик',d:'medium',s:'todo'},
    {id:19,t:'Батчинг записей',d:'medium',s:'todo'},
    {id:20,t:'Backpressure',d:'hard',s:'todo'},
  ]},
  { n:'06', name:'Code Review', review:true, tasks:[
    {id:21,t:'Найти гонку в кэше',d:'hard',s:'todo',rev:true},
    {id:22,t:'Утечка горутины в воркере',d:'hard',s:'todo',rev:true},
  ]},
  { n:'07', name:'Воркер-пулы и конвейеры', tasks:[
    {id:23,t:'Простой воркер-пул',d:'easy',s:'solved'},
    {id:24,t:'Пул с результатами',d:'medium',s:'solved'},
    {id:25,t:'Пул с ограничением параллелизма',d:'medium',s:'active'},
    {id:26,t:'Конвейер из трёх стадий',d:'medium',s:'todo'},
    {id:27,t:'Graceful shutdown пула',d:'hard',s:'todo'},
    {id:28,t:'Динамическое масштабирование',d:'hard',s:'todo'},
    {id:29,t:'Приоритетная очередь задач',d:'medium',s:'todo'},
    {id:30,t:'Ретраи с backoff',d:'medium',s:'todo'},
    {id:31,t:'Сбор ошибок (errgroup)',d:'medium',s:'todo'},
    {id:32,t:'Конвейер с отменой',d:'hard',s:'todo'},
  ]},
];

const STARTER = `package workerpool

import "sync"

// WorkerPool обрабатывает jobs не более чем limit горутинами
// одновременно и возвращает результаты в произвольном порядке.
func WorkerPool(jobs []int, limit int, fn func(int) int) []int {
\tresults := make([]int, len(jobs))
\tsem := make(chan struct{}, limit)
\tvar wg sync.WaitGroup

\tfor i, j := range jobs {
\t\twg.Add(1)
\t\tsem <- struct{}{}
\t\tgo func(i, j int) {
\t\t\tdefer wg.Done()
\t\t\tdefer func() { <-sem }()
\t\t\tresults[i] = fn(j)
\t\t}(i, j)
\t}

\twg.Wait()
\treturn results
}`;

const OUT = {
  pass:`$ go test -race -run TestWorkerPool ./...
=== RUN   TestWorkerPool
=== RUN   TestWorkerPool/limit_1
=== RUN   TestWorkerPool/limit_4
=== RUN   TestWorkerPool/limit_exceeds_jobs
--- PASS: TestWorkerPool (0.42s)
    --- PASS: TestWorkerPool/limit_1 (0.10s)
    --- PASS: TestWorkerPool/limit_4 (0.11s)
    --- PASS: TestWorkerPool/limit_exceeds_jobs (0.09s)
PASS
ok      concurrency/workerpool  1.84s`,
  fail:`$ go test -race -run TestWorkerPool ./...
=== RUN   TestWorkerPool
=== RUN   TestWorkerPool/limit_4
    pool_test.go:48: порядок не важен, но сумма результатов неверна:
        ожидалось 90, получено 48
--- FAIL: TestWorkerPool (0.31s)
    --- FAIL: TestWorkerPool/limit_4 (0.12s)
FAIL
exit status 1
FAIL    concurrency/workerpool  0.93s`,
  race:`$ go test -race -run TestWorkerPool ./...
=== RUN   TestWorkerPool
==================
WARNING: DATA RACE
Write at 0x00c0000b4010 by goroutine 9:
  concurrency/workerpool.WorkerPool.func1()
      pool.go:17 +0x84

Previous write at 0x00c0000b4010 by goroutine 8:
  concurrency/workerpool.WorkerPool.func1()
      pool.go:17 +0x84

Goroutine 9 (running) created at:
  concurrency/workerpool.WorkerPool()
      pool.go:14 +0x1f0
==================
--- FAIL: TestWorkerPool (0.28s)
FAIL    concurrency/workerpool  0.71s`,
  compile:`$ go test -race -run TestWorkerPool ./...
# concurrency/workerpool [build failed]
./pool.go:17:11: undefined: reslts
./pool.go:21:2: wg.Wait undefined (type sync.WaitGroup has no field or method Wait)
FAIL    concurrency/workerpool [build failed]`,
  timeout:`$ go test -race -timeout 10s -run TestWorkerPool ./...
=== RUN   TestWorkerPool
panic: test timed out after 10s
\trunning tests:
\t\tTestWorkerPool (10s)

goroutine 34 [chan send]:
concurrency/workerpool.WorkerPool(...)
      pool.go:13 +0x118
fatal error: all goroutines are asleep - deadlock!
FAIL    concurrency/workerpool  10.00s`,
};

const SCENARIOS = [
  {k:'pass',label:'PASS'},{k:'fail',label:'FAIL'},{k:'race',label:'Гонка'},
  {k:'compile',label:'Компиляция'},{k:'timeout',label:'Timeout'},
];
const verdictOf = (k)=> k==='pass'?'pass': k==='timeout'?'timeout': (k==='compile'?'compile':'fail');

/* ── Sidebar ───────────────────────────────────────────────────────────── */
function Sidebar({ collapsed, onToggle, activeId, solved }) {
  const diffColor = (d)=>({easy:'var(--diff-easy)',medium:'var(--diff-medium)',hard:'var(--diff-hard)'}[d]);
  const statusOf = (tk)=> solved.has(tk.id) ? 'solved' : (tk.id===activeId?'active':tk.s);
  const W = collapsed ? 56 : 300;
  return (
    <aside style={{width:W, flexShrink:0, borderRight:'1px solid var(--border-subtle)', background:'var(--bg-surface)', display:'flex', flexDirection:'column', transition:'width var(--dur-base) var(--ease-out)'}}>
      <div style={{height:48, display:'flex', alignItems:'center', gap:8, padding:collapsed?'0 10px':'0 14px', borderBottom:'1px solid var(--border-subtle)'}}>
        {!collapsed && <>
          <span style={{display:'inline-flex',alignItems:'center',gap:8}}>{Ic.search({stroke:'var(--text-tertiary)'})}<span style={{fontSize:13,color:'var(--text-tertiary)'}}>Поиск задач</span></span>
          <span className="mono" style={{marginLeft:'auto',fontSize:11,color:'var(--text-tertiary)',display:'inline-flex',gap:3}}><span style={{padding:'1px 5px',border:'1px solid var(--border-strong)',borderRadius:4}}>⌘K</span></span>
        </>}
      </div>
      {!collapsed && (
        <div style={{padding:'12px 14px', borderBottom:'1px solid var(--border-subtle)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8}}>
            <span style={{fontSize:12,color:'var(--text-secondary)'}}>Прогресс</span>
            <span className="mono" style={{fontSize:13,color:'var(--accent-text)',fontWeight:600}}>{12+(solved.size>12?0:0)}/32</span>
          </div>
          <div style={{height:6,background:'var(--bg-inset)',borderRadius:999,overflow:'hidden'}}><div style={{width:'37.5%',height:'100%',background:'var(--accent)'}}/></div>
        </div>
      )}
      <div style={{flex:1, overflowY:'auto', padding:collapsed?'8px 8px':'8px 8px'}}>
        {TOPICS.map((tp)=>(
          <div key={tp.n} style={{marginBottom:collapsed?6:10}}>
            {!collapsed && (
              <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 8px 4px'}}>
                <span className="mono" style={{fontSize:11,color:'var(--text-tertiary)'}}>{tp.n}</span>
                <span style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)',letterSpacing:'.01em',textTransform:'none'}}>{tp.name}</span>
                {tp.review && <span style={{marginLeft:'auto'}}>{Ic.search({stroke:'var(--violet-400)',width:11,height:11})}</span>}
              </div>
            )}
            {collapsed && <div style={{height:1,background:'var(--border-subtle)',margin:'4px 6px'}}/>}
            {tp.tasks.map((tk)=>{
              const st = statusOf(tk); const active = tk.id===activeId;
              const marker = st==='solved'?Ic.check():st==='attempted'?
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--warning)" strokeWidth="2" strokeDasharray="3 3"/></svg>:
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="var(--border-strong)" strokeWidth="1.5"/></svg>;
              if (collapsed) return (
                <div key={tk.id} title={`${tk.id}. ${tk.t}`} style={{display:'flex',alignItems:'center',justifyContent:'center',height:34,borderRadius:6,background:active?'var(--accent-subtle)':'transparent',position:'relative',cursor:'pointer'}}>
                  {active && <span style={{position:'absolute',left:-2,top:7,bottom:7,width:2,background:'var(--accent)',borderRadius:2}}/>}{marker}
                </div>
              );
              return (
                <div key={tk.id} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 8px 7px 10px',borderRadius:6,position:'relative',cursor:'pointer',background:active?'var(--accent-subtle)':'transparent'}}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background='var(--bg-hover)';}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent';}}>
                  {active && <span style={{position:'absolute',left:0,top:6,bottom:6,width:2.5,background:'var(--accent)',borderRadius:2}}/>}
                  <span style={{flexShrink:0,display:'inline-flex'}}>{marker}</span>
                  <span className="mono" style={{fontSize:12,color:'var(--text-tertiary)',width:18,flexShrink:0}}>{String(tk.id).padStart(2,'0')}</span>
                  <span style={{flex:1,minWidth:0,fontSize:13,color:active?'var(--text-primary)':st==='solved'?'var(--text-secondary)':'var(--text-primary)',fontWeight:active?500:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{tk.t}</span>
                  {tk.rev && <span style={{flexShrink:0}}>{Ic.search({stroke:'var(--violet-400)',width:12,height:12})}</span>}
                  <span style={{width:7,height:7,borderRadius:'50%',background:diffColor(tk.d),flexShrink:0}}/>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <button onClick={onToggle} style={{height:42,border:'none',borderTop:'1px solid var(--border-subtle)',background:'transparent',color:'var(--text-tertiary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontSize:13}}>
        {collapsed? Ic.chevR() : <>{Ic.chevL()} Свернуть</>}
      </button>
    </aside>
  );
}

/* ── Right panel ───────────────────────────────────────────────────────── */
function RightPanel({ width, tab, setTab, solutionUnlocked, onForceUnlock }) {
  const tabs = [
    {value:'cond',label:'Условие'},
    {value:'theory',label:'Теория'},
    {value:'sol',label:'Решение', locked:!solutionUnlocked},
  ];
  return (
    <aside style={{width, flexShrink:0, borderLeft:'1px solid var(--border-subtle)', background:'var(--bg-surface)', display:'flex', flexDirection:'column', minWidth:300}}>
      <div style={{padding:'10px 14px', borderBottom:'1px solid var(--border-subtle)'}}>
        <div role="tablist" style={{display:'inline-flex',gap:2,padding:3,background:'var(--bg-inset)',border:'1px solid var(--border-default)',borderRadius:8,width:'100%'}}>
          {tabs.map(tb=>{
            const sel=tb.value===tab;
            return <button key={tb.value} disabled={tb.locked} onClick={()=>!tb.locked&&setTab(tb.value)}
              style={{flex:1,display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,height:32,fontSize:13,fontWeight:500,
                color:tb.locked?'var(--text-disabled)':sel?'var(--text-primary)':'var(--text-secondary)',
                background:sel?'var(--bg-elevated)':'transparent',border:`1px solid ${sel?'var(--border-strong)':'transparent'}`,borderRadius:6,cursor:tb.locked?'not-allowed':'pointer'}}>
              {tb.label}{tb.locked && Ic.lock({style:{opacity:.7}})}
            </button>;
          })}
        </div>
      </div>
      <div style={{flex:1, overflowY:'auto', padding:'20px 18px'}}>
        {tab==='cond' && <PanelCondition/>}
        {tab==='theory' && <PanelTheory/>}
        {tab==='sol' && (solutionUnlocked ? <PanelSolution/> : <PanelLocked onForce={onForceUnlock}/>)}
      </div>
    </aside>
  );
}
const H = ({children})=> <h3 style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',margin:'0 0 10px'}}>{children}</h3>;
const P = ({children})=> <p style={{fontSize:14,lineHeight:'22px',color:'var(--text-secondary)',margin:'0 0 14px'}}>{children}</p>;
const Code = ({children})=> <code className="mono" style={{fontSize:12.5,color:'var(--code-text)',background:'var(--bg-inset)',border:'1px solid var(--border-subtle)',borderRadius:4,padding:'1px 5px'}}>{children}</code>;

function PanelCondition(){
  return <>
    <div style={{display:'flex',gap:8,marginBottom:16}}>
      <span style={{display:'inline-flex',alignItems:'center',gap:6,height:22,padding:'0 8px',borderRadius:999,fontSize:12,fontWeight:500,color:'var(--diff-medium)',background:'var(--warning-bg)',border:'1px solid var(--warning-border)'}}><span style={{width:6,height:6,borderRadius:'50%',background:'var(--diff-medium)'}}/>medium</span>
      <span style={{display:'inline-flex',alignItems:'center',height:22,padding:'0 8px',borderRadius:6,fontSize:12,fontFamily:'var(--font-mono)',color:'var(--text-secondary)',background:'var(--bg-elevated)',border:'1px solid var(--border-default)'}}>functional</span>
    </div>
    <H>Постановка</H>
    <P>Реализуй <Code>WorkerPool</Code>, который обрабатывает срез <Code>jobs</Code> не более чем <Code>limit</Code> горутинами одновременно. Каждое значение прогоняется через <Code>fn</Code>; результат сохраняется по тому же индексу. Порядок выполнения не важен — важно соответствие индексов.</P>
    <H>Сигнатура</H>
    <div style={{background:'var(--bg-inset)',border:'1px solid var(--border-default)',borderRadius:8,padding:'12px 14px',marginBottom:14}}>
      <pre className="mono" style={{margin:0,fontSize:12.5,lineHeight:'20px',whiteSpace:'pre-wrap'}}><span style={{color:'var(--code-keyword)'}}>func</span> <span style={{color:'var(--code-func)'}}>WorkerPool</span>(jobs []<span style={{color:'var(--code-type)'}}>int</span>, limit <span style={{color:'var(--code-type)'}}>int</span>,{'\n'}{'  '}fn <span style={{color:'var(--code-keyword)'}}>func</span>(<span style={{color:'var(--code-type)'}}>int</span>) <span style={{color:'var(--code-type)'}}>int</span>) []<span style={{color:'var(--code-type)'}}>int</span></pre>
    </div>
    <H>Требования</H>
    <ul style={{margin:0,paddingLeft:18,fontSize:14,lineHeight:'24px',color:'var(--text-secondary)'}}>
      <li>не более <Code>limit</Code> одновременных горутин;</li>
      <li>результат <Code>results[i] == fn(jobs[i])</Code>;</li>
      <li>чистый прогон под <Code>-race</Code>;</li>
      <li>без утечек горутин после возврата.</li>
    </ul>
  </>;
}
function PanelTheory(){
  return <>
    <span style={{fontFamily:'var(--font-mono)',fontSize:11,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--accent-text)'}}>Читать до решения</span>
    <H><span style={{marginTop:12,display:'block'}}>Ограничение параллелизма</span></H>
    <P>Классический приём — счётный семафор на буферизованном канале. Ёмкость канала равна максимуму одновременных горутин: запись <Code>sem &lt;- struct{}{}</Code> блокируется, когда «слотов» нет.</P>
    <div style={{display:'flex',gap:10,padding:'12px 14px',background:'var(--warning-bg)',border:'1px solid var(--warning-border)',borderRadius:8,marginBottom:14}}>
      <span style={{flexShrink:0,marginTop:1}}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--warning-fg)" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg></span>
      <div><div style={{fontSize:13,fontWeight:600,color:'var(--warning-fg)',marginBottom:3}}>Грабли</div><div style={{fontSize:13.5,lineHeight:'21px',color:'var(--text-secondary)'}}>Захватывай переменные цикла (<Code>i, j</Code>) параметрами горутины. Иначе все горутины увидят последнее значение — и получишь гонку или неверный индекс.</div></div>
    </div>
    <P>Запись в <Code>results[i]</Code> по разным <Code>i</Code> безопасна без мьютекса: горутины пишут в непересекающиеся ячейки. А вот <Code>append</Code> в общий слайс — уже гонка.</P>
    <div style={{display:'flex',gap:10,padding:'12px 14px',background:'var(--info-bg)',border:'1px solid var(--info-border)',borderRadius:8}}>
      <span style={{flexShrink:0,marginTop:1}}>{Ic.book({stroke:'var(--accent-text)',width:16,height:16})}</span>
      <div style={{fontSize:13.5,lineHeight:'21px',color:'var(--text-secondary)'}}>Глубже — в учебнике: <a href="../textbook/index.html">Паттерны конкурентности → Семафоры</a> и <a href="../textbook/index.html">Утечки и гонки</a>.</div>
    </div>
  </>;
}
function PanelLocked({ onForce }){
  return <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 16px'}}>
    <div style={{width:48,height:48,borderRadius:12,background:'var(--bg-elevated)',border:'1px solid var(--border-default)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-tertiary)',marginBottom:16}}>{Ic.lock({width:20,height:20})}</div>
    <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>Решение заблокировано</div>
    <p style={{fontSize:14,lineHeight:'22px',color:'var(--text-secondary)',maxWidth:240,margin:'0 0 20px'}}>Эталонный разбор откроется, когда тесты пройдут. Сначала попробуй сам.</p>
    <button onClick={onForce} style={{height:36,padding:'0 16px',borderRadius:8,border:'1px solid var(--border-strong)',background:'transparent',color:'var(--text-secondary)',fontSize:13,fontWeight:500,cursor:'pointer'}}>Показать всё равно</button>
  </div>;
}
function PanelSolution(){
  const sol = `func WorkerPool(jobs []int, limit int, fn func(int) int) []int {
\tresults := make([]int, len(jobs))
\tsem := make(chan struct{}, limit)
\tvar wg sync.WaitGroup
\tfor i, j := range jobs {
\t\twg.Add(1)
\t\tsem <- struct{}{}
\t\tgo func(i, j int) {
\t\t\tdefer wg.Done()
\t\t\tdefer func() { <-sem }()
\t\t\tresults[i] = fn(j)
\t\t}(i, j)
\t}
\twg.Wait()
\treturn results
}`;
  return <>
    <div style={{display:'inline-flex',alignItems:'center',gap:7,marginBottom:14}}>{Ic.check()}<span style={{fontSize:13,color:'var(--success-fg)',fontWeight:500}}>Задача решена</span></div>
    <H>Эталон по шагам</H>
    <ol style={{margin:'0 0 16px',paddingLeft:18,fontSize:14,lineHeight:'23px',color:'var(--text-secondary)'}}>
      <li>Семафор <Code>sem</Code> ёмкостью <Code>limit</Code> ограничивает параллелизм.</li>
      <li>Слот занимается <i>до</i> запуска горутины — так живых горутин не больше лимита.</li>
      <li><Code>results[i]</Code> пишется по своему индексу — гонки нет.</li>
      <li><Code>wg.Wait()</Code> гарантирует, что все завершились до возврата.</li>
    </ol>
    <div style={{background:'var(--bg-inset)',border:'1px solid var(--border-default)',borderRadius:8,overflow:'hidden',marginBottom:16}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',borderBottom:'1px solid var(--border-subtle)',background:'var(--bg-surface)'}}>{Ic.doc({stroke:'var(--text-tertiary)'})}<span className="mono" style={{fontSize:12,color:'var(--text-secondary)'}}>pool.go</span></div>
      <pre className="mono" style={{margin:0,padding:'12px 14px',fontSize:12,lineHeight:'18px',overflowX:'auto'}}><code>{hl(sol)}</code></pre>
    </div>
    <H>Вопросы интервьюера</H>
    <ul style={{margin:0,paddingLeft:18,fontSize:14,lineHeight:'23px',color:'var(--text-secondary)'}}>
      <li>Что изменится, если <Code>fn</Code> может паниковать?</li>
      <li>Как добавить отмену через <Code>context.Context</Code>?</li>
      <li>Чем это отличается от пула на фиксированных воркерах с общим каналом задач?</li>
    </ul>
  </>;
}

/* ── Editor + Terminal ─────────────────────────────────────────────────── */
function Editor({ code, runState }){
  const lines = code.split('\n');
  const errLine = runState==='compile'?17:null;
  return (
    <div style={{flex:1, minHeight:0, display:'flex', flexDirection:'column', background:'var(--bg-inset)'}}>
      {/* file tab */}
      <div style={{display:'flex',alignItems:'stretch',borderBottom:'1px solid var(--border-subtle)',background:'var(--bg-surface)',flexShrink:0}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'0 16px',height:40,borderRight:'1px solid var(--border-subtle)',borderBottom:'2px solid var(--accent)',background:'var(--bg-inset)'}}>
          {Ic.doc({stroke:'var(--accent-text)'})}<span className="mono" style={{fontSize:12.5,color:'var(--text-primary)'}}>pool.go</span>
        </div>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'0 16px',height:40,color:'var(--text-tertiary)'}}>
          {Ic.doc({stroke:'var(--text-tertiary)'})}<span className="mono" style={{fontSize:12.5}}>pool_test.go</span>
          <span style={{fontSize:11,color:'var(--text-disabled)'}}>readonly</span>
        </div>
      </div>
      {/* code */}
      <div style={{flex:1, minHeight:0, overflow:'auto'}}>
        <pre className="mono" style={{margin:0,padding:'12px 0',fontSize:13,lineHeight:'21px'}}><code style={{display:'block',minWidth:'max-content'}}>
          {lines.map((ln,i)=>{
            const isErr = errLine===i+1;
            return <span key={i} style={{display:'flex',background:isErr?'var(--error-bg)':'transparent',boxShadow:isErr?'inset 2px 0 0 var(--error)':'none'}}>
              <span style={{flexShrink:0,width:48,paddingRight:16,textAlign:'right',color:'var(--text-tertiary)',userSelect:'none',opacity:.6}}>{i+1}</span>
              <span style={{flex:1,paddingRight:18,whiteSpace:'pre',color:'var(--code-text)'}}>{hl(ln)}{ln===''?' ':''}</span>
            </span>;
          })}
        </code></pre>
      </div>
    </div>
  );
}

const VERD = {
  idle:{label:'Готов к запуску',fg:'var(--text-tertiary)',dot:'var(--text-tertiary)'},
  running:{label:'Выполняется…',fg:'var(--accent-text)',dot:'var(--accent)'},
  pass:{label:'PASS',fg:'var(--success-fg)',dot:'var(--success)'},
  fail:{label:'FAIL',fg:'var(--error-fg)',dot:'var(--error)'},
  timeout:{label:'TIMEOUT',fg:'var(--warning-fg)',dot:'var(--warning)'},
  compile:{label:'Ошибка компиляции',fg:'var(--error-fg)',dot:'var(--error)'},
};
function TermLine({line}){
  let c='var(--code-text)'; const t=line.trimStart();
  if (/^(ok|PASS|--- PASS|=== RUN|\s*--- PASS)/.test(t)) c='var(--success-fg)';
  else if (/^(FAIL|--- FAIL|panic:|fatal error|exit status|\s*--- FAIL|.*_test\.go:\d+:|\.\/pool\.go|# )/.test(t)) c='var(--error-fg)';
  else if (/^(WARNING: DATA RACE|====)/.test(t)) c='var(--warning-fg)';
  else if (/^(Write|Previous|Read|Goroutine|running tests|goroutine|concurrency)/.test(t)) c='var(--text-secondary)';
  else if (t.startsWith('$')) c='var(--text-tertiary)';
  else if (/pool\.go:\d+/.test(t)) c='var(--text-secondary)';
  return <div style={{whiteSpace:'pre-wrap',color:c}}>{line===''?'\u00a0':line}</div>;
}
function Terminal({ runState, output, duration, height }){
  const v = VERD[runState]||VERD.idle;
  const lines = output? output.split('\n'):[];
  const glow = runState==='pass'?'var(--glow-success)':runState==='fail'||runState==='compile'?'var(--glow-error)':'none';
  return (
    <div style={{height, flexShrink:0, background:'var(--bg-terminal)', borderTop:'1px solid var(--border-default)', display:'flex', flexDirection:'column', boxShadow:glow}}>
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--border-subtle)',flexShrink:0}}>
        <span className="mono" style={{fontSize:12,color:'var(--text-tertiary)'}}>go test -race ./...</span>
        <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:7}}>
          {runState==='running'
            ? <span style={{width:9,height:9,borderRadius:'50%',border:'1.5px solid var(--accent)',borderTopColor:'transparent',animation:'sp .7s linear infinite'}}/>
            : <span style={{width:8,height:8,borderRadius:'50%',background:v.dot,boxShadow:(runState==='pass'||runState==='fail')?`0 0 8px ${v.dot}`:'none'}}/>}
          <span className="mono" style={{fontSize:12,fontWeight:500,color:v.fg,letterSpacing:'.04em'}}>{v.label}</span>
          {duration && <span className="mono" style={{fontSize:11,color:'var(--text-tertiary)'}}>{duration}</span>}
        </span>
      </div>
      <div style={{flex:1,overflow:'auto',padding:lines.length?'10px 14px':0}}>
        {lines.length? lines.map((l,i)=><TermLine key={i} line={l}/>) :
          <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-tertiary)',fontSize:12,fontFamily:'var(--font-mono)'}}>Запусти тесты, чтобы увидеть вывод · ⌘↵</div>}
        <style>{`@keyframes sp{to{transform:rotate(360deg)}} pre,div{font-family:var(--font-mono);font-size:12.5px;line-height:19px;}`}</style>
      </div>
    </div>
  );
}

/* ── App ───────────────────────────────────────────────────────────────── */
function App(){
  const [collapsed,setCollapsed] = useState(false);
  const [runState,setRunState] = useState('idle');   // idle running pass fail timeout compile
  const [scenario,setScenario] = useState('pass');
  const [tab,setTab] = useState('cond');
  const [solved,setSolved] = useState(new Set([1,2,3,4,5,6,9,10,23,24,2]));
  const [unlocked,setUnlocked] = useState(false);
  const [termH,setTermH] = useState(208);
  const [toast,setToast] = useState(null);
  const timer = useRef();

  const run = useCallback(()=>{
    clearTimeout(timer.current);
    setRunState('running');
    const dur = scenario==='timeout'?1400:1000;
    timer.current = setTimeout(()=>{
      const v = verdictOf(scenario);
      setRunState(v);
      if (v==='pass'){ setSolved(s=>new Set([...s,25])); setUnlocked(true); setToast('Задача решена · Решение разблокировано'); setTimeout(()=>setToast(null),3200); }
    }, dur);
  },[scenario]);

  useEffect(()=>{
    const h=(e)=>{ if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();run();} };
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h);
  },[run]);

  // terminal drag-resize
  const dragRef = useRef(null);
  const onDrag = (e)=>{
    e.preventDefault();
    const startY=e.clientY, startH=termH;
    const move=(ev)=>setTermH(Math.max(64,Math.min(460,startH+(startY-ev.clientY))));
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  };

  const out = runState==='idle'||runState==='running'? '' : OUT[scenario];
  const dur = runState==='pass'?'1.84s':runState==='fail'?'0.93s':runState==='timeout'?'10.0s':runState==='compile'?'0.2s':runState==='race'?'0.71s':undefined;

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'var(--bg-canvas)'}}>
      {/* HEADER */}
      <header style={{height:48,flexShrink:0,display:'flex',alignItems:'center',gap:14,padding:'0 14px',borderBottom:'1px solid var(--border-subtle)',background:'var(--bg-surface)'}}>
        <a href="../landing/index.html" style={{display:'inline-flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <svg width="22" height="22" viewBox="0 0 28 28"><rect width="28" height="28" rx="7" fill="var(--accent)"/><path d="M8 10.5h7.5a3.5 3.5 0 0 1 0 7H10l2.4-2.4M8 17.5h-.5" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
        </a>
        <div style={{display:'flex',alignItems:'center',gap:7,minWidth:0}}>
          <span className="mono" style={{fontSize:12,color:'var(--text-tertiary)'}}>Топик 07</span>
          {Ic.chevR({stroke:'var(--text-disabled)',width:13,height:13})}
          <span style={{fontSize:13,color:'var(--text-secondary)',whiteSpace:'nowrap'}}>Воркер-пулы</span>
          {Ic.chevR({stroke:'var(--text-disabled)',width:13,height:13})}
          <span style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',whiteSpace:'nowrap'}}>25 · Пул с ограничением</span>
        </div>
        {/* scenario switcher (demo) */}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
          <span className="mono" style={{fontSize:11,color:'var(--text-disabled)'}}>демо-сценарий</span>
          <div style={{display:'inline-flex',gap:2,padding:2,background:'var(--bg-inset)',border:'1px solid var(--border-default)',borderRadius:7}}>
            {SCENARIOS.map(s=>{
              const sel=s.k===scenario;
              return <button key={s.k} onClick={()=>{setScenario(s.k);setRunState('idle');}}
                style={{height:24,padding:'0 9px',fontSize:11.5,fontWeight:500,fontFamily:'var(--font-mono)',color:sel?'var(--text-primary)':'var(--text-tertiary)',background:sel?'var(--bg-elevated)':'transparent',border:`1px solid ${sel?'var(--border-strong)':'transparent'}`,borderRadius:5,cursor:'pointer'}}>{s.label}</button>;
            })}
          </div>
        </div>
        <div style={{width:1,height:22,background:'var(--border-subtle)'}}/>
        <div style={{display:'flex',gap:4}}>
          <button title="Назад" style={navBtn}>{Ic.chevL()}</button>
          <button title="Дальше" style={navBtn}>{Ic.chevR()}</button>
        </div>
      </header>

      {/* BODY */}
      <div style={{flex:1,minHeight:0,display:'flex'}}>
        <Sidebar collapsed={collapsed} onToggle={()=>setCollapsed(c=>!c)} activeId={25} solved={solved}/>
        {/* center */}
        <main style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
          {/* toolbar */}
          <div style={{height:48,flexShrink:0,display:'flex',alignItems:'center',gap:10,padding:'0 14px',borderBottom:'1px solid var(--border-subtle)',background:'var(--bg-surface)'}}>
            <button onClick={run} disabled={runState==='running'} style={{display:'inline-flex',alignItems:'center',gap:8,height:34,padding:'0 14px',borderRadius:8,border:'none',background:runState==='running'?'var(--grey-800)':'var(--accent)',color:runState==='running'?'var(--text-secondary)':'#fff',fontSize:13.5,fontWeight:500,cursor:runState==='running'?'default':'pointer'}}>
              {runState==='running'? <span style={{width:14,height:14,borderRadius:'50%',border:'2px solid currentColor',borderTopColor:'transparent',animation:'sp .7s linear infinite'}}/> : Ic.play()}
              {runState==='running'?'Выполняется':'Запустить тесты'}
              <span className="mono" style={{fontSize:11,opacity:.8,padding:'1px 5px',background:'rgba(255,255,255,.16)',borderRadius:4}}>⌘↵</span>
            </button>
            <button onClick={()=>setRunState('idle')} style={{display:'inline-flex',alignItems:'center',gap:7,height:34,padding:'0 13px',borderRadius:8,border:'1px solid var(--border-strong)',background:'transparent',color:'var(--text-secondary)',fontSize:13.5,fontWeight:500,cursor:'pointer'}}>{Ic.reset()} Сбросить</button>
            <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text-tertiary)'}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'var(--success)'}}/>Go 1.22 · -race
            </span>
          </div>
          <Editor code={STARTER} runState={runState}/>
          {/* drag handle */}
          <div onPointerDown={onDrag} style={{height:6,flexShrink:0,cursor:'ns-resize',background:'var(--bg-surface)',borderTop:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{width:34,height:3,borderRadius:2,background:'var(--border-strong)'}}/>
          </div>
          <Terminal runState={runState} output={out} duration={dur} height={termH}/>
        </main>
        <RightPanel width={collapsed?420:380} tab={tab} setTab={setTab} solutionUnlocked={unlocked} onForceUnlock={()=>setUnlocked(true)}/>
      </div>

      {/* toast */}
      {toast && (
        <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',zIndex:1100,display:'inline-flex',alignItems:'center',gap:10,padding:'11px 16px',background:'var(--bg-elevated)',border:'1px solid var(--success-border)',borderRadius:10,boxShadow:'var(--shadow-lg)'}}>
          {Ic.check()}<span style={{fontSize:13.5,color:'var(--text-primary)',fontWeight:500}}>{toast}</span>
        </div>
      )}
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
const navBtn = {display:'inline-flex',alignItems:'center',justifyContent:'center',width:32,height:32,borderRadius:7,border:'1px solid var(--border-default)',background:'transparent',color:'var(--text-secondary)',cursor:'pointer'};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
