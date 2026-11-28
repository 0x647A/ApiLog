/*
 * Beekeeping knowledge base: facts, development cycle, worker calendar and
 * the advice rules. Everything is in Polish and English. Works offline.
 *
 * The advice is made here in the browser from the inspection data and saved
 * with the inspection (inspection.advice), so it is also visible offline.
 *
 * Sources: kolo-pszczelarzy.pl, miodowewzgorze.pl, pasieka24.pl,
 * portalpszczelarski.pl, pasiekasmakulskich.pl, pasiecznik.pl, lyson.com.pl.
 */

/* Not called `_lang` like in i18n.js: all scripts share one global scope,
 * and a repeated name would stop this whole file from loading. */
function knowledgeLang() {
  return (window.I18N && window.I18N.getLang && window.I18N.getLang()) || "pl";
}
/* Pick the pl or en text from {pl, en}. A plain string is returned as it is. */
function L(obj) {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  return obj[knowledgeLang()] ?? obj.pl ?? "";
}

/* Bee facts */
const BEE_FACTS = [
  { pl: "Matka pszczela może żyć do 5 lat, podczas gdy robotnica latem żyje zaledwie 4–6 tygodni.",
    en: "A queen bee can live up to 5 years, while a summer worker lives only 4–6 weeks." },
  { pl: "Aby wyprodukować 1 kg miodu, pszczoły muszą zebrać ok. 3 kg nektaru, bo nektar zawiera dużo więcej wody niż miód.",
    en: "To make 1 kg of honey, bees must gather about 3 kg of nectar, because nectar contains much more water than honey." },
  { pl: "Pszczoła miodna w locie wykonuje ok. 230 uderzeń skrzydłami na sekundę. Stąd charakterystyczne bzyczenie.",
    en: "In flight a honey bee beats its wings about 230 times per second, which makes the typical buzzing sound." },
  { pl: "Zbieraczka oddala się od ula nawet na 5 km w poszukiwaniu pożytku.",
    en: "A forager can travel up to 5 km from the hive in search of forage." },
  { pl: "Pszczoły porozumiewają się tańcem: taniec okrężny = pożytek blisko, taniec wywijany (ósemka) = daleko.",
    en: "Bees communicate by dancing: round dance = forage nearby, waggle dance = far away." },
  { pl: "Kąt tańca wywijanego względem pionu wskazuje kierunek do pożytku względem słońca.",
    en: "The waggle dance angle relative to vertical points to the forage direction relative to the sun." },
  { pl: "O tym, czy z jaja wyrośnie matka czy robotnica, decyduje pokarm larwy. Przyszła matka jada tylko mleczko pszczele.",
    en: "Whether an egg becomes a queen or a worker depends on what the larva eats. A future queen gets only royal jelly." },
  { pl: "Rozwój matki od jaja do wygryzienia trwa 16 dni; robotnicy 21 dni, a trutnia 24 dni.",
    en: "A queen develops from egg to emergence in 16 days; a worker in 21 days, a drone in 24 days." },
  { pl: "Matecznik pszczoły zasklepiają ok. 5. dnia od wylęgu larwy, a matka wygryza się z niego ok. 16. dnia rozwoju.",
    en: "Bees cap a queen cell around day 5 after the larva hatches; the queen emerges around day 16 of development." },
  { pl: "Młoda matka odbywa loty godowe zwykle 3–5 dni po wygryzieniu; czerwić zaczyna ok. tygodnia po unasiennieniu.",
    en: "A young queen takes mating flights 3–5 days after emerging; she starts laying about a week after mating." },
  { pl: "Dzięki pszczołom zapylana jest znaczna część roślin uprawnych. To jedni z najważniejszych zapylaczy.",
    en: "Bees pollinate a large share of crop plants. They are among the most important pollinators." },
  { pl: "Trutnie nie mają żądła i nie zbierają nektaru. Ich rolą jest unasiennienie matki.",
    en: "Drones have no sting and gather no nectar. Their only job is to mate with a queen." },
  { pl: "Zimą pszczoły tworzą kłąb i ogrzewają się wzajemnie, utrzymując w centrum nawet ok. 30 °C.",
    en: "In winter bees form a cluster and warm each other, keeping the core at around 30 °C." },
  { pl: "Jedna rodzina pszczela latem może liczyć 50–60 tysięcy osobników.",
    en: "A single colony can number 50,000–60,000 bees in summer." },
  { pl: "Pszczoły wyczuwają zapachy tysiące razy słabsze niż człowiek. To podstawa ich orientacji przy kwiatach.",
    en: "Bees can smell scents thousands of times weaker than humans can. This helps them find flowers." },
  { pl: "Wosk pszczoły wytwarzają z gruczołów woskowych na odwłoku; na 1 kg wosku zużywają wiele kg miodu.",
    en: "Bees make wax from glands on the abdomen; producing 1 kg of wax consumes several kg of honey." },
  { pl: "Propolis (kit pszczeli) pszczoły zbierają z pąków drzew i uszczelniają nim ul. Propolis ma działanie antybakteryjne.",
    en: "Bees collect propolis from tree buds and use it to seal the hive. It has antibacterial properties." },
  { pl: "Matka feromonami spaja rodzinę; jej brak pszczoły wyczuwają w ciągu kilku godzin.",
    en: "The queen's pheromones hold the colony together; bees sense her absence within hours." },
  { pl: "Rójka to naturalny sposób rozmnażania rodzin. Ze starą matką odlatuje część pszczół, zakładając nowe gniazdo.",
    en: "Swarming is how colonies reproduce: the old queen leaves with part of the bees to start a new nest." },
  { pl: "Mateczniki rojowe pszczoły zakładają zwykle na krawędziach i dole plastrów, a ratunkowe tam, gdzie był czerw.",
    en: "Swarm cells are usually built on comb edges and bottoms; emergency cells where brood already was." },
  { pl: "Pyłek to główne źródło białka dla rodziny. Bez niego matka ogranicza czerwienie.",
    en: "Pollen is the main source of protein for the colony. Without it, the queen lays fewer eggs." },
  { pl: "Warroza (roztocz Varroa destructor) to dziś główna przyczyna upadków rodzin pszczelich.",
    en: "Varroosis (the mite Varroa destructor) is today the main cause of colony losses." },
  { pl: "Pszczoły utrzymują w gnieździe czerwiowym stałą temperaturę ok. 34–35 °C, niezależnie od pogody.",
    en: "Bees keep the brood nest at a steady ~34–35 °C regardless of the weather." },
  { pl: "Jedna robotnica przez całe życie produkuje zaledwie ok. 1/12 łyżeczki miodu.",
    en: "A single worker produces only about 1/12 of a teaspoon of honey in its whole life." },
];

/* Fact of the day: chosen by the day of the year, so it stays the same all day. */
function factOfTheDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  return L(BEE_FACTS[dayOfYear % BEE_FACTS.length]);
}

/* Development cycle of the queen, worker and drone */
const DEV_CYCLE = [
  {
    caste: { pl: "Matka (królowa)", en: "Queen" }, emoji: "👑", total: 16, color: "#c0392b",
    stages: [
      { name: { pl: "Jajo", en: "Egg" }, range: { pl: "1–3 dzień", en: "days 1–3" }, days: 3,
        desc: { pl: "Takie samo jak u robotnicy. O losie decyduje pokarm.", en: "Same as a worker. The food decides what the larva becomes." } },
      { name: { pl: "Larwa", en: "Larva" }, range: { pl: "4–8 dzień", en: "days 4–8" }, days: 5,
        desc: { pl: "Karmiona wyłącznie mleczkiem pszczelim w mateczniku.", en: "Fed only royal jelly inside the queen cell." } },
      { name: { pl: "Zasklep + poczwarka", en: "Capped + pupa" }, range: { pl: "ok. 8–16 dzień", en: "~days 8–16" }, days: 8,
        desc: { pl: "Matecznik zasklepiony ok. 8 dnia; matka wygryza się ok. 16 dnia.", en: "Cell capped around day 8; queen emerges around day 16." } },
    ],
    after: { pl: "Po wygryzieniu: loty godowe 3–5 dni później, unasiennienie, a czerwienie zaczyna ok. tygodnia po unasiennieniu. Żyje nawet do 5 lat.",
             en: "After emerging: mating flights 3–5 days later, then she starts laying about a week after mating. Lives up to 5 years." },
  },
  {
    caste: { pl: "Robotnica", en: "Worker" }, emoji: "🐝", total: 21, color: "#d98700",
    stages: [
      { name: { pl: "Jajo", en: "Egg" }, range: { pl: "1–3 dzień", en: "days 1–3" }, days: 3,
        desc: { pl: "Zapłodnione jajo złożone przez matkę w komórce pszczelej.", en: "Fertilised egg laid by the queen in a worker cell." } },
      { name: { pl: "Larwa", en: "Larva" }, range: { pl: "4–9 dzień", en: "days 4–9" }, days: 6,
        desc: { pl: "Pierwsze dni mleczko, potem miód i pyłek; szybki wzrost.", en: "Royal jelly at first, then honey and pollen; rapid growth." } },
      { name: { pl: "Zasklep + poczwarka", en: "Capped + pupa" }, range: { pl: "ok. 9–21 dzień", en: "~days 9–21" }, days: 12,
        desc: { pl: "Komórka zasklepiona, przeobrażenie w dorosłego osobnika.", en: "Cell capped, metamorphosis into an adult bee." } },
    ],
    after: { pl: "Latem robotnica żyje 4–6 tygodni, a pokolenie zimowe nawet kilka miesięcy. Rola zmienia się z wiekiem (patrz kalendarz niżej).",
             en: "A summer worker lives 4–6 weeks; the winter generation several months. Its role changes with age (see calendar below)." },
  },
  {
    caste: { pl: "Truteń", en: "Drone" }, emoji: "🛸", total: 24, color: "#3a6ea5",
    stages: [
      { name: { pl: "Jajo", en: "Egg" }, range: { pl: "1–3 dzień", en: "days 1–3" }, days: 3,
        desc: { pl: "Jajo NIEzapłodnione (partenogeneza), więc truteń ma tylko matkę.", en: "Unfertilised egg (parthenogenesis), so a drone has only a mother." } },
      { name: { pl: "Larwa", en: "Larva" }, range: { pl: "4–10 dzień", en: "days 4–10" }, days: 7,
        desc: { pl: "Karmiona przez robotnice; komórka trutowa jest większa.", en: "Fed by workers; the drone cell is larger." } },
      { name: { pl: "Zasklep + poczwarka", en: "Capped + pupa" }, range: { pl: "ok. 10–24 dzień", en: "~days 10–24" }, days: 14,
        desc: { pl: "Najdłuższy rozwój ze wszystkich kast.", en: "The longest development of all castes." } },
    ],
    after: { pl: "Truteń nie ma żądła i nie pracuje. Jego rolą jest unasiennienie matki. Jesienią robotnice usuwają trutnie z ula.",
             en: "A drone has no sting and does no work in the hive. Its role is to mate. In autumn the workers push the drones out of the hive." },
  },
];

/* Worker bee calendar: tasks by age */
const WORKER_CALENDAR = [
  { range: { pl: "1–3 dzień", en: "days 1–3" }, role: { pl: "Sprzątaczka", en: "Cleaner" }, emoji: "🧹", color: "#8a7a4a",
    desc: { pl: "Zaraz po wygryzieniu czyści i poleruje komórki (także tę, z której wyszła), by matka mogła w nich znów czerwić. Usuwa resztki i martwe osobniki.",
            en: "Right after emerging it cleans and polishes cells (including its own) so the queen can lay again. Removes debris and dead bees." } },
  { range: { pl: "3–10 dzień", en: "days 3–10" }, role: { pl: "Mamka (karmicielka)", en: "Nurse bee" }, emoji: "🍼", color: "#c0392b",
    desc: { pl: "Gruczoły gardzielowe produkują mleczko pszczele; karmi larwy i matkę, pilnuje temperatury i wilgotności czerwiu. Najintensywniejszy okres opieki nad potomstwem.",
            en: "Its glands produce royal jelly; it feeds larvae and the queen and regulates brood temperature and humidity. The most intense brood-care phase." } },
  { range: { pl: "7–14 dzień", en: "days 7–14" }, role: { pl: "Budowniczka", en: "Builder" }, emoji: "🔧", color: "#d98700",
    desc: { pl: "Gruczoły woskowe wydzielają wosk, więc buduje i naprawia plastry. Odbiera nektar od zbieraczek, rozkłada go w komórkach i uczestniczy w dojrzewaniu miodu.",
            en: "Its wax glands produce wax, so it builds and repairs comb. It takes nectar from foragers, stores it in cells and helps turn it into honey." } },
  { range: { pl: "12–18 dzień", en: "days 12–18" }, role: { pl: "Porządkowa / magazynier", en: "Housekeeper / storer" }, emoji: "📦", color: "#3a8f3a",
    desc: { pl: "Ubija pyłek w komórkach (pierzga), wynosi śmieci i martwe pszczoły, wentyluje gniazdo ruchem skrzydeł, roznosi pokarm po ulu.",
            en: "Packs pollen into cells (bee bread), carries out debris and dead bees, ventilates the nest with its wings, distributes food around the hive." } },
  { range: { pl: "18–21 dzień", en: "days 18–21" }, role: { pl: "Strażniczka", en: "Guard" }, emoji: "🛡️", color: "#6a4a8a",
    desc: { pl: "Pilnuje wylotka: sprawdza po zapachu, kto wchodzi, broni rodziny przed obcymi pszczołami (rabunek), osami i szerszeniami. Uczestniczy w klimatyzacji ula.",
            en: "Guards the entrance. It checks bees that arrive by their scent and defends the hive against robber bees, wasps and hornets. It also helps to ventilate the hive." } },
  { range: { pl: "od ~21 dnia", en: "from ~day 21" }, role: { pl: "Zbieraczka", en: "Forager" }, emoji: "🌸", color: "#f4a300",
    desc: { pl: "Najstarsze robotnice wylatują po nektar, pyłek, wodę i spadź. Pracują w polu aż do końca życia. To najbardziej wyczerpujące zadanie.",
            en: "The oldest workers fly out for nectar, pollen, water and honeydew. They forage until the end of their lives. This is the hardest job in the colony." } },
];

/* Advice rules */
const VARROA_SAMPLE_METHODS = ["cukier_puder", "smyw_alkoholowy"];
const VARROA_SAMPLE_MIN = 3;

/* Each rule returns { level, title, text, next_review_days }.
 * Texts are written as L({ pl, en }). */
const ADVICE_RULES = [
  {
    id: "queen_cells",
    when: (i) => (i.queen_cells || 0) > 0 || i.swarm_mood === "rojowy" || i.swarm_mood === "budujacy",
    build: (i) => {
      const n = i.queen_cells || 0;
      const many = n >= 5;
      return {
        level: "danger",
        title: L({
          pl: `Nastrój rojowy: ${n > 0 ? n + " mateczników" : "zaczątki mateczników"}`,
          en: `Swarming signs: ${n > 0 ? n + " queen cells" : "queen cells starting"}`,
        }),
        text: L({
          pl: "Rodzina szykuje się do rójki. Zdecyduj: albo rozładuj nastrój (poszerz gniazdo węzą, odbierz 2–3 ramki czerwiu krytego z pszczołą do odkładu, zapewnij miejsce i wentylację), albo wykorzystaj to na odkład. Mateczniki pszczoły zasklepiają ok. 5. dnia od wylęgu larwy, dlatego następny przegląd zrób najpóźniej za 4–5 dni, ZANIM się zasklepią i wyjdzie rójka. " +
              (many ? "Przy tak wielu matecznikach ryzyko rójki jest wysokie. Działaj bez zwłoki. " : "") +
              "Na przeglądzie: przejrzyj WSZYSTKIE plastry, zerwij mateczniki zostawiając 1–2 najładniejsze jeśli chcesz wymiany matki, i sprawdź czy matka nadal czerwi.",
          en: "The colony is getting ready to swarm. You can stop it (add foundation, move 2 or 3 frames of capped brood with bees to a nuc, give more space and air) or use it to make a split. Bees cap queen cells about 5 days after the larva hatches, so do the next inspection within 4 to 5 days, before the cells are capped and the swarm leaves. " +
              (many ? "With this many queen cells the risk of swarming is high, so act soon. " : "") +
              "At the next inspection check all combs. Remove the queen cells, but leave 1 or 2 of the best ones if you want a new queen. Check that the queen is still laying.",
        }),
        next_review_days: 4,
      };
    },
  },
  {
    id: "queenless",
    when: (i) => i.queen_status === "nie_znaleziono" && !i.eggs && !i.larvae,
    build: () => ({
      level: "danger",
      title: L({ pl: "Podejrzenie bezmateczności", en: "Suspected queenlessness" }),
      text: L({
        pl: "Brak matki, jaj i larw to sygnał, że rodzina może być bezmateczna. Sprawdź jeszcze raz w cieplejszy dzień. Obecność świeżych jaj (stojących w komórkach) oznacza, że matka czerwiła w ostatnich ~3 dniach. Jeśli potwierdzisz brak matki: podaj ramkę z młodym czerwiem i jajami z innej rodziny albo dodaj matkę/matecznik. Zwlekanie grozi pojawieniem się trutówek. Następny przegląd za 3–4 dni.",
        en: "No queen, eggs or larvae means the colony may be queenless. Check again on a warmer day. Fresh eggs (standing upright in the cells) mean the queen laid in the last ~3 days. If the colony is queenless, give it a frame of young brood and eggs from another colony, or add a queen or a queen cell. If you wait too long, laying workers may appear. Next inspection in 3 to 4 days.",
      }),
      next_review_days: 3,
    }),
  },
  {
    id: "poor_brood",
    when: (i) => i.brood_pattern != null && i.brood_pattern <= 2,
    build: (i) => ({
      level: "warning",
      title: L({ pl: `Słaby wzorzec czerwiu (${i.brood_pattern}/5)`, en: `Poor brood pattern (${i.brood_pattern}/5)` }),
      text: L({
        pl: "Rozstrzelony, dziurawy czerw może oznaczać starzejącą się lub słabo unasiennioną matkę, chorobę czerwiu albo niedobór pokarmu/pyłku. Oceń: czy są jaja, czy czerw kryty nie jest zapadnięty/dziurawy. Rozważ wymianę matki, jeśli obraz się nie poprawia. Kolejny przegląd za ~7 dni, porównaj wzorzec.",
        en: "A spotty brood pattern can mean an old or badly mated queen, a brood disease, or too little food or pollen. Check if there are eggs and if the capped brood is sunken or has holes. If it doesn't get better, think about a new queen. Next inspection in about 7 days, then compare the pattern.",
      }),
      next_review_days: 7,
    }),
  },
  {
    id: "varroa",
    // Same rule as in app/alerts_engine.py: only a sample of about 300 bees
    // (sugar roll or alcohol wash), where 3 mites is about 1%.
    when: (i) => VARROA_SAMPLE_METHODS.includes(i.varroa_method) &&
      i.varroa_count != null && i.varroa_count >= VARROA_SAMPLE_MIN,
    build: (i) => ({
      level: "danger",
      title: L({ pl: `Wysoki poziom warrozy (${i.varroa_count} roztoczy w próbce)`, en: `High varroa level (${i.varroa_count} mites in the sample)` }),
      text: L({
        pl: "Warroza to główna przyczyna upadków rodzin. Zaplanuj leczenie zgodnie z aktualnymi zaleceniami i porą roku (np. po ostatnim miodobraniu). Pamiętaj o karencji preparatów przed pozyskaniem miodu. Monitoruj poziom porażenia przed i po zabiegu. Kontrola za 7–10 dni.",
        en: "Varroa is the main cause of colony losses. Plan a treatment that fits current guidance and the season (e.g. after the last honey harvest). Remember the withdrawal period before you take honey. Count the mites before and after the treatment. Check again in 7 to 10 days.",
      }),
      next_review_days: 10,
    }),
  },
  {
    id: "low_food",
    when: (i) => i.stores_food != null && i.stores_food <= 1,
    build: () => ({
      level: "warning",
      title: L({ pl: "Niskie zapasy pokarmu", en: "Low food stores" }),
      text: L({
        pl: "Przy niskich zapasach rodzinie grozi głód, a matka ogranicza czerwienie. Rozważ podkarmianie (syrop lub ciasto, zależnie od pory roku). Uważaj, by pokarm nie zalał gniazda. Sprawdź zapasy ponownie za ~7 dni.",
        en: "With low stores the colony can starve, and the queen lays fewer eggs. Think about feeding (syrup or fondant, depending on the season). Don't give so much that it fills the brood nest. Check the stores again in about 7 days.",
      }),
      next_review_days: 7,
    }),
  },
  {
    id: "no_pollen",
    when: (i) => i.stores_pollen != null && i.stores_pollen === 0,
    build: () => ({
      level: "info",
      title: L({ pl: "Brak zapasów pyłku", en: "No pollen stores" }),
      text: L({
        pl: "Pyłek to główne źródło białka. Bez niego rodzina ogranicza wychów czerwiu. Jeśli w okolicy brak pożytku pyłkowego, rozważ podanie ciasta białkowego. Obserwuj wnoszenie obnóży.",
        en: "Pollen is the main source of protein. Without it the colony raises less brood. If there is no pollen forage nearby, consider a protein patch. Watch for incoming pollen loads.",
      }),
      next_review_days: 10,
    }),
  },
  {
    id: "aggression",
    when: (i) => i.temperament === "agresywny",
    build: () => ({
      level: "info",
      title: L({ pl: "Zwiększona agresja rodziny", en: "Increased colony aggression" }),
      text: L({
        pl: "Nagła agresja może wynikać z bezmateczności, złej pogody, braku pożytku lub genetyki. Najpierw sprawdź obecność matki i czerwiu. Jeśli agresja się utrzymuje mimo dobrej matki, rozważ wymianę matki na spokojniejszą linię. Przeglądy rób w ciepłe, bezwietrzne, słoneczne dni.",
        en: "Sudden aggression can come from a missing queen, bad weather, lack of forage or genetics. First check for the queen and brood. If it doesn't stop although the queen is good, think about a new queen from a gentler line. Inspect on warm, calm, sunny days.",
      }),
      next_review_days: 14,
    }),
  },
  {
    id: "disease",
    when: (i) => !!(i.disease_signs && i.disease_signs.trim()),
    build: (i) => ({
      level: "danger",
      title: L({ pl: "Odnotowano objawy chorobowe", en: "Disease signs recorded" }),
      text: L({
        pl: `Zapisano objawy: „${i.disease_signs.trim()}”. Nie bagatelizuj tego, bo niektóre choroby (np. zgnilec) podlegają obowiązkowi zgłoszenia. Odizoluj sprzęt, nie przenoś ramek między ulami, w razie wątpliwości skontaktuj się z lekarzem weterynarii. Kontrola za 5–7 dni.`,
        en: `Signs recorded: “${i.disease_signs.trim()}”. Don't ignore them: some diseases (e.g. foulbrood) must be reported to a vet. Keep the equipment separate, don't move frames between hives, and ask a vet if you are not sure. Check again in 5 to 7 days.`,
      }),
      next_review_days: 5,
    }),
  },
  {
    id: "ok",
    when: (i) =>
      i.queen_status !== "nie_znaleziono" &&
      (i.brood_pattern == null || i.brood_pattern >= 4) &&
      (i.queen_cells || 0) === 0 &&
      i.swarm_mood === "spokojny" &&
      !(i.disease_signs && i.disease_signs.trim()),
    build: () => ({
      level: "ok",
      title: L({ pl: "Rodzina wygląda dobrze", en: "Colony looks healthy" }),
      text: L({
        pl: "Brak sygnałów alarmowych. W sezonie utrzymuj rytm przeglądów co 7–14 dni (wiosna) / 10–14 dni (lato), poszerzaj gniazdo w miarę rozwoju i pilnuj zapasów. Regularność to najlepsza profilaktyka nastroju rojowego.",
        en: "No warning signs. In season, inspect every 7 to 14 days in spring and every 10 to 14 days in summer. Give more space as the colony grows and keep an eye on the stores. Regular inspections are the best way to prevent swarming.",
      }),
      next_review_days: 10,
    }),
  },
];

/* Keywords in the notes. They add advice when the beekeeper described a
 * problem in words. The patterns cover Polish and English. */
const NOTE_KEYWORDS = [
  { rx: /trutów|trutow|garbaty czerw|czerw garbaty|laying worker|drone.?laying/i, level: "danger",
    title: { pl: "Możliwe trutówki", en: "Possible laying workers" },
    text: { pl: "Notatka sugeruje trutówki (czerw garbaty, jaja po kilka w komórce). To skutek długiej bezmateczności. Ratunek bywa trudny. Często najlepiej połączyć rodzinę ze zdrową lub podać dużo młodego czerwiu. Działaj szybko.",
            en: "The note suggests laying workers (domed drone brood, several eggs in one cell). This happens when a colony has been without a queen for a long time. It is hard to save the colony. Often the best option is to unite it with a strong colony or to add a lot of young brood. Act quickly." } },
  { rx: /zgnilec|zgnilca|foulbrood/i, level: "danger",
    title: { pl: "Podejrzenie zgnilca", en: "Suspected foulbrood" },
    text: { pl: "Zgnilec to groźna choroba podlegająca zgłoszeniu. Nie przenoś sprzętu ani ramek, skontaktuj się z lekarzem weterynarii.",
            en: "Foulbrood is a serious notifiable disease. Do not move equipment or frames; contact a vet." } },
  { rx: /rabun|rabow|robbing/i, level: "warning",
    title: { pl: "Możliwy rabunek", en: "Possible robbing" },
    text: { pl: "Przy rabunku zwęź wylotek, unikaj rozlewania syropu i długiego trzymania ula otwartego. Rabunek osłabia i rozprzestrzenia choroby.",
            en: "When robbing occurs, reduce the entrance, avoid spilling syrup and don't keep the hive open long. Robbing weakens colonies and spreads disease." } },
  { rx: /osy|szershe|szersze|wasp|hornet/i, level: "info",
    title: { pl: "Presja os / szerszeni", en: "Wasp / hornet pressure" },
    text: { pl: "Zwęź wylotek, by słabszej rodzinie łatwiej było się bronić. Rozważ pułapki na szerszenie w pobliżu pasieki.",
            en: "Reduce the entrance so a weaker colony can defend more easily. Consider hornet traps near the apiary." } },
];

/* Main function: check the inspection and the notes, return a list of advice. */
function generateAdvice(inspection) {
  const out = [];
  for (const rule of ADVICE_RULES) {
    try { if (rule.when(inspection)) out.push(rule.build(inspection)); }
    catch (e) { /* skip a rule that throws an error */ }
  }
  const note = (inspection.notes || "") + " " + (inspection.todo || "");
  for (const k of NOTE_KEYWORDS) {
    if (k.rx.test(note)) out.push({ level: k.level, title: L(k.title), text: L(k.text) });
  }
  if (!out.length) {
    out.push({
      level: "info",
      title: L({ pl: "Notatka zapisana", en: "Note saved" }),
      text: L({ pl: "Brak konkretnych sygnałów do analizy. Utrzymuj rytm przeglądów co 7–14 dni w sezonie.",
                en: "No specific signals to analyse. Keep a rhythm of inspections every 7–14 days in season." }),
      next_review_days: 12,
    });
  }
  const days = out.map((a) => a.next_review_days).filter((d) => typeof d === "number");
  const nextDays = days.length ? Math.min(...days) : null;
  return { advice: out, next_review_days: nextDays };
}

/* Cycle and calendar in the current language (used by app.js). */
function devCycleLocalized() {
  return DEV_CYCLE.map((c) => ({
    caste: L(c.caste), emoji: c.emoji, total: c.total, color: c.color,
    stages: c.stages.map((s) => ({ name: L(s.name), range: L(s.range), days: s.days, desc: L(s.desc) })),
    after: L(c.after),
  }));
}
function workerCalendarLocalized() {
  return WORKER_CALENDAR.map((r) => ({ range: L(r.range), role: L(r.role), emoji: r.emoji, color: r.color, desc: L(r.desc) }));
}

/* Export to the global scope (the file is a normal <script>, not a module). */
window.KNOWLEDGE = {
  factOfTheDay, generateAdvice, BEE_FACTS,
  devCycleLocalized, workerCalendarLocalized,
};
