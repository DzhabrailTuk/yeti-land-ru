/* YETI · меню
   Правь цены, названия, состав и КБЖУ здесь. Как — написано в README.md. */
window.YETI = window.YETI || {};

/* Категории в верхней «карусели» и в фильтрах. */
const CATS = [
  { id: "all", label: "всё" },
  { id: "bubble", label: "бабл ти" },
  { id: "tea", label: "фруктовый чай" },
  { id: "coffee", label: "кофе" },
  { id: "lemon", label: "лимонады" },
  { id: "poke", label: "poke" },
  { id: "food", label: "брускетты" },
  { id: "donut", label: "donut" },
  { id: "mochi", label: "moti" },
  { id: "dessert", label: "десерты" },
];

/* Все позиции меню.
   price — 500 мл, price650 — 650 мл (у еды поля price650 нет),
   photo — путь к файлу от корня сайта, cat — категория из CATS. */
const ITEMS = [
  { id: 60, cat: "bubble", name: "Конго", kcal: 268, prot: 4.1, fat: 6.2, carb: 47, price: 445, price650: 495, desc: "Манго, маракуйя, тапиока", tags: ["hit"], shot: "[ фото · bubble tea ]", photo: "assets/menu/bubble/bt-kongo.webp" },
  { id: 61, cat: "bubble", name: "Таро", kcal: 284, prot: 4.6, fat: 7.1, carb: 49, price: 445, price650: 495, desc: "Таро, молочная база, тапиока", tags: ["hit"], shot: "[ фото · bubble tea ]", photo: "assets/menu/bubble/bt-taro.webp" },
  { id: 62, cat: "bubble", name: "Криспикрим", kcal: 312, prot: 5.4, fat: 9.8, carb: 49, price: 395, price650: 445, desc: "Клубника, сливочная пенка, крошка", tags: ["sweet"], shot: "[ фото · bubble tea ]", photo: "assets/menu/bubble/bt-crispycream.webp" },
  { id: 63, cat: "bubble", name: "Бабл бери", kcal: 232, prot: 1.2, fat: 0.6, carb: 55, price: 445, price650: 495, desc: "Микс лесных ягод, тапиока", tags: ["sweet"], shot: "[ фото · bubble tea ]", photo: "assets/menu/bubble/bt-bubble-berry.webp" },
  { id: 64, cat: "bubble", name: "Бабл сансет", kcal: 194, prot: 0.6, fat: 0.3, carb: 46, price: 470, price650: 520, desc: "Апельсин, маракуйя, тапиока", tags: ["sweet"], shot: "[ фото · bubble tea ]", photo: "assets/menu/bubble/bt-bubble-sunset.webp" },
  { id: 65, cat: "bubble", name: "Шококрим", kcal: 326, prot: 5.8, fat: 10.4, carb: 51, price: 445, price650: 495, desc: "Какао, сливки, тапиока", tags: ["sweet"], shot: "[ фото · bubble tea ]", photo: "assets/menu/bubble/bt-shokocrem.webp" },
  { id: 80, cat: "matcha", name: "Матча крем", kcal: 246, prot: 5.1, fat: 8.4, carb: 36, price: 445, price650: 495, desc: "Матча, сливочная пенка", tags: ["hit"], shot: "[ фото · матча ]", photo: "assets/menu/matcha/matcha-krem.webp" },
  { id: 81, cat: "matcha", name: "Йети", kcal: 238, prot: 4.8, fat: 8.1, carb: 35, price: 445, price650: 495, desc: "Матча с голубой спирулиной", tags: ["hit"], shot: "[ фото · матча ]", photo: "assets/menu/matcha/matcha-yeti.webp" },
  { id: 82, cat: "matcha", name: "Банана крем", kcal: 274, prot: 5.3, fat: 8.9, carb: 43, price: 445, price650: 495, desc: "Матча, банан, сливки", tags: ["hit"], shot: "[ фото · матча ]", photo: "assets/menu/matcha/matcha-banana-krem.webp" },
  { id: 83, cat: "matcha", name: "Пинки", kcal: 252, prot: 4.9, fat: 8.2, carb: 39, price: 445, price650: 495, desc: "Матча, розовый питайя-крем", tags: ["hit"], shot: "[ фото · матча ]", photo: "assets/menu/matcha/matcha-pinky.webp" },
  { id: 84, cat: "matcha", name: "Пурбери", kcal: 228, prot: 4.4, fat: 7.6, carb: 34, price: 445, price650: 495, desc: "Матча, лесные ягоды, лёд", tags: ["hit"], shot: "[ фото · матча ]", photo: "assets/menu/matcha/matcha-purberry.webp" },
  { id: 90, cat: "cheese", name: "Блюкрим", kcal: 298, prot: 5.6, fat: 9.4, carb: 45, price: 445, price650: 495, desc: "Сливочный чиз, лесные ягоды", tags: ["hit"], shot: "[ фото · cream cheese ]", photo: "assets/menu/cheese/cc-blukrim.webp" },
  { id: 91, cat: "cheese", name: "Коконас", kcal: 316, prot: 5.2, fat: 12.1, carb: 44, price: 445, price650: 495, desc: "Кокос, чиз-пенка", tags: ["hit"], shot: "[ фото · cream cheese ]", photo: "assets/menu/cheese/cc-kokonas.webp" },
  { id: 92, cat: "cheese", name: "Манго кинг", kcal: 288, prot: 5.4, fat: 9.1, carb: 44, price: 445, price650: 495, desc: "Манго, чиз-пенка", tags: ["hit"], shot: "[ фото · cream cheese ]", photo: "assets/menu/cheese/cc-mango-king.webp" },
  { id: 93, cat: "cheese", name: "Росберикрим", kcal: 284, prot: 5.5, fat: 9.2, carb: 42, price: 445, price650: 495, desc: "Малина, чиз-пенка", tags: ["hit"], shot: "[ фото · cream cheese ]", photo: "assets/menu/cheese/cc-rosberikrim.webp" },
  { id: 94, cat: "cheese", name: "Стар бери", kcal: 286, prot: 5.5, fat: 9.3, carb: 43, price: 445, price650: 495, desc: "Клубника, чиз-пенка", tags: ["hit"], shot: "[ фото · cream cheese ]", photo: "assets/menu/cheese/cc-star-berry.webp" },
  { id: 95, cat: "cheese", name: "Черри бери", kcal: 292, prot: 5.4, fat: 9.2, carb: 45, price: 445, price650: 495, desc: "Вишня, чиз-пенка", tags: ["hit"], shot: "[ фото · cream cheese ]", photo: "assets/menu/cheese/cc-cherry-berry.webp" },
  { id: 100, cat: "icecoffee", name: "Бамбл", kcal: 148, prot: 0.9, fat: 0.2, carb: 35, price: 395, price650: 445, desc: "Эспрессо, апельсиновый сок, лёд", tags: ["hit"], shot: "[ фото · холодный кофе ]", photo: "assets/menu/icecoffee/ic-bambl.webp" },
  { id: 101, cat: "icecoffee", name: "Латте кремчиз", kcal: 242, prot: 6.4, fat: 9.6, carb: 30, price: 395, price650: 445, desc: "Айс-латте с чиз-пенкой", tags: ["hit"], shot: "[ фото · холодный кофе ]", photo: "assets/menu/icecoffee/ic-latte-cremcheese.webp" },
  { id: 102, cat: "icecoffee", name: "Шококрим", kcal: 268, prot: 6.1, fat: 10.2, carb: 36, price: 395, price650: 445, desc: "Айс-латте, шоколадный соус", tags: ["hit"], shot: "[ фото · холодный кофе ]", photo: "assets/menu/icecoffee/ic-shokokrim.webp" },
  { id: 110, cat: "colddrink", name: "Оранж клаб", kcal: 166, prot: 0.7, fat: 0.2, carb: 39, price: 445, price650: 495, desc: "Лимон, лайм, апельсин, лёд", tags: ["hit"], shot: "[ фото · холодный напиток ]", photo: "assets/menu/colddrink/cd-orange-club.webp" },
  { id: 111, cat: "colddrink", name: "Санрайз", kcal: 182, prot: 0.9, fat: 0.3, carb: 43, price: 445, price650: 495, desc: "Клубника, киви, апельсин", tags: ["hit"], shot: "[ фото · холодный напиток ]", photo: "assets/menu/colddrink/cd-sunrise.webp" },
  { id: 112, cat: "colddrink", name: "Спешл пешен", kcal: 174, prot: 0.8, fat: 0.3, carb: 41, price: 445, price650: 495, desc: "Апельсин, киви, лёд", tags: ["hit"], shot: "[ фото · холодный напиток ]", photo: "assets/menu/colddrink/cd-special-passion.webp" },
  { id: 113, cat: "colddrink", name: "Тропик вей", kcal: 188, prot: 0.9, fat: 0.3, carb: 44, price: 445, price650: 495, desc: "Маракуйя, ананас, киви", tags: ["hit"], shot: "[ фото · холодный напиток ]", photo: "assets/menu/colddrink/cd-tropic-way.webp" },
  { id: 50, cat: "tea", name: "ДХП", kcal: 12, prot: 0.1, fat: 0, carb: 2, price: 200, price650: 240, desc: "Да Хун Пао на льду, без сахара", tags: ["light"], shot: "[ фото · чай ]", photo: "assets/menu/tea/tea-dhp.webp" },
  { id: 51, cat: "tea", name: "Жасмин", kcal: 14, prot: 0.1, fat: 0, carb: 3, price: 200, price650: 240, desc: "Жасминовый чай, лёд, лимон", tags: ["hit", "light", "veg"], shot: "[ фото · чай ]", photo: "assets/menu/tea/tea-jasmine.webp" },
  { id: 52, cat: "tea", name: "Улун", kcal: 12, prot: 0.1, fat: 0, carb: 2, price: 200, price650: 240, desc: "Молочный улун с манго", tags: ["hit"], shot: "[ фото · чай ]", photo: "assets/menu/tea/tea-oolong.webp" },
  { id: 4, cat: "tea", name: "Персик-жасмин", kcal: 96, prot: 0.3, fat: 0.1, carb: 23, price: 350, desc: "Жасминовый чай, персик, лайм", tags: ["light"], shot: "[ фото · холодный чай ]" },
  { id: 5, cat: "tea", name: "Грейпфрут-розмарин", kcal: 88, prot: 0.4, fat: 0.1, carb: 21, price: 360, desc: "Зелёный чай, свежий грейпфрут", tags: ["light", "veg"], shot: "[ фото · грейпфрут ]" },
  { id: 6, cat: "coffee", name: "Айс-латте на овсяном", kcal: 138, prot: 3.4, fat: 4.2, carb: 20, price: 320, desc: "Двойной эспрессо, овсяное молоко", tags: ["veg"], shot: "[ фото · айс-латте ]" },
  { id: 20, cat: "coffee", name: "Американо", kcal: 4, prot: 0.2, fat: 0, carb: 0.4, price: 220, desc: "Двойной эспрессо и горячая вода", tags: ["light"], shot: "[ фото · американо ]", photo: "assets/menu/coffee/coffee-americano.webp" },
  { id: 40, cat: "coffee", name: "Капучино Флэт", kcal: 124, prot: 6.2, fat: 6.4, carb: 10, price: 280, desc: "Плотная пенка, тонкий молочный слой", tags: ["hit"], shot: "[ фото · капучино ]", photo: "assets/menu/coffee/coffee-cappuccino-flat.jpg" },
  { id: 41, cat: "coffee", name: "Латте раф", kcal: 216, prot: 5.8, fat: 9.8, carb: 24, price: 320, desc: "Сливки, ваниль, тростниковый сахар", tags: ["hit", "sweet"], shot: "[ фото · раф ]", photo: "assets/menu/coffee/coffee-latte-raf.webp" },
  { id: 7, cat: "coffee", name: "Эспрессо-тоник", kcal: 68, prot: 0.4, fat: 0.1, carb: 16, price: 300, desc: "Эспрессо, тоник, апельсин", tags: ["light"], shot: "[ фото · тоник ]" },
  { id: 8, cat: "lemon", name: "Лимонад тархун", kcal: 92, prot: 0.1, fat: 0, carb: 22, price: 290, desc: "Тархун, лайм, много льда", tags: ["light", "veg"], shot: "[ фото · лимонад ]" },
  { id: 9, cat: "lemon", name: "Арбуз-базилик", kcal: 84, prot: 0.3, fat: 0.1, carb: 20, price: 310, desc: "Арбузное пюре, базилик", tags: ["hit", "veg"], shot: "[ фото · арбуз ]" },
  { id: 30, cat: "poke", name: "С лососем", kcal: 512, prot: 26.4, fat: 18.2, carb: 58, price: 650, desc: "Рис, лосось, чука, эдамаме, тофу", tags: ["hit"], shot: "[ фото · поке ]", photo: "assets/menu/poke/poke-losos.webp" },
  { id: 31, cat: "poke", name: "С тунцом", kcal: 486, prot: 24.6, fat: 14.2, carb: 62, price: 600, desc: "Тунец обжаренный, манго, эдамаме, кукуруза", tags: ["hit"], shot: "[ фото · поке ]", photo: "assets/menu/poke/poke-tunets.webp" },
  { id: 32, cat: "poke", name: "С креветками", kcal: 442, prot: 23.8, fat: 11.4, carb: 59, price: 650, desc: "Креветки, манго, чука, огурец, эдамаме", tags: [], shot: "[ фото · поке ]", photo: "assets/menu/poke/poke-krevetki.webp" },
  { id: 33, cat: "poke", name: "С индейкой", kcal: 468, prot: 28.2, fat: 12.6, carb: 57, price: 600, desc: "Индейка, морковь по-корейски, капуста, томаты", tags: ["light"], shot: "[ фото · поке ]", photo: "assets/menu/poke/poke-indeyka.webp" },
  { id: 11, cat: "food", name: "Брускетта с томатами", kcal: 212, prot: 6.4, fat: 8.2, carb: 26, price: 320, desc: "Чиабатта, страчателла, томаты", tags: ["veg"], shot: "[ фото · брускетта ]" },
  { id: 14, cat: "donut", name: "Ягодный", kcal: 318, prot: 5.1, fat: 14.8, carb: 42, price: 270, desc: "Ягодная глазурь, ягодная начинка", tags: ["hit", "sweet"], shot: "[ фото · пончик ]", photo: "assets/menu/donuts/p-yagodny.webp" },
  { id: 15, cat: "donut", name: "Кокос", kcal: 352, prot: 5.4, fat: 17.6, carb: 43, price: 270, desc: "Белая глазурь, кокосовая стружка", tags: ["sweet"], shot: "[ фото · пончик ]", photo: "assets/menu/donuts/p-kokos.webp" },
  { id: 16, cat: "donut", name: "Йогурт ваниль", kcal: 334, prot: 5.6, fat: 15.4, carb: 44, price: 270, desc: "Йогуртовая глазурь, ванильный крем", tags: ["hit", "sweet"], shot: "[ фото · пончик ]", photo: "assets/menu/donuts/p-yogurt-vanil.webp" },
  { id: 17, cat: "donut", name: "Вишня шоколад", kcal: 346, prot: 5.3, fat: 16.2, carb: 45, price: 270, desc: "Шоколадная глазурь, вишнёвая начинка", tags: ["hit", "sweet"], shot: "[ фото · пончик ]", photo: "assets/menu/donuts/p-vishnya-shokolad.webp" },
  { id: 18, cat: "donut", name: "Клубника", kcal: 324, prot: 5.2, fat: 15.1, carb: 42, price: 270, desc: "Клубничная глазурь и крем", tags: ["sweet"], shot: "[ фото · пончик ]", photo: "assets/menu/donuts/p-klubnika.webp" },
  { id: 19, cat: "donut", name: "Буэно", kcal: 372, prot: 6.1, fat: 18.4, carb: 45, price: 270, desc: "Шоколадная глазурь, вафельная крошка", tags: ["hit", "sweet"], shot: "[ фото · пончик ]", photo: "assets/menu/donuts/p-bueno.webp" },
  { id: 70, cat: "mochi", name: "Малина фисташка", kcal: 136, prot: 2.4, fat: 4.1, carb: 22, price: 220, desc: "Фисташковое моти с малиновым центром", tags: ["hit","sweet"], shot: "[ фото · моти ]", photo: "assets/menu/mochi/mochi-malina-fistashka.webp" },
  { id: 71, cat: "mochi", name: "Манго маракуйя", kcal: 124, prot: 1.8, fat: 2.9, carb: 24, price: 220, desc: "Манго снаружи, маракуйя внутри", tags: ["hit","sweet","veg"], shot: "[ фото · моти ]", photo: "assets/menu/mochi/mochi-mango-marakuya.webp" },
  { id: 72, cat: "mochi", name: "Орео", kcal: 142, prot: 2.2, fat: 4.6, carb: 23, price: 220, desc: "Печенье орео и сливочный крем", tags: ["sweet"], shot: "[ фото · моти ]", photo: "assets/menu/mochi/mochi-oreo.webp" },
  { id: 73, cat: "mochi", name: "Раффаэло", kcal: 152, prot: 2.3, fat: 6.2, carb: 21, price: 220, desc: "Кокосовая стружка и миндаль", tags: ["sweet"], shot: "[ фото · моти ]", photo: "assets/menu/mochi/mochi-raffaelo.webp" },
  { id: 74, cat: "mochi", name: "Банан нутелла", kcal: 148, prot: 2.5, fat: 5.4, carb: 23, price: 220, desc: "Банан и шоколадно-ореховая паста", tags: ["hit","sweet"], shot: "[ фото · моти ]", photo: "assets/menu/mochi/mochi-banan-nutella.webp" },
  { id: 75, cat: "mochi", name: "Киндер кантри", kcal: 146, prot: 2.6, fat: 5.1, carb: 23, price: 220, desc: "Молочный шоколад и злаки", tags: ["sweet"], shot: "[ фото · моти ]", photo: "assets/menu/mochi/mochi-kinder-kantri.webp" },
  { id: 76, cat: "mochi", name: "Ферреро", kcal: 158, prot: 2.8, fat: 6.6, carb: 22, price: 220, desc: "Шоколад, лесной орех, вафля", tags: ["hit","sweet"], shot: "[ фото · моти ]", photo: "assets/menu/mochi/mochi-ferrero.webp" },
  { id: 12, cat: "dessert", name: "Чизкейк басконский", kcal: 386, prot: 7.2, fat: 24.6, carb: 32, price: 340, desc: "Тот самый подгоревший сверху", tags: ["sweet"], shot: "[ фото · чизкейк ]" },
  { id: 26, cat: "dessert", name: "Бабл гам", kcal: 298, prot: 4.2, fat: 12.4, carb: 42, price: 260, desc: "Моти со вкусом бабл-гам и посыпкой", tags: ["sweet"], shot: "[ фото · моти бабл гам ]", photo: "assets/menu/dessert/p-bubble-gum.webp" },
  { id: 27, cat: "dessert", name: "Банан нутелла", kcal: 148, prot: 2.5, fat: 5.4, carb: 23, price: 270, desc: "Моти: банановое тесто, ореховый крем", tags: ["hit", "sweet"], shot: "[ фото · моти банан ]", photo: "assets/menu/dessert/p-banan-nutella.webp" },
  { id: 28, cat: "dessert", name: "Дубайский шоколад", kcal: 412, prot: 6.8, fat: 22.4, carb: 46, price: 320, desc: "Моти с фисташкой и кадаифом", tags: ["hit", "sweet"], shot: "[ фото · моти дубай ]", photo: "assets/menu/dessert/p-dubai-shokolad.webp" },
];

/* Быстрые фильтры под меню. */
const FILTERS = [
  { id: "hit", label: "хиты" },
  { id: "sweet", label: "сладкое" },
  { id: "light", label: "полегче" },
  { id: "veg", label: "без молочки животной" },
];

/* Объёмы стакана в конструкторе и наценка за объём. */
const SIZES = [
  { id: "m", label: "500 мл", delta: 0 },
  { id: "l", label: "700 мл", delta: 60 },
  { id: "xl", label: "1 л", delta: 120 },
];

/* Топпинги в конструкторе. */
const TOPPINGS = [
  { id: "tapioca", label: "тапиока", price: 60 },
  { id: "popping", label: "попинг-боба", price: 70 },
  { id: "jelly", label: "кокосовое желе", price: 60 },
  { id: "cream", label: "сливочная пенка", price: 80 },
  { id: "pudding", label: "пудинг", price: 70 },
  { id: "double", label: "двойной сироп", price: 40 },
];

/* Средние КБЖУ по категории — подставляются, если у позиции нет своих. */
const NUTRI = {
  bubble:    { kcal: 268, p: 4.1, f: 6.2, c: 47, vol: "500 мл" },
  matcha:    { kcal: 246, p: 5.1, f: 8.4, c: 36, vol: "500 мл" },
  cheese:    { kcal: 298, p: 5.6, f: 9.4, c: 45, vol: "500 мл" },
  icecoffee: { kcal: 212, p: 4.8, f: 6.6, c: 31, vol: "500 мл" },
  colddrink: { kcal: 178, p: 0.5, f: 0.2, c: 43, vol: "500 мл" },
  tea:       { kcal: 96,  p: 0.3, f: 0.1, c: 23, vol: "500 мл" },
  coffee:    { kcal: 148, p: 4.2, f: 4.8, c: 20, vol: "400 мл" },
  mochi:     { kcal: 132, p: 2.1, f: 3.6, c: 23, vol: "1 шт · 45 г" },
  donut:     { kcal: 342, p: 5.2, f: 16.4, c: 43, vol: "1 шт · 80 г" },
  poke:      { kcal: 486, p: 24.6, f: 14.2, c: 62, vol: "1 порция" },
};

YETI.menu = { CATS, ITEMS, FILTERS, SIZES, TOPPINGS, NUTRI };
