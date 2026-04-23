setupStartTimePersistence();
setupMealUi();
initTimePickers();
setupFiveMinuteEnforcement();
setupFixedOrderUi();
document.getElementById('listDayType')?.addEventListener('change', renderThemeListFromDB);
loadThemes();
