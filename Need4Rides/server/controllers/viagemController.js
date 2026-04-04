const Viagem = require('../models/viagemModel');
const Turno = require('../models/turnoModel');
const Pessoa = require('../models/userModel');
const Preco = require('../models/precoModel');

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
    const { viagem_Id, destino } = req.body;

    const horaFim = new Date();

    const viagem = await Viagem.findById(viagem_Id);

    if (!viagem) {
      return res.status(404).json({ success: false, message: "Viagem não encontrada." });
    }

    // RIA 1: Validar se fim é após o início 
    if (horaFim <= viagem.hora_inicial_viagem) {
      return res.status(400).json({ message: "Hora de fim inválida." });
    }

    //RIA 19: Calcular distancia com a morada inicial e final
    const km = calcularDistancia(viagem.morada_inicial_viagem.coordenadas, [destino.long, destino.lat]);
    
    //RIA 20: Calclar preco com o nivel de conforto, e hora inicial e final
    const preco = await calcularPreco(viagem.nivel_conforto, viagem.hora_inicial_viagem, horaFim);

    const viagemFinalizada = await Viagem.findByIdAndUpdate(
        viagem_Id,
        {   
            hora_final_viagem: horaFim,
            morada_final_viagem: {
                type: "Point",
                coordenadas: [parseFloat(destino.long), parseFloat(destino.lat)]
            },
            km_percorridos: km,
            preco_viagem: preco
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
    const { clienteId, n_passageiros, nivel_conforto, origem, destino } = req.body;
    
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
      type: "Point",
      coordenadas: [parseFloat(origem.long), parseFloat(origem.lat)]
    };

    const pontoDestino = {
      type: "Point",
      coordenadas: [parseFloat(destino.long), parseFloat(destino.lat)]
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
        custo_estimado: "A calcular..." 
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro ao processar pedido de táxi." });
  }
}

//US6 - Aceitar o motorista (Cliente)
exports.confirmacaoCliente = async (req, res) => {
  try {
    const { viagemId, confirma } = req.body;

    if (!confirma) {
      await Viagem.findByIdAndUpdate(viagemId, { $unset: { motorista_proposto: "" } });
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

// US6/US7 - Cliente rejeita o motorista proposto
exports.rejeitarMotorista = async (req, res) => {
  try {
    const { viagemId } = req.body;

    const pedidoReset = await Viagem.findByIdAndUpdate(
      viagemId,
      { $unset: { motorista_proposto: "" } },
      { new: true }
    );

    if (!pedidoReset) {
      return res.status(404).json({ success: false, message: "Pedido não encontrado." });
    }

    res.status(200).json({ 
      success: true, 
      message: "Motorista rejeitado. O seu pedido voltará a ser mostrado a outros condutores. " 
    });

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

//US7 - Mostrar viagens ao motorista
exports.listarPedidosParaMotorista = async (req, res) => {
  try {
    const { turnoId, longitude, latitude } = req.query;

    const turno = await Turno.findById(turnoId);
    if (!turno) return res.status(404).json({ message: "Turno não encontrado." });

    const pedidos = await Viagem.find({
      turno: null,
      morada_inicial_viagem: {
        $near: {
          $geometry: { type: "Point", coordenadas: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: 10000
        }
      }
    }).populate('Cliente');

    // Filtrar pedidos que não podem ser satisfeitos no tempo restante do turno
    const pedidosFiltrados = pedidos.filter(pedido => {
      const tempoEstimadoViagem = calcularTempoEstimado(pedido.morada_inicial_viagem, pedido.morada_final_viagem);
      const agora = new Date();
      
      // Verifica se a hora atual + duração estimada ultrapassa o fim do turno
      const horaPrevisaoFim = new Date(agora.getTime() + tempoEstimadoViagem * 60000);
      
      return horaPrevisaoFim <= turno.hora_fim;
    });
    
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
      { new: true }
    ).populate({
      path: "motorista_proposto",
      populate: { path: "motorista taxi" }
    });

    res.status(200).json({
      message: "Aceitação enviada ao cliente. Aguarde confirmação. ",
      detalhes: pedido.motorista_proposto
    });

  } catch (error) {
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

//Tempo estimado de um lugar a outro -- Acho que dá pra fazer com o nominatim
function calcularTempoEstimado(coordsInicio, coordsFim) {
  if (!coordsFim) return 10; 
  
  const distancia = calcularDistancia(coordsInicio.coordenadas, coordsFim.coordenadas || coordsFim);
  const velocidadeMedia = 60; 
  const tempoHoras = distancia / velocidadeMedia;
  return Math.max(tempoHoras * 60, 5); 
}