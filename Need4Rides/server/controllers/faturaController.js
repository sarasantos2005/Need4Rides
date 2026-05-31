const Fatura = require('../models/faturaModel');
const Pessoa = require('../models/userModel');
const Viagem = require('../models/viagemModel');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

//US10
exports.emitirFatura = async (req, res) => {
  try {
    const { viagemId } = req.body;

    const existe = await Fatura.findOne({ viagem: viagemId });
    if (existe) return res.status(400).json({ message: "Fatura já emitida para esta viagem." });

    const viagem = await Viagem.findById(viagemId);
    if (!viagem) return res.status(404).json({ message: "Viagem não encontrada." });
    if (!viagem.pago) return res.status(402).json({ message: "O cliente ainda não pagou esta viagem." });

    const novaFatura = new Fatura({
      viagem: viagemId,
      n_sequencial: await gerarProximoNumeroSequencial(),
      ano: new Date().getFullYear(),
      data_emissao: new Date()
    });

    await novaFatura.save();

    // Enviar email ao cliente automaticamente
    try {
      const viagem = await Viagem.findById(viagemId)
        .populate('cliente', 'email nome')
        .populate({ path: 'turno', populate: { path: 'motorista', select: 'nome' } });

      if (viagem?.cliente?.email) {
        const invoiceNumber = `N4R-${novaFatura.ano}/${String(novaFatura.n_sequencial).padStart(3, '0')}`;
        const data = new Date(viagem.hora_inicial_viagem).toLocaleDateString('pt-PT');
        const hora = new Date(viagem.hora_inicial_viagem).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

        await transporter.sendMail({
          from: `"Need4Rides" <${process.env.EMAIL_USER}>`,
          to: viagem.cliente.email,
          subject: `Fatura Need4Rides — ${invoiceNumber}`,
          html: `
            <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:auto;background:#0a0a1a;color:#e0e0e0;border-radius:12px;overflow:hidden">
              <div style="background:#0a1223;padding:28px 32px;border-bottom:3px solid #f5c518">
                <span style="font-size:22px;font-weight:800;color:#f5c518">Need4Rides</span>
                <span style="float:right;font-size:13px;color:#aaa;margin-top:6px">Fatura / Recibo</span>
              </div>
              <div style="padding:28px 32px">
                <table style="width:100%;border-collapse:collapse;font-size:14px">
                  <tr><td style="color:#888;padding:6px 0">Nº Fatura</td><td style="text-align:right;font-weight:700;color:#f5c518">${invoiceNumber}</td></tr>
                  <tr><td style="color:#888;padding:6px 0">Data</td><td style="text-align:right">${data} às ${hora}</td></tr>
                  <tr><td style="color:#888;padding:6px 0">Cliente</td><td style="text-align:right">${viagem.cliente.nome}</td></tr>
                  <tr><td style="color:#888;padding:6px 0">Motorista</td><td style="text-align:right">${viagem.turno?.motorista?.nome ?? '—'}</td></tr>
                </table>
                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0">
                <table style="width:100%;border-collapse:collapse;font-size:14px">
                  <tr><td style="color:#888;padding:6px 0">Origem</td><td style="text-align:right">${viagem.morada_inicial_viagem?.morada ?? '—'}</td></tr>
                  <tr><td style="color:#888;padding:6px 0">Destino</td><td style="text-align:right">${viagem.morada_final_viagem?.morada ?? '—'}</td></tr>
                </table>
                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="color:#888;font-size:14px">Método de Pagamento</td><td style="text-align:right;font-size:14px">Stripe</td></tr>
                  <tr><td style="font-size:16px;font-weight:700;padding-top:10px">Total</td><td style="text-align:right;font-size:20px;font-weight:800;color:#f5c518;padding-top:10px">€${viagem.preco_viagem?.toFixed(2) ?? '—'}</td></tr>
                </table>
              </div>
              <div style="background:#0a1223;padding:16px 32px;text-align:center;font-size:12px;color:#555">
                Obrigado por viajar com Need4Rides
              </div>
            </div>
          `
        });
      }
    } catch (emailErr) {
      console.error('Erro ao enviar email da fatura:', emailErr.message);
    }

    res.status(201).json(novaFatura);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFatura = async(req, res) => {
  try {
    const { viagemId } = req.params;

    if (!viagemId) {
      return res.status(400).json({ message: "ID da viagem não fornecido." });
    }

    const fatura = await Fatura.findOne({ viagem: viagemId })
      .populate({
        path: 'viagem',
        populate: {
          path: 'turno',
          populate: { path: 'motorista', select: 'nome' }
        }
      });

    if (!fatura) {
      return res.status(404).json({ 
        success: false, 
        message: "Fatura ainda não emitida para esta viagem." 
      });
    }

    const numeroFormatado = `N4R-${fatura.ano}/${String(fatura.n_sequencial).padStart(3, '0')}`;

    res.status(200).json({
      success: true,
      fatura: {
        ...fatura._doc,
        numeroFormatado 
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enviarFaturaPorEmail = async (req, res) => {
  try {
    const { invoiceNumber, data, hora, origem, destino, preco, cliente, motorista } = req.body;

    const utilizador = await Pessoa.findById(req.userId).select('email');
    if (!utilizador?.email) return res.status(400).json({ message: 'Email do utilizador não encontrado.' });
    const destinatario = utilizador.email;

    await transporter.sendMail({
      from: `"Need4Rides" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `Fatura Need4Rides — ${invoiceNumber}`,
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:auto;background:#0a0a1a;color:#e0e0e0;border-radius:12px;overflow:hidden">
          <div style="background:#0a1223;padding:28px 32px;border-bottom:3px solid #f5c518">
            <span style="font-size:22px;font-weight:800;color:#f5c518">Need4Rides</span>
            <span style="float:right;font-size:13px;color:#aaa;margin-top:6px">Fatura / Recibo</span>
          </div>
          <div style="padding:28px 32px">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="color:#888;padding:6px 0">Nº Fatura</td><td style="text-align:right;font-weight:700;color:#f5c518">${invoiceNumber}</td></tr>
              <tr><td style="color:#888;padding:6px 0">Data</td><td style="text-align:right">${data} às ${hora}</td></tr>
              <tr><td style="color:#888;padding:6px 0">Cliente</td><td style="text-align:right">${cliente}</td></tr>
              <tr><td style="color:#888;padding:6px 0">Motorista</td><td style="text-align:right">${motorista}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="color:#888;padding:6px 0">Origem</td><td style="text-align:right">${origem}</td></tr>
              <tr><td style="color:#888;padding:6px 0">Destino</td><td style="text-align:right">${destino}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#888;font-size:14px">Método de Pagamento</td>
                <td style="text-align:right;font-size:14px">Stripe</td>
              </tr>
              <tr>
                <td style="font-size:16px;font-weight:700;padding-top:10px">Total</td>
                <td style="text-align:right;font-size:20px;font-weight:800;color:#f5c518;padding-top:10px">€${preco}</td>
              </tr>
            </table>
          </div>
          <div style="background:#0a1223;padding:16px 32px;text-align:center;font-size:12px;color:#555">
            Obrigado por viajar com Need4Rides
          </div>
        </div>
      `
    });

    res.status(200).json({ success: true, message: 'Fatura enviada com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar email:', error.message);
    res.status(500).json({ message: 'Erro ao enviar email.', error: error.message });
  }
};

//RIA21 : As faturas emitidas num dado ano vão do número 1 em diante.
async function gerarProximoNumeroSequencial() {
  const anoAtual = new Date().getFullYear();
  const ultima = await Fatura.findOne({ ano: anoAtual }).sort({ n_sequencial: -1 });

  return ultima ? ultima.n_sequencial + 1 : 1;
}