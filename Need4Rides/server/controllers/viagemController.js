const Viagem = require('../models/viagemModel');
const Turno = require('../models/turnoModel');
const Pessoa = require('../models/userModel');
const Preco = require('../models/precoModel');
const Fatura = require('../models/faturaModel');
const axios = require('axios');

//Registar viagem -> Depois do cliente pedir, o motorista aceitar e o cliente confirmar
//US-8
exports.iniciarViagem = async (req, res) => {
  try {
    const { viagemId } = req.body;
    const agora = new Date();

    //RIA 3
    const viagem = await Viagem.findById(viagemId).populate('turno');
    if (agora < viagem.turno.hora_inicio || agora > viagem.turno.hora_fim) {
      return res.status(400).json({ message: "A viagem deve estar contida no período do turno. " });
    }

    const viagemIniciada = await Viagem.findByIdAndUpdate(
      viagemId,
      { hora_inicial_viagem: agora }, 
      { new: true }
    );

    res.status(200).json({ message: "Viagem iniciada com sucesso! ", viagem: viagemIniciada });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao registar viagem." });
    console.error(error);
  }
};

//Finalizar viagem
//US-8
exports.finalizarViagem = async (req, res) => {
  try {
    const { viagemId, destino } = req.body;

    const horaFim = new Date();

    const viagem = await Viagem.findById(viagemId);

    if (!viagem) {
      return res.status(404).json({ success: false, message: "Viagem não encontrada." });
    }

    // RIA 1: Validar se fim é após o início 
    if (horaFim <= viagem.hora_inicial_viagem) {
      return res.status(400).json({ message: "Hora de fim inválida." });
    }

    //RIA 19: Calcular distancia com a morada inicial e final
    const km = await calcularDistanciaOSRM(viagem.morada_inicial_viagem.localizacao.coordinates, [destino.long, destino.lat]);
    
    //RIA 20: Calclar preco com o nivel de conforto, e hora inicial e final
    const preco = await calcularPreco(viagem.nivel_conforto, viagem.hora_inicial_viagem, horaFim);

    const viagemFinalizada = await Viagem.findByIdAndUpdate(
        viagemId,
        {   
            hora_final_viagem: horaFim,
            morada_final_viagem: {
              morada: destino.morada,
              localizacao: { type: "Point", coordinates: [destino.long, destino.lat] }
            },
            km_percorridos: km,
            preco_viagem: preco,
            $unset: { motorista_proposto: "", motoristas_rejeitados: "" }
        },
        {new: true}
    );


    res.status(200).json({
      success: true,
      message: "Viagem finalizada com sucesso",
      viagem: viagemFinalizada
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao registar viagem." });
    console.error(error);
  }
};

//US6 - Pedir o Taxi
exports.pedirTaxi = async (req, res) => {
  try{
    const { n_passageiros, nivel_conforto, origem, destino, preco_estimado } = req.body;
    const clienteId = req.userId;
    
    //RIA 12 e 13
    const cliente = await Pessoa.findById(clienteId);
    if (!cliente || cliente.tipo !== 'Cliente') {
      return res.status(404).json({ success: false, message: "Cliente não encontrado ou inválido." });
    }

    //RIA 18
    if (n_passageiros < 1 || n_passageiros > 4) {
      return res.status(400).json({ success: false, message: "O número de passageiros deve estar entre 1 e 4." });
    }

    //RIA 16
    const niveisValidos = ["Básico", "Luxuoso"];
    if (!niveisValidos.includes(nivel_conforto)) {
      return res.status(400).json({ success: false, message: "Nível de conforto inválido." });
    }

    const pontoOrigem = {
      morada: origem.morada,
      localizacao: { type: "Point", coordinates: [origem.localizacao.coordinates[1], origem.localizacao.coordinates[0]] }
    };
    
    const pontoDestino = {
      morada: destino.morada,
      localizacao: {type: "Point", coordinates: [destino.localizacao.coordinates[1], destino.localizacao.coordinates[0]]}
    };

    const novoPedido = new Viagem({
      cliente: clienteId,
      n_passageiros: n_passageiros,
      nivel_conforto: nivel_conforto,
      morada_inicial_viagem: pontoOrigem,
      morada_final_viagem: pontoDestino
    });

    await novoPedido.save();

    res.status(201).json({
      success: true,
      message: "Pedido de táxi registado. Aguarde resposta de um motorista.",
      pedido: {
        id: novoPedido._id,
        cliente: cliente.nome,
        custo_estimado: preco_estimado
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro ao processar pedido de táxi." });
  }
}

//US6/US7 - Aceitar ou rejeitar motorista (Cliente)
exports.confirmacaoCliente = async (req, res) => {
  try {
    const { viagemId, confirma, motoristaId } = req.body;

    if (!confirma) {
      const turno = await Turno.findById(motoristaId);
      if (!turno) return res.status(404).json({ message: "Turno não encontrado." });

      await Viagem.findByIdAndUpdate(viagemId, {
        $unset: { motorista_proposto: "" }, 
        $addToSet: { motoristas_rejeitados: turno.motorista }
      });
      return res.status(200).json({ message: "Motorista rejeitado. O pedido continua pendente. " });
    }

    const viagem = await Viagem.findById(viagemId);
    await Viagem.findByIdAndUpdate(viagemId, {
      turno: viagem.motorista_proposto,
      $unset: { motorista_proposto: "" }
    });

    res.status(200).json({ message: "Motorista confirmado! Aguarde a chegada. " });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Motorista rejeita pedido de viagem
exports.recusarCliente = async (req, res) => {
  try {
    const { viagemId } = req.body;
    const motoristaId = req.userId;

    const viagem = await Viagem.findByIdAndUpdate(
      viagemId,
      { $addToSet: { motoristas_rejeitados: motoristaId } },
      { strict: false }
    );

    if (!viagem) {
      return res.status(404).json({ message: "Viagem não encontrada." });
    }

    res.status(200).json({ success: true, message: "Pedido ignorado." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// US7 - Motorista cancela a sua própria proposta por falta de resposta do cliente
exports.cancelarAceitacaoMotorista = async (req, res) => {
  try {
    const { viagemId, turnoId } = req.body;

    const viagem = await Viagem.findById(viagemId);
    
    if (!viagem) {
      return res.status(404).json({ success: false, message: "Pedido não encontrado." });
    }

    if (viagem.motorista_proposto.toString() !== turnoId) {
      return res.status(403).json({ 
        success: false, 
        message: "Não tem permissão para cancelar a aceitação de outro motorista." 
      });
    }

    // O pedido volta a ficar disponível para todos na lista (turno: null)
    await Viagem.findByIdAndUpdate(viagemId, { 
      $unset: { motorista_proposto: "" } 
    });

    res.status(200).json({ 
      success: true, 
      message: "Aceitação cancelada com sucesso. O táxi está novamente livre para outros pedidos." 
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cancelarViagem = async(req, res) => {
  try {
    const { viagemId } = req.body;
    const clienteId = req.userId;

    const cliente = await Pessoa.findById(clienteId);
    if (!cliente || cliente.tipo !== 'Cliente') {
      return res.status(404).json({ success: false, message: "Cliente não encontrado ou inválido." });
    }

    try {
      await Viagem.findByIdAndDelete(viagemId);  
    } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Ocorreu um erro ao tentar eliminar a viagem."});
    }
    
    
    res.status(200).json({ success: true, message: "Pedido ignorado." });
  } catch (error) {
    console.log("1:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

//US7 - Mostrar viagens ao motorista
exports.listarPedidosParaMotorista = async (req, res) => {
  try {
    const id = req.userId;

    const motoristaId = id;

    const motorista = await Pessoa.findById(motoristaId);

    let coordenadasBusca;

    if (req.query.lat && req.query.lng) {
      coordenadasBusca = [parseFloat(req.query.lat), parseFloat(req.query.lng)];
    } else {
      const motorista = await Pessoa.findById(motoristaId);
      coordenadasBusca = motorista.motorista.morada.localizacao.coordinates;
    }
    
    if (!motorista || !motorista.motorista?.morada?.localizacao?.coordinates) {
      return res.status(404).json({ message: "Localização do motorista não encontrada." });
    }
    
    const turnoAtivo = await Turno.findOne({ motorista: motoristaId, estado: 'Ativo' }).populate('taxi');;

    if (!turnoAtivo) {
      return res.status(403).json({ message: "Precisa de estar em turno ativo para ver pedidos." });
    }

    const confortoDoTaxi = turnoAtivo.taxi.nivel_conforto;
    const pedidos = await Viagem.find({
      turno: null,
      nivel_conforto: confortoDoTaxi,
      motorista_proposto: { $exists: false },
      motoristas_rejeitados: { $ne: motoristaId },
      "morada_inicial_viagem.localizacao": {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: coordenadasBusca
          },
          $maxDistance: 10000
        }
      }
    }).populate('cliente', 'nome');

    // Filtrar pedidos que não podem ser satisfeitos no tempo restante do turno
    const pedidosComTempo = await Promise.all(pedidos.map(async (pedido) => {
      let duracao = pedido.duracao_estimada;

      if(!duracao){
        duracao = await calcularTempoOSRM(pedido.morada_inicial_viagem.localizacao, pedido.morada_final_viagem.localizacao);
      }

      const agora = new Date();
      const horaPrevisaoFim = new Date(agora.getTime() + duracao * 60000);
      const fimTurno = new Date(turnoAtivo.hora_fim);

      return {
        ...pedido._doc,
        duracao_calculada: duracao,
        pode: horaPrevisaoFim <= fimTurno
      };
    }));

    const pedidosFiltrados = pedidosComTempo.filter(p => p.pode);
    
    res.status(200).json(pedidosFiltrados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//US7 - Aceitar pedido de viagem (Motorista aceita)
exports.aceitarPedido = async (req, res) => {
  try {
    const { viagemId, turnoId } = req.body;

    const pedidoExistente = await Viagem.findById(viagemId);
    if (!pedidoExistente) return res.status(404).json({ message: "Pedido não encontrado." });
    
    if (pedidoExistente.turno || pedidoExistente.motorista_proposto) {
      return res.status(400).json({ message: "Este pedido já não está disponível." });
    }

    const pedido = await Viagem.findByIdAndUpdate(
      viagemId, 
      { motorista_proposto: turnoId }, 
      { returnDocument: 'after', strict: false }
    );

    if (!pedido) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    await pedido.populate({
      path: "motorista_proposto",
      model: 'Viagem',
      strictPopulate: false,
      populate: {path: "motorista taxi"}
    });

    res.status(200).json({
      message: "Aceitação enviada ao cliente. Aguarde confirmação. ",
      detalhes: pedido.motorista_proposto
    });

  } catch (error) {
    console.error("ERRO NO ACEITAR PEDIDO:", error);
    res.status(500).json({ success: false, message: "Erro ao aceitar pedido." });
  }
};

//RIA 19
function calcularDistancia(coordsInicio, coordsFim) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; 

  const dLat = toRad(coordsFim[1] - coordsInicio[1]);
  const dLon = toRad(coordsFim[0] - coordsInicio[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coordsInicio[1])) * Math.cos(toRad(coordsFim[1])) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;

  return parseFloat(distancia.toFixed(2)); 
}

async function calcularDistanciaOSRM(coordsInicio, coordsFim) {
  try {
    const lon1 = coordsInicio[1];
    const lat1 = coordsInicio[0];
    const lon2 = coordsFim[1];
    const lat2 = coordsFim[0];

    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const response = await axios.get(url);

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const distanciaMetros = response.data.routes[0].distance;
      return parseFloat((distanciaMetros / 1000).toFixed(2));
    } else {
      throw new Error("Nenhuma rota encontrada pelo OSRM");
    }
  } catch (error) {
    console.error("Erro ao calcular distância via OSRM:", error.message);
    return null; 
  }
}

//RIA 20
async function calcularPreco(nivelConforto, horaInicio, horaFim) {
  const configuracaoPreco = await Preco.findOne({ nivel_conforto: nivelConforto })
                                        .sort({ data_definicao: -1 });

  if (!configuracaoPreco) {
    throw new Error("Tabela de preços não configurada pelo gestor.");
  }

  return calcularPrecoViagem(
    new Date(horaInicio),
    new Date(horaFim),
    configuracaoPreco.valor_minuto,
    configuracaoPreco.acrescimo_noturno
  );
}

// Mostrar historico de viagens do motorista
exports.historicoDeViagens = async (req, res) => {
  try {
    const id = req.userId;

    const turnosDoMotorista = await Turno.find({ motorista: id }).select('_id');
    const idsTurnos = turnosDoMotorista.map(t => t._id);

    const historico = await Viagem.find({
      turno: { $in: idsTurnos },
      hora_final_viagem: { $exists: true }
    })
    .populate('cliente', 'nome') 
    .populate({
      path: 'turno',
      populate: { path: 'taxi', select: 'matricula' }
    })
    .sort({ hora_inicial_viagem: -1 });
    
    const faturas = await Fatura.find({ viagem: { $in: historico.map(v => v._id) } });

    const idsComFatura = faturas.map(f => f.viagem.toString());

    const resposta = historico.map(v => {
      const vObj = v.toObject();
      vObj.temFatura = idsComFatura.includes(v._id.toString());
      return vObj;
    });

    res.status(200).json(resposta);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// Mostrar historico de viagens do cliente
exports.historicoDeViagens_Cliente = async (req, res) => {
  try {
    const id = req.userId;

    if (!id) {
      return res.status(401).json({ message: "Utilizador não autenticado." });
    }

    const viagens = await Viagem.find({
      cliente: id,
      hora_final_viagem: { $exists: true }
    }).populate({
      path: 'turno',
      populate: {
        path: 'motorista', 
        select: 'nome' 
      }
    })
    .sort({ hora_inicial_viagem: -1 });

    const faturas = await Fatura.find({ viagem: { $in: viagens.map(v => v._id) } });

    const idsComFatura = faturas.map(f => f.viagem.toString());

    const resposta = viagens.map(v => {
      const vObj = v.toObject();
      vObj.temFatura = idsComFatura.includes(v._id.toString());
      return vObj;
    });

    res.status(200).json(resposta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function calcularPrecoViagem(inicio, fim, precoMinuto, agravamento) {
  const multiplicadorNoturno = 1 + agravamento / 100;
  let preco = 0;
  let cursor = new Date(inicio);

  while (cursor < fim) {
    const proximaMudanca = proximaMudancaTarifa(cursor);
    const fimSegmento = proximaMudanca < fim ? proximaMudanca : fim;

    const hora = cursor.getHours();
    const eNoturno = hora >= 21 || hora < 6;
    const multiplicador = eNoturno ? multiplicadorNoturno : 1.0;

    const minutosSegmento = (fimSegmento - cursor) / 60000;
    preco += minutosSegmento * precoMinuto * multiplicador;

    cursor = fimSegmento;
  }

  return parseFloat(preco.toFixed(2));
}

function proximaMudancaTarifa(data) {
  const d = new Date(data);
  const hora = d.getHours();

  if (hora >= 21) {
    d.setDate(d.getDate() + 1);
    d.setHours(6, 0, 0, 0);
  } else if (hora < 6) {
    d.setHours(6, 0, 0, 0);
  } else {
    d.setHours(21, 0, 0, 0);
  }

  return d;
}

//Tempo estimado de um lugar a outro
function calcularTempoEstimado(coordsInicio, coordsFim) {
  if (!coordsFim) return 10; 
  
  const distancia = calcularDistancia(coordsInicio.coordinates, coordsFim.coordinates || coordsFim);
  const velocidadeMedia = 60; 
  const tempoHoras = distancia / velocidadeMedia;
  return Math.max(tempoHoras * 60, 5); 
}

//Para depois, quando o cliente fizer um pedido de viagem
const calcularTempoOSRM = async (origem, destino) => {
  try {
    const coordsOrigem = `${origem.coordinates[1]},${origem.coordinates[0]}`; // Long,Lat
    const coordsDestino = `${destino.coordinates[1]},${destino.coordinates[0]}`; // Long,Lat
    
    const url = `http://router.project-osrm.org/route/v1/driving/${coordsOrigem};${coordsDestino}?overview=false`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data.routes.length > 0) {
      return Math.round(response.data.routes[0].duration / 60);
    }
    return calcularTempoEstimado(coordsInicio, coordsFim);
  } catch (error) {
    console.error("Erro na API OSRM:", error.message);
    return calcularTempoEstimado(coordsInicio, coordsFim);
  }
};


exports.fetchViagemStatus = async (req, res) => {
  try {
    const id = req.userId;
    const { viagemId } = req.params;

    if (!id) {
      
      return res.status(401).json({ message: "Utilizador não autenticado." });
    }

    const viagem = await Viagem.findById(viagemId)
    .populate("motorista_proposto", "nome")
    .populate({
      path: 'turno',
      populate: [
        {
          path: 'motorista', 
          select: 'nome email'  
        },
        {
          path: "taxi",
          select: "marca modelo matricula"
        }
      ]      
    });

    if(!viagem) return res.status(404).json({ message: "Viagem não encontrada." });

    let status = 'procurando';
    if(viagem.hora_final_viagem){
      status = "finalizada";
    } else if (viagem.turno && viagem.hora_inicial_viagem) {
      status = "emCurso";
    } else if (viagem.turno && !viagem.hora_inicial_viagem) {
      status = "aguardandoInicio";
    } else if (viagem.motorista_proposto) {
      status = "aguardandoConfirmacao";
    }

    const motoristaData = viagem.motorista_proposto || viagem.turno?.motorista;
    const taxiData = viagem.turno?.taxi;

    const info = motoristaData ? {
      nome: motoristaData.nome,
      email: motoristaData.email,
      marca: taxiData?.marca || "N/A",
      modelo: taxiData?.modelo || "N/A",
      matricula: taxiData?.matricula || "N/A"
    } : null;

    res.status(200).json({ status, motorista: motoristaData, info });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Tempo de espera (pedir taxi)
exports.estimarTempoEspera = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) return res.status(400).json({ error: "Coordenadas em falta" });

    //Motoristas ativos num raio de 10km
    const motoristasAtivos = await Turno.find({ 
      estado: "Ativo",
      localizacao_atual: {
          $nearSphere: {
              $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
              $maxDistance: 10000 
          }
      }
    });

    if(motoristasAtivos.length === 0) return res.status(200).json({ tempoEspera: 15, media: 15 });

    let coordsStr = `${lng},${lat}`;
    motoristasAtivos.forEach(m => {
      const [mLng, mLat] = m.localizacao_atual.coordinates;
      coordsStr += `;${mLng},${mLat}`;
    });
    
    //OSRM Matrix
    const sources = motoristasAtivos.map((_, index) => index + 1).join(';');
    const url = `http://router.project-osrm.org/table/v1/driving/${coordsStr}?sources=${sources}&destinations=0`;
    const response = await axios.get(url);

    if (response.data && response.data.durations) {
      const tempos = response.data.durations.map(d => d[0]/60); //minutos
      const soma = tempos.reduce((a,b) => a + b, 0);
      const media = soma / tempos.length;

      res.status(200).json({ 
          tempoEspera: Math.round(Math.min(...tempos)), //mais rapido
          media: Math.round(media) //media de tempos de espera
      });
    } else {
      res.status(200).json({ tempoEspera: 10, media: 10 });
    }
  } catch (err) {
    console.error("DEBUG: ERRO NO BACKEND:", err); // ISTO VAI MOSTRAR O ERRO REAL
    res.status(500).json({ err: "Erro ao calcular espera." });
  }
};

exports.statusMotorista = async (req, res) => {
  try {
    const motoristaId  = req.userId;

    if (!motoristaId ) {
      return res.status(401).json({ message: "Utilizador não autenticado." });
    }

    const turnoAtivo = await Turno.findOne({ motorista: motoristaId, estado: 'Ativo' });
    
    if (!turnoAtivo) {
      return res.status(200).json({ viagemId: null });
    }

    const viagem = await Viagem.findOne({
      turno: turnoAtivo._id,
      hora_final_viagem: { $exists: false }  
    })
    .populate({
      path: 'turno',
      populate: [
        { path: 'motorista', select: 'nome email' },
        { path: 'taxi',      select: 'marca modelo matricula' }
      ]
    })
    .populate('cliente', 'nome');

    if (!viagem) {
      return res.status(200).json({ viagemId: null });
    }

    let status;
    if (viagem.hora_inicial_viagem) {
      status = 'emCurso';
    } else {
      status = 'aguardandoInicio';
    }

    const taxiData = viagem.turno?.taxi;
    const viagemInfo = {
      _id:         viagem._id,
      origem:      viagem.morada_inicial_viagem,
      destino:     viagem.morada_final_viagem,
      km:          viagem.km_percorridos   ?? null,
      preco:       viagem.preco_viagem     ?? null,
      passageiros: viagem.n_passageiros,
    };

    const clienteInfo = viagem.cliente
      ? { nome: viagem.cliente.nome }
      : null;

    const info = taxiData ? {
      marca:     taxiData.marca    || 'N/A',
      modelo:    taxiData.modelo   || 'N/A',
      matricula: taxiData.matricula || 'N/A'
    } : null;

    res.status(200).json({
      viagemId: viagem._id,
      status,
      viagem:  viagemInfo,
      cliente: clienteInfo,
      info
    });

    
  } catch (error) {
    console.error('Erro em statusMotorista:', error);
    res.status(500).json({ error: error.message });
  }
};