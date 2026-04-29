loadThemeSameGapsFromStorage();
loadThemeListSortFromStorage();
setupStartTimePersistence();
setupMealUi();
initTimePickers();
setupFiveMinuteEnforcement();
setupFixedOrderUi();
document.getElementById('listDayType')?.addEventListener('change', renderThemeListFromDB);
document.getElementById('themeListSort')?.addEventListener('change', () => {
    saveThemeListSortToStorage();
    renderThemeListFromDB();
});
loadThemes();
