import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import heroBg from '../assets/images/LA.jpg';
import ddImg from '../assets/images/fennec.jpg';
import '../css/MotoristaHome.css';
import '../css/GestorMotoristas.css';
import AvatarDropdown from '../components/AvatarDropdown';
import Loading from '../components/Loading';
import useMinLoading from '../hooks/useMinLoading';

export default function GestorHome() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState({ nome: 'Utilizador' });
  const [relatoriosData, setRelatoriosData] = useState(null);
  const [loading, setLoading] = useMinLoading();
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const [dataInicio, setDataInicio] = useState(todayStr);
  const [dataFim,    setDataFim]    = useState(todayStr);
  const [exporting, setExporting] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [sortMotCol, setSortMotCol] = useState(null);
  const [sortMotDir, setSortMotDir] = useState(1);
  const [sortViaCol, setSortViaCol] = useState(null);
  const [sortViaDir, setSortViaDir] = useState(1);
  const [apiStatus, setApiStatus] = useState({
    relatorios: false
  });
  const firstRenderRef = useRef(true);

  // Carregamento inicial — mostra o ecrã de loading completo
  useEffect(() => {
    const storedUser = localStorage.getItem('user_logado');
    const token = localStorage.getItem('token');
    if (!token || !storedUser) {
      navigate('/login');
    } else {
      setUserData(JSON.parse(storedUser));
      fetchRelatorios(dataInicio, dataFim, true);
    }
  }, [navigate]);

  // Mudança de datas — atualização silenciosa, sem ecrã de loading
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    console.log('[dateEffect] dataInicio:', dataInicio, 'dataFim:', dataFim);
    if (dataInicio <= dataFim) fetchRelatorios(dataInicio, dataFim, false);
  }, [dataInicio, dataFim]);

  const fmtDate = (str) => {
    if (!str) return '';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  };
  const currentLabel = dataInicio === dataFim
    ? fmtDate(dataInicio)
    : `${fmtDate(dataInicio)} – ${fmtDate(dataFim)}`;

  const fetchRelatorios = async (di, df, fullLoad = false) => {
    try {
      if (fullLoad) setLoading(true);
      else setFiltering(true);

      const token = localStorage.getItem('token');
      const url = `http://localhost:3000/api/relatorios/taxis-motoristas?dataInicio=${di}&dataFim=${df}`;
      console.log('[fetchRelatorios] URL:', url);

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[fetchRelatorios] viagensPeriodo.length:', data.viagensPeriodo?.length, '| resumo:', data.resumo);
        setRelatoriosData(data);
        if (fullLoad) setApiStatus({ relatorios: true });
      } else {
        console.error('[fetchRelatorios] HTTP error:', response.status);
        if (fullLoad) setApiStatus({ relatorios: true });
      }
    } catch (error) {
      console.error('[fetchRelatorios] Erro na requisição:', error);
      if (fullLoad) setApiStatus({ relatorios: true });
    } finally {
      if (!fullLoad) setFiltering(false);
    }
  };

  const [tema, setTema] = useState(() => {
    return localStorage.getItem('tema') || 'escuro';
  });

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => {
    setTema(prev => (prev === 'escuro' ? 'claro' : 'escuro'));
  };

  const openTripDetails = (trip) => {
    navigate('/gestor/viagem', { state: { trip } });
  };

  const exportarPDF = () => {
    try {
      setExporting(true);
      if (!relatoriosData) throw new Error('Dados do relatório não disponíveis');

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const M = 40;
      const CW = W - M * 2;

      const checkY = (y, needed = 60) => {
        if (y + needed > H - 45) { doc.addPage(); return M; }
        return y;
      };

      const truncate = (str, max) => {
        const s = String(str ?? '—');
        return s.length > max ? s.slice(0, max - 1) + '…' : s;
      };

      const parseRatio = (str) => {
        const parts = String(str ?? '0/0').split('/').map(s => parseInt(s.trim(), 10));
        return [parts[0] || 0, parts[1] || 0];
      };

      // ── HEADER ──────────────────────────────────────────────────────────────
      doc.setFillColor(10, 18, 35);
      doc.rect(0, 0, W, 78, 'F');
      doc.setFillColor(245, 197, 24);
      doc.rect(0, 75, W, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(245, 197, 24);
      doc.text('Need4Rides', M, 38);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(180, 190, 210);
      doc.text('Relatório de Gestão', M, 57);

      doc.setFontSize(9);
      doc.setTextColor(160, 170, 190);
      doc.text(`Período: ${currentLabel}`, W - M, 38, { align: 'right' });
      doc.text(`Gerado: ${new Date().toLocaleString('pt-PT')}`, W - M, 53, { align: 'right' });

      let y = 98;

      // ── STAT CARDS ──────────────────────────────────────────────────────────
      const resumo = relatoriosData.resumo;
      const stats = [
        { label: 'Viagens', value: String(resumo.viagensPeriodo ?? 0), color: [245, 180, 0] },
        { label: 'Receita', value: `€${resumo.receitaPeriodo ?? '0.00'}`, color: [34, 197, 94] },
        { label: 'Motoristas Ativos', value: String(resumo.motoristasAtivos ?? '0/0'), color: [59, 130, 246] },
        { label: 'Táxis em Serviço', value: String(resumo.taxisEmServico ?? '0/0'), color: [168, 85, 247] },
      ];

      const cardW = (CW - 15) / 4;
      stats.forEach((s, i) => {
        const cx = M + i * (cardW + 5);
        doc.setFillColor(248, 249, 251);
        doc.roundedRect(cx, y, cardW, 62, 4, 4, 'F');
        doc.setFillColor(...s.color);
        doc.roundedRect(cx, y, cardW, 4, 2, 2, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(110, 110, 120);
        doc.text(s.label.toUpperCase(), cx + cardW / 2, y + 20, { align: 'center' });
        doc.setFontSize(15);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 30);
        doc.text(s.value, cx + cardW / 2, y + 44, { align: 'center' });
      });

      y += 80;

      // ── SECTION TITLE helper ─────────────────────────────────────────────
      const sectionTitle = (title, yPos) => {
        doc.setFillColor(245, 197, 24);
        doc.rect(M, yPos, 3, 14, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 30);
        doc.text(title, M + 10, yPos + 11);
        return yPos + 22;
      };

      // ── UTILIZAÇÃO DA FROTA (barra de progresso) ─────────────────────────
      y = checkY(y, 80);
      y = sectionTitle('Utilização da Frota', y);

      const utilizacaoBars = [
        { label: 'Motoristas em Turno', ratio: parseRatio(resumo.motoristasAtivos), color: [59, 130, 246] },
        { label: 'Táxis em Serviço',    ratio: parseRatio(resumo.taxisEmServico),    color: [168, 85, 247] },
      ];

      const barH = 14;
      const labelColW = 145;
      const trackW = CW * 0.5;
      const valX = M + labelColW + trackW + 10;

      utilizacaoBars.forEach(b => {
        const [active, total] = b.ratio;
        const pct = total > 0 ? active / total : 0;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(55, 55, 65);
        doc.text(b.label, M, y + barH - 2);

        doc.setFillColor(220, 222, 228);
        doc.roundedRect(M + labelColW, y, trackW, barH, 3, 3, 'F');

        if (pct > 0) {
          doc.setFillColor(...b.color);
          doc.roundedRect(M + labelColW, y, trackW * pct, barH, 3, 3, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 40);
        doc.text(`${active} / ${total}  (${Math.round(pct * 100)}%)`, valX, y + barH - 2);

        y += barH + 10;
      });

      // Frota de táxis por tipo e conforto
      const porTipo = relatoriosData.statsAdicionais?.taxis?.porTipo ?? [];
      const porConforto = relatoriosData.statsAdicionais?.taxis?.porConforto ?? [];
      const totalTaxis = relatoriosData.statsAdicionais?.taxis?.total || 1;

      if (porTipo.length > 0 || porConforto.length > 0) {
        y += 4;
        const miniTrackW = 90;
        const miniH = 10;
        const colGap = 20;
        const col2X = M + CW / 2;

        [[porTipo, 'Tipo de Motor', M], [porConforto, 'Nível de Conforto', col2X]].forEach(([arr, label, startX]) => {
          let ty = y;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 115);
          doc.text(label.toUpperCase(), startX, ty);
          ty += 12;

          (arr).forEach((item, idx) => {
            const pct = item.count / totalTaxis;
            const colors = [[245, 180, 0], [130, 100, 220], [34, 180, 90], [220, 80, 80]];
            const [r, g, b] = colors[idx % colors.length];

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 70);
            doc.text(String(item._id ?? '—'), startX, ty + miniH - 1);

            doc.setFillColor(218, 220, 228);
            doc.roundedRect(startX + 95, ty, miniTrackW, miniH, 2, 2, 'F');
            if (pct > 0) {
              doc.setFillColor(r, g, b);
              doc.roundedRect(startX + 95, ty, miniTrackW * pct, miniH, 2, 2, 'F');
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(30, 30, 40);
            doc.text(`${item.count}`, startX + 95 + miniTrackW + 6, ty + miniH - 1);

            ty += miniH + 7;
          });
        });

        y += Math.max(
          porTipo.length * 17 + 18,
          porConforto.length * 17 + 18
        );
      }

      y += 8;

      // ── TOP MOTORISTAS (gráfico de barras horizontal) ─────────────────────
      const topPerformers = relatoriosData.statsAdicionais?.motoristas?.topPerformers ?? [];
      if (topPerformers.length > 0) {
        y = checkY(y, 30 + topPerformers.length * 26);
        y = sectionTitle(`Top ${topPerformers.length} Motoristas — Receita (${currentLabel})`, y);

        const maxGanhos = Math.max(...topPerformers.map(m => parseFloat(m.ganhos) || 0), 1);
        const chartLabelW = 130;
        const chartBarMaxW = CW - chartLabelW - 70;
        const chartBarH = 16;
        const medalColors = [[212, 175, 55], [160, 160, 160], [176, 127, 68]];

        topPerformers.slice(0, 5).forEach((m, i) => {
          const ganhos = parseFloat(m.ganhos) || 0;
          const bw = (ganhos / maxGanhos) * chartBarMaxW;
          const [mr, mg, mb] = medalColors[i] ?? [200, 200, 200];

          // Rank circle
          doc.setFillColor(mr, mg, mb);
          doc.circle(M + 8, y + chartBarH / 2, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.text(String(i + 1), M + 8, y + chartBarH / 2 + 3, { align: 'center' });

          // Name
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(45, 45, 55);
          const shortName = m.nome.split(' ').slice(0, 2).join(' ');
          doc.text(truncate(shortName, 20), M + 22, y + chartBarH - 2);

          // Viagens badge
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(120, 120, 135);
          doc.text(`${m.viagens} viag.`, M + chartLabelW - 28, y + chartBarH - 2);

          // Bar track
          doc.setFillColor(225, 226, 232);
          doc.roundedRect(M + chartLabelW, y + 2, chartBarMaxW, chartBarH - 4, 2, 2, 'F');

          // Bar fill
          if (bw > 0) {
            doc.setFillColor(245, 197, 24);
            doc.roundedRect(M + chartLabelW, y + 2, bw, chartBarH - 4, 2, 2, 'F');
          }

          // Value
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(25, 25, 35);
          doc.text(`€${ganhos.toFixed(2)}`, M + chartLabelW + chartBarMaxW + 6, y + chartBarH - 2);

          y += chartBarH + 9;
        });

        y += 12;
      }

      // ── TABLE helper ─────────────────────────────────────────────────────
      const drawTable = (title, headers, rows, colWidths) => {
        const rowH = 21;
        const needed = 40 + (rows.length + 1) * rowH;
        y = checkY(y, Math.min(needed, 120));
        y = sectionTitle(title, y);

        const tableW = CW;

        // Header row
        doc.setFillColor(10, 18, 35);
        doc.rect(M, y, tableW, rowH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(245, 197, 24);

        let cx = M;
        headers.forEach((h, i) => {
          doc.text(h, cx + 6, y + 14);
          cx += colWidths[i];
        });
        y += rowH;

        rows.forEach((row, rowIdx) => {
          y = checkY(y, rowH + 2);
          if (rowIdx % 2 === 0) {
            doc.setFillColor(247, 248, 250);
            doc.rect(M, y, tableW, rowH, 'F');
          }
          doc.setDrawColor(225, 226, 232);
          doc.line(M, y + rowH, M + tableW, y + rowH);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(45, 45, 55);

          cx = M;
          row.forEach((cell, i) => {
            const maxChars = Math.max(6, Math.floor(colWidths[i] / 5.2));
            doc.text(truncate(cell, maxChars), cx + 6, y + 14);
            cx += colWidths[i];
          });
          y += rowH;
        });

        y += 16;
      };

      // ── VIAGENS EM CURSO ─────────────────────────────────────────────────
      const viagensEmCurso = relatoriosData.viagensEmCurso ?? [];
      drawTable(
        `Viagens em Curso (${viagensEmCurso.length})`,
        ['Cliente', 'Motorista', 'Origem', 'Destino', 'Estado'],
        viagensEmCurso.length > 0
          ? viagensEmCurso.map(v => [v.cliente, v.motorista, v.origem, v.destino, v.status])
          : [['—', '—', 'Nenhuma viagem em curso', '', '']],
        [103, 108, 115, 115, 74]
      );

      // ── MOTORISTAS ───────────────────────────────────────────────────────
      const motoristas = relatoriosData.motoristas ?? [];
      drawTable(
        `Motoristas (${motoristas.length})`,
        ['Nome', 'Estado', 'Viagens', 'Receita'],
        motoristas.length > 0
          ? motoristas.map(m => [m.nome, m.estado, String(m.viagens), `€${m.ganhos}`])
          : [['—', '—', '—', '—']],
        [210, 140, 85, 80]
      );

      // ── VIAGENS DO PERÍODO ───────────────────────────────────────────────
      const viagens = relatoriosData.viagensPeriodo ?? [];
      drawTable(
        `Viagens do Período — ${currentLabel} (${viagens.length})`,
        ['Cliente', 'Motorista', 'Origem', 'Destino', 'Data/Hora', 'Preço'],
        viagens.length > 0
          ? viagens.map(v => [v.cliente, v.motorista, v.origem, v.destino, `${v.data} ${v.hora}`, `€${v.preco}`])
          : [['—', '—', 'Sem viagens no período', '', '', '']],
        [90, 90, 100, 100, 90, 45]
      );

      // ── FOOTER em todas as páginas ───────────────────────────────────────
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(240, 241, 244);
        doc.rect(0, H - 28, W, 28, 'F');
        doc.setFillColor(245, 197, 24);
        doc.rect(0, H - 28, W, 2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 135);
        doc.text('Need4Rides — Documento Confidencial', M, H - 10);
        doc.text(`Página ${p} de ${totalPages}`, W - M, H - 10, { align: 'right' });
      }

      doc.save(`relatorio-${periodo}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro na exportação:', error);
      alert('Falha ao gerar o PDF. Verifica a consola do navegador.');
    } finally {
      setExporting(false);
    }
  };

  const handleSortMot = (col) => {
    setSortMotDir(prev => sortMotCol === col ? prev * -1 : 1);
    setSortMotCol(col);
  };
  const handleSortVia = (col) => {
    setSortViaDir(prev => sortViaCol === col ? prev * -1 : 1);
    setSortViaCol(col);
  };
  const getSortClass = (activeCol, col) => {
    if (activeCol !== col) return '';
    return sortMotCol === col ? (sortMotDir === 1 ? 'asc' : 'desc')
      : sortViaCol === col ? (sortViaDir === 1 ? 'asc' : 'desc') : '';
  };

  const SortIcon = ({ col, activeCol, dir }) => (
    <span className="sort-icon">
      <span className={`up ${activeCol === col && dir === 1 ? 'active' : ''}`} />
      <span className={`dn ${activeCol === col && dir === -1 ? 'active' : ''}`} />
    </span>
  );

  const sortedMotoristas = [...(relatoriosData?.motoristas ?? [])].sort((a, b) => {
    if (!sortMotCol) return 0;
    const val = (m) => {
      if (sortMotCol === 'nome')    return m.nome ?? '';
      if (sortMotCol === 'estado')  return m.estado ?? '';
      if (sortMotCol === 'viagens') return Number(m.viagens) || 0;
      if (sortMotCol === 'ganhos')  return parseFloat(m.ganhos) || 0;
      return '';
    };
    const va = val(a), vb = val(b);
    if (typeof va === 'number') return (va - vb) * sortMotDir;
    return String(va).localeCompare(String(vb), 'pt') * sortMotDir;
  });

  const sortedViagens = [...(relatoriosData?.viagensPeriodo ?? [])].sort((a, b) => {
    if (!sortViaCol) return 0;
    const val = (v) => {
      if (sortViaCol === 'cliente')   return v.cliente ?? '';
      if (sortViaCol === 'motorista') return v.motorista ?? '';
      if (sortViaCol === 'origem')    return v.origem ?? '';
      if (sortViaCol === 'destino')   return v.destino ?? '';
      if (sortViaCol === 'data') {
        const [d, m, y] = (v.data ?? '').split('/');
        return new Date(`${y}-${m}-${d}T${v.hora ?? '00:00'}`).getTime() || 0;
      }
      if (sortViaCol === 'preco') return parseFloat(v.preco) || 0;
      return '';
    };
    const va = val(a), vb = val(b);
    if (typeof va === 'number') return (va - vb) * sortViaDir;
    return String(va).localeCompare(String(vb), 'pt') * sortViaDir;
  });

  if (loading || !userData) {
    return (
      <Loading 
        tasks={Object.values(apiStatus)} 
        onFinished={() => setLoading(false)} 
      />
    );
  }

  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  return (
    <>
    <div className="mh-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mh-overlay" />

      {/* NAVBAR  */}
      <nav className="mh-navbar">
        <span className="mh-logo">Need4Rides</span>

        <div
          className={`mh-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`mh-nav-links ${menuOpen ? 'active' : ''}`}>
          <li className="mh-profile-li avatarHamburguer">
            <AvatarDropdown profilePath="/gestor/perfil" avatarClass="mh-avatar" />
            <span className="mh-profile-pill-name">{USERNAME}</span>
          </li>

          <li><a className="active" onClick={() => navigate('/gestor')}>Dashboard</a></li>

          <li><a onClick={() => navigate('/gestor/motoristas')}>Motoristas</a></li>

          <li><a onClick={() => navigate('/gestor/taxis')}>Táxis</a></li>

          <li><a onClick={() => navigate('/gestor/precos')}>Preços</a></li>

          <li>
            <button className="mh-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>
          <li className="mh-profile-li avatarNormal">
            <div className="mh-profile-pill">
              <span className="mh-profile-pill-name">{USERNAME}</span>
              <AvatarDropdown profilePath="/gestor/perfil" avatarClass="mh-avatar" />
            </div>
          </li>
        </ul>
      </nav>

      <div className="mh-wrapper">

        {/* WELCOME */}
        <div className="mh-welcome">
          <div className="mh-welcome-left">
            <div className="mh-welcome-avatar-ring">
              <img src={ddImg} alt="Gestor" />
            </div>

            <div>
              <p className="mh-welcome-sub">Bem-vindo de volta,</p>
              <h1 className="mh-welcome-name">
                {userData.nome.split(' ')[0]}
              </h1>

              <span className="mh-status-badge online">
                ● Gestor
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* DATE RANGE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label className="gh-date-label">De</label>
                <input
                  type="date"
                  className="gh-date-input"
                  value={dataInicio}
                  max={dataFim}
                  onChange={e => setDataInicio(e.target.value)}
                />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '18px', marginTop: '16px' }}>—</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label className="gh-date-label">
                  Até
                  {filtering && (
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      border: '2px solid #f5c518', borderTopColor: 'transparent',
                      display: 'inline-block', marginLeft: '6px',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                  )}
                </label>
                <input
                  type="date"
                  className="gh-date-input"
                  value={dataFim}
                  min={dataInicio}
                  onChange={e => setDataFim(e.target.value)}
                />
              </div>
            </div>

            {/* DIVISOR */}
            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />

            {/* EXPORTAR PDF */}
            <button
              className="btn-exportar-pdf"
              onClick={exportarPDF}
              disabled={exporting}
            >
              {exporting ? '⏳ A exportar...' : '↓ Exportar PDF'}
            </button>

          </div>
        </div>

        {/* STATS */}
        <div className="mh-stats-row" style={{ opacity: filtering ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <div className="mh-stat-card">
            <span className="mh-stat-label">Viagens no período</span>
            <span className="mh-stat-value">{relatoriosData?.resumo?.viagensPeriodo || 0}</span>
          </div>

          <div className="mh-stat-card accent">
            <span className="mh-stat-label">Receita no período</span>
            <span className="mh-stat-value">€{relatoriosData?.resumo?.receitaPeriodo || '0.00'}</span>
          </div>

          <div className="mh-stat-card">
            <span className="mh-stat-label">Motoristas ativos</span>
            <span className="mh-stat-value">{relatoriosData?.resumo?.motoristasAtivos || '0 / 0'}</span>
          </div>

          <div className="mh-stat-card">
            <span className="mh-stat-label">Táxis em serviço</span>
            <span className="mh-stat-value">{relatoriosData?.resumo?.taxisEmServico || '0 / 0'}</span>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="mh-middle-row" style={{ opacity: filtering ? 0.5 : 1, transition: 'opacity 0.2s', gridTemplateColumns: '1fr' }}>

          {/* VIAGENS */}
          <div className="mh-card">
            <div className="mh-section-header">
              <h3 className="mh-card-title">Viagens em Curso</h3>
              <span className="mh-badge">{relatoriosData?.viagensEmCurso?.length || 0}</span>
            </div>

            <div>
              {relatoriosData?.viagensEmCurso?.length > 0 ? (
                relatoriosData.viagensEmCurso.map(v => (
                  <div
                    className="mh-pedido-card"
                    key={v.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openTripDetails(v)}
                  >
                    <div className="mh-pedido-route">
                      <span className="mh-dot origin" />
                      <span>{v.origem}</span>
                      <span className="mh-dot dest" />
                      <span>{v.destino}</span>
                    </div>

                    <div className="mh-pedido-meta">
                      <span>{v.cliente}</span>
                      <span>·</span>
                      <span>{v.motorista}</span>
                    </div>

                    <span className="mh-status-badge online">
                      {v.status}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  Nenhuma viagem em curso
                </div>
              )}
            </div>
          </div>

          {/* MOTORISTAS */}
          <div className="mh-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="mh-section-header" style={{ padding: '1rem 1.2rem 0.8rem' }}>
              <h3 className="mh-card-title">Motoristas</h3>
              <span className="mh-badge">{sortedMotoristas.length}</span>
            </div>

            {sortedMotoristas.length > 0 ? (
              <div className="gm-table-wrap">
                <table className="gm-table">
                  <thead>
                    <tr>
                      <th className={sortMotCol === 'nome' ? (sortMotDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSortMot('nome')}>
                        Nome <SortIcon col="nome" activeCol={sortMotCol} dir={sortMotDir} />
                      </th>
                      <th className={sortMotCol === 'estado' ? (sortMotDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSortMot('estado')}>
                        Estado <SortIcon col="estado" activeCol={sortMotCol} dir={sortMotDir} />
                      </th>
                      <th className={sortMotCol === 'viagens' ? (sortMotDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSortMot('viagens')}>
                        Viagens <SortIcon col="viagens" activeCol={sortMotCol} dir={sortMotDir} />
                      </th>
                      <th className={sortMotCol === 'ganhos' ? (sortMotDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSortMot('ganhos')}>
                        Receita <SortIcon col="ganhos" activeCol={sortMotCol} dir={sortMotDir} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMotoristas.map(m => (
                      <tr
                        key={m.id}
                        className="gm-table-row-clickable"
                        onClick={() => navigate(`/gestor/motoristas/${m.id}`)}
                      >
                        <td className="gm-nome">{m.nome}</td>
                        <td>
                          <span className={`gm-estado ${m.estado === 'Em turno' ? 'online' : 'offline'}`}>
                            {m.estado === 'Em turno' ? '● Em turno' : '○ Fora de turno'}
                          </span>
                        </td>
                        <td className="gm-muted">{m.viagens}</td>
                        <td className="gm-ganhos">€{m.ganhos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Nenhum motorista encontrado
              </div>
            )}
          </div>

        </div>

        {/* VIAGENS DO PERÍODO */}
        <div className="mh-middle-row" style={{ opacity: filtering ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <div className="mh-card full-width" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="mh-section-header" style={{ padding: '1rem 1.2rem 0.8rem' }}>
              <h3 className="mh-card-title">Viagens do Período — {currentLabel}</h3>
              <span className="mh-badge">{sortedViagens.length}</span>
            </div>

            {sortedViagens.length > 0 ? (
              <div className="gm-table-wrap">
                <table className="gm-table">
                  <thead>
                    <tr>
                      <th className={sortViaCol === 'cliente' ? (sortViaDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSortVia('cliente')}>
                        Cliente <SortIcon col="cliente" activeCol={sortViaCol} dir={sortViaDir} />
                      </th>
                      <th className={sortViaCol === 'motorista' ? (sortViaDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSortVia('motorista')}>
                        Motorista <SortIcon col="motorista" activeCol={sortViaCol} dir={sortViaDir} />
                      </th>
                      <th className={sortViaCol === 'origem' ? (sortViaDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSortVia('origem')}>
                        Origem <SortIcon col="origem" activeCol={sortViaCol} dir={sortViaDir} />
                      </th>
                      <th className={sortViaCol === 'destino' ? (sortViaDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSortVia('destino')}>
                        Destino <SortIcon col="destino" activeCol={sortViaCol} dir={sortViaDir} />
                      </th>
                      <th className={sortViaCol === 'data' ? (sortViaDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSortVia('data')}>
                        Data/Hora <SortIcon col="data" activeCol={sortViaCol} dir={sortViaDir} />
                      </th>
                      <th className={sortViaCol === 'preco' ? (sortViaDir === 1 ? 'asc' : 'desc') : ''} onClick={() => handleSortVia('preco')}>
                        Preço <SortIcon col="preco" activeCol={sortViaCol} dir={sortViaDir} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedViagens.map(v => (
                      <tr
                        key={v.id}
                        className="gm-table-row-clickable"
                        onClick={() => openTripDetails(v)}
                      >
                        <td className="gm-nome">{v.cliente}</td>
                        <td className="gm-muted">{v.motorista}</td>
                        <td className="gm-muted">{v.origem}</td>
                        <td className="gm-muted">{v.destino}</td>
                        <td className="gm-muted">{v.data} {v.hora}</td>
                        <td className="gm-ganhos">€{v.preco}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Nenhuma viagem no período selecionado
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
    </>
  );
}