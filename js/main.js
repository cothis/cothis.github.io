loadThemeSameGapsFromStorage();
loadThemeFixedOrderFromStorage();
loadThemeFixedOrderEnabledFromStorage();
loadThemeListSortFromStorage();
setupRegistrantPersistence();
setupMealUi();
initTimePickers();
setupFiveMinuteEnforcement();
setupStartTimePersistence();
setupFixedOrderUi();
document.getElementById('themeListSort')?.addEventListener('change', () => {
    saveThemeListSortToStorage();
    renderThemeListFromDB();
});
loadThemes();
