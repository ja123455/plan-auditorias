(() => {
  const applyBranding = () => {
    const logos = document.querySelector('.company-brand-logos');
    if (!logos) return false;

    const style = document.createElement('style');
    style.textContent = `
      .company-brand-wrap{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:28px!important;flex-wrap:wrap!important}
      .company-brand-logos{display:grid!important;grid-template-columns:140px 230px!important;align-items:center!important;column-gap:56px!important;row-gap:18px!important;flex:none!important}
      .company-brand-logo-card{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;padding:0!important;background:transparent!important;box-shadow:none!important;border:none!important;border-radius:0!important;min-height:auto!important}
      .company-brand-logo{display:block!important;width:100%!important;height:auto!important;object-fit:contain!important;filter:drop-shadow(0 2px 10px rgba(0,0,0,.12))!important;opacity:.98!important}
      .company-brand-logo.wildtours{max-width:140px!important;max-height:62px!important}
      .company-brand-logo.aviomar{max-width:230px!important;max-height:68px!important}
      @media(max-width:900px){
        .company-brand-logos{grid-template-columns:120px 190px!important;column-gap:38px!important}
        .company-brand-logo.wildtours{max-width:120px!important;max-height:54px!important}
        .company-brand-logo.aviomar{max-width:190px!important;max-height:58px!important}
      }
      @media(max-width:620px){
        .company-brand-logos{grid-template-columns:1fr!important;width:230px!important;row-gap:14px!important}
        .company-brand-logo.wildtours{max-width:120px!important;max-height:50px!important}
        .company-brand-logo.aviomar{max-width:210px!important;max-height:60px!important}
      }
    `;
    document.head.appendChild(style);

    logos.innerHTML = `
      <div class="company-brand-logo-card"><img class="company-brand-logo wildtours" src="logo-wildtours.svg?v=18" alt="Wildtours"></div>
      <div class="company-brand-logo-card"><img class="company-brand-logo aviomar" src="logo-aviomar.svg?v=18" alt="Aviomar Adventours"></div>
    `;

    const version = document.querySelector('.version-mark');
    if (version) version.textContent = 'Versión 18';
    return true;
  };

  if (!applyBranding()) {
    const observer = new MutationObserver(() => {
      if (applyBranding()) observer.disconnect();
    });
    observer.observe(document.documentElement, {childList:true, subtree:true});
  }
})();