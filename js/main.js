loadThemeSameGapsFromStorage();
loadThemeFixedOrderFromStorage();
loadThemeFixedOrderEnabledFromStorage();
loadThemeListSortFromStorage();
setupStartTimePersistence();
setupRegistrantPersistence();
setupMealUi();
initTimePickers();
setupFiveMinuteEnforcement();
setupFixedOrderUi();
document.getElementById('themeListSort')?.addEventListener('change', () => {
    saveThemeListSortToStorage();
    renderThemeListFromDB();
});
loadThemes();
