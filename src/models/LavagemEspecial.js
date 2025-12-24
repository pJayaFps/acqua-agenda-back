const mongoose = require("mongoose");

const LavagemEspecialSchema = new mongoose.Schema({
    placa: { type: String, required: true, uppercase: true, trim: true },
    categoria: { type: String, enum: ["P", "M", "G"], required: true },
    valor: { type: Number, required: true }, // 🔥 valor da lavagem
    data_hora: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LavagemEspecial", LavagemEspecialSchema);
