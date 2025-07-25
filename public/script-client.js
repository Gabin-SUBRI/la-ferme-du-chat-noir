// Configuration JSONBin
const JSONBIN_API_KEY =
  "$2a$10$6kUDySCUaKoUY.UGsOqahOx4ep7ZYufpGYapG47UEQRGGPu70LABa";
const STOCK_BIN_ID = "6883fcf7ae596e708fbbca13";
const COMMANDES_BIN_ID = "6883ff07ae596e708fbbcab7";

// URLs de l'API JSONBin
const STOCK_URL = `https://api.jsonbin.io/v3/b/${STOCK_BIN_ID}`;
const COMMANDES_URL = `https://api.jsonbin.io/v3/b/${COMMANDES_BIN_ID}`;

// Headers pour JSONBin
const headers = {
  "Content-Type": "application/json",
  "X-Master-Key": JSONBIN_API_KEY,
};

let commandesClient = [];

// Fonction pour lire le stock depuis JSONBin
async function lireStock() {
  try {
    const response = await fetch(STOCK_URL, { headers });
    const data = await response.json();
    // Filtre l'élément "exemple" qu'on avait mis pour créer le bin
    return data.record.filter((item) => item.nom !== "exemple");
  } catch (error) {
    console.error("Erreur lecture stock:", error);
    return [];
  }
}

// Charger le stock pour l'affichage client
async function chargerStock() {
  try {
    const stock = await lireStock();

    // Mettre à jour la liste des légumes disponibles
    const listeStock = document.getElementById("liste-stock");
    const select = document.getElementById("produit");

    listeStock.innerHTML = "";
    select.innerHTML = '<option value="">-- Choisissez un légume --</option>';

    if (stock.length === 0) {
      listeStock.innerHTML =
        '<li style="text-align: center; color: #666; font-style: italic;">Aucun légume disponible pour le moment</li>';
      return;
    }

    stock.forEach((item) => {
      // Affichage dans la liste des légumes disponibles
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${item.nom}</strong><br>
        <span style="color: #666;">Prix: ${item.prix.toFixed(2)} €/${
        item.unite
      }</span><br>
        <span style="color: ${
          item.quantite > 5
            ? "#28a745"
            : item.quantite > 0
            ? "#f39c12"
            : "#dc3545"
        };">
          Stock: ${item.quantite} ${item.unite} ${
        item.quantite === 0
          ? "(Épuisé)"
          : item.quantite <= 5
          ? "(Stock limité)"
          : ""
      }
        </span>
      `;
      listeStock.appendChild(li);

      // Ajouter au select seulement si en stock
      if (item.quantite > 0) {
        const option = document.createElement("option");
        option.value = item.nom;
        option.textContent = `${item.nom} – ${item.prix.toFixed(2)} €/${
          item.unite
        } (Stock: ${item.quantite})`;
        option.dataset.prix = item.prix;
        option.dataset.unite = item.unite;
        option.dataset.stockDisponible = item.quantite;
        select.appendChild(option);
      }
    });
  } catch (err) {
    console.error("Erreur de chargement du stock :", err);
    afficherMessageClient("❌ Impossible de charger les produits", "error");
  }
}

// Fonction pour sauvegarder une commande
async function sauvegarderCommande(commandesValidees, nomClient) {
  try {
    // Lire les commandes existantes
    const response = await fetch(COMMANDES_URL, { headers });
    const data = await response.json();
    const commandesExistantes = data.record.filter(
      (cmd) => cmd.nom !== "exemple"
    );

    // Créer l'objet commande avec timestamp
    const nouvelleCommande = {
      id: Date.now(), // ID unique basé sur le timestamp
      client: nomClient,
      produits: commandesValidees,
      total: commandesValidees.reduce(
        (sum, cmd) => sum + cmd.quantite * cmd.prix,
        0
      ),
      date: new Date().toLocaleString("fr-FR"),
      statut: "à préparer",
    };

    // Ajouter la nouvelle commande
    commandesExistantes.push(nouvelleCommande);

    // Sauvegarder
    const saveResponse = await fetch(COMMANDES_URL, {
      method: "PUT",
      headers,
      body: JSON.stringify(commandesExistantes),
    });

    return saveResponse.ok;
  } catch (error) {
    console.error("Erreur sauvegarde commande:", error);
    return false;
  }
}
async function mettreAJourStock(commandesValidees) {
  try {
    const stockActuel = await lireStock();

    // Décrémenter les quantités commandées
    commandesValidees.forEach((commande) => {
      const itemStock = stockActuel.find(
        (item) => item.nom === commande.produit
      );
      if (itemStock) {
        itemStock.quantite = Math.max(
          0,
          itemStock.quantite - commande.quantite
        );
      }
    });

    // Sauvegarder le stock mis à jour
    const response = await fetch(STOCK_URL, {
      method: "PUT",
      headers,
      body: JSON.stringify(stockActuel),
    });

    return response.ok;
  } catch (error) {
    console.error("Erreur mise à jour stock:", error);
    return false;
  }
}

// Charger le stock au démarrage
document.addEventListener("DOMContentLoaded", () => {
  chargerStock();

  // Recharger le stock toutes les 30 secondes pour avoir les dernières données
  setInterval(chargerStock, 30000);
});

// Gérer l'ajout d'articles au panier
document.getElementById("form-commande").addEventListener("submit", (e) => {
  e.preventDefault();

  const select = document.getElementById("produit");
  const quantiteInput = document.getElementById("quantite");
  const quantiteDemandee = Number(quantiteInput.value);
  const stockDisponible = Number(
    select.selectedOptions[0]?.dataset.stockDisponible || 0
  );

  // Vérifications
  if (!select.value) {
    afficherMessageClient("⚠️ Veuillez sélectionner un légume", "error");
    return;
  }

  if (quantiteDemandee <= 0) {
    afficherMessageClient("⚠️ La quantité doit être supérieure à 0", "error");
    return;
  }

  if (quantiteDemandee > stockDisponible) {
    afficherMessageClient(
      `⚠️ Stock insuffisant ! Il ne reste que ${stockDisponible} ${select.selectedOptions[0].dataset.unite}`,
      "error"
    );
    return;
  }

  // Vérifier si le produit est déjà dans le panier
  const produitExistant = commandesClient.find(
    (cmd) => cmd.produit === select.value
  );

  if (produitExistant) {
    const totalQuantite = produitExistant.quantite + quantiteDemandee;
    if (totalQuantite > stockDisponible) {
      afficherMessageClient(
        `⚠️ Vous avez déjà ${produitExistant.quantite} ${produitExistant.unite} de ${produitExistant.produit} dans votre panier. Stock total insuffisant !`,
        "error"
      );
      return;
    }
    produitExistant.quantite = totalQuantite;
  } else {
    const commande = {
      produit: select.value,
      quantite: quantiteDemandee,
      prix: Number(select.selectedOptions[0].dataset.prix),
      unite: select.selectedOptions[0].dataset.unite,
    };
    commandesClient.push(commande);
  }

  afficherCommandesClient();
  afficherMessageClient(
    `✅ ${quantiteDemandee} ${select.selectedOptions[0].dataset.unite} de ${select.value} ajouté(s) au panier`,
    "success"
  );
  e.target.reset();
});

// Afficher les commandes dans le tableau
function afficherCommandesClient() {
  const tbody = document.getElementById("table-commandes");
  tbody.innerHTML = "";

  let totalGeneral = 0;

  commandesClient.forEach((cmd, index) => {
    const total = cmd.quantite * cmd.prix;
    totalGeneral += total;

    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${cmd.produit}</td>
      <td>${cmd.quantite}</td>
      <td>${cmd.unite}</td>
      <td>${cmd.prix.toFixed(2)} €</td>
      <td>${total.toFixed(2)} €</td>
      <td>
        <button onclick="retirerDuPanier(${index})" style="
          background: #dc3545; color: white; border: none; padding: 5px 10px; 
          border-radius: 4px; cursor: pointer; font-size: 0.8rem;
        ">
          🗑️ Retirer
        </button>
      </td>
    `;
  });

  // Ajouter une ligne de total
  if (commandesClient.length > 0) {
    const rowTotal = tbody.insertRow();
    rowTotal.innerHTML = `
      <td colspan="4" style="text-align: right; font-weight: bold;">TOTAL :</td>
      <td style="font-weight: bold; color: #28a745;">${totalGeneral.toFixed(
        2
      )} €</td>
      <td></td>
    `;
    rowTotal.style.backgroundColor = "#f8f9fa";
  }
}

// Retirer un article du panier
function retirerDuPanier(index) {
  const produitRetiré = commandesClient[index];
  commandesClient.splice(index, 1);
  afficherCommandesClient();
  afficherMessageClient(
    `🗑️ ${produitRetiré.produit} retiré du panier`,
    "success"
  );
}

// Valider la commande
document
  .getElementById("valider-commande")
  .addEventListener("click", async () => {
    if (commandesClient.length === 0) {
      afficherMessageClient("⚠️ Aucune commande à valider !", "error");
      return;
    }

    const nomClient = document.getElementById("nom-client").value.trim();
    if (!nomClient) {
      afficherMessageClient("⚠️ Veuillez renseigner votre nom !", "error");
      document.getElementById("nom-client").focus();
      return;
    }

    // Afficher un loading
    const bouton = document.getElementById("valider-commande");
    const texteOriginal = bouton.textContent;
    bouton.textContent = "⏳ Validation en cours...";
    bouton.disabled = true;

    try {
      // Vérifier une dernière fois les stocks
      const stockActuel = await lireStock();
      let erreurStock = false;

      for (const commande of commandesClient) {
        const itemStock = stockActuel.find(
          (item) => item.nom === commande.produit
        );
        if (!itemStock || itemStock.quantite < commande.quantite) {
          afficherMessageClient(
            `❌ Stock insuffisant pour ${commande.produit}. Veuillez actualiser la page.`,
            "error"
          );
          erreurStock = true;
          break;
        }
      }

      if (erreurStock) {
        chargerStock(); // Recharger les stocks
        return;
      }

      // Mettre à jour le stock et sauvegarder la commande
      const [stockMisAJour, commandeSauvee] = await Promise.all([
        mettreAJourStock(commandesClient),
        sauvegarderCommande(commandesClient, nomClient),
      ]);

      if (stockMisAJour && commandeSauvee) {
        // Calculer le total
        let total = 0;
        const lignes = commandesClient.map((cmd) => {
          const sousTotal = cmd.quantite * cmd.prix;
          total += sousTotal;
          return `${cmd.quantite} ${cmd.unite} de ${
            cmd.produit
          } à ${cmd.prix.toFixed(2)} €/${cmd.unite} → ${sousTotal.toFixed(
            2
          )} €`;
        });

        afficherMessageClient(
          `✅ Commande validée pour ${nomClient}\n${lignes.join(
            "\n"
          )}\nTotal : ${total.toFixed(2)} €\n\nMerci pour votre commande ! 🌱`,
          "success"
        );

        // Réinitialiser
        commandesClient = [];
        afficherCommandesClient();
        document.getElementById("nom-client").value = "";

        // Recharger le stock mis à jour
        setTimeout(chargerStock, 1000);
      } else {
        afficherMessageClient(
          "❌ Erreur lors de la validation de la commande",
          "error"
        );
        // Recharger le stock au cas où il aurait été modifié partiellement
        chargerStock();
      }
    } catch (err) {
      console.error("Erreur lors de la validation :", err);
      afficherMessageClient(
        "❌ Erreur de connexion lors de la validation",
        "error"
      );
    } finally {
      // Restaurer le bouton
      bouton.textContent = texteOriginal;
      bouton.disabled = false;
    }
  });

// Vider le panier
document.getElementById("vider-panier").addEventListener("click", () => {
  if (commandesClient.length === 0) {
    afficherMessageClient("⚠️ Le panier est déjà vide", "error");
    return;
  }

  if (confirm("Êtes-vous sûr de vouloir vider votre panier ?")) {
    commandesClient = [];
    afficherCommandesClient();
    afficherMessageClient("🧹 Panier vidé avec succès", "success");
  }
});

// Fonction pour afficher les messages
function afficherMessageClient(message, type) {
  const zone = document.getElementById("message");
  if (!zone) return;

  zone.textContent = message;
  zone.className = type === "error" ? "error" : "success";

  // Auto-masquage après 5 secondes pour les messages de succès
  if (type === "success") {
    setTimeout(() => {
      zone.textContent = "";
      zone.className = "";
    }, 5000);
  }
}

// Fonction de debug (à supprimer en production)
window.debugClient = () => {
  console.log("Commandes client:", commandesClient);
  console.log("Fonction de lecture stock:", lireStock);
};

// ========================================
// GESTION DU MODAL ADMIN
// ========================================

// Configuration
const ADMIN_PASSWORD = "ferme2025"; // Change ce mot de passe !

// Fonction d'initialisation du modal admin
function initModalAdmin() {
  // Éléments DOM
  const adminLink = document.getElementById("admin-link");
  const adminModal = document.getElementById("admin-modal");
  const adminPasswordInput = document.getElementById("admin-password");
  const adminLoginBtn = document.getElementById("admin-login");
  const adminCancelBtn = document.getElementById("admin-cancel");
  const adminError = document.getElementById("admin-error");

  // Vérifier que tous les éléments existent
  if (
    !adminLink ||
    !adminModal ||
    !adminPasswordInput ||
    !adminLoginBtn ||
    !adminCancelBtn ||
    !adminError
  ) {
    console.warn("Éléments du modal admin non trouvés");
    return;
  }

  // Ouvrir le modal
  adminLink.addEventListener("click", (e) => {
    e.preventDefault();
    adminModal.style.display = "block";
    adminPasswordInput.focus();
    adminError.style.display = "none";
    adminPasswordInput.value = "";
  });

  // Fermer le modal
  adminCancelBtn.addEventListener("click", () => {
    adminModal.style.display = "none";
  });

  // Fermer en cliquant à l'extérieur
  adminModal.addEventListener("click", (e) => {
    if (e.target === adminModal) {
      adminModal.style.display = "none";
    }
  });

  // Connexion
  adminLoginBtn.addEventListener("click", () => {
    const password = adminPasswordInput.value.trim();

    if (password === ADMIN_PASSWORD) {
      // Connexion réussie
      adminModal.style.display = "none";
      window.location.href = "admin.html";
    } else {
      // Mot de passe incorrect
      adminError.style.display = "block";
      adminPasswordInput.value = "";
      adminPasswordInput.focus();

      // Animation d'erreur
      adminPasswordInput.style.borderColor = "#e74c3c";
      adminPasswordInput.style.animation = "shake 0.5s ease-in-out";

      setTimeout(() => {
        adminPasswordInput.style.borderColor = "#bdc3c7";
        adminPasswordInput.style.animation = "";
      }, 500);
    }
  });

  // Connexion avec Enter
  adminPasswordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      adminLoginBtn.click();
    }
  });

  // Fermer avec Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && adminModal.style.display === "block") {
      adminModal.style.display = "none";
    }
  });
}

// Initialiser le modal quand le DOM est chargé
document.addEventListener("DOMContentLoaded", () => {
  // Attendre un peu pour que tous les éléments soient prêts
  setTimeout(initModalAdmin, 100);
});
