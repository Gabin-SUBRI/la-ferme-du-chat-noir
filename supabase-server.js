const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ilkmibaddfuyysqtyowx.supabase.co";
const supabaseServiceKey = "VOTRE_SERVICE_ROLE_KEY_ICI"; // ⚠️ Clé SERVICE (pas publique!)

// Client avec tous les droits pour le serveur
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabase };
