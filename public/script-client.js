let commandesClient = [];

async function chargerStock() {
  try {
    const res = await fetch("/stock");
    const stock = await res.json();
    const select = document.getElementById("produit");
    select.innerHTML = "";

    stock.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.produit;
      option.textContent = `${item.produit} – ${item.prix.toFixed(2)} €/${
        item.unite
      } (Stock: ${item.quantite})`;
      option.dataset.prix = item.prix;
      option.dataset.unite = item.unite;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Erreur de chargement du stock :", err);
    afficherMessageClient("❌ Impossible de charger les produits", "erreur");
  }
}

document.addEventListener("DOMContentLoaded", () => chargerStock());

document.getElementById("form-commande").addEventListener("submit", (e) => {
  e.preventDefault();

  const select = document.getElementById("produit");
  const quantite = Number(document.getElementById("quantite").value);

  const commande = {
    produit: select.value,
    quantite,
    prix: Number(select.selectedOptions[0].dataset.prix),
    unite: select.selectedOptions[0].dataset.unite,
  };

  commandesClient.push(commande);
  afficherCommandesClient();
  e.target.reset();
});

function afficherCommandesClient() {
  const tbody = document.getElementById("table-commandes");
  tbody.innerHTML = "";

  commandesClient.forEach((cmd) => {
    const total = cmd.quantite * cmd.prix;
    tbody.innerHTML += `<tr>
      <td>${cmd.produit}</td>
      <td>${cmd.quantite}</td>
      <td>${cmd.unite}</td>
      <td>${cmd.prix.toFixed(2)} €</td>
      <td>${total.toFixed(2)} €</td>
    </tr>`;
  });
}

document
  .getElementById("valider-commande")
  .addEventListener("click", async () => {
    if (commandesClient.length === 0) {
      afficherMessageClient("⚠️ Aucune commande à valider !", "erreur");
      return;
    }

    const nomClient = document.getElementById("nom-client").value.trim();
    if (!nomClient) {
      afficherMessageClient("⚠️ Veuillez renseigner votre nom !", "erreur");
      return;
    }

    const commandesAvecNom = commandesClient.map((cmd) => ({
      ...cmd,
      client: nomClient,
    }));

    try {
      const res = await fetch("/valider-commande", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commandesAvecNom),
      });

      if (!res.ok) {
        const msg = await res.text();
        afficherMessageClient(`❌ Commande refusée : ${msg}`, "erreur");
        return;
      }

      let total = 0;
      const lignes = commandesAvecNom.map((cmd) => {
        const sousTotal = cmd.quantite * cmd.prix;
        total += sousTotal;
        return `${cmd.quantite} ${cmd.unite} de ${
          cmd.produit
        } à ${cmd.prix.toFixed(2)} €/${cmd.unite} → ${sousTotal.toFixed(2)} €`;
      });

      afficherMessageClient(
        `✅ Commande validée pour ${nomClient}\n${lignes.join(
          "\n"
        )}\nTotal : ${total.toFixed(2)} €`,
        "success"
      );

      commandesClient = [];
      afficherCommandesClient();
      document.getElementById("form-commande").reset();
      chargerStock();
    } catch (err) {
      console.error("Erreur lors de la validation :", err);
      afficherMessageClient("❌ Échec serveur ou connexion perdue", "erreur");
    }
  });

function afficherMessageClient(message, type) {
  const zone = document.getElementById("message");
  zone.textContent = message;
  zone.className = type;
}
document.getElementById("vider-panier").addEventListener("click", () => {
  if (commandesClient.length === 0) {
    afficherMessageClient("⚠️ Le panier est déjà vide", "erreur");
    return;
  }

  commandesClient = [];
  afficherCommandesClient();
  document.getElementById("form-commande").reset();
  afficherMessageClient("🧹 Panier vidé avec succès", "success");
});
