setupStartTimePersistence();
setupFiveMinuteEnforcement();
setupMealUi();
setupFixedOrderUi();
document.getElementById('listDayType')?.addEventListener('change', renderThemeListFromDB);
loadThemes();
