import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ilkmibaddfuyysqtyowx.supabase.co";
const supabaseKey = "sb_publishable_sHMfECnBBHKLhEZJs4Pdcw_O5YmzR5Y"; // À remplacer par votre vraie clé

export const supabase = createClient(supabaseUrl, supabaseKey);
