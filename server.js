const fs = require("fs");
const express = require("express");
const cors = require("cors"); // ← NOUVEAU
const path = require("path");
const app = express();
const PORT = 3000;

// Middleware de logs (optionnel pour debug)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// CORS - permettre les requêtes du frontend
app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "http://localhost:5173",
      "http://127.0.0.1:5500",
    ],
    credentials: true,
  })
);

app.use(express.json());

const fichierCommandes = path.join(__dirname, "data", "commandes.json");
const fichierStock = path.join(__dirname, "data", "stock.json");

// Routes existantes (pas de changement)
app.get("/commandes", (req, res) => {
  const commandes = JSON.parse(fs.readFileSync(fichierCommandes));
  res.json(commandes);
});

app.post("/commande", (req, res) => {
  const nouvelleCommande = req.body;
  const commandes = JSON.parse(fs.readFileSync(fichierCommandes));
  commandes.push(nouvelleCommande);
  fs.writeFileSync(fichierCommandes, JSON.stringify(commandes, null, 2));
  res.sendStatus(201);
});

app.delete("/commande/:index", (req, res) => {
  const index = Number(req.params.index);
  const commandes = JSON.parse(fs.readFileSync(fichierCommandes));
  commandes.splice(index, 1);
  fs.writeFileSync(fichierCommandes, JSON.stringify(commandes, null, 2));
  res.sendStatus(204);
});

app.get("/stock", (req, res) => {
  const stock = JSON.parse(fs.readFileSync(fichierStock));
  res.json(stock);
});

app.post("/stock", (req, res) => {
  const stock = JSON.parse(fs.readFileSync(fichierStock));
  stock.push(req.body);
  fs.writeFileSync(fichierStock, JSON.stringify(stock, null, 2));
  res.sendStatus(201);
});

app.delete("/stock/:index", (req, res) => {
  const index = Number(req.params.index);
  const stock = JSON.parse(fs.readFileSync(fichierStock));
  stock.splice(index, 1);
  fs.writeFileSync(fichierStock, JSON.stringify(stock, null, 2));
  res.sendStatus(204);
});

app.post("/valider-commande", (req, res) => {
  const nouvellesCommandes = req.body;

  try {
    // 📦 Lecture du stock
    const stock = JSON.parse(fs.readFileSync(fichierStock, "utf-8"));

    // 🛑 Vérifier les ruptures de stock avant de traiter
    for (const cmd of nouvellesCommandes) {
      const item = stock.find((s) => s.produit === cmd.produit);
      if (!item || item.quantite <= 0) {
        return res
          .status(400)
          .send(`❌ "${cmd.produit}" est en rupture de stock`);
      }
    }

    // 🧮 Mise à jour du stock
    nouvellesCommandes.forEach((cmd) => {
      const item = stock.find((s) => s.produit === cmd.produit);
      if (item) {
        item.quantite -= cmd.quantite;
        if (item.quantite < 0) item.quantite = 0;
      }
    });

    // 🧹 Supprimer les produits épuisés
    const stockFiltré = stock.filter((item) => item.quantite > 0);

    // 💾 Sauvegarde du stock
    fs.writeFileSync(fichierStock, JSON.stringify(stockFiltré, null, 2));

    // 📝 Enregistrement des commandes
    const commandesExistantes = JSON.parse(
      fs.readFileSync(fichierCommandes, "utf-8")
    );
    const toutesCommandes = [...commandesExistantes, ...nouvellesCommandes];
    fs.writeFileSync(
      fichierCommandes,
      JSON.stringify(toutesCommandes, null, 2)
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("💥 Erreur dans valider-commande :", err);
    res.status(500).send("Erreur serveur lors de la validation");
  }
});

app.get("/commandes-a-preparer", (req, res) => {
  try {
    const data = fs.readFileSync("./data/commandes.json", "utf-8");
    const commandes = JSON.parse(data);
    res.json(commandes);
  } catch (err) {
    console.error("Erreur lecture commandes :", err);
    res.status(500).send("Erreur serveur");
  }
});

app.put("/commande/statut/:index", (req, res) => {
  const index = Number(req.params.index);

  try {
    const commandes = JSON.parse(fs.readFileSync(fichierCommandes, "utf-8"));
    if (!commandes[index]) return res.sendStatus(404);

    commandes[index].statut = "préparée";
    fs.writeFileSync(fichierCommandes, JSON.stringify(commandes, null, 2));
    res.sendStatus(200);
  } catch (err) {
    console.error("Erreur modification statut :", err);
    res.sendStatus(500);
  }
});

// Middleware d'erreur global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur serveur" });
});

app.listen(PORT, () =>
  console.log(`🚀 Serveur backend lancé sur http://localhost:${PORT}`)
);
