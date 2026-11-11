import { useMemo, useState } from 'react';
import { generateAllNets } from './core/topology/generateNets';
import { validateClosure, validateTopology } from './core/validation/validateNet';
import { NetScene } from './render/NetScene';
import './styles.css';

export default function App() {
  const nets = useMemo(() => generateAllNets({ l: 2, w: 2, h: 2 }, true), []);
  const [patternId, setPatternId] = useState(1);
  const [foldProgress, setFoldProgress] = useState(0);
  const net = nets.find((candidate) => candidate.patternId === patternId) ?? nets[0];
  const topologyIssues = useMemo(() => validateTopology(net), [net]);
  const closureIssues = useMemo(() => validateClosure(net), [net]);

  return (
    <main className="app-shell">
      <aside className="panel">
        <div>
          <p className="eyebrow">KNOL MATH · NET ENGINE</p>
          <h1>전개도 접힘 · 숨은 모서리</h1>
          <p className="description">보이는 모서리는 실선, 현재 시점에서 면에 가려지는 구간은 점선으로 다시 계산합니다.</p>
        </div>

        <label>
          전개도
          <select value={patternId} onChange={(event) => setPatternId(Number(event.target.value))}>
            {nets.map((candidate) => (
              <option key={candidate.id} value={candidate.patternId}>
                정육면체 전개도 {candidate.patternId}
              </option>
            ))}
          </select>
        </label>

        <label>
          접기 <strong>{Math.round(foldProgress)}%</strong>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={foldProgress}
            onChange={(event) => setFoldProgress(Number(event.target.value))}
          />
        </label>

        <div className="button-row">
          <button onClick={() => setFoldProgress(0)}>펼치기</button>
          <button className="primary" onClick={() => setFoldProgress(100)}>완전히 접기</button>
        </div>

        <section className="status-card">
          <span className={topologyIssues.length === 0 ? 'ok' : 'bad'}>
            Topology {topologyIssues.length === 0 ? '정상' : '오류'}
          </span>
          <span className={closureIssues.length === 0 ? 'ok' : 'bad'}>
            100% Closure {closureIssues.length === 0 ? '정상' : '오류'}
          </span>
        </section>
        <p className="hint">마우스 또는 터치로 입체를 회전하세요. 회전 중에도 시점 기준 가시성을 다시 계산합니다.</p>
      </aside>
      <section className="viewport">
        <NetScene net={net} foldProgress={foldProgress} />
      </section>
    </main>
  );
}
