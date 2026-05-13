const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Viagem = require('../models/viagemModel');

// POST /api/pagamento/criar-intent
exports.criarIntent = async (req, res) => {
  try {
    const { viagemId } = req.body;
    if (!viagemId) return res.status(400).json({ message: 'viagemId obrigatório.' });

    const viagem = await Viagem.findById(viagemId);
    if (!viagem) return res.status(404).json({ message: 'Viagem não encontrada.' });
    if (viagem.pago) return res.status(400).json({ message: 'Viagem já foi paga.' });
    if (!viagem.preco_viagem) return res.status(400).json({ message: 'Viagem sem preço definido.' });

    // Stripe trabalha em cêntimos (mínimo 50)
    const amount = Math.max(50, Math.round(viagem.preco_viagem * 100));

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      metadata: { viagemId: String(viagemId) },
    });

    res.status(200).json({ clientSecret: intent.client_secret, amount });
  } catch (error) {
    console.error('Erro ao criar PaymentIntent:', error.message);
    res.status(500).json({ message: 'Erro ao iniciar pagamento.', error: error.message });
  }
};

// POST /api/pagamento/confirmar
exports.confirmar = async (req, res) => {
  try {
    const { viagemId, paymentIntentId } = req.body;
    if (!viagemId || !paymentIntentId) {
      return res.status(400).json({ message: 'viagemId e paymentIntentId obrigatórios.' });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      return res.status(400).json({ message: `Pagamento não confirmado (estado: ${intent.status}).` });
    }

    const viagem = await Viagem.findByIdAndUpdate(
      viagemId,
      { pago: true, stripe_payment_id: paymentIntentId },
      { new: true }
    );

    if (!viagem) return res.status(404).json({ message: 'Viagem não encontrada.' });

    res.status(200).json({ success: true, viagem });
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error.message);
    res.status(500).json({ message: 'Erro ao confirmar pagamento.', error: error.message });
  }
};
