import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaHistorico.css';
import '../css/GestorMotoristas.css';
import AvatarDropdown from '../components/AvatarDropdown';
import Loading from '../components/Loading';
import useMinLoading from '../hooks/useMinLoading';
import '../css/global.css';
import { toastSucesso, toastErro, toastAviso, toastInfo, confirmar } from '../components/toast';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const fmtDate = (str) => {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
};

export default function MotoristaRelatorio() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [dados, setDados]           = useState(null);
  const [loading, setLoading]       = useMinLoading();
  const [filtering, setFiltering]   = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [dataInicio, setDataInicio] = useState(todayStr);
  const [dataFim,    setDataFim]    = useState(todayStr);
  const [sortCol,    setSortCol]    = useState(null);
  const [sortDir,    setSortDir]    = useState(1);
  const [apiStatus, setApiStatus]   = useState({ relatorio: false });
  const firstRenderRef = useRef(true);

  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');
  useEffect(() => { document.body.className = tema; localStorage.setItem('tema', tema); }, [tema]);
  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

  // Carregamento inicial
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = localStorage.getItem('user_logado');
    if (!token || !user) { navigate('/login'); return; }
    fetchRelatorio(dataInicio, dataFim, true);
  }, [navigate]);

  // Mudança de datas — silenciosa
  useEffect(() => {
    if (firstRenderRef.current) { firstRenderRef.current = false; return; }
    if (dataInicio <= dataFim) fetchRelatorio(dataInicio, dataFim, false);
  }, [dataInicio, dataFim]);

  const fetchRelatorio = async (di, df, fullLoad = false) => {
    try {
      if (fullLoad) setLoading(true); else setFiltering(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:3000/api/relatorios/motorista?dataInicio=${di}&dataFim=${df}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setDados(data);
        if (fullLoad) setApiStatus({ relatorio: true });
      } else {
        if (fullLoad) setApiStatus({ relatorio: true });
      }
    } catch {
      if (fullLoad) setApiStatus({ relatorio: true });
    } finally {
      if (!fullLoad) setFiltering(false);
    }
  };

  const currentLabel = dataInicio === dataFim
    ? fmtDate(dataInicio)
    : `${fmtDate(dataInicio)} – ${fmtDate(dataFim)}`;

  const handleSort = (col) => {
    setSortDir(prev => sortCol === col ? prev * -1 : 1);
    setSortCol(col);
  };

  const SortIcon = ({ col }) => (
    <span className="sort-icon">
      <span className={`up ${sortCol === col && sortDir === 1  ? 'active' : ''}`} />
      <span className={`dn ${sortCol === col && sortDir === -1 ? 'active' : ''}`} />
    </span>
  );

  const sortedViagens = [...(dados?.viagens ?? [])].sort((a, b) => {
    if (!sortCol) return 0;
    const val = v => {
      if (sortCol === 'cliente')  return v.cliente  ?? '';
      if (sortCol === 'origem')   return v.origem   ?? '';
      if (sortCol === 'destino')  return v.destino  ?? '';
      if (sortCol === 'km')       return Number(v.km)    || 0;
      if (sortCol === 'preco')    return Number(v.preco) || 0;
      if (sortCol === 'rating')   return Number(v.rating) || 0;
      if (sortCol === 'data') {
        const [d, m, y] = (v.data ?? '').split('/');
        return new Date(`${y}-${m}-${d}T${v.hora ?? '00:00'}`).getTime() || 0;
      }
      return '';
    };
    const va = val(a), vb = val(b);
    if (typeof va === 'number') return (va - vb) * sortDir;
    return String(va).localeCompare(String(vb), 'pt') * sortDir;
  });

  const exportarPDF = () => {
    try {
      setExporting(true);
      if (!dados) throw new Error('Sem dados');

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const M = 40;
      const CW = W - M * 2;
      const checkY = (y, need = 60) => { if (y + need > H - 45) { doc.addPage(); return M; } return y; };
      const truncate = (s, max) => { const t = String(s ?? '—'); return t.length > max ? t.slice(0, max-1) + '…' : t; };

      // Header
      doc.setFillColor(10, 18, 35);
      doc.rect(0, 0, W, 78, 'F');
      doc.setFillColor(245, 197, 24);
      doc.rect(0, 75, W, 3, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(28); doc.setTextColor(245, 197, 24);
      doc.text('Need4Rides', M, 38);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(180, 190, 210);
      doc.text('Relatório do Motorista', M, 57);
      doc.setFontSize(9); doc.setTextColor(160, 170, 190);
      doc.text(`Período: ${currentLabel}`, W - M, 38, { align: 'right' });
      doc.text(`Gerado: ${new Date().toLocaleString('pt-PT')}`, W - M, 53, { align: 'right' });

      let y = 98;

      // Stat cards
      const r = dados.resumo;
      const stats = [
        { label: 'Viagens',      value: String(r.viagens ?? 0),       color: [245, 180, 0]   },
        { label: 'Ganhos',       value: `€${r.ganhos ?? '0.00'}`,     color: [34, 197, 94]   },
        { label: 'Km Percorridos', value: `${r.km ?? '0.0'} km`,      color: [59, 130, 246]  },
        { label: 'Rating Médio', value: r.ratingMedio ?? '—',         color: [168, 85, 247]  },
      ];
      const cardW = (CW - 15) / 4;
      stats.forEach((s, i) => {
        const cx = M + i * (cardW + 5);
        doc.setFillColor(248, 249, 251); doc.roundedRect(cx, y, cardW, 62, 4, 4, 'F');
        doc.setFillColor(...s.color);    doc.roundedRect(cx, y, cardW,  4, 2, 2, 'F');
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 110, 120);
        doc.text(s.label.toUpperCase(), cx + cardW / 2, y + 20, { align: 'center' });
        doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 30);
        doc.text(s.value, cx + cardW / 2, y + 44, { align: 'center' });
      });
      y += 82;

      // Section title helper
      const sectionTitle = (title, yPos) => {
        doc.setFillColor(245, 197, 24); doc.rect(M, yPos, 3, 14, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 20, 30);
        doc.text(title, M + 10, yPos + 11);
        return yPos + 22;
      };

      // Trips table
      y = checkY(y, 50);
      y = sectionTitle(`Viagens do Período — ${currentLabel} (${dados.viagens.length})`, y);

      const rowH = 21;
      const headers = ['Cliente', 'Origem', 'Destino', 'Data/Hora', 'Km', 'Preço', 'Rating'];
      const colW    = [85, 100, 100, 90, 45, 50, 45]; // total = 515 ≈ CW
      const tableW  = CW;

      doc.setFillColor(10, 18, 35); doc.rect(M, y, tableW, rowH, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(245, 197, 24);
      let cx = M;
      headers.forEach((h, i) => { doc.text(h, cx + 5, y + 14); cx += colW[i]; });
      y += rowH;

      if (dados.viagens.length === 0) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 135);
        doc.text('Sem viagens no período selecionado.', M + 10, y + 14);
        y += rowH;
      } else {
        dados.viagens.forEach((v, idx) => {
          y = checkY(y, rowH + 2);
          if (idx % 2 === 0) { doc.setFillColor(247, 248, 250); doc.rect(M, y, tableW, rowH, 'F'); }
          doc.setDrawColor(225, 226, 232); doc.line(M, y + rowH, M + tableW, y + rowH);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(45, 45, 55);
          const cells = [
            v.cliente, v.origem, v.destino,
            `${v.data} ${v.hora}`,
            `${v.km} km`,
            `€${Number(v.preco).toFixed(2)}`,
            v.rating != null ? String(v.rating) : '—',
          ];
          cx = M;
          cells.forEach((cell, i) => {
            const max = Math.max(6, Math.floor(colW[i] / 5.2));
            doc.text(truncate(cell, max), cx + 5, y + 14);
            cx += colW[i];
          });
          y += rowH;
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(240, 241, 244); doc.rect(0, H - 28, W, 28, 'F');
        doc.setFillColor(245, 197, 24);  doc.rect(0, H - 28, W,  2, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(120, 120, 135);
        doc.text('Need4Rides — Documento Confidencial', M, H - 10);
        doc.text(`Página ${p} de ${totalPages}`, W - M, H - 10, { align: 'right' });
      }

      doc.save(`relatorio-motorista-${dataInicio}-${dataFim}.pdf`);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      toastErro('Falha ao gerar o PDF.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <Loading tasks={Object.values(apiStatus)} onFinished={() => setLoading(false)} />;
  }

  const USERNAME = JSON.parse(localStorage.getItem('user_logado')).nome;
  const resumo = dados?.resumo;

  return (
    <div className="mhist-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mhist-overlay" />

      <nav className="mh-navbar">
        <span className="mh-logo">Need4Rides</span>

        <div className={`mh-hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </div>

        <ul className={`mh-nav-links ${menuOpen ? 'active' : ''}`}>
          <li className="mh-profile-li avatarHamburguer">
            <AvatarDropdown profilePath="/motorista/perfil" avatarClass="mh-avatar" />
            <span className="mh-profile-pill-name">{USERNAME}</span>
          </li>
          <li><a onClick={() => navigate('/motorista')}>Dashboard</a></li>
          <li><a onClick={() => navigate('/motorista/reabastecimento')}>Reabastecimento</a></li>
          <li><a onClick={() => navigate('/motorista/historico')}>Histórico</a></li>
          <li><a className="active">Relatório</a></li>
          <li><a onClick={() => navigate('/motorista/suporte')}>Suporte</a></li>
          <li>
            <button className="mh-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>
          <li className="mh-profile-li avatarNormal">
            <div className="mh-profile-pill">
              <span className="mh-profile-pill-name">{USERNAME}</span>
              <AvatarDropdown profilePath="/motorista/perfil" avatarClass="mh-avatar" />
            </div>
          </li>
        </ul>
      </nav>

      <div className="mhist-wrapper">

        {/* HEADER */}
        <div className="mhist-header">
          <div>
            <h1 className="mhist-title">Relatório</h1>
            <p className="mhist-sub">As tuas estatísticas no período selecionado</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Date range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>De</label>
                <input
                  type="date"
                  value={dataInicio}
                  max={dataFim}
                  onChange={e => setDataInicio(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px', color: '#f0f0f0', padding: '6px 10px',
                    fontSize: '0.82rem', colorScheme: 'dark', cursor: 'pointer',
                  }}
                />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '16px', marginTop: '14px' }}>—</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  Até
                  {filtering && (
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', border: '2px solid #f5c518', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  )}
                </label>
                <input
                  type="date"
                  value={dataFim}
                  min={dataInicio}
                  onChange={e => setDataFim(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px', color: '#f0f0f0', padding: '6px 10px',
                    fontSize: '0.82rem', colorScheme: 'dark', cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            {/* Export */}
            <button
              className="btn-exportar-pdf"
              onClick={exportarPDF}
              disabled={exporting}
              style={{ marginTop: '14px' }}
            >
              {exporting ? '⏳ A exportar...' : '↓ Exportar PDF'}
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="mhist-stats" style={{ opacity: filtering ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <div className="mhist-stat">
            <span className="mhist-stat-label">Viagens no período</span>
            <span className="mhist-stat-value">{resumo?.viagens ?? 0}</span>
          </div>
          <div className="mhist-stat accent">
            <span className="mhist-stat-label">Ganhos no período</span>
            <span className="mhist-stat-value">€{resumo?.ganhos ?? '0.00'}</span>
          </div>
          <div className="mhist-stat">
            <span className="mhist-stat-label">Km percorridos</span>
            <span className="mhist-stat-value">{resumo?.km ?? '0.0'} km</span>
          </div>
          <div className="mhist-stat">
            <span className="mhist-stat-label">Rating médio</span>
            <span className="mhist-stat-value">{resumo?.ratingMedio ?? '—'} ★</span>
          </div>
        </div>

        {/* TABELA */}
        <div className="mhist-card" style={{ padding: 0, overflow: 'hidden', opacity: filtering ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <div style={{ padding: '1rem 1.4rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, color: '#f0f0f0', fontSize: '1rem', fontWeight: 700 }}>
              Viagens — {currentLabel}
            </h3>
            <span className="mhist-detail">{sortedViagens.length} viagens</span>
          </div>

          {sortedViagens.length > 0 ? (
            <div className="gm-table-wrap">
              <table className="gm-table">
                <thead>
                  <tr>
                    <th className={sortCol === 'cliente'  ? (sortDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSort('cliente')}>
                      Cliente <SortIcon col="cliente" />
                    </th>
                    <th className={sortCol === 'origem'   ? (sortDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSort('origem')}>
                      Origem <SortIcon col="origem" />
                    </th>
                    <th className={sortCol === 'destino'  ? (sortDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSort('destino')}>
                      Destino <SortIcon col="destino" />
                    </th>
                    <th className={sortCol === 'data'     ? (sortDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSort('data')}>
                      Data/Hora <SortIcon col="data" />
                    </th>
                    <th className={sortCol === 'km'       ? (sortDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSort('km')}>
                      Km <SortIcon col="km" />
                    </th>
                    <th className={sortCol === 'preco'    ? (sortDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSort('preco')}>
                      Preço <SortIcon col="preco" />
                    </th>
                    <th className={sortCol === 'rating'   ? (sortDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSort('rating')}>
                      Rating <SortIcon col="rating" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedViagens.map(v => (
                    <tr key={String(v.id)}>
                      <td className="gm-nome">{v.cliente}</td>
                      <td className="gm-muted">{v.origem}</td>
                      <td className="gm-muted">{v.destino}</td>
                      <td className="gm-muted">{v.data} {v.hora}</td>
                      <td className="gm-muted">{v.km} km</td>
                      <td className="gm-ganhos">€{Number(v.preco).toFixed(2)}</td>
                      <td className="gm-muted">{v.rating != null ? `${v.rating} ★` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              Nenhuma viagem no período selecionado
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
