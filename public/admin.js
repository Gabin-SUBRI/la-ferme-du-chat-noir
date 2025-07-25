// Ajout au stock
document.getElementById("form-stock").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    produit: document.getElementById("nom").value,
    quantite: Number(document.getElementById("quantite").value),
    prix: Number(document.getElementById("prix").value),
    unite: document.getElementById("unite").value,
  };

  await fetch("/stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  chargerStock();
  e.target.reset();
});

// Charger le stock
async function chargerStock() {
  const res = await fetch("/stock");
  const stock = await res.json();
  const tbody = document.getElementById("table-stock");
  tbody.innerHTML = "";
  stock.forEach((item, index) => {
    tbody.innerHTML += `<tr>
      <td>${item.produit}</td>
      <td>${item.quantite}</td>
      <td>${item.unite}</td>
      <td>${item.prix.toFixed(2)} €</td>
      <td><button onclick="supprimerLegume(${index})">Supprimer</button></td>
    </tr>`;
  });
}
async function chargerCommandesPreparation() {
  try {
    const res = await fetch("/commandes-a-preparer");
    const commandes = await res.json();

    const tbody = document.querySelector("#table-preparation tbody");
    tbody.innerHTML = "";

    commandes.forEach((cmd) => {
      const ligne = document.createElement("tr");

      ligne.innerHTML = `
        <td>${cmd.client || "<em>Inconnu</em>"}</td>
        <td>${cmd.produit}</td>
        <td>${cmd.quantite}</td>
        <td>${cmd.unite}</td>
      `;

      tbody.appendChild(ligne);
    });
  } catch (err) {
    console.error("Erreur chargement commandes à préparer :", err);
  }
}

// Charge les commandes au démarrage
document.addEventListener("DOMContentLoaded", () => {
  chargerCommandesPreparation();
  chargerStock();
});

function chargerCommandesPreparation() {
  fetch("/commandes-a-preparer")
    .then((res) => res.json())
    .then((commandes) => {
      const tbody = document.querySelector("#table-preparation tbody");
      tbody.innerHTML = "";

      commandes.forEach((cmd, index) => {
        const ligne = document.createElement("tr");

        ligne.innerHTML = `
          <td>${cmd.client}</td>
          <td>${cmd.produit}</td>
          <td>${cmd.quantite}</td>
          <td>${cmd.unite}</td>
          <td>${cmd.statut || "à préparer"}</td>
          <td>
            ${
              cmd.statut === "préparée"
                ? "✅"
                : `<button onclick="marquerCommePrepare(${index})">📦 Marquer comme préparée</button>`
            }
          </td>
        `;
        tbody.appendChild(ligne);
      });
    });
}
function marquerCommePrepare(index) {
  fetch(`/commande/statut/${index}`, {
    method: "PUT",
  }).then((res) => {
    if (res.ok) {
      chargerCommandesPreparation();
    } else {
      alert("❌ Impossible de modifier le statut");
    }
  });
}
