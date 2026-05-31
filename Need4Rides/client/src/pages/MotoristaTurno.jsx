import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toastSucesso, toastErro, toastAviso } from '../components/toast';
import heroBg from '../assets/images/LA.jpg'; 
import '../css/global.css';
import '../css/MotoristaTurno.css';
import VEICULOS from "../../../server/data/marcasEmodelos";
import useAuthGuard from '../hooks/authGuard';

export default function MotoristaTurno() {
    useAuthGuard();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingTaxis, setLoadingTaxis] = useState(false);

    const [horarioValidadoLocal, setHorarioValidadoLocal] = useState(false);

    const [horasTurno, setHorasTurno] = useState({
        data_hora_inicio: '',
        data_hora_fim: ''
    });

    const [taxis, setTaxis] = useState([]);
    const [selecionado, setSelecionado] = useState(null);
    const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

    useEffect(() => {
        document.body.className = tema;
        localStorage.setItem('tema', tema);
    }, [tema]);

    const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');
  
    //Encontrar os dados da marca (id no marcasEModelos = marca na BD)
    const getDadosMarca = (idBD) => {
        const marcaEncontrada = VEICULOS.marcas.find(m => m.id === idBD);
        return marcaEncontrada ? marcaEncontrada.nome : idBD;
    };

    const handleVerificarHorario = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        
        if(!token) {
            navigate('/login');
            return;
        }

        if (!horasTurno.data_hora_inicio || !horasTurno.data_hora_fim) {
            toastAviso("Por favor, preencha a data de início e de fim.");
            return;
        }

        const dataInicio = new Date(horasTurno.data_hora_inicio);
        const dataFim = new Date(horasTurno.data_hora_fim);
        const agora = new Date();

        const minutoAtual = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), agora.getHours(), agora.getMinutes(), 0, 0);
        const minutoInicio = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate(), dataInicio.getHours(), dataInicio.getMinutes(), 0, 0);

        if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
            toastErro("As datas inseridas não são válidas.");
            return;
        }

        if(dataInicio >= dataFim) {
            toastErro("A hora de início deve ser anterior à hora de fim");
            return;
        }

        if(minutoInicio < minutoAtual || dataFim < agora) {
            toastErro("Não é possível criar um turno no passado");
            return;
        }

        const diffMs = dataFim - dataInicio;
        const diffHoras = diffMs / (1000 * 60 * 60);

        if (diffHoras > 8) {
            toastErro("O turno não pode ter uma duração superior a 8 horas");
            return;
        }

        try {
            setLoadingTaxis(true);

            const res = await axios.get('http://localhost:3000/api/taxi', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    inicio: dataInicio.toISOString(),
                    fim: dataFim.toISOString()
                }
            });

            setTaxis(res.data);
            setHorarioValidadoLocal(true);
            toastSucesso("Horário verificado! Escolha um táxi abaixo");
        } catch (err) { 
            console.error(err);
            toastErro("Erro ao verificar disponibilidade: " + err);
        } finally {
            setLoadingTaxis(false);
        }
    };
    
    const handleCriarTurnoCompleto = async() => {
        if (!selecionado) {
            toastAviso("Por favor, seleciona um táxi primeiro.");
            return;
        }
        const token = localStorage.getItem('token');
        const dataInicio = new Date(horasTurno.data_hora_inicio);
        const dataFim = new Date(horasTurno.data_hora_fim);
        
        try {
            setLoading(true);

            await axios.post('http://localhost:3000/api/turno/', {
                hora_inicio: dataInicio.toISOString(),
                hora_fim: dataFim.toISOString(),
                taxiId: selecionado._id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toastSucesso("Turno criado com sucesso!");
            navigate("/motorista");
        } catch (err) {
            console.error(err);
            toastErro("Erro ao registar o turno: " + err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="turno-page" style={{ backgroundImage: `url(${heroBg})` }}>
            <div className="turno-overlay" />
                <div className="turno-wrapper">

                    {/* Título */}
                    <div className="turno-header">
                    <div>
                        <h1 className="turno-title">Registar Turno</h1>
                    </div>
                    {/* {!taxi && (
                        <p className="turno-aviso">⚠️ Não tens nenhum turno ativo. Requisita um táxi primeiro.</p>
                    )} */}
                    </div>

                    <div className="turno-content">

                        {/* Formulário */}
                        <div className="turno-card turno-form-card">
                            <h3 className="turno-card-title">Novo Registo</h3>
                            <form className="turno-form" onSubmit={handleVerificarHorario}>
                                <div className="turno-form-row">
                                    <div className="turno-field">
                                        <label htmlFor="page_hora_inicio">Data de Início</label>
                                        <input 
                                            id="page_hora_inicio"
                                            type="datetime-local" 
                                            style={{ width: '100%', marginTop: '0.5rem' }}
                                            value={horasTurno.data_hora_inicio}
                                            onChange={(e) => setHorasTurno(prev => ({ ...prev, data_hora_inicio: e.target.value }))}
                                            required
                                            disabled={horarioValidadoLocal}
                                        />
                                    </div>

                                    <div className="turno-field">
                                        <label htmlFor="page_hora_fim">Data de Fim</label>
                                        <input 
                                            id="page_hora_fim"
                                            type="datetime-local" 
                                            style={{ width: '100%', marginTop: '0.5rem' }}
                                            value={horasTurno.data_hora_fim}
                                            disabled={horarioValidadoLocal}
                                            onChange={(e) => setHorasTurno(prev => ({ ...prev, data_hora_fim: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mh-pedido-actions" style={{ marginTop: '1rem', justifyContent: 'space-between', gap: '1rem' }}>
                                    <button 
                                    type="button" 
                                    className="mh-btn-recusar" 
                                    onClick={() => navigate('/motorista')} 
                                    style={{ width: '48%', margin: 0 }}
                                    >
                                    Voltar
                                    </button>
                                    {!horarioValidadoLocal && (
                                    <button type="submit" className="mh-btn-aceitar">
                                        Verificar Táxis Livres
                                    </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {horarioValidadoLocal && (
                        <div className="mh-main-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '0' }}>
                            <div className="mrt-container" style={{ maxWidth: '800px', width: '100%', background: '#1a1a1a', padding: '2rem', borderRadius: '12px' }}>
                                <h2 className="mrt-title">2. Selecionar Táxi Disponível</h2>
                                <p className="mrt-subtitle">Escolhe um veículo livre para o período: {new Date(horasTurno.data_hora_inicio).toLocaleString()} até {new Date(horasTurno.data_hora_fim).toLocaleString()}</p>

                                {loadingTaxis ? (
                                    <div style={{ padding: '2rem', textAlign: 'center' }}><Loading /></div>
                                ) : (
                                    <div className="mrt-grid" style={{ marginTop: '1.5rem' }}>
                                    {taxis.length > 0 ? (
                                        taxis.map(t => {
                                        const nomeMarca = getDadosMarca(t.marca);
                                        return (
                                            <div
                                            key={t._id}
                                            className={`mrt-card ${selecionado?._id === t._id ? 'selected' : ''}`}
                                            onClick={() => setSelecionado(t)}
                                            >
                                            <div className="mrt-card-top">
                                                <div>
                                                <span className="mrt-matricula">{t.matricula}</span>
                                                <span className="mrt-modelo">{nomeMarca} {t.modelo}</span>
                                                </div>
                                                <div className="mrt-badges">
                                                <span className={`mrt-tipo ${t.tipo_motor === 'Elétrico' ? 'eletrico' : 'combustao'}`}>{t.tipo_motor}</span>
                                                <span className="mrt-conforto">{t.nivel_conforto}</span>
                                                </div>
                                            </div>
                                            <div className="mrt-turno">Ano: {t.ano_compra} | Cor: {t.cor}</div>
                                            {selecionado?._id === t._id && (
                                                <div className="mrt-check">✓ Selecionado</div>
                                            )}
                                            </div>
                                        );
                                        })
                                    ) : (
                                        <p className="mh-no-data">Infelizmente, não existem táxis disponíveis para este intervalo de horas.</p>
                                    )}
                                    </div>
                                )}

                                <div className="mrt-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <button 
                                    className="mh-btn-recusar" 
                                    onClick={() => {setHorarioValidadoLocal(false);
                                        setSelecionado(null);}} 
                                    >
                                    Alterar Horário
                                    </button>
                                    <button
                                    className="mrt-btn-confirmar"
                                    onClick={handleCriarTurnoCompleto}
                                    disabled={loading || !selecionado}
                                    >
                                    {'Confirmar Turno e Táxi'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
    );
}
    