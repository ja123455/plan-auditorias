(() => {
  const form = $('form');
  const companySelect = $('company');
  const originalLocationField = $('location');
  const saveButton = $('saveBtn');
  if (!form || !companySelect || !originalLocationField || !saveButton) return;

  const locationSelect = document.createElement('select');
  locationSelect.id = 'location';
  locationSelect.name = originalLocationField.name || 'location';
  locationSelect.required = true;
  locationSelect.setAttribute('aria-label', 'Locación registrada');
  originalLocationField.replaceWith(locationSelect);

  const help = document.createElement('p');
  help.className = 'visit-location-help';
  locationSelect.insertAdjacentElement('afterend', help);

  const style = document.createElement('style');
  style.textContent = `
    .visit-location-help{margin:6px 2px 0;color:var(--muted);font-size:11px;line-height:1.35;font-weight:700}
    .visit-location-help.warning{color:#a33a2b}
    #location:disabled{background:#f1f4f6;color:#7b8792;cursor:not-allowed}
  `;
  document.head.appendChild(style);

  const locationsForCompany = companyId => {
    if (companyId === BOTH_ID) {
      return locationNotes.filter(location => location.companyId === BOTH_ID);
    }
    return locationNotes.filter(location => location.companyId === companyId || location.companyId === BOTH_ID);
  };

  const optionMarkup = location => {
    const suffix = location.companyId === BOTH_ID ? ' · Compartida' : '';
    return `<option value="${esc(location.name)}" data-location-id="${location.id}">${esc(location.name)}${suffix}</option>`;
  };

  function refreshVisitLocations(preferredId = '', preferredName = '') {
    const companyId = companySelect.value || companies[0]?.id || '';
    const currentId = preferredId || locationSelect.selectedOptions[0]?.dataset.locationId || '';
    const currentName = preferredName || locationSelect.value || '';
    const available = locationsForCompany(companyId)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    const ownLocations = available.filter(location => location.companyId === companyId);
    const sharedLocations = available.filter(location => location.companyId === BOTH_ID && companyId !== BOTH_ID);

    let html = '<option value="">Selecciona una locación</option>';
    if (ownLocations.length) {
      html += `<optgroup label="${esc(company(companyId).name)}">${ownLocations.map(optionMarkup).join('')}</optgroup>`;
    }
    if (sharedLocations.length) {
      html += `<optgroup label="Locaciones compartidas">${sharedLocations.map(optionMarkup).join('')}</optgroup>`;
    }
    locationSelect.innerHTML = html;

    const options = [...locationSelect.options];
    const selectedOption = options.find(option => option.dataset.locationId === currentId)
      || options.find(option => option.value === currentName && option.dataset.locationId);
    if (selectedOption) selectedOption.selected = true;

    const hasLocations = available.length > 0;
    locationSelect.disabled = !hasLocations;
    saveButton.disabled = !hasLocations;
    help.classList.toggle('warning', !hasLocations);
    help.textContent = hasLocations
      ? 'Selecciona una locación registrada. Para usar una nueva, agrégala primero en Control de locaciones.'
      : 'No hay locaciones registradas para esta empresa. Agrégala primero en Control de locaciones.';
  }

  form.addEventListener('submit', event => {
    const selectedOption = locationSelect.selectedOptions[0];
    if (!selectedOption?.dataset.locationId) {
      event.preventDefault();
      event.stopImmediatePropagation();
      alert('Primero selecciona una locación registrada. Si no aparece, agrégala en Control de locaciones.');
    }
  }, true);

  companySelect.addEventListener('change', () => refreshVisitLocations());

  syncVisitToLocation = function syncVisitToRegisteredLocation(visit) {
    if (!visit) return;

    let record = visit.locationId
      ? locationNotes.find(location => location.id === visit.locationId)
      : null;

    const selectedOption = locationSelect.selectedOptions[0];
    if (!record && selectedOption?.dataset.locationId && selectedOption.value === visit.location) {
      record = locationNotes.find(location => location.id === selectedOption.dataset.locationId);
    }

    if (!record) {
      const locationKey = normalizeName(visit.location);
      record = locationNotes.find(location =>
        normalizeName(location.name) === locationKey
        && (location.companyId === visit.companyId || location.companyId === BOTH_ID)
      );
    }

    if (!record) return;

    visit.locationId = record.id;
    visit.location = record.name;

    if (visit.status === 'Completada') {
      const completedDate = computedEndDate(visit);
      if (!record.lastAuditDate || dateObj(completedDate) > dateObj(record.lastAuditDate)) {
        record.lastAuditDate = completedDate;
      }
    }
  };

  const originalReset = reset;
  reset = function resetWithRegisteredLocations() {
    originalReset();
    refreshVisitLocations();
  };

  const originalEditVisit = editVisit;
  editVisit = function editVisitWithRegisteredLocation(id) {
    const visit = visits.find(item => item.id === id);
    originalEditVisit(id);
    if (visit) refreshVisitLocations(visit.locationId || '', visit.location || '');
  };

  const originalScheduleLocation = scheduleLocation;
  scheduleLocation = function scheduleRegisteredLocation(id) {
    const location = locationNotes.find(item => item.id === id);
    originalScheduleLocation(id);
    if (location) refreshVisitLocations(location.id, location.name);
  };

  const originalRefreshCompanies = refreshCompanies;
  refreshCompanies = function refreshCompaniesAndLocations() {
    originalRefreshCompanies();
    refreshVisitLocations();
  };

  const originalRenderLocations = renderLocations;
  renderLocations = function renderLocationsAndVisitOptions() {
    const selectedId = locationSelect.selectedOptions[0]?.dataset.locationId || '';
    const selectedName = locationSelect.value || '';
    originalRenderLocations();
    refreshVisitLocations(selectedId, selectedName);
  };

  const version = document.querySelector('.version-mark');
  if (version) version.textContent = 'Versión 19';
  refreshVisitLocations();
})();