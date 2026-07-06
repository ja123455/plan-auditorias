(() => {
  const applyBranding = () => {
    const logos = document.querySelector('.company-brand-logos');
    if (!logos) return false;

    const style = document.createElement('style');
    style.textContent = `
      .company-brand-logos{display:flex!important;align-items:flex-end!important;gap:22px!important;flex-wrap:wrap!important}
      .company-brand-logo-card{display:flex!important;align-items:flex-end!important;justify-content:center!important;padding:0!important;background:transparent!important;box-shadow:none!important;border:none!important;border-radius:0!important;min-height:auto!important}
      .company-brand-logo-card img{display:none!important}
      .company-brand-wordmark{color:rgba(255,255,255,.98);text-shadow:0 2px 10px rgba(0,0,0,.12);line-height:1}
      .wildtours-wordmark{font-family:"Arial Rounded MT Bold","Trebuchet MS",sans-serif;font-size:34px;font-weight:900;letter-spacing:.01em;text-transform:lowercase}
      .aviomar-wordmark{display:flex;flex-direction:column;align-items:flex-start;gap:2px;font-style:italic}
      .aviomar-main{font-size:52px;font-weight:900;letter-spacing:.01em;line-height:.92}
      .aviomar-sub{font-size:19px;font-weight:900;letter-spacing:.18em;line-height:1;text-transform:uppercase}
      @media(max-width:760px){
        .company-brand-logos{gap:14px!important}
        .wildtours-wordmark{font-size:25px}
        .aviomar-main{font-size:38px}
        .aviomar-sub{font-size:14px;letter-spacing:.12em}
      }
    `;
    document.head.appendChild(style);

    logos.innerHTML = `
      <div class="company-brand-logo-card"><div class="company-brand-wordmark wildtours-wordmark" aria-label="Wildtours">wildtours</div></div>
      <div class="company-brand-logo-card"><div class="company-brand-wordmark aviomar-wordmark" aria-label="Aviomar Adventours"><span class="aviomar-main">Aviomar</span><span class="aviomar-sub">Adventours</span></div></div>
    `;

    const version = document.querySelector('.version-mark');
    if (version) version.textContent = 'Versión 16';
    return true;
  };

  if (!applyBranding()) {
    const observer = new MutationObserver(() => {
      if (applyBranding()) observer.disconnect();
    });
    observer.observe(document.documentElement, {childList:true, subtree:true});
  }
})();