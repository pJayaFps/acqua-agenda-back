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

// Listar lavagens
router.get('/', async (req, res) => {
  try {
    const { placa, data, tipo } = req.query;
    const filtro = {};

    // Filtro por placa
    if (placa) filtro.placa = { $regex: placa.trim().toUpperCase(), $options: 'i' };
    
    // Filtro por tipo
    if (tipo && (tipo === 'simples' || tipo === 'especial')) filtro.tipo_lavagem = tipo;

    // Determinar data
    if (data) {
      // Pesquisa por dia específico
      const [ano, mes, dia] = data.split("-").map(Number);
      const inicio = new Date(ano, mes - 1, dia, 0, 0, 0);
      const fim = new Date(ano, mes - 1, dia + 1, 0, 0, 0);
      filtro.data_hora = { $gte: inicio, $lt: fim };
    } else {
      // Sem query → mostrar apenas lavagens de hoje
      const hoje = new Date();
      hoje.setHours(0,0,0,0);
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
