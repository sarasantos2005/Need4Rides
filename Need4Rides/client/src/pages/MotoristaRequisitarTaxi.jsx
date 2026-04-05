import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaHome.css';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/MotoristaRequisitarTaxi.css';
import axios from 'axios';
import VEICULOS from "../../../server/data/marcasEmodelos";

export default function MotoristaRequisitarTaxi() {
  const navigate = useNavigate();
  const [taxis, setTaxis] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [turnoAtivo, setTurnoAtivo] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
      const storedUser = localStorage.getItem('user_logado');
      const token = localStorage.getItem('token');
  
      if (!token || !storedUser) {
        navigate('/login'); 
      } else {
        const user = JSON.parse(storedUser);
        setUserData(user);
        
        const carregarDadosIniciais = async () => {
          try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const userId = user._id || user.id;

            const resTurno = await axios.get(`http://localhost:3000/api/turno/atual?id=${userId}`, config);
            setTurnoAtivo(resTurno.data);

            const res = await axios.get('http://localhost:3000/api/taxi/', {
              headers: { Authorization: `Bearer ${token}` }
            });
            setTaxis(res.data);
          } catch (err) {
            console.error("Erro ao procurar dados na BD", err);
          } finally {
            setLoading(false);
          }
        };
        carregarDadosIniciais();
      }
    }, [navigate]);


  const handleConfirmar = async () => {
    if (!selecionado) return;
      
    try {
      const token = localStorage.getItem('token');
      const turnoId = turnoAtivo._id;

      await axios.patch('http://localhost:3000/api/turno/requisitar', {
        turnoId: turnoId,
        taxiId: selecionado._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem('motoristataxi', JSON.stringify(selecionado));
      navigate('/motorista');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
  alert("Erro: " + msg);
    }
    
  };

  //Encontrar os dados da marca (id no marcasEModelos = marca na BD)
  const getDadosMarca = (idBD) => {
    const marcaEncontrada = VEICULOS.marcas.find(m => m.id === idBD);
    return marcaEncontrada ? marcaEncontrada.nome : idBD;
  };

  if (loading) return <div className="mh-loading">A procurar veículos...</div>;

  return (
    <div className="mrt-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mh-overlay" />

      {/* Navbar */}
      <nav className="mh-navbar">
        <span className="mh-logo">Need4Rides</span>
        <ul className="mh-nav-links">
          <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('/motorista')}>Dashboard</a></li>
          <li><a onClick={() => navigate('/motorista/historico')} style={{ cursor: 'pointer' }}>Histórico</a></li>
          <li><a onClick={() => navigate('/motorista/suporte')} style={{ cursor: 'pointer' }}>Suporte</a></li>
          <li>
            <AvatarDropdown profilePath="/motorista/perfil" avatarClass="mh-avatar" />
          </li>
        </ul>
      </nav>

      <div className="mrt-wrapper">
        <div className="mrt-header">
          <div>
            <h1 className="mrt-title">Requisitar Táxi</h1>
            <p className="mrt-subtitle">Seleciona um veículo disponível para o teu turno</p>
          </div>
          <button className="mrt-btn-cancel" onClick={() => navigate('/motorista')}>
            Cancelar
          </button>
        </div>

        <div className="mrt-grid">
          {taxis.length > 0 ? taxis.map(t => {
            const nomeBonitinho = getDadosMarca(t.marca);

            return (
            <div
              key={t._id}
              className={`mrt-card ${selecionado?._id === t._id ? 'selected' : ''}`}
              onClick={() => setSelecionado(t)}
            >
              <div className="mrt-card-top">
                <div>
                  <span className="mrt-matricula">{t.matricula}</span>
                  <span className="mrt-modelo">{nomeBonitinho} {t.modelo}</span>
                </div>
                <div className="mrt-badges">
                  <span className={`mrt-tipo ${t.tipo_motor === 'Elétrico' ? 'eletrico' : 'combustao'}`}>{t.tipo_motor}</span>
                  <span className="mrt-conforto">{t.nivel_conforto}</span>
                </div>
              </div>

              <div className="mrt-fuel-row">
                <span className="mrt-fuel-label">Combustível / Carga</span>
                <span className="mrt-fuel-pct">{t.nivel_combustivel_carga}%</span>
              </div>
              <div className="mrt-fuel-bar-bg">
                <div className="mrt-fuel-bar" style={{ width: `${t.nivel_combustivel_carga}%` }} />
              </div>
              <div className="mrt-autonomia">≈ {t.autonomia_maxima} km de autonomia</div>
              <div className="mrt-turno">Ano: {t.ano_compra} | Cor: {t.cor}</div>

              {selecionado?._id === t._id && (
                <div className="mrt-check">✓ Selecionado</div>
              )}
            </div>
          );
         }) : <p className="mh-no-data">Não há táxis disponíveis no momento.</p>}
        </div>

        <div className="mrt-actions">
          <button
            className="mrt-btn-confirmar"
            disabled={!selecionado}
            onClick={handleConfirmar}
          >
            Confirmar Requisição
          </button>
        </div>
      </div>
    </div>
  );
}
