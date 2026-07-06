/* =====================================================================
 * email.js
 * ---------------------------------------------------------------------
 * Envío del formulario de contacto (#contactForm) mediante EmailJS v4.
 * Pensado para sitios estáticos alojados en GitHub Pages, donde no hay
 * backend/PHP disponible: EmailJS actúa como puente entre el formulario
 * y una cuenta de Gmail configurada como "Email Service" en EmailJS.
 *
 * CÓMO ACTIVARLO
 * ---------------------------------------------------------------------
 * 1. Crea una cuenta en https://www.emailjs.com/
 * 2. Conecta tu Gmail en "Email Services" (pestaña "Email Services") y
 *    copia el SERVICE_ID que EmailJS genera automáticamente: siempre
 *    tiene el formato "service_XXXXXXX" (NUNCA es tu dirección de Gmail).
 *    ⚠ El valor actual de SERVICE_ID en este archivo ("teacheredwincaceres@gmai")
 *    es una dirección de correo incompleta, no un Service ID válido, por lo
 *    que EmailJS rechaza el envío. Reemplázalo por el ID real de tu servicio.
 * 3. Crea una plantilla en "Email Templates" y copia el TEMPLATE_ID.
 *    El formulario envía el mensaje escrito por el usuario bajo varios
 *    nombres de variable para que funcione con cualquier plantilla:
 *      {{nombre}} / {{name}}   {{email}}   {{reply_to}}   {{telefono}}
 *      {{mensaje}} / {{message}} / {{comentario}} (los 3 llevan el mismo texto)
 *      {{quiere_info}}   {{quiere_unirse}}
 * 4. Copia tu clave pública en Account > General y colócala en
 *    PUBLIC_KEY más abajo.
 * 5. Reemplaza los 3 valores de EMAILJS_CONFIG y listo: no hace falta
 *    tocar el resto del archivo.
 * ===================================================================== */

(function () {
  "use strict";

  /* -------------------------------------------------------------------
   * 1. CONFIGURACIÓN DE EMAILJS
   *    Sustituye estos 3 valores por los de tu propia cuenta de EmailJS.
   * ---------------------------------------------------------------- */
  var EMAILJS_CONFIG = {
    PUBLIC_KEY: "wBIHCQ-UD4QvjVZbr",       // Clave pública (Account > API Keys)
    SERVICE_ID: "teacheredwincaceres@gmai", // ID del servicio de correo (Email Services)
    TEMPLATE_ID: "template_bb40y5s"         // ID de la plantilla (Email Templates)
  };

  // Inicializa el SDK de EmailJS con la clave pública, si el SDK cargó correctamente.
  if (window.emailjs && typeof window.emailjs.init === "function") {
    window.emailjs.init({ publicKey: EMAILJS_CONFIG.PUBLIC_KEY });
  }

  /* -------------------------------------------------------------------
   * 2. REFERENCIAS AL DOM
   *    Todas por id; si el formulario de contacto no está en la página
   *    actual, el script termina aquí sin generar errores.
   * ---------------------------------------------------------------- */
  var form = document.getElementById("contactForm");
  if (!form) {
    return; // Esta página no tiene formulario de contacto.
  }

  var nameInput = document.getElementById("cName");
  var emailInput = document.getElementById("cEmail");
  var phoneInput = document.getElementById("cWhats");   // Opcional
  var msgInput = document.getElementById("cMsg");
  var wantInfoInput = document.getElementById("cWantInfo"); // Checkbox opcional
  var joinInput = document.getElementById("cJoin");         // Checkbox opcional
  var honeypotInput = document.getElementById("cHoneypot"); // Anti-spam
  var submitBtn = document.getElementById("submitBtn");
  var formMsg = document.getElementById("formMsg");

  // Texto original del botón, para poder restaurarlo tras enviar/fallar.
  var SUBMIT_DEFAULT_TEXT = submitBtn ? submitBtn.textContent : "Enviar";
  var SUBMIT_SENDING_TEXT = "Enviando...";

  /* -------------------------------------------------------------------
   * 3. UTILIDADES DE VALIDACIÓN
   * ---------------------------------------------------------------- */
  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Muestra un mensaje de estado dentro del formulario.
   * @param {string} text  Texto a mostrar (vacío para limpiar).
   * @param {string} type  "ok" | "err" | "" (estado neutro).
   */
  function showMessage(text, type) {
    if (!formMsg) return;
    formMsg.textContent = text || "";
    formMsg.className = "form-msg" + (type ? " " + type : "");
  }

  /**
   * Valida los campos del formulario según las reglas de negocio:
   *  - Nombre: obligatorio
   *  - Correo: obligatorio y con formato válido
   *  - Teléfono/WhatsApp: opcional (si se llena, se revisa longitud mínima)
   *  - Mensaje: obligatorio
   * @returns {boolean} true si el formulario es válido.
   */
  function validateForm() {
    var name = nameInput ? nameInput.value.trim() : "";
    var email = emailInput ? emailInput.value.trim() : "";
    var phone = phoneInput ? phoneInput.value.trim() : "";
    var message = msgInput ? msgInput.value.trim() : "";

    if (!name) {
      showMessage("Por favor ingresa tu nombre.", "err");
      if (nameInput) nameInput.focus();
      return false;
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      showMessage("Por favor ingresa un correo electrónico válido.", "err");
      if (emailInput) emailInput.focus();
      return false;
    }

    // El teléfono/WhatsApp es opcional: solo se valida si el usuario escribió algo.
    if (phone && phone.replace(/[^0-9]/g, "").length < 7) {
      showMessage(
        "El número de WhatsApp no parece válido. Puedes dejarlo vacío si lo prefieres.",
        "err"
      );
      if (phoneInput) phoneInput.focus();
      return false;
    }

    if (!message) {
      showMessage("Por favor escribe un mensaje.", "err");
      if (msgInput) msgInput.focus();
      return false;
    }

    return true;
  }

  /* -------------------------------------------------------------------
   * 4. ENVÍO DEL FORMULARIO CON EMAILJS
   * ---------------------------------------------------------------- */

  /**
   * Activa/desactiva el estado visual "Enviando..." en el botón.
   * @param {boolean} isSending
   */
  function setSendingState(isSending) {
    if (!submitBtn) return;
    submitBtn.disabled = isSending;
    submitBtn.textContent = isSending ? SUBMIT_SENDING_TEXT : SUBMIT_DEFAULT_TEXT;
  }

  /**
   * Maneja el evento submit del formulario: valida, envía vía EmailJS
   * y actualiza la interfaz según el resultado.
   * @param {Event} event
   */
  function handleSubmit(event) {
    event.preventDefault();

    // Honeypot anti-spam: si un bot rellenó este campo oculto, se ignora el envío
    // simulando éxito (para no darle pistas al bot) sin llamar a EmailJS.
    if (honeypotInput && honeypotInput.value.trim() !== "") {
      showMessage("Mensaje enviado correctamente", "ok");
      form.reset();
      return;
    }

    if (!validateForm()) {
      return; // validateForm ya mostró el mensaje de error correspondiente
    }

    if (!window.emailjs) {
      showMessage("No fue posible enviar el mensaje. Intente nuevamente.", "err");
      return;
    }

    setSendingState(true);
    showMessage("", "");

    // El mensaje escrito por el usuario en el textarea #cMsg es la única
    // fuente del contenido que se envía: se toma tal cual (recortando
    // espacios sobrantes) y se manda bajo varios nombres de variable
    // ({{mensaje}}, {{message}}, {{comentario}}) para que llegue completo
    // al correo sin importar cuál de esos nombres use tu plantilla de
    // EmailJS. Así el texto que la persona anota en el formulario es,
    // siempre, el texto que aparece en el correo recibido.
    var mensajeEscrito = msgInput.value.trim();

    // Parámetros que viajan a la plantilla de EmailJS.
    var templateParams = {
      nombre: nameInput.value.trim(),
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      reply_to: emailInput.value.trim(), // permite responder directo al remitente
      telefono: phoneInput ? phoneInput.value.trim() : "(no proporcionado)",
      mensaje: mensajeEscrito,
      message: mensajeEscrito,
      comentario: mensajeEscrito,
      quiere_info: wantInfoInput && wantInfoInput.checked ? "Sí" : "No",
      quiere_unirse: joinInput && joinInput.checked ? "Sí" : "No"
    };

    window.emailjs
      .send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, templateParams)
      .then(function () {
        showMessage("Mensaje enviado correctamente", "ok");
        form.reset();

        // Si el sitio expone un cerrador de modal (ver index.html), se usa
        // para cerrar automáticamente la burbuja de contacto tras el envío.
        if (typeof window.IMPULSOS_closeContactModal === "function") {
          setTimeout(window.IMPULSOS_closeContactModal, 1800);
        }
      })
      .catch(function (error) {
        // Se deja constancia en consola para depuración, sin exponer detalles al usuario.
        console.error("EmailJS: error al enviar el formulario de contacto.", error);
        showMessage("No fue posible enviar el mensaje. Intente nuevamente.", "err");
      })
      .finally(function () {
        setSendingState(false);
      });
  }

  /* -------------------------------------------------------------------
   * 5. REGISTRO DE EVENTOS
   * ---------------------------------------------------------------- */
  form.addEventListener("submit", handleSubmit);
})();
