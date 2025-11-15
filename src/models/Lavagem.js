// src/models/Lavagem.js
const mongoose = require('mongoose');

const LavagemSchema = new mongoose.Schema({
  placa: { type: String, required: true, uppercase: true, trim: true },
  tipo_lavagem: { type: String, enum: ['simples','especial'], required: true },
  especial: { type: Boolean, default: false }, // true se for especial (⭐)
  data_hora: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lavagem', LavagemSchema);
