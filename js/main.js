/* Surface Capital — site behaviour (vanilla JS, no dependencies) */
(function () {
  "use strict";

  /* ---- professional-investor gate ---- */
  var gate = document.getElementById("gate");
  var KEY = "sc-investor-ack";
  try {
    if (sessionStorage.getItem(KEY) !== "1") { gate.hidden = false; }
  } catch (e) { gate.hidden = false; }   // privacy mode: show gate each visit

  var accept = document.getElementById("gate-accept");
  var decline = document.getElementById("gate-decline");
  if (accept) {
    accept.addEventListener("click", function () {
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
      gate.hidden = true;
    });
  }
  if (decline) {
    decline.addEventListener("click", function () {
      document.getElementById("gate-title").textContent = "Tak for besøget";
      document.getElementById("gate-body").textContent =
        "Indholdet på dette website er forbeholdt professionelle og kvalificerede investorer.";
      var actions = document.querySelector(".gate-actions");
      if (actions) { actions.remove(); }
    });
  }

  /* ---- nav: solid background on scroll ---- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 40) { nav.classList.add("scrolled"); }
    else { nav.classList.remove("scrolled"); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu toggle ---- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- email obfuscation ---- */
  var mail = document.getElementById("mail");
  if (mail) {
    var user = mail.getAttribute("data-user");
    var domain = mail.getAttribute("data-domain");
    var addr = user + "@" + domain;
    mail.href = "mailto:" + addr;
    mail.textContent = addr;
  }

  /* ---- footer year ---- */
  var yr = document.getElementById("yr");
  if (yr) { yr.textContent = new Date().getFullYear(); }
})();
