const express = require('express');
const router = express.Router();
const Lavagem = require('../models/Lavagem');
const validarPlaca = require('../utils/validarPlaca');

// Registrar lavagem
router.post('/', async (req, res) => {
  try {
    const { placa, tipo_lavagem } = req.body;

    if (!placa || !tipo_lavagem) {
      return res.status(400).json({ erro: 'placa e tipo_lavagem são obrigatórios' });
    }

    if (!validarPlaca(placa)) {
      return res.status(400).json({ erro: 'placa inválida' });
    }

    const placaUpper = placa.toUpperCase();

    // 🔥 CALCULAR JANELA DE 24H PARA BLOQUEIO
    const agora = new Date();
    const limite24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

    // 🔥 VERIFICAR SE A PLACA JÁ FOI REGISTRADA NAS ÚLTIMAS 24H
    const existe = await Lavagem.findOne({
      placa: placaUpper,
      data_hora: { $gte: limite24h }
    });

    if (existe) {
      return res.status(400).json({
        erro: `A placa ${placaUpper} já foi registrada nas últimas 24 horas`
      });
    }

    const especial = tipo_lavagem === 'especial';

    const nova = new Lavagem({
      placa: placaUpper,
      tipo_lavagem,
      especial
    });

    const salva = await nova.save();
    return res.status(201).json(salva);

  } catch (err) {
    console.error('Erro registrar lavagem:', err);
    return res.status(500).json({ erro: 'Erro interno ao registrar lavagem' });
  }
});

// Listar lavagens
router.get('/', async (req, res) => {
  try {
    const { placa, data, tipo } = req.query;
    const filtro = {};

    if (placa) filtro.placa = { $regex: placa.trim().toUpperCase(), $options: 'i' };

    if (tipo && (tipo === 'simples' || tipo === 'especial')) {
      filtro.tipo_lavagem = tipo;
    }

    if (data) {
      const [ano, mes, dia] = data.split("-").map(Number);
      const inicio = new Date(ano, mes - 1, dia, 0, 0, 0);
      const fim = new Date(ano, mes - 1, dia + 1, 0, 0, 0);
      filtro.data_hora = { $gte: inicio, $lt: fim };
    } else {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      filtro.data_hora = { $gte: hoje, $lt: amanha };
    }

    const lavagens = await Lavagem.find(filtro).sort({ data_hora: -1 }).limit(1000);
    return res.json(lavagens);

  } catch (err) {
    console.error('Erro listar lavagens:', err);
    return res.status(500).json({ erro: 'Erro interno ao listar lavagens' });
  }
});

// Buscar por id
router.get('/:id', async (req, res) => {
  try {
    const lavagem = await Lavagem.findById(req.params.id);
    if (!lavagem) return res.status(404).json({ erro: 'Lavagem não encontrada' });
    return res.json(lavagem);
  } catch (err) {
    console.error('Erro buscar lavagem:', err);
    return res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
