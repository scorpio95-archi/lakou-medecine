/* ============================================================
   LAKOU SANTÉ — MÉDECINE — client Supabase dédié
   Projet Supabase propre à Médecine (pas de partage avec les
   autres disciplines — chacune aura son propre Admin, adapté
   à sa matière, et son propre projet).

   ⚠️ À FAIRE : remplace SUPABASE_URL et SUPABASE_KEY ci-dessous
   par ceux de ton NOUVEAU projet Supabase créé pour Médecine.

   RÈGLE D'OR : ne jamais faire `const supabase = ...` dans une
   autre page. Toujours utiliser `window.supabaseClient`.
   C'est ce qui a causé le conflit de GoTrueClient sur
   Architecture Intérieure — on ne répète pas l'erreur ici.

   Inclure une seule fois par page, avant les autres scripts :
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="supabase-client.js"></script>
   ============================================================ */

(function () {
  if (window.supabaseClient) return; // déjà initialisé sur cette page

  const SUPABASE_URL = "https://jrjgdztmudpalpxozctg.supabase.co";
  const SUPABASE_KEY = "sb_publishable_AxoD166CEIkdq3nK_IBKEQ_9xBDCwCc";

  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
})();
