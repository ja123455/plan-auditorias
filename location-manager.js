(() => {
  const form = $('locationForm');
  const managerInput = $('locationManagerName');
  if (!form || !managerInput) return;

  const originalEditLocation = editLocation;
  editLocation = function editLocationWithManager(id) {
    originalEditLocation(id);
    const locationRecord = locationNotes.find(location => location.id === id);
    managerInput.value = locationRecord?.managerName || '';
  };

  const originalResetLocationForm = resetLocationForm;
  resetLocationForm = function resetLocationFormWithManager() {
    originalResetLocationForm();
    managerInput.value = '';
  };

  let pendingLocation = null;

  form.addEventListener('submit', () => {
    pendingLocation = {
      id: $('locationEditId').value,
      companyId: $('locationCompany').value,
      name: $('locationName').value.trim(),
      managerName: managerInput.value.trim()
    };
  }, true);

  form.addEventListener('submit', () => {
    if (!pendingLocation) return;

    let record = pendingLocation.id
      ? locationNotes.find(location => location.id === pendingLocation.id)
      : locationNotes.find(location =>
          location.companyId === pendingLocation.companyId &&
          normalizeName(location.name) === normalizeName(pendingLocation.name)
        );

    if (record) {
      record.managerName = pendingLocation.managerName;
      save();
      renderLocations();
    }

    pendingLocation = null;
  });
})();
