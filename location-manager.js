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