/*
 * UI translations (Polish and English).
 *
 * Usage: t("hives") returns "Ule" or "Hives", depending on the language.
 * The chosen language is saved in localStorage ("apilog_lang").
 */

const I18N = {
  pl: {
    app_title: "ApiLog",
    // navigation
    tab_hives: "Ule", tab_alerts: "Uwagi", tab_apiaries: "Pasieki", tab_knowledge: "Wiedza",
    net_online: "online", net_offline: "offline",
    net_offline_pending: (n) => `offline · ${n} do wysłania`,
    net_syncing: (n) => `synchronizacja… (${n})`,
    sync_rejected: (n) => `Serwer odrzucił zapisy (${n}). Sprawdź dane i spróbuj ponownie.`,
    // common
    save: "Zapisz", cancel: "Anuluj", edit: "Edytuj", back_to_hives: "← Wróć do uli",
    saved: "Zapisano", saved_offline: "Zapisano offline",
    // apiaries
    apiaries: "Pasieki", new_apiary: "➕ Nowa pasieka", edit_apiary: "Edytuj pasiekę",
    apiary_name: "Nazwa", location: "Lokalizacja", notes: "Notatki",
    no_apiaries: "Brak pasiek. Dodaj pierwszą, aby zacząć.",
    no_location: "bez lokalizacji", hives_count: (n) => `${n} uli`,
    need_apiary_name: "Podaj nazwę pasieki",
    delete: "Usuń", deleted: "Usunięto", deleted_offline: "Usunięto (wyślę po połączeniu)",
    confirm_delete_apiary: (name, n) => `Usunąć pasiekę „${name}”? Usunie to też ${n} uli i ich przeglądy.`,
    confirm_delete_hive: (name) => `Usunąć ul „${name}” razem z całą historią przeglądów?`,
    confirm_delete_inspection: (date) => `Usunąć przegląd z ${date}?`,
    // hives
    hives: "Ule", new_hive: "➕ Nowy ul", edit_hive: "Edytuj ul",
    need_apiary_first: "Najpierw dodaj pasiekę w zakładce 📍 Pasieki.",
    no_hives: "Brak uli. Dodaj pierwszy ul.",
    hive_apiary: "Pasieka", hive_name: "Nazwa / numer ula", hive_type: "Typ ula",
    bee_race: "Rasa pszczoły", queen_year: "Rok matki", queen_color: "Kolor matki",
    no_details: "brak szczegółów", last_inspection: "Ostatni przegląd",
    no_inspections: "Brak przeglądów", brood: "czerw",
    ok_pill: "ok", alerts_pill: (n) => `${n} uwag`,
    need_hive_name: "Podaj nazwę/numer ula",
    colors: { "": "—", "biały": "biały", "żółty": "żółty", "czerwony": "czerwony", "zielony": "zielony", "niebieski": "niebieski" },
    // hive details
    edit_hive_btn: "Edytuj ul", new_inspection: "➕ Nowy przegląd",
    inspection_history: "Historia przeglądów", no_hive_inspections: "Jeszcze brak przeglądów tego ula.",
    not_synced: "niezsync.", todo_label: "📌 Do zrobienia: ", advice_toggle: (n) => `💡 Rady (${n})`,
    // inspection form
    inspection_of: "Przegląd: ", inspection_date: "Data przeglądu",
    fs_queen: "👑 Matka i czerw", queen_status: "Status matki",
    q_seen: "Matkę widziano", q_eggs: "Nie widziano, ale są jaja", q_notfound: "Nie znaleziono matki", q_unmarked: "Obecna, nieoznakowana",
    chk_eggs: "🥚 jaja", chk_larvae: "🐛 larwy", chk_capped: "▨ czerw kryty",
    brood_pattern: "Wzorzec czerwiu (1 = słaby, 5 = zwarty)",
    fs_mood: "🐝 Nastrój i siła rodziny", swarm_mood: "Nastrój rojowy",
    mood_calm: "Spokojny", mood_building: "Zaczątki mateczników", mood_swarming: "Rojowy (dojrzałe mat.)",
    queen_cells: "Liczba mateczników", strength: "Siła rodziny (1–10)", frames_bees: "Obsiadane ramki",
    temperament: "Temperament", temp_gentle: "Łagodny", temp_normal: "Normalny", temp_aggr: "Agresywny",
    fs_stores: "🍯 Zapasy", stores_food: "Pokarm (0–5)", stores_pollen: "Pyłek (0–5)",
    fs_health: "🩺 Zdrowie", varroa_method: "Metoda badania Varroa",
    vm_none: "Nie badano", vm_sugar: "Cukier puder", vm_alcohol: "Zmyw alkoholowy", vm_board: "Wkład dennicowy", vm_drone: "Czerw trutowy",
    varroa_count: "Wynik (liczba roztoczy)", disease_signs: "Objawy chorób (zgnilec, nosema, biegunka…)",
    disease_ph: "puste = brak objawów",
    fs_actions: "🧰 Wykonane czynności", treatment: "Zabieg / leczenie", feeding: "Karmienie",
    honey: "Odebrany miód [kg]",
    fs_ctx: "🌤️ Warunki i notatki", weather: "Pogoda", temperature: "Temperatura [°C]",
    todo_next: "📌 Do zrobienia następnym razem",
    save_inspection: "💾 Zapisz przegląd",
    // advice screen
    advice_screen_title: "Rady po przeglądzie", advice_saved_head: (h) => `✅ Zapisano przegląd: ${h}`,
    advice_saved_sub: "Na podstawie wpisanych obserwacji przygotowaliśmy wskazówki. Są zapisane w historii tego ula (również offline).",
    next_review: "⏱ Następny przegląd",
    next_review_txt: (d, date) => `Zalecany za ${d} dni, ok. ${date}.`,
    see_history: "Zobacz historię ula", to_hives: "Do listy uli",
    advice_review_in: (d) => `⏱ Sugerowany następny przegląd: za ${d} dni`,
    // alerts
    alerts: "Uwagi", alerts_offline_note: "Jesteś offline. Uwagi liczone są na serwerze i mogą być nieaktualne.",
    no_alerts: "🎉 Brak uwag. Wszystkie ule wyglądają dobrze.", alert_last: "ostatni przegląd: ",
    // knowledge
    knowledge: "Wiedza",
    dev_cycle_h: "🥚 Cykl rozwojowy: od jaja do dorosłej pszczoły",
    dev_cycle_sub: "Ile dni trwa rozwój każdej z trzech kast i co dzieje się na kolejnych etapach.",
    days: "dni",
    worker_cal_h: "🐝 Życie robotnicy dzień po dniu",
    worker_cal_sub: "Zadania robotnicy zmieniają się z wiekiem (tzw. polietyzm wieku). Zakresy dni są orientacyjne i nakładają się.",
    offline_note: "Wiedza dostępna również offline.",
    fact_label: "🐝 Ciekawostka dnia",
    // status labels in the inspection summary
    qs_widziana: "👑 widziana", qs_jaja: "🥚 jaja", qs_nie_znaleziono: "❓ brak matki", qs_nieoznakowana: "matka bez znaku",
    md_spokojny: "spokojny", md_budujacy: "zaczątki mateczników", md_rojowy: "⚠️ rojowy",
    lbl_brood: "czerw", lbl_cells: "mateczniki: ", lbl_varroa: "Varroa: ",
    // alert texts (built from the code and params sent by the server)
    al_no_inspection: () => "Brak jakiegokolwiek przeglądu tego ula.",
    al_overdue: (p) => `Ostatni przegląd ${p.days} dni temu. Zalecany co 7–14 dni w sezonie.`,
    al_queenless: () => "Nie znaleziono matki, jaj ani larw. Rodzina może być bezmateczna.",
    al_swarming: (p) => `Nastrój rojowy (${p.mood}), mateczniki: ${p.cells}. Rozważ poszerzenie / odebranie czerwiu.`,
    al_poor_brood: (p) => `Słaby wzorzec czerwiu (${p.pattern}/5). Możliwy problem z matką lub choroba.`,
    al_low_food: () => "Niskie zapasy pokarmu. Rozważ podkarmianie.",
    al_varroa: (p) => `Wysoki poziom warrozy (${p.count} roztoczy w próbce). Planuj leczenie.`,
    al_disease: (p) => `Odnotowano objawy chorobowe: ${p.signs}.`,
  },
  en: {
    app_title: "ApiLog",
    tab_hives: "Hives", tab_alerts: "Alerts", tab_apiaries: "Apiaries", tab_knowledge: "Knowledge",
    net_online: "online", net_offline: "offline",
    net_offline_pending: (n) => `offline · ${n} to send`,
    net_syncing: (n) => `syncing… (${n})`,
    sync_rejected: (n) => `The server rejected ${n} change(s). Please check the data and try again.`,
    save: "Save", cancel: "Cancel", edit: "Edit", back_to_hives: "← Back to hives",
    saved: "Saved", saved_offline: "Saved offline",
    apiaries: "Apiaries", new_apiary: "➕ New apiary", edit_apiary: "Edit apiary",
    apiary_name: "Name", location: "Location", notes: "Notes",
    no_apiaries: "No apiaries yet. Add your first one to start.",
    no_location: "no location", hives_count: (n) => `${n} hives`,
    need_apiary_name: "Enter apiary name",
    delete: "Delete", deleted: "Deleted", deleted_offline: "Deleted (will sync when online)",
    confirm_delete_apiary: (name, n) => `Delete apiary "${name}"? This also deletes its ${n} hives and their inspections.`,
    confirm_delete_hive: (name) => `Delete hive "${name}" with its whole inspection history?`,
    confirm_delete_inspection: (date) => `Delete the inspection from ${date}?`,
    hives: "Hives", new_hive: "➕ New hive", edit_hive: "Edit hive",
    need_apiary_first: "First add an apiary in the 📍 Apiaries tab.",
    no_hives: "No hives yet. Add your first hive.",
    hive_apiary: "Apiary", hive_name: "Hive name / number", hive_type: "Hive type",
    bee_race: "Bee race", queen_year: "Queen year", queen_color: "Queen color",
    no_details: "no details", last_inspection: "Last inspection",
    no_inspections: "No inspections", brood: "brood",
    ok_pill: "ok", alerts_pill: (n) => `${n} alerts`,
    need_hive_name: "Enter hive name/number",
    colors: { "": "—", "biały": "white", "żółty": "yellow", "czerwony": "red", "zielony": "green", "niebieski": "blue" },
    edit_hive_btn: "Edit hive", new_inspection: "➕ New inspection",
    inspection_history: "Inspection history", no_hive_inspections: "No inspections for this hive yet.",
    not_synced: "not synced", todo_label: "📌 To do: ", advice_toggle: (n) => `💡 Advice (${n})`,
    inspection_of: "Inspection: ", inspection_date: "Inspection date",
    fs_queen: "👑 Queen & brood", queen_status: "Queen status",
    q_seen: "Queen seen", q_eggs: "Not seen, but eggs present", q_notfound: "Queen not found", q_unmarked: "Present, unmarked",
    chk_eggs: "🥚 eggs", chk_larvae: "🐛 larvae", chk_capped: "▨ capped brood",
    brood_pattern: "Brood pattern (1 = poor, 5 = solid)",
    fs_mood: "🐝 Swarming & colony strength", swarm_mood: "Swarming signs",
    mood_calm: "Calm", mood_building: "Queen cells starting", mood_swarming: "Swarming (mature cells)",
    queen_cells: "Number of queen cells", strength: "Colony strength (1–10)", frames_bees: "Frames of bees",
    temperament: "Temperament", temp_gentle: "Gentle", temp_normal: "Normal", temp_aggr: "Aggressive",
    fs_stores: "🍯 Stores", stores_food: "Food (0–5)", stores_pollen: "Pollen (0–5)",
    fs_health: "🩺 Health", varroa_method: "Varroa test method",
    vm_none: "Not tested", vm_sugar: "Sugar roll", vm_alcohol: "Alcohol wash", vm_board: "Sticky board", vm_drone: "Drone brood",
    varroa_count: "Result (mites)", disease_signs: "Disease signs (foulbrood, nosema, dysentery…)",
    disease_ph: "empty = no signs",
    fs_actions: "🧰 Actions taken", treatment: "Treatment", feeding: "Feeding",
    honey: "Honey harvested [kg]",
    fs_ctx: "🌤️ Conditions & notes", weather: "Weather", temperature: "Temperature [°C]",
    todo_next: "📌 To do next time",
    save_inspection: "💾 Save inspection",
    advice_screen_title: "Advice after inspection", advice_saved_head: (h) => `✅ Inspection saved: ${h}`,
    advice_saved_sub: "Based on your observations we prepared some tips. They are saved in this hive's history (offline too).",
    next_review: "⏱ Next inspection",
    next_review_txt: (d, date) => `Recommended in ${d} days, around ${date}.`,
    see_history: "See hive history", to_hives: "Back to hive list",
    advice_review_in: (d) => `⏱ Suggested next inspection: in ${d} days`,
    alerts: "Alerts", alerts_offline_note: "You are offline. Alerts are computed on the server and may be outdated.",
    no_alerts: "🎉 No alerts. All hives look fine.", alert_last: "last inspection: ",
    knowledge: "Knowledge",
    dev_cycle_h: "🥚 Development cycle: from egg to adult bee",
    dev_cycle_sub: "How many days each of the three castes takes to develop and what happens at each stage.",
    days: "days",
    worker_cal_h: "🐝 A worker's life day by day",
    worker_cal_sub: "A worker's tasks change with age (age polyethism). Day ranges are approximate and overlap.",
    offline_note: "Knowledge available offline too.",
    fact_label: "🐝 Fact of the day",
    qs_widziana: "👑 seen", qs_jaja: "🥚 eggs", qs_nie_znaleziono: "❓ no queen", qs_nieoznakowana: "queen unmarked",
    md_spokojny: "calm", md_budujacy: "queen cells starting", md_rojowy: "⚠️ swarming",
    lbl_brood: "brood", lbl_cells: "queen cells: ", lbl_varroa: "Varroa: ",
    al_no_inspection: () => "This hive has no inspections at all.",
    al_overdue: (p) => `Last inspection was ${p.days} days ago. In season, inspect every 7 to 14 days.`,
    al_queenless: () => "No queen, eggs or larvae found. The colony may be queenless.",
    al_swarming: (p) => `Swarming signs (${p.mood}), queen cells: ${p.cells}. Consider giving more space or removing brood.`,
    al_poor_brood: (p) => `Poor brood pattern (${p.pattern}/5). Possible queen problem or disease.`,
    al_low_food: () => "Low food stores. Consider feeding.",
    al_varroa: (p) => `High varroa level (${p.count} mites in the sample). Plan treatment.`,
    al_disease: (p) => `Disease signs recorded: ${p.signs}.`,
  },
};

let _lang = localStorage.getItem("apilog_lang") || (navigator.language || "pl").slice(0, 2);
if (_lang !== "pl" && _lang !== "en") _lang = "pl";

function getLang() { return _lang; }
function setLang(l) {
  _lang = (l === "en") ? "en" : "pl";
  localStorage.setItem("apilog_lang", _lang);
  document.documentElement.lang = _lang;
}
/* t(key, ...args): if the translation is a function, call it with the args. */
function t(key, ...args) {
  const v = (I18N[_lang] && I18N[_lang][key]) ?? (I18N.pl[key]) ?? key;
  return typeof v === "function" ? v(...args) : v;
}

window.I18N = { t, getLang, setLang, dict: I18N };
