(() => {
  const applyBranding = () => {
    const logos = document.querySelector('.company-brand-logos');
    if (!logos) return false;

    const style = document.createElement('style');
    style.textContent = `
      .company-brand-wrap{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:24px!important;flex-wrap:wrap!important}
      .company-brand-logos{display:flex!important;align-items:center!important;gap:22px!important;flex-wrap:wrap!important}
      .company-brand-logo-card{display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;background:transparent!important;box-shadow:none!important;border:none!important;border-radius:0!important;min-height:auto!important}
      .company-brand-logo{display:block!important;width:auto!important;height:auto!important;object-fit:contain!important;filter:drop-shadow(0 2px 10px rgba(0,0,0,.12))!important;opacity:.98!important}
      .company-brand-logo.wildtours{max-width:150px!important;max-height:64px!important}
      .company-brand-logo.aviomar{max-width:250px!important;max-height:70px!important}
      @media(max-width:760px){
        .company-brand-logos{gap:14px!important}
        .company-brand-logo.wildtours{max-width:112px!important;max-height:48px!important}
        .company-brand-logo.aviomar{max-width:180px!important;max-height:52px!important}
      }
    `;
    document.head.appendChild(style);

    logos.innerHTML = `
      <div class="company-brand-logo-card"><img class="company-brand-logo wildtours" src="logo-wildtours.svg?v=17" alt="Wildtours"></div>
      <div class="company-brand-logo-card"><img class="company-brand-logo aviomar" src="logo-aviomar.svg?v=17" alt="Aviomar Adventours"></div>
    `;

    const version = document.querySelector('.version-mark');
    if (version) version.textContent = 'Versión 17';
    return true;
  };

  if (!applyBranding()) {
    const observer = new MutationObserver(() => {
      if (applyBranding()) observer.disconnect();
    });
    observer.observe(document.documentElement, {childList:true, subtree:true});
  }
})();