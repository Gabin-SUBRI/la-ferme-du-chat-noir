const fs = require("fs");
const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const app = express();

// Port pour Vercel (utilise le port fourni par l'environnement)
const PORT = process.env.PORT || 3000;

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
      "https://la-ferme-du-chat-noir-frontend.vercel.app", // ← Ton frontend Vercel
      /\.vercel\.app$/, // Permet tous les domaines .vercel.app
    ],
    credentials: true,
  })
);

app.use(express.json());

// Chemins des fichiers (adaptés pour Vercel)
const fichierCommandes = path.join(process.cwd(), "data", "commandes.json");
const fichierStock = path.join(process.cwd(), "data", "stock.json");

// ========================================
// SYSTÈME D'AUTHENTIFICATION SÉCURISÉ
// ========================================
//oui
// Stocker les tokens admin en mémoire (pour une solution simple)
// En production avancée, utilisez Redis ou une base de données
const tokensAdmin = new Set();

// Générer un token sécurisé
function genererTokenAdmin() {
  return `admin_${crypto.randomBytes(32).toString("hex")}_${Date.now()}`;
}

// Middleware pour vérifier l'authentification admin
function verifierAdmin(req, res, next) {
  const token = req.headers.authorization;

  if (!token || !tokensAdmin.has(token)) {
    return res.status(403).json({
      success: false,
      message: "Accès non autorisé - Token invalide ou expiré",
    });
  }

  next();
}

// Route de connexion admin
app.post("/api/admin/login", (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe requis",
      });
    }

    // ✅ MODIFICATION ICI - Sécurisé sans fallback
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Vérifier que la variable d'environnement existe
    if (!adminPassword) {
      console.error(
        "❌ ADMIN_PASSWORD non configuré dans les variables d'environnement"
      );
      return res.status(500).json({
        success: false,
        message: "Configuration serveur manquante",
      });
    }

    console.log("Tentative de connexion admin"); // Pour debug (ne pas afficher le mot de passe!)

    if (password === adminPassword) {
      // Générer un token sécurisé
      const token = genererTokenAdmin();
      tokensAdmin.add(token);

      // Supprimer le token après 2 heures (optionnel)
      setTimeout(() => {
        tokensAdmin.delete(token);
      }, 2 * 60 * 60 * 1000); // 2 heures

      return res.json({
        success: true,
        message: "Authentification réussie",
        token: token,
      });
    } else {
      console.log(
        "Tentative de connexion admin échouée - Mot de passe incorrect"
      );
      return res.status(401).json({
        success: false,
        message: "Mot de passe incorrect",
      });
    }
  } catch (error) {
    console.error("Erreur authentification admin:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// Route pour vérifier si un token est valide
app.get("/api/admin/verify", verifierAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Token valide",
  });
});

// Route de déconnexion admin
app.post("/api/admin/logout", (req, res) => {
  const token = req.headers.authorization;
  if (token) {
    tokensAdmin.delete(token);
  }
  res.json({
    success: true,
    message: "Déconnexion réussie",
  });
});

// Fonction utilitaire pour lire un fichier JSON avec gestion d'erreur
function lireFichierJSON(cheminFichier, defaut = []) {
  try {
    if (fs.existsSync(cheminFichier)) {
      const contenu = fs.readFileSync(cheminFichier, "utf-8");
      return JSON.parse(contenu);
    }
    return defaut;
  } catch (error) {
    console.error(`Erreur lecture ${cheminFichier}:`, error);
    return defaut;
  }
}

// Fonction utilitaire pour écrire un fichier JSON
function ecrireFichierJSON(cheminFichier, donnees) {
  try {
    // Créer le dossier data s'il n'existe pas
    const dossier = path.dirname(cheminFichier);
    if (!fs.existsSync(dossier)) {
      fs.mkdirSync(dossier, { recursive: true });
    }
    fs.writeFileSync(cheminFichier, JSON.stringify(donnees, null, 2));
    return true;
  } catch (error) {
    console.error(`Erreur écriture ${cheminFichier}:`, error);
    return false;
  }
}

// ========================================
// ROUTES PUBLIQUES (pas d'authentification)
// ========================================

// Routes pour les commandes publiques
app.get("/commandes", (req, res) => {
  const commandes = lireFichierJSON(fichierCommandes);
  res.json(commandes);
});

app.post("/commande", (req, res) => {
  const nouvelleCommande = req.body;
  const commandes = lireFichierJSON(fichierCommandes);
  commandes.push(nouvelleCommande);

  if (ecrireFichierJSON(fichierCommandes, commandes)) {
    res.sendStatus(201);
  } else {
    res.status(500).json({ error: "Erreur lors de l'ajout de la commande" });
  }
});

// Route pour le stock (lecture publique)
app.get("/stock", (req, res) => {
  const stock = lireFichierJSON(fichierStock);
  res.json(stock);
});

// Route pour valider une commande (publique)
app.post("/valider-commande", (req, res) => {
  const nouvellesCommandes = req.body;

  try {
    // 📦 Lecture du stock
    const stock = lireFichierJSON(fichierStock);

    // 🛑 Vérifier les ruptures de stock avant de traiter
    for (const cmd of nouvellesCommandes) {
      const item = stock.find(
        (s) => s.produit === cmd.produit || s.nom === cmd.produit
      );
      if (!item || item.quantite <= 0) {
        return res
          .status(400)
          .json({ error: `"${cmd.produit}" est en rupture de stock` });
      }
      if (item.quantite < cmd.quantite) {
        return res.status(400).json({
          error: `Stock insuffisant pour "${cmd.produit}". Disponible: ${item.quantite}`,
        });
      }
    }

    // 🧮 Mise à jour du stock
    nouvellesCommandes.forEach((cmd) => {
      const item = stock.find(
        (s) => s.produit === cmd.produit || s.nom === cmd.produit
      );
      if (item) {
        item.quantite -= cmd.quantite;
        if (item.quantite < 0) item.quantite = 0;
      }
    });

    // 💾 Sauvegarde du stock
    if (!ecrireFichierJSON(fichierStock, stock)) {
      return res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du stock" });
    }

    // 📝 Enregistrement des commandes
    const commandesExistantes = lireFichierJSON(fichierCommandes);
    const toutesCommandes = [...commandesExistantes, ...nouvellesCommandes];

    if (!ecrireFichierJSON(fichierCommandes, toutesCommandes)) {
      return res
        .status(500)
        .json({ error: "Erreur lors de l'enregistrement des commandes" });
    }

    res.json({ success: true, message: "Commande validée avec succès" });
  } catch (err) {
    console.error("💥 Erreur dans valider-commande :", err);
    res.status(500).json({ error: "Erreur serveur lors de la validation" });
  }
});

// ========================================
// ROUTES PROTÉGÉES (authentification admin requise)
// ========================================

// Routes pour le stock (administration)
app.post("/stock", verifierAdmin, (req, res) => {
  console.log("🔍 DEBUG - Début ajout stock");
  console.log("🔍 Données reçues:", req.body);

  try {
    const stock = lireFichierJSON(fichierStock);
    console.log("🔍 Stock actuel lu:", stock.length, "items");

    stock.push(req.body);
    console.log("🔍 Stock après push:", stock.length, "items");

    if (ecrireFichierJSON(fichierStock, stock)) {
      console.log("🔍 Écriture réussie!");
      res.sendStatus(201);
    } else {
      console.error("🔍 Échec écriture fichier");
      res.status(500).json({ error: "Erreur lors de l'ajout au stock" });
    }
  } catch (error) {
    console.error("🔍 ERREUR CATCH:", error);
    res.status(500).json({ error: "Erreur lors de l'ajout au stock" });
  }
});

app.delete("/stock/:index", verifierAdmin, (req, res) => {
  const index = Number(req.params.index);
  const stock = lireFichierJSON(fichierStock);

  if (index >= 0 && index < stock.length) {
    stock.splice(index, 1);
    if (ecrireFichierJSON(fichierStock, stock)) {
      res.sendStatus(204);
    } else {
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  } else {
    res.status(404).json({ error: "Produit non trouvé" });
  }
});

// Routes pour les commandes (administration)
app.delete("/commande/:index", verifierAdmin, (req, res) => {
  const index = Number(req.params.index);
  const commandes = lireFichierJSON(fichierCommandes);

  if (index >= 0 && index < commandes.length) {
    commandes.splice(index, 1);
    if (ecrireFichierJSON(fichierCommandes, commandes)) {
      res.sendStatus(204);
    } else {
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  } else {
    res.status(404).json({ error: "Commande non trouvée" });
  }
});

// Route pour les commandes à préparer (admin)
app.get("/commandes-a-preparer", verifierAdmin, (req, res) => {
  try {
    const commandes = lireFichierJSON(fichierCommandes);
    res.json(commandes);
  } catch (err) {
    console.error("Erreur lecture commandes :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour changer le statut d'une commande (admin)
app.put("/commande/statut/:index", verifierAdmin, (req, res) => {
  const index = Number(req.params.index);

  try {
    const commandes = lireFichierJSON(fichierCommandes);

    if (index < 0 || index >= commandes.length) {
      return res.status(404).json({ error: "Commande non trouvée" });
    }

    commandes[index].statut = "préparée";

    if (ecrireFichierJSON(fichierCommandes, commandes)) {
      res.json({ success: true, message: "Statut mis à jour" });
    } else {
      res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  } catch (err) {
    console.error("Erreur modification statut :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ========================================
// ROUTES UTILITAIRES
// ========================================

// Route de santé pour vérifier que l'API fonctionne
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API La Ferme du Chat Noir fonctionne",
    timestamp: new Date().toISOString(),
    environnement: process.env.NODE_ENV || "development",
    authConfigured: !!process.env.ADMIN_PASSWORD,
  });
});

// Middleware d'erreur global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur serveur interne" });
});

// Route par défaut
app.get("/", (req, res) => {
  res.json({
    message: "🐱 API La Ferme du Chat Noir",
    version: "2.0.0",
    authentification: "Activée",
    endpoints: {
      public: [
        "GET /health",
        "GET /stock",
        "POST /valider-commande",
        "POST /api/admin/login",
      ],
      admin: [
        "POST /stock",
        "DELETE /stock/:index",
        "GET /commandes-a-preparer",
        "PUT /commande/statut/:index",
        "DELETE /commande/:index",
        "GET /api/admin/verify",
        "POST /api/admin/logout",
      ],
    },
  });
});

// Démarrage du serveur
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 API La Ferme du Chat Noir lancée sur le port ${PORT}`);
    console.log(
      `🔐 Authentification configurée: ${
        !!process.env.ADMIN_PASSWORD
          ? "OUI"
          : "NON (utilise mot de passe par défaut)"
      }`
    );
  });
}

// Export pour Vercel
module.exports = app;
