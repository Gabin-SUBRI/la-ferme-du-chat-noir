const fs = require("fs");
const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(express.json());

const fichierCommandes = path.join(__dirname, "data", "commandes.json");

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

app.listen(PORT, () =>
  console.log(`Serveur lancé sur http://localhost:${PORT}`)
);
app.delete("/commande/:index", (req, res) => {
  const index = Number(req.params.index);
  const commandes = JSON.parse(fs.readFileSync(fichierCommandes));
  commandes.splice(index, 1);
  fs.writeFileSync(fichierCommandes, JSON.stringify(commandes, null, 2));
  res.sendStatus(204);
});
// Stock des légumes
const fichierStock = path.join(__dirname, "data", "stock.json");

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
  const fichierStock = path.join(__dirname, "data", "stock.json");
  const fichierCommandes = path.join(__dirname, "data", "commandes.json");

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
  const commandesPath = path.join(__dirname, "data", "commandes.json");

  try {
    const commandes = JSON.parse(fs.readFileSync(commandesPath, "utf-8"));
    if (!commandes[index]) return res.sendStatus(404);

    commandes[index].statut = "préparée";
    fs.writeFileSync(commandesPath, JSON.stringify(commandes, null, 2));
    res.sendStatus(200);
  } catch (err) {
    console.error("Erreur modification statut :", err);
    res.sendStatus(500);
  }
});
