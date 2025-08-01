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

// Fonctions utilitaires JSONBin
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

async function sauvegarderStock(stock) {
  try {
    const response = await fetch(STOCK_URL, {
      method: "PUT",
      headers,
      body: JSON.stringify(stock),
    });
    return response.ok;
  } catch (error) {
    console.error("Erreur sauvegarde stock:", error);
    return false;
  }
}

// Ajout au stock
document.getElementById("form-stock").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Afficher un loading
  const bouton = e.target.querySelector('button[type="submit"]');
  const texteOriginal = bouton.textContent;
  bouton.textContent = "Ajout en cours...";
  bouton.disabled = true;

  const nouvelItem = {
    nom: document.getElementById("nom").value.trim(),
    quantite: Number(document.getElementById("quantite").value),
    prix: Number(document.getElementById("prix").value),
    unite: document.getElementById("unite").value.trim(),
  };

  try {
    // Lire le stock actuel
    const stockActuel = await lireStock();

    // Vérifier si le légume existe déjà
    const indexExistant = stockActuel.findIndex(
      (item) => item.nom.toLowerCase() === nouvelItem.nom.toLowerCase()
    );

    if (indexExistant !== -1) {
      // Mettre à jour la quantité si le légume existe
      stockActuel[indexExistant].quantite += nouvelItem.quantite;
      stockActuel[indexExistant].prix = nouvelItem.prix; // Mettre à jour le prix
    } else {
      // Ajouter le nouveau légume
      stockActuel.push(nouvelItem);
    }

    // Sauvegarder le stock mis à jour
    const succes = await sauvegarderStock(stockActuel);

    if (succes) {
      chargerStock();
      e.target.reset();
      afficherMessage("✅ Légume ajouté avec succès !", "success");
    } else {
      afficherMessage("❌ Erreur lors de l'ajout", "error");
    }
  } catch (error) {
    console.error("Erreur:", error);
    afficherMessage("❌ Erreur de connexion", "error");
  } finally {
    // Restaurer le bouton
    bouton.textContent = texteOriginal;
    bouton.disabled = false;
  }
});

// Charger le stock
async function chargerStock() {
  try {
    const stock = await lireStock();
    const tbody = document.getElementById("table-stock");
    tbody.innerHTML = "";

    if (stock.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align: center; font-style: italic; color: #666;">Aucun légume en stock</td></tr>';
      return;
    }

    stock.forEach((item, index) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${item.nom}</td>
        <td>${item.quantite}</td>
        <td>${item.unite}</td>
        <td>${item.prix.toFixed(2)} €</td>
        <td>
          <button class="btn-supprimer" onclick="supprimerLegume(${index})">
            🗑️ Supprimer
          </button>
        </td>
      `;
    });
  } catch (error) {
    console.error("Erreur chargement stock:", error);
    afficherMessage("❌ Erreur lors du chargement du stock", "error");
  }
}

// Supprimer un légume
async function supprimerLegume(index) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce légume ?")) {
    return;
  }

  try {
    const stock = await lireStock();
    stock.splice(index, 1);

    const succes = await sauvegarderStock(stock);

    if (succes) {
      chargerStock();
      afficherMessage("✅ Légume supprimé", "success");
    } else {
      afficherMessage("❌ Erreur lors de la suppression", "error");
    }
  } catch (error) {
    console.error("Erreur suppression:", error);
    afficherMessage("❌ Erreur de connexion", "error");
  }
}

// Fonctions pour les commandes
async function lireCommandes() {
  try {
    const response = await fetch(COMMANDES_URL, { headers });
    const data = await response.json();
    // Filtre l'élément "exemple" et retourne les commandes
    return data.record.filter((cmd) => cmd.nom !== "exemple");
  } catch (error) {
    console.error("Erreur lecture commandes:", error);
    return [];
  }
}

async function sauvegarderCommandes(commandes) {
  try {
    const response = await fetch(COMMANDES_URL, {
      method: "PUT",
      headers,
      body: JSON.stringify(commandes),
    });
    return response.ok;
  } catch (error) {
    console.error("Erreur sauvegarde commandes:", error);
    return false;
  }
}

async function chargerCommandesPreparation() {
  try {
    const commandes = await lireCommandes();
    const tbody = document.querySelector("#table-preparation tbody");
    tbody.innerHTML = "";

    if (commandes.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center; font-style: italic; color: #666;">Aucune commande en préparation</td></tr>';
      return;
    }

    // Trier les commandes par date (plus récentes en premier)
    commandes.sort((a, b) => new Date(b.date) - new Date(a.date));

    commandes.forEach((commande, index) => {
      // Créer une ligne de titre pour chaque commande
      const titleRow = tbody.insertRow();
      titleRow.innerHTML = `
        <td colspan="6" style="
          background: ${commande.statut === "préparée" ? "#d4edda" : "#fff3cd"};
          padding: 15px;
          font-weight: bold;
          border-top: 3px solid ${
            commande.statut === "préparée" ? "#28a745" : "#f39c12"
          };
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 1.1em;">🧑‍🌾 ${commande.client}</strong>
              <span style="margin-left: 15px; color: #666;">📅 ${
                commande.date
              }</span>
              <span style="margin-left: 15px; color: #666;">💰 Total: ${commande.total.toFixed(
                2
              )} €</span>
            </div>
            <div>
              <span style="color: ${
                commande.statut === "préparée" ? "#28a745" : "#f39c12"
              }; font-weight: bold; margin-right: 15px;">
                ${
                  commande.statut === "préparée"
                    ? "✅ Préparée"
                    : "⏳ À préparer"
                }
              </span>
              ${
                commande.statut === "préparée"
                  ? '<span style="color: #28a745; font-weight: bold;">✅ Terminé</span>'
                  : `<button onclick="marquerCommePrepare(${index})" style="
                      background: linear-gradient(135deg, #4caf50, #2e7d32);
                      color: white;
                      border: none;
                      padding: 8px 16px;
                      border-radius: 6px;
                      cursor: pointer;
                      font-weight: 600;
                      transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(76,175,80,0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                      📦 Marquer comme préparée
                    </button>`
              }
            </div>
          </div>
        </td>
      `;

      // Créer la ligne de produits
      commande.produits.forEach((produit, produitIndex) => {
        const productRow = tbody.insertRow();
        productRow.innerHTML = `
          <td style="padding-left: 30px; border-left: 4px solid ${
            commande.statut === "préparée" ? "#28a745" : "#f39c12"
          };">
            <strong>${commande.client}</strong>
          </td>
          <td><strong>${produit.produit}</strong></td>
          <td style="text-align: center; font-weight: bold;">${
            produit.quantite
          }</td>
          <td>${produit.unite}</td>
          <td style="text-align: center;">
            <span style="
              background: ${
                commande.statut === "préparée" ? "#d4edda" : "#fff3cd"
              };
              color: ${commande.statut === "préparée" ? "#28a745" : "#f39c12"};
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 0.85em;
              font-weight: bold;
            ">
              ${commande.statut === "préparée" ? "✅ Prête" : "⏳ À préparer"}
            </span>
          </td>
          <td style="text-align: center;">
            ${
              produitIndex === 0
                ? `
              ${
                commande.statut === "préparée"
                  ? '<span style="color: #28a745; font-weight: bold;">✅ Terminé</span>'
                  : `<button onclick="marquerCommePrepare(${index})" style="
                      background: linear-gradient(135deg, #4caf50, #2e7d32);
                      color: white;
                      border: none;
                      padding: 6px 12px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 0.85em;
                      font-weight: 600;
                    ">
                      📦 Préparer
                    </button>`
              }
            `
                : ""
            }
          </td>
        `;

        // Style pour les lignes de produits
        if (produitIndex > 0) {
          productRow.style.backgroundColor =
            commande.statut === "préparée" ? "#f8fff9" : "#fffbf0";
        }
      });

      // Ajouter une ligne de séparation entre les commandes
      if (index < commandes.length - 1) {
        const separatorRow = tbody.insertRow();
        separatorRow.innerHTML = `
          <td colspan="6" style="height: 10px; background: transparent; border: none;"></td>
        `;
      }
    });
  } catch (err) {
    console.error("Erreur chargement commandes à préparer :", err);
    afficherMessage("❌ Erreur lors du chargement des commandes", "error");
  }
}

// Marquer une commande comme préparée
async function marquerCommePrepare(index) {
  if (!confirm("Marquer cette commande comme préparée ?")) {
    return;
  }

  try {
    const commandes = await lireCommandes();
    commandes[index].statut = "préparée";

    const succes = await sauvegarderCommandes(commandes);

    if (succes) {
      chargerCommandesPreparation();
      afficherMessage("✅ Commande marquée comme préparée !", "success");
    } else {
      afficherMessage("❌ Erreur lors de la mise à jour", "error");
    }
  } catch (error) {
    console.error("Erreur:", error);
    afficherMessage("❌ Erreur de connexion", "error");
  }
}

// Fonction pour afficher les messages
function afficherMessage(message, type) {
  // Créer une zone de message temporaire si elle n'existe pas
  let messageZone = document.getElementById("admin-message");
  if (!messageZone) {
    messageZone = document.createElement("div");
    messageZone.id = "admin-message";
    messageZone.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1000;
      max-width: 400px;
      opacity: 0;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(messageZone);
  }

  messageZone.textContent = message;

  if (type === "success") {
    messageZone.style.background = "linear-gradient(135deg, #d4edda, #c3e6cb)";
    messageZone.style.color = "#155724";
    messageZone.style.border = "1px solid #c3e6cb";
  } else {
    messageZone.style.background = "linear-gradient(135deg, #f8d7da, #f5c6cb)";
    messageZone.style.color = "#721c24";
    messageZone.style.border = "1px solid #f5c6cb";
  }

  // Afficher le message
  messageZone.style.opacity = "1";

  // Masquer après 4 secondes
  setTimeout(() => {
    messageZone.style.opacity = "0";
  }, 4000);
}

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  chargerStock();
  chargerCommandesPreparation();

  // Actualiser les commandes toutes les 30 secondes
  setInterval(chargerCommandesPreparation, 30000);

  // Message de bienvenue
  setTimeout(() => {
    afficherMessage("🔧 Interface admin JSONBin prête !", "success");
  }, 500);
});

// Fonction de debug (à supprimer en production)
window.debugStock = async () => {
  const stock = await lireStock();
  console.log("Stock actuel:", stock);
};
