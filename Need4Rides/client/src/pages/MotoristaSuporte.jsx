import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaSuporte.css';
import AvatarDropdown from '../components/AvatarDropdown';

const TOPICOS = [
  {
    id: 'turno',
    icon: '🕐',
    titulo: 'Gestão de Turnos',
    resumo: 'Como iniciar, gerir e terminar o teu turno.',
    faqs: [
      {
        q: 'Como inicio um turno?',
        a: 'No Dashboard, clica no botão "Entrar em Turno". O turno fica registado com a hora de início e o táxi fica reservado para ti durante esse período. Um turno não pode durar mais de 8 horas.',
      },
      {
        q: 'Como escolho o táxi para o meu turno?',
        a: 'Após indicares as horas de início e fim do turno, aparece uma lista de táxis disponíveis. Escolhe apenas um — o táxi fica reservado e não pode ser usado por outro motorista durante o teu turno.',
      },
      {
        q: 'Posso ter dois turnos ao mesmo tempo?',
        a: 'Não. Os períodos de dois turnos teus não podem sobrepor-se. Tens de terminar ou aguardar o fim de um turno antes de iniciar outro.',
      },
      {
        q: 'O que acontece quando o turno termina?',
        a: 'O táxi fica disponível para outros motoristas. Se tiveres um táxi elétrico, o carregamento pode continuar para além do fim do turno — para automaticamente sem necessidade de intervenção.',
      },
    ],
  },
  {
    id: 'pedidos',
    icon: '📍',
    titulo: 'Pedidos de Táxi',
    resumo: 'Como aceitar e gerir pedidos de clientes.',
    faqs: [
      {
        q: 'Como vejo os pedidos disponíveis?',
        a: 'Na secção "Pedidos Pendentes" do Dashboard vês a lista de pedidos por ordem de distância a que os clientes se encontram. Só aparecem pedidos que podes cumprir dentro do período do teu turno atual.',
      },
      {
        q: 'O que faço depois de aceitar um pedido?',
        a: 'O cliente recebe a notificação e pode aceitar ou rejeitar a tua proposta. Se o cliente confirmar, podes iniciar a viagem. Se rejeitar, o pedido volta à lista disponível.',
      },
      {
        q: 'O cliente não respondeu — o que faço?',
        a: 'Se o cliente não confirmar nem rejeitar em tempo útil, podes cancelar a aceitação. O pedido voltará à fila para outros motoristas.',
      },
      {
        q: 'Posso rejeitar um pedido?',
        a: 'Sim. Clica em "Recusar" na lista de pedidos pendentes. O pedido continua disponível para outros motoristas.',
      },
    ],
  },
  {
    id: 'viagens',
    icon: '🚖',
    titulo: 'Registo de Viagens',
    resumo: 'Como registar o início e fim de cada viagem.',
    faqs: [
      {
        q: 'Como registo o início de uma viagem?',
        a: 'Após o cliente confirmar a tua aceitação, clica em "Iniciar Viagem". A hora e localização são registadas automaticamente. Só tens de inserir o número de passageiros (entre 1 e 4, não contando contigo).',
      },
      {
        q: 'Como registo o fim da viagem?',
        a: 'Ao chegares ao destino, clica em "Terminar Viagem". A hora e coordenadas são registadas automaticamente. O preço é calculado com base na duração e no nível de conforto do táxi.',
      },
      {
        q: 'Como é calculado o preço?',
        a: 'O preço baseia-se no tempo da viagem, no nível de conforto do táxi (luxuoso é mais caro), e no período do dia. Viagens entre as 21h e as 6h têm um acréscimo percentual configurado pelo gestor.',
      },
      {
        q: 'Uma viagem pode sair do período do meu turno?',
        a: 'Não. O período completo de uma viagem tem de estar dentro do teu turno. Pedidos que não possam ser concluídos dentro do turno não aparecem na lista de pedidos.',
      },
    ],
  },
  {
    id: 'faturas',
    icon: '🧾',
    titulo: 'Emissão de Faturas',
    resumo: 'Como emitir faturas após cada viagem.',
    faqs: [
      {
        q: 'Quando posso emitir uma fatura?',
        a: 'Após o pagamento da viagem pelo cliente. A fatura é emitida automaticamente com base nos dados da viagem — não precisas de introduzir dados manualmente.',
      },
      {
        q: 'Cada viagem pode ter mais do que uma fatura?',
        a: 'Não. Só pode ser emitida uma fatura por viagem. A data da fatura tem de ser posterior à data de início dessa viagem.',
      },
      {
        q: 'A fatura precisa do NIF do cliente?',
        a: 'Sim, se o cliente o fornecer. O NIF tem de ter 9 dígitos. A fatura inclui data, número sequencial anual, valor, e os dados do cliente (NIF, nome, género).',
      },
      {
        q: 'Onde vejo as faturas emitidas?',
        a: 'No teu histórico de viagens. Podes aceder a partir do Dashboard clicando em "Ver Histórico Completo", onde cada viagem tem os dados da fatura associada.',
      },
    ],
  },
  {
    id: 'reabastecimento',
    icon: '⛽',
    titulo: 'Reabastecimento',
    resumo: 'Como registar reabastecimentos e carregamentos.',
    faqs: [
      {
        q: 'Quando posso abastecer o táxi?',
        a: 'Os táxis a combustão são abastecidos durante o turno, mas fora do período de viagens com clientes, em bombas públicas. O período do reabastecimento tem de estar contido no teu turno.',
      },
      {
        q: 'E os carregamentos elétricos?',
        a: 'Os carregamentos elétricos são feitos no parque da empresa, perto do fim do turno. O início tem de estar dentro do teu turno, mas o carregamento pode continuar além do fim — para automaticamente.',
      },
      {
        q: 'O que tenho de registar?',
        a: 'Turno, data de início e fim do reabastecimento, litros (combustão) ou kWh (elétrico), euros pagos, e os quilómetros que o táxi tinha. Os km têm de ser positivos e crescentes em relação ao registo anterior.',
      },
      {
        q: 'Onde registo o reabastecimento?',
        a: 'Acede a "Registar Reabastecimento" na navbar do Dashboard. Preenche o formulário rápido e confirma. O registo aparece no topo da lista do histórico de reabastecimentos.',
      },
    ],
  },
  {
    id: 'pagamento',
    icon: '💳',
    titulo: 'Pagamentos',
    resumo: 'Como funciona o processo de pagamento via Stripe.',
    faqs: [
      {
        q: 'Como é feito o pagamento pelo cliente?',
        a: 'No final da viagem, o preço é comunicado ao cliente. O cliente efetua o pagamento via Stripe — o único método de pagamento disponível na plataforma.',
      },
      {
        q: 'O que faço se o pagamento falhar?',
        a: 'Se o Stripe comunicar falha no pagamento, o cliente pode tentar novamente. Enquanto o pagamento não for confirmado, a fatura não pode ser emitida.',
      },
      {
        q: 'Como sei que o pagamento foi confirmado?',
        a: 'Recebes uma notificação no ecrã assim que o Stripe confirmar o pagamento. Só depois podes emitir a fatura e a viagem fica marcada como concluída.',
      },
    ],
  },
];

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`ms-faq-item ${open ? 'open' : ''}`}>
      <button className="ms-faq-q" onClick={() => setOpen(o => !o)}>
        <span>{faq.q}</span>
        <span className="ms-faq-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <p className="ms-faq-a">{faq.a}</p>}
    </div>
  );
}

export default function MotoristaSuporte() {
  const navigate = useNavigate();
  const [topico, setTopico] = useState(null);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const topicoAtivo = TOPICOS.find(t => t.id === topico);

  /*Tema */
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

  const topicosFiltrados = query.trim()
    ? TOPICOS.filter(t =>
        t.titulo.toLowerCase().includes(query.toLowerCase()) ||
        t.faqs.some(f =>
          f.q.toLowerCase().includes(query.toLowerCase()) ||
          f.a.toLowerCase().includes(query.toLowerCase())
        )
      )
    : TOPICOS;

  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  return (
    <div className="ms-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="ms-overlay" />

       <nav className="mh-navbar">
               
          <span className="mh-logo">Need4Rides</span>
  
          {/* BOTÃO HAMBURGUER */}
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
              <AvatarDropdown profilePath="/motorista/perfil" avatarClass="mh-avatar" />
              <span className="mh-profile-pill-name">{USERNAME}</span>
            </li>
  
            <li onClick={() => navigate('/motorista')}><a>Dashboard</a></li>
  
            <li><a onClick={() => navigate('/motorista/reabastecimento')}>Reabastecimento</a></li>
            <li><a onClick={() => navigate('/motorista/historico')}>Histórico</a></li>
            <li><a onClick={() => navigate('/motorista/relatorio')}>Relatório</a></li>
            <li><a className="active">Suporte</a></li>
            <li><a onClick={() => navigate('/motorista/viagem')}>Viagem</a></li>
  
            <li className="mh-theme-li-hamburger">
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

      <div className="ms-wrapper">

        {/* Header */}
        <div className="ms-header">
          <div>
            <h1 className="ms-title">Centro de Apoio</h1>
            <p className="ms-sub">Tudo o que precisas para operar na plataforma Need4Rides</p>
          </div>
          {topico && (
            <button className="ms-back-btn" onClick={() => setTopico(null)}>← Todos os tópicos</button>
          )}
        </div>

        {/* Barra de pesquisa */}
        {!topico && (
          <div className="ms-search-wrap">
            <span className="ms-search-icon">🔍</span>
            <input
              className="ms-search-input"
              type="text"
              placeholder="Pesquisa por turnos, faturas, reabastecimento..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="ms-search-clear" onClick={() => setQuery('')}>✕</button>
            )}
          </div>
        )}

        {/* Grid de tópicos ou detalhe */}
        {!topico ? (
          <>
            <div className="ms-grid">
              {topicosFiltrados.map(t => (
                <button key={t.id} className="ms-topic-card" onClick={() => { setTopico(t.id); setQuery(''); }}>
                  <span className="ms-topic-icon">{t.icon}</span>
                  <div className="ms-topic-text">
                    <span className="ms-topic-titulo">{t.titulo}</span>
                    <span className="ms-topic-resumo">{t.resumo}</span>
                  </div>
                  <span className="ms-topic-arrow">›</span>
                </button>
              ))}
            </div>

            {topicosFiltrados.length === 0 && (
              <div className="ms-empty">
                <p>Nenhum resultado para "<strong>{query}</strong>"</p>
                <span>Tenta um termo diferente ou contacta o suporte abaixo.</span>
              </div>
            )}

            {/* Contacto direto */}
            <div className="ms-contact-card">
              <div className="ms-contact-text">
                <span className="ms-contact-title">Ainda precisas de ajuda?</span>
                <span className="ms-contact-sub">A equipa de suporte está disponível todos os dias das 08h às 22h.</span>
              </div>
              <div className="ms-contact-actions">
                <a className="ms-contact-btn email" href="mailto:suporte@need4rides.pt">✉ Email</a>
                <a className="ms-contact-btn phone" href="tel:+351800200300">📞 800 200 300</a>
              </div>
            </div>
          </>
        ) : (
          <div className="ms-detalhe">
            <div className="ms-detalhe-header">
              <span className="ms-detalhe-icon">{topicoAtivo.icon}</span>
              <div>
                <h2 className="ms-detalhe-titulo">{topicoAtivo.titulo}</h2>
                <p className="ms-detalhe-resumo">{topicoAtivo.resumo}</p>
              </div>
            </div>
            <div className="ms-faq-list">
              {topicoAtivo.faqs.map((faq, i) => (
                <FaqItem key={i} faq={faq} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
