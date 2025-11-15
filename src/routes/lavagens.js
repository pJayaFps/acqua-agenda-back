// src/routes/lavagens.js
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
    const especial = tipo_lavagem === 'especial';
    const nova = new Lavagem({
      placa: placa.toUpperCase(),
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

// Listar todas (com opcional paginação)
router.get('/', async (req, res) => {
  try {
    // Filtros: placa (exata ou parte), data, tipo
    const { placa, data, tipo } = req.query;
    const filtro = {};
    if (placa) filtro.placa = { $regex: placa.trim().toUpperCase(), $options: 'i' };
    if (tipo && (tipo === 'simples' || tipo === 'especial')) filtro.tipo_lavagem = tipo;
    if (data) {
      // espera data no formato YYYY-MM-DD
      const inicio = new Date(data + 'T00:00:00.000Z');
      const fim = new Date(data + 'T23:59:59.999Z');
      filtro.data_hora = { $gte: inicio, $lte: fim };
    }
    const lavagens = await Lavagem.find(filtro).sort({ data_hora: -1 }).limit(1000);
    return res.json(lavagens);
  } catch (err) {
    console.error('Erro listar lavagens:', err);
    return res.status(500).json({ erro: 'Erro interno ao listar lavagens' });
  }
});

// Buscar por id (opcional)
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
