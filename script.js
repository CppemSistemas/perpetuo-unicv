/* =========================================================
   UniCV Caruaru — Pré-venda
   Carrossel + Formulário → Google Sheets (Apps Script)
   + redirect automático para o WhatsApp
   ========================================================= */

/* ⚠️ CONFIGURE ANTES DE PUBLICAR ------------------------------------------
   1) SHEET_URL  → URL do Web App do Google Apps Script
      (no editor do Apps Script: Implantar → Nova implantação → App da Web,
       "Quem pode acessar: Qualquer pessoa"; copie a URL terminada em /exec)
   2) WHATSAPP_NUM → número de atendimento, só dígitos, com DDI 55
-------------------------------------------------------------------------- */
const SHEET_URL    = "https://script.google.com/macros/s/AKfycbxdFplWVSfhTjvyIA7HIWb645xRjGNhBVhTdTf5UMjo0lSpW_A_jCuys0qB4uImKXPQ/exec";
const WHATSAPP_NUM = "5581973105354";
const WHATSAPP_MSG = "Olá! Acabei de me cadastrar na pré-venda da UniCV e quero saber mais sobre as condições.";
const REDIRECT_SEG = 3; // segundos antes de abrir o WhatsApp

/* ---------- Validação ---------- */
const form = document.getElementById("lead-form");

function fieldOf(name) {
  return form.querySelector(`[name="${name}"]`).closest(".field");
}
function setError(name, msg) {
  fieldOf(name).classList.add("invalid");
  form.querySelector(`[data-error-for="${name}"]`).textContent = msg;
}
function clearError(name) {
  fieldOf(name).classList.remove("invalid");
  form.querySelector(`[data-error-for="${name}"]`).textContent = "";
}
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function validate() {
  let ok = true;
  ["nome", "email", "telefone", "escolaridade"].forEach(clearError);

  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const tel = form.telefone.value.replace(/\D/g, "");
  const esc = form.escolaridade.value;

  if (nome.length < 3) { setError("nome", "Informe seu nome completo."); ok = false; }
  if (!isEmail(email)) { setError("email", "Informe um e-mail válido."); ok = false; }
  if (tel.length < 10) { setError("telefone", "Informe um telefone válido com DDD."); ok = false; }
  if (!esc) { setError("escolaridade", "Selecione a escolaridade."); ok = false; }

  return ok;
}

/* ---------- Envio ---------- */
if (form) {
  const btn = document.getElementById("lead-submit");
  const success = document.getElementById("form-success");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    btn.disabled = true;
    btn.textContent = "ENVIANDO...";

    const escSelect = form.escolaridade;
    const payload = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      // grava o texto legível ("Primeira graduação" / "Já tenho graduação...")
      escolaridade: escSelect.options[escSelect.selectedIndex].text,
    };

    try {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors", // Apps Script não envia cabeçalhos CORS; resposta é opaca
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Evento de conversão do Meta Pixel
      if (typeof fbq !== "undefined") {
        fbq("track", "Lead", { content_name: "Pre-venda UniCV Caruaru" });
      }

      // Evento de Lead do Pixel X (disparado antes do redirect para o WhatsApp)
      if (window.pixel_x_app && typeof window.pixel_x_app.send_event === "function") {
        try {
          await window.pixel_x_app.send_event({
            // Evento
            event_name: "Lead",

            // Lead
            lead_name: payload.nome,
            lead_email: payload.email,
            lead_phone: payload.telefone,
          });
        } catch (_) {
          /* não bloqueia o fluxo de sucesso/redirect */
        }
      }

      // Estado de sucesso: oculta o formulário e mostra a confirmação
      form.querySelectorAll(".field, .note").forEach((el) => (el.style.display = "none"));
      btn.style.display = "none";
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });

      // Contagem regressiva → redireciona para o WhatsApp (mesma aba = sem bloqueio de popup)
      const countEl = document.getElementById("countdown");
      let seg = REDIRECT_SEG;
      if (countEl) countEl.textContent = seg;
      const timer = setInterval(() => {
        seg--;
        if (countEl) countEl.textContent = Math.max(seg, 0);
        if (seg <= 0) {
          clearInterval(timer);
          const url = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(WHATSAPP_MSG)}`;
          window.location.href = url;
        }
      }, 1000);
    } catch (err) {
      setError("telefone", "Erro ao enviar. Tente novamente.");
      btn.disabled = false;
      btn.textContent = "QUERO GARANTIR MINHA VAGA";
    }
  });
}
