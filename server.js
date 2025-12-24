// server.js

const express = require('express');

const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const lavagensRoute = require('./src/routes/lavagens');
const Lavagem = require('./src/models/Lavagem');
const especiaisRouter = require("./src/routes/especiais");
const LavagemEspecial = require('./src/models/LavagemEspecial');


const app = express();
const PORT = 3000;
require('dotenv').config();
// -------------------------------
// 🔥 COLOQUE SUA CONNECTION STRING AQUI DIRETO
// Exemplo:
// const MONGO_URI = "mongodb+srv://usuario:senha@cluster0.abcd123.mongodb.net/lavacar?retryWrites=true&w=majority&appName=Cluster0";
const MONGO_URI = process.env.MONGO_URI;

console.log(MONGO_URI)
// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Limite básico para evitar abusos
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Rotas
app.use('/api/lavagens', lavagensRoute);
app.use("/api/lavagens-especiais", especiaisRouter);

app.get("/api/relatorio/dia", async (req, res) => {
    try {
        console.log("➡ Entrou no relatório diário.");

        // Pegamos a data atual em LOCAL
        const agora = new Date();

        // Criamos o início do dia LOCAL
        const inicio = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate(),
            0, 0, 0
        );

        // Convertendo para UTC
        const inicioUTC = new Date(inicio.getTime() + 3 * 60 * 60 * 1000);

        // Fim do dia local convertido para UTC
        const fimUTC = new Date(inicioUTC.getTime() + 24 * 60 * 60 * 1000);

        console.log("Início (LOCAL):", inicio);
        console.log("Inicio UTC:", inicioUTC);
        console.log("Fim UTC:", fimUTC);

        const simples = await Lavagem.countDocuments({
            tipo_lavagem: "simples",
            data_hora: { $gte: inicioUTC, $lt: fimUTC }
        });

        const especial = await Lavagem.countDocuments({
            tipo_lavagem: "especial",
            data_hora: { $gte: inicioUTC, $lt: fimUTC }
        });

        res.json({
            total: simples + especial,
            simples,
            especial
        });

    } catch (err) {
        console.error("❌ ERRO REAL NO RELATÓRIO DIÁRIO:");
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


app.get("/api/relatorio/mensal", async (req, res) => {
    try {
        const agora = new Date();

        // Ajustar datas corretamente com hora zerada
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0);
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1, 0, 0, 0);

        const filtro = {
            data_hora: { $gte: inicioMes, $lt: fimMes }
        };

        const simples = await Lavagem.countDocuments({
            tipo_lavagem: "simples",
            ...filtro
        });

        const especial = await Lavagem.countDocuments({
            tipo_lavagem: "especial",
            ...filtro
        });

        res.json({
            mes: `${inicioMes.getMonth() + 1}/${inicioMes.getFullYear()}`,
            total: simples + especial,
            simples,
            especial
        });

    } catch (err) {
        console.error("Erro no relatório mensal:", err);
        res.status(500).json({ error: "Erro no relatório mensal" });
    }
});


app.get("/api/relatorio/por-dia", async (req, res) => {
    try {
        const { data } = req.query;

        if (!data) {
            return res.status(400).json({ error: "Envie a data no formato YYYY-MM-DD" });
        }

        // Extrair ano, mês e dia manualmente (sem UTC)
        const [ano, mes, dia] = data.split("-").map(Number);

        // Criar faixa de datas NO FUSO LOCAL (sem UTC)
        const inicio = new Date(ano, mes - 1, dia, 0, 0, 0);    
        const fim = new Date(ano, mes - 1, dia, 23, 59, 59);

        const simples = await Lavagem.countDocuments({
            tipo_lavagem: "simples",
            data_hora: { $gte: inicio, $lte: fim }
        });

        const especial = await Lavagem.countDocuments({
            tipo_lavagem: "especial",
            data_hora: { $gte: inicio, $lte: fim }
        });

        res.json({
            data: `${dia}/${mes}/${ano}`,
            total: simples + especial,
            simples,
            especial
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro no relatório por dia" });
    }
});

app.get("/api/relatorio/pmg/dia", async (req, res) => {
    try {
        const agora = new Date();
        
        const inicio = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate(),
            0, 0, 0
        );

        const fim = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate(),
            23, 59, 59
        );

        const total = await LavagemEspecial.countDocuments({
            data_hora: { $gte: inicio, $lte: fim }
        });

        res.json({
            total,
            inicio,
            fim
        });

    } catch (err) {
        console.error("Erro no relatório diário PMG:", err);
        res.status(500).json({ error: "Erro no relatório PMG do dia" });
    }
});


app.get("/api/relatorio/pmg/mensal", async (req, res) => {
    try {
        const agora = new Date();

        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0);
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1, 0, 0, 0);

        const total = await LavagemEspecial.countDocuments({
            data_hora: { $gte: inicioMes, $lt: fimMes }
        });

        res.json({
            mes: `${inicioMes.getMonth() + 1}/${inicioMes.getFullYear()}`,
            total
        });

    } catch (err) {
        console.error("Erro relatório mensal PMG:", err);
        res.status(500).json({ error: "Erro relatório PMG mensal" });
    }
});

app.get("/api/relatorio/pmg/por-dia", async (req, res) => {
    try {
        const { data } = req.query;

        if (!data) {
            return res.status(400).json({ error: "Envie a data no formato YYYY-MM-DD" });
        }

        const [ano, mes, dia] = data.split("-").map(Number);

        const inicio = new Date(ano, mes - 1, dia, 0, 0, 0);
        const fim = new Date(ano, mes - 1, dia, 23, 59, 59);

        const total = await LavagemEspecial.countDocuments({
            data_hora: { $gte: inicio, $lte: fim }
        });

        res.json({
            data: `${dia}/${mes}/${ano}`,
            total
        });

    } catch (err) {
        console.error("Erro relatório PMG por dia:", err);
        res.status(500).json({ error: "Erro relatório PMG por dia" });
    }
});

app.get("/api/financeiro", async (req, res) => {
    try {
        const lavagens = await Lavagem.find().sort({ data_hora: -1 });
        const especiais = await LavagemEspecial.find().sort({ data_hora: -1 });

        // Totais gerais
        const totalNormal = lavagens.reduce((acc, v) => acc + v.valor, 0);
        const totalEspecial = especiais.reduce((acc, v) => acc + v.valor, 0);

        const totalGeral = totalNormal + totalEspecial;

        // PMG categorias
        const totalP = especiais.filter(e => e.categoria === "P")
                        .reduce((acc, v) => acc + v.valor, 0);

        const totalM = especiais.filter(e => e.categoria === "M")
                        .reduce((acc, v) => acc + v.valor, 0);

        const totalG = especiais.filter(e => e.categoria === "G")
                        .reduce((acc, v) => acc + v.valor, 0);

        res.json({
            totalGeral,
            totalNormal,
            totalEspecial,
            totalP,
            totalM,
            totalG,
            lavagens,
            especiais
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Erro no relatório financeiro" });
    }
});


app.get('/', (req, res) => {
    res.send('API Lavacar funcionando');
});



// Conexão com MongoDB
async function conectarMongo() {
    if (!MONGO_URI) {
        console.error('❌ ERRO: MONGO_URI não foi definida!');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado ao MongoDB');
    } catch (err) {
        console.error('❌ Erro conectar MongoDB:', err);
        process.exit(1);
    }
}

conectarMongo().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
});
