(() => {
  const form = $('locationForm');
  const managerInput = $('locationManagerName');
  const companySelect = $('locationCompany');
  const primaryField = $('sharedPrimaryCompanyField');
  const primarySelect = $('locationPrimaryCompany');
  if (!form || !managerInput) return;

  const refreshPrimaryOptions = () => {
    if (!primarySelect) return;
    const selected = primarySelect.value;
    primarySelect.innerHTML = companies
      .map(companyItem => `<option value="${companyItem.id}">${esc(companyItem.name)}</option>`)
      .join('');
    primarySelect.value = companies.some(companyItem => companyItem.id === selected)
      ? selected
      : (companies[0]?.id || '');
  };

  const updatePrimaryVisibility = () => {
    if (!primaryField || !primarySelect || !companySelect) return;
    const isShared = companySelect.value === BOTH_ID;
    primaryField.hidden = !isShared;
    primarySelect.required = isShared;
    if (isShared && !primarySelect.value) {
      primarySelect.value = companies[0]?.id || '';
    }
  };

  const originalEditLocation = editLocation;
  editLocation = function editLocationWithDetails(id) {
    originalEditLocation(id);
    const locationRecord = locationNotes.find(location => location.id === id);
    managerInput.value = locationRecord?.managerName || '';
    refreshPrimaryOptions();
    if (primarySelect) {
      primarySelect.value = companies.some(companyItem => companyItem.id === locationRecord?.primaryCompanyId)
        ? locationRecord.primaryCompanyId
        : (companies[0]?.id || '');
    }
    updatePrimaryVisibility();
  };

  const originalResetLocationForm = resetLocationForm;
  resetLocationForm = function resetLocationFormWithDetails() {
    originalResetLocationForm();
    managerInput.value = '';
    refreshPrimaryOptions();
    updatePrimaryVisibility();
  };

  companySelect?.addEventListener('change', updatePrimaryVisibility);
  $('saveCompanies')?.addEventListener('click', () => {
    setTimeout(() => {
      refreshPrimaryOptions();
      updatePrimaryVisibility();
    }, 0);
  });

  let pendingLocation = null;

  form.addEventListener('submit', () => {
    const companyId = companySelect.value;
    pendingLocation = {
      id: $('locationEditId').value,
      companyId,
      name: $('locationName').value.trim(),
      managerName: managerInput.value.trim(),
      primaryCompanyId: companyId === BOTH_ID ? (primarySelect?.value || '') : ''
    };
  }, true);

  form.addEventListener('submit', () => {
    if (!pendingLocation) return;

    const record = pendingLocation.id
      ? locationNotes.find(location => location.id === pendingLocation.id)
      : locationNotes.find(location =>
          location.companyId === pendingLocation.companyId &&
          normalizeName(location.name) === normalizeName(pendingLocation.name)
        );

    if (record) {
      record.managerName = pendingLocation.managerName;
      record.primaryCompanyId = pendingLocation.primaryCompanyId;
      save();
      renderLocations();
    }

    pendingLocation = null;
  });

  refreshPrimaryOptions();
  updatePrimaryVisibility();
})();

(() => {
  const header = document.querySelector('header .head');
  if (!header || header.querySelector('.company-brand-logos')) return;

  const titleBlock = header.firstElementChild;
  if (!titleBlock) return;

  const style = document.createElement('style');
  style.textContent = `
    .company-brand-wrap{display:flex;align-items:center;gap:20px;min-width:0;flex:1;flex-wrap:wrap}
    .company-brand-logos{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
    .company-brand-logo-card{display:flex;align-items:center;justify-content:center;min-height:72px;padding:8px 14px;border-radius:14px;background:rgba(255,255,255,.94);box-shadow:0 8px 20px rgba(0,0,0,.12)}
    .company-brand-logo{display:block;width:auto;height:auto;object-fit:contain}
    .company-brand-logo.wildtours{max-width:150px;max-height:64px}
    .company-brand-logo.aviomar{max-width:250px;max-height:70px}
    .company-brand-copy{min-width:260px}
    @media(max-width:760px){
      .company-brand-wrap{align-items:flex-start;gap:14px}
      .company-brand-logos{gap:9px}
      .company-brand-logo-card{min-height:56px;padding:6px 9px}
      .company-brand-logo.wildtours{max-width:112px;max-height:48px}
      .company-brand-logo.aviomar{max-width:180px;max-height:52px}
      .company-brand-copy{min-width:0;width:100%}
    }
  `;
  document.head.appendChild(style);

  const wrapper = document.createElement('div');
  wrapper.className = 'company-brand-wrap';
  const logos = document.createElement('div');
  logos.className = 'company-brand-logos';
  logos.innerHTML = `
    <div class="company-brand-logo-card"><img class="company-brand-logo wildtours" src="logo-wildtours.svg?v=1" alt="Wildtours"></div>
    <div class="company-brand-logo-card"><img class="company-brand-logo aviomar" src="logo-aviomar.svg?v=1" alt="Aviomar Adventours"></div>
  `;

  const copy = document.createElement('div');
  copy.className = 'company-brand-copy';
  while (titleBlock.firstChild) copy.appendChild(titleBlock.firstChild);

  titleBlock.replaceWith(wrapper);
  wrapper.append(logos, copy);

  const versionMark = document.querySelector('.version-mark');
  if (versionMark) versionMark.textContent = 'Versión 15';
})();