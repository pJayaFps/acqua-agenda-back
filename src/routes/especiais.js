const express = require("express");
const router = express.Router();
const LavagemEspecial = require("../models/LavagemEspecial");

// Registrar lavagem especial
router.post("/", async (req, res) => {
    try {
        const { placa, categoria } = req.body;

        if (!placa || !categoria) {
            return res.status(400).json({ error: "Placa e categoria são obrigatórias." });
        }

        // 🔥 CALCULAR JANELA DE 24H PARA BLOQUEIO
        const agora = new Date();
        const limite24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

        // 🔥 VERIFICAR SE A PLACA JÁ FOI REGISTRADA NESSE ESPECIAL NAS ÚLTIMAS 24H
        const existe = await LavagemEspecial.findOne({
            placa: placa,
            data_hora: { $gte: limite24h }
        });

        if (existe) {
            return res.status(400).json({
                error: `A placa ${placa} já foi registrada nas últimas 24 horas`
            });
        }

        // 🔵 CRIAR NOVA LAVAGEM
        let valor = 0;

        if (categoria === "P") valor = 80;
        else if (categoria === "M") valor = 110;
        else if (categoria === "G") valor = 150;

        const novaLavagem = new LavagemEspecial({
            placa: placa.toUpperCase(),
            categoria,
            valor
        });

        await novaLavagem.save();
        res.status(201).json(novaLavagem);

    } catch (err) {
        console.error("Erro registrar lavagem especial:", err);
        res.status(500).json({ error: "Erro ao registrar lavagem especial" });
    }
});

// 🔵 LISTAR + FILTRAR LAVAGENS ESPECIAIS (placa, data, categoria)
router.get("/", async (req, res) => {
    try {
        const { placa, data, categoria } = req.query;

        const filtro = {};

        // 📌 FILTRO POR PLACA
        if (placa) {
            filtro.placa = placa.toUpperCase();
        }

        // 📌 FILTRO POR CATEGORIA
        if (categoria && categoria !== "todas") {
            filtro.categoria = categoria;
        }

        // 📌 FILTRO POR DATA
        if (data) {
            const [ano, mes, dia] = data.split("-").map(Number);

            const inicio = new Date(ano, mes - 1, dia, 0, 0, 0);
            const fim = new Date(ano, mes - 1, dia, 23, 59, 59);

            filtro.data_hora = { $gte: inicio, $lte: fim };
        }

        const lista = await LavagemEspecial.find(filtro).sort({ data_hora: -1 });

        res.json(lista);

    } catch (err) {
        console.error("Erro ao buscar lavagens especiais:", err);
        res.status(500).json({ error: "Erro ao buscar lavagens especiais" });
    }
});

module.exports = router;
