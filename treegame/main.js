var currentVersion = "0.2";

var trees = 0;
var wood = 0;
var seeds = 100;
var money = 0;
var stores = 0;
var demand = 100;
var marketing = 1;
var arborists = 0;
var woodcutters = 0;
var seedBuyers = 0;
var seedBuyersOn = true;
var autoAdjustPrice = false;
var gamePaused = false;

var woodPrice = 25; // money is handled in cents
var seedPrice = 20;
var seedPriceBase = seedPrice;
var seedTrend = 0;
var seedPriceMultiplier = 1;
var arboristPriceRate = 1.1;
var woodcutterPriceRate = 1.15;
var seedBuyerPriceRate = 1.12;
var arboristPrice = Math.floor(2000 * Math.pow(arboristPriceRate, arborists));
var woodcutterPrice = Math.floor(2000 * Math.pow(woodcutterPriceRate, woodcutters));
var seedBuyerPrice = Math.floor(2000 * Math.pow(seedBuyerPriceRate, seedBuyers));
var storeWoodPrice = Math.floor(150 * Math.pow(1.07, stores));
var storeMoneyPrice = Math.floor(3000 * Math.pow(1.1, stores));
var marketingPrice = Math.floor(10000 * Math.pow(1.25, marketing - 1));
var popularityTrend = 0;
var popularity = 1;
var woodProduction = 1;
var treeProduction = 1;
var seedProduction = 1;
var extraSales = 0; // to handle floating points on wood sales

var totalTrees = trees;
var totalWood = wood;
var totalMoney = money;
var totalSeeds = seeds;

var SEEDS_PER_PACKET = 100;
var MIN_SEED_PRICE = 5;
var MAX_SEED_PRICE = 30;
var MIN_WOOD_PRICE = 1;
var MAX_WOOD_PRICE = 100;
var SALES_MULTIPLIER = 1;
var CONSOLE_SPEED = 15; // in letters per second
var RAID_TURN_LENGTH = 5; // seconds

var INTRO_STAGE = 0, CITY_STAGE = 1;
var stage = INTRO_STAGE;

var consoleCurrentFirstLine = "";
var consoleFullFirstLine = "";
var consoleOtherLines = "";
var CONSOLE_MAX_LINE_COUNT = 5;
var CONSOLE_NEW_AT_TOP = false;

var resetFlag = false;

var upgradeListStart;

var PLACE_VALUE = ["", " thousand", " million", " billion", " trillion", " quadrillion", " quintillion", " sextillion", " septillion", " octillion", " nonillion", " decillion", " undecillion", " duodecillion", " tredecillion", " quattuordecillion", " quindecillion", " sexdecillion", " septendecillion", " octodecillion", " novemdecillion", " vigintillion", " unvigintillion", " duovigintillion", " trevigintillion", " quattuorvigintillion", " quinvigintillion", " sexvigintillion", " septenvigintillion", " octovigintillion", " novemvigintillion", " trigintillion", " untrigintillion", " duotrigintillion", " tretrigintillion", " quattuortrigintillion", " quintrigintillion", " sextrigintillion", " septentrigintillion", " octotrigintillion", " novemtrigintillion", " quadragintillion", " unquadragintillion", " duoquadragintillion", " trequadragintillion", " quattuorquadragintillion", " quinquadragintillion", " sexquadragintillion", " septenquadragintillion", " octoquadragintillion", " novemquadragintillion", " quinquagintillion", " unquinquagintillion", " duoquinquagintillion", " trequinquagintillion", " quattuorquinquagintillion", " quinquinquagintillion", " sexquinquagintillion", " septenquinquagintillion", " octoquinquagintillion", " novemquinquagintillion", " sexagintillion", " unsexagintillion", " duosexagintillion", " tresexagintillion", " quattuorsexagintillion", " quinsexagintillion", " sexsexagintillion", " septsexagintillion", " octosexagintillion", " octosexagintillion", " septuagintillion", " unseptuagintillion", " duoseptuagintillion", " treseptuagintillion", " quinseptuagintillion"," sexseptuagintillion"," septseptuagintillion"," octoseptuagintillion"," novemseptuagintillion"," octogintillion"," unoctogintillion"," duooctogintillion"," treoctogintillion"," quattuoroctogintillion"," quinoctogintillion"," sexoctogintillion"," septoctogintillion"," octooctogintillion"," novemoctogintillion"," nonagintillion"," unnonagintillion"," duononagintillion", " trenonagintillion "," quattuornonagintillion "," quinnonagintillion "," sexnonagintillion "," septnonagintillion "," octononagintillion "," novemnonagintillion ", " centillion"];


// TODO:
// stock market, intro (slowly unlock parts of the game)
// stages: intro, city, multiple-city, empire, planetary exploration
// Change title of the sales element based on what the problem is?


function addTrees(amount) {
    trees += amount;
    if (amount > 0) totalTrees += amount;
    set("trees", formatInt(trees));
}

function addWood(amount) {
    wood += amount;
    if (amount > 0) totalWood += amount;
    set("wood", formatInt(wood));
}

function addMoney(amount) {
    money += amount;
    if (amount > 0) totalMoney += amount;
    set("money", formatMoney(money));
}

function addSeeds(amount) {
    seeds += amount;
    if (amount > 0) totalSeeds += amount;
    set("seeds", formatInt(seeds));
}

function subTrees(amount) { addTrees(-amount); }
function subWood(amount) { addWood(-amount); }
function subMoney(amount) { addMoney(-amount); }
function subSeeds(amount) { addSeeds(-amount); }

function get(id) {
    return document.getElementById(id);
}

function set(id, value) {
    try {
        document.getElementById(id).innerHTML = value;
    } catch (err) {
        console.log('Error setting variable: ' + err.name);
        console.log(err.message);
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function getTime() {
    return (new Date()).getTime() * 0.001;
}

function formatMoney(amount) {
    if (amount >= 1000000000) return "$" + formatLargeNumber(amount / 100);
    return "$" + (Math.round(amount) / 100).toLocaleString(undefined,
 {'minimumFractionDigits':2,'maximumFractionDigits':2});
}

function formatInt(num) {
    if (num < 1000000000) return Math.round(num).toLocaleString();
    
    else return formatLargeNumber(num);
}

function formatLargeNumber(num) {
    var zeroCount = Math.floor(Math.log10(num));
    var placeValueIndex = Math.floor(zeroCount / 3);
    var adjustedNum = num / (Math.pow(10, placeValueIndex * 3));
    return (Math.round(adjustedNum * 100) / 100) + PLACE_VALUE[placeValueIndex];
}

function formatDec(num) {
    return (Math.round(num * 100) / 100).toLocaleString();
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

  return array;
}

function updateDemand() {
    if (popularity < 1) popularity = (popularity - 1) * 2;
    else popularity -= 1; // convert from 0.5 to 2, to -1 to 1
    
    popularityTrend += getRandomFloat(-0.1, 0.1);
    if (popularity === -1) popularityTrend += 0.02;
    else if (popularity === 1) popularityTrend -= 0.02;
    popularityTrend = clamp(popularityTrend, -0.1, 0.1);
    
    popularity += getRandomFloat(Math.min(0, popularityTrend), Math.max(0, popularityTrend));
    popularity = clamp(popularity, -1, 1);
    
    if (popularity > 0) popularity += 1;
    else popularity = 1 + (popularity / 2);
    setDemand();
}

function setDemand() {
    // demand = Math.pow(woodPrice - 1, 0.45295) * -23.70464 + 200;
    demand = Math.pow(1000 / woodPrice, 1.5);
    
    demand *= (marketing + 1) * 0.5;
    demand *= popularity;
    set("demand", Math.round(demand));
    set("popularity", Math.round(popularity * 100));
}

function buyArborist() {
    if (money >= arboristPrice && arborists + woodcutters + seedBuyers < getMaxWorkers()) {
    	subMoney(arboristPrice);
    	arborists++;
        set("arborists", arborists);
        set("workerCount", arborists + woodcutters + seedBuyers);
    }
    arboristPrice = Math.floor(2000 * Math.pow(arboristPriceRate, arborists));
    set("arboristPrice", formatMoney(arboristPrice));
}

function buyWoodcutter() {
    if (money >= woodcutterPrice && arborists + woodcutters + seedBuyers < getMaxWorkers()) {
        woodcutters++;
        subMoney(woodcutterPrice)
        set("woodcutters", formatInt(woodcutters));
        set("workerCount", arborists + woodcutters + seedBuyers);
    }
    woodcutterPrice = Math.floor(2000 * Math.pow(woodcutterPriceRate, woodcutters));
    set("woodcutterPrice", formatMoney(woodcutterPrice));
}

function buySeedBuyer() {
    if (money >= seedBuyerPrice && arborists + woodcutters + seedBuyers < getMaxWorkers()) {
    	subMoney(seedBuyerPrice);
    	seedBuyers++;
        set("seedBuyers", seedBuyers);
        set("workerCount", arborists + woodcutters + seedBuyers);
        get("seedBuyerToggle").style.display = "block";
    }
    seedBuyerPrice = Math.floor(2000 * Math.pow(seedBuyerPriceRate, seedBuyers));
    set("seedBuyerPrice", formatMoney(seedBuyerPrice));
}

function toggleSeedBuyers() {
    seedBuyersOn = !seedBuyersOn;
    if (seedBuyersOn) set("seedBuyerToggle", "Stop Buying");
    else set("seedBuyerToggle", "Start Buying");
}

function buySeeds(amount) {
    amount = Math.min(amount, Math.floor(money / seedPrice));
    if (money >= seedPrice * amount || (seeds === 0 && wood === 0 && trees === 0)) {
        subMoney(seedPrice * amount);
        addSeeds(amount);
    }
}

function buySeedPacket() {
    if (money >= seedPrice * SEEDS_PER_PACKET || (seeds === 0 && wood === 0 && trees === 0)) {
        subMoney(seedPrice * SEEDS_PER_PACKET);
        addSeeds(SEEDS_PER_PACKET);
    }
}

function upgradeMarketing() {
    if (money >= marketingPrice) {
        subMoney(marketingPrice);
        marketing++;
        set("marketing", formatInt(marketing));
        setDemand();
    }
    marketingPrice = Math.floor(10000 * Math.pow(1.25, marketing - 1));
    set("marketingPrice", formatMoney(marketingPrice));
}

function buildStore() {
    if(money >= storeMoneyPrice && wood >= storeWoodPrice) {
    	subMoney(storeMoneyPrice);
        subWood(storeWoodPrice);
        stores++;
        set("stores", formatInt(stores));
    }
    storeWoodPrice = Math.floor(150 * Math.pow(1.07, stores));
    storeMoneyPrice = Math.floor(3000 * Math.pow(1.1, stores));
    set("storePrice", formatMoney(storeMoneyPrice) + ", " + storeWoodPrice + " wood");
}

function plantTree(number){
    number = Math.min(number, seeds);
    addTrees(number);
    subSeeds(number);
}

function cutTree(number) {
    number = Math.min(trees, number);
    subTrees(number);
    addWood(getRandomInt(4 * number, 6 * number));
}

function updateStores() {
    sellWood(stores * (demand / 100));
}

function sellWood(amount) {
    var sales = Math.min(wood, SALES_MULTIPLIER * amount + extraSales);
    extraSales = sales % 1;
    sales = Math.floor(sales);
    
    subWood(sales);
    addMoney(sales * woodPrice);
}

function raisePrice() {
    woodPrice = clamp(woodPrice + 1, MIN_WOOD_PRICE, MAX_WOOD_PRICE);
    set("woodPrice", formatMoney(woodPrice));
    setDemand();
}

function lowerPrice() {
    woodPrice = clamp(woodPrice - 1, MIN_WOOD_PRICE, MAX_WOOD_PRICE);
    set('woodPrice', formatMoney(woodPrice));
    setDemand();
}

function updateSpeeds() {
    var seedsPurchased = seedBuyersOn ? Math.min(seedBuyers * seedProduction, Math.floor(money / seedPrice)) : 0;
    var prePlantingSeeds = seeds + seedsPurchased;
    var treesPlanted = Math.min(arborists * treeProduction, prePlantingSeeds);
    var preCuttingTrees = trees + treesPlanted;
    var treesCut = Math.min(woodcutters * woodProduction, preCuttingTrees);
    var preSellingWood = wood + (treesCut * 5);
    var possibleSales = SALES_MULTIPLIER * stores * demand / 100;
    var sales = Math.min(preSellingWood, possibleSales);
    
    set("treesPerSecond", formatDec(treesPlanted - treesCut));
    set("seedsPerSecond", formatDec(seedsPurchased - treesPlanted));
    set("production", formatDec(treesCut * 5));
    set("salesPerSecond", formatDec(sales));
    
    var idealWoodPrice = Math.round(1000 / Math.pow(1000 * treesCut / SALES_MULTIPLIER / stores / popularity / (marketing + 1), 1/1.5));
    

    if (autoAdjustPrice) {
        if (idealWoodPrice > woodPrice) raisePrice();
        else if (idealWoodPrice < woodPrice) lowerPrice();
    }
    
    set("moneyPerSecond", formatMoney(sales * woodPrice - seedsPurchased * seedPrice));  // money (from stores)
    set("woodPerSecond", formatDec((treesCut * 5) - sales));
}

function updateButtons() {
    get("plantTreeBtn").disabled = seeds < 1;
    get("cutTreeBtn").disabled = trees < 1;
    get("sellWoodBtn").disabled = wood < 1;
    get("buySeedsBtn").disabled = money < seedPrice * 100;
    get("arboristPrice").disabled = money < arboristPrice;
    get("woodcutterPrice").disabled = money < woodcutterPrice;
    get("seedBuyerPrice").disabled = money < seedBuyerPrice;
    get("storePrice").disabled = money < storeMoneyPrice || wood < storeWoodPrice;
    get("marketingPrice").disabled = money < marketingPrice;
    get("raiseWoodPriceBtn").disabled = woodPrice === MAX_WOOD_PRICE;
    get("lowerWoodPriceBtn").disabled = woodPrice === MIN_WOOD_PRICE;
    get("rebuildWallButton").disabled = wood < 250;
}


function updateSeedPrice() {
    // seedTrend += getRandomInt(Math.min(-seedTrend, -2), Math.max(seedTrend, 2));
    seedTrend += getRandomFloat(-4, 4);
    if (seedPriceBase === 40) seedTrend -= 1.5;
    else if (seedPriceBase === 5) seedTrend += 1.5;
    seedTrend = clamp(seedTrend, -5, 5);
    
    seedPriceBase += getRandomFloat(Math.min(0, seedTrend), Math.max(0, seedTrend));
    seedPriceBase = clamp(seedPriceBase, MIN_SEED_PRICE, MAX_SEED_PRICE);
    seedPrice = seedPriceBase * seedPriceMultiplier;
    set("seedPacketPrice", formatMoney(seedPrice * 100));
}

function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) set("pauseButton", "Resume");
    else set("pauseButton", "Pause");
}

function save() {
    var upgradesUses = [];
    var upgradesFlags = [];
    var upgradesActive = [];

    for(var i=0; i < upgrades.length; i++){
        upgradesUses[i] = upgrades[i].uses;
        upgradesFlags[i] = upgrades[i].flag;
    }
    
    for(var i=0; i < activeUpgrades.length; i++){
        upgradesActive[i] = activeUpgrades[i].id;
    }
    
    
    var saveGame = {
        version: currentVersion,
        
        gamePaused: gamePaused,
        stage: stage,
        trees: trees,
        wood: wood,
        seeds: seeds,
        money: money,
        totalTrees: totalTrees,
        totalWood: totalWood,
        totalSeeds: totalSeeds,
        totalMoney: totalMoney,
        stores: stores,
        demand: demand,
        marketing: marketing,
        arborists: arborists,
        woodcutters: woodcutters,
        seedBuyers: seedBuyers,
        woodPrice: woodPrice,
        seedPriceBase: seedPriceBase,
        seedPriceMultiplier: seedPriceMultiplier,
        seedTrend: seedTrend,
        popularityTrend: popularityTrend,
        popularity: popularity,
        treeProduction: treeProduction,
        woodProduction: woodProduction,
        seedProduction: seedProduction,
        seedBuyersOn: seedBuyersOn,

        autoAdjustPrice: autoAdjustPrice,
        raidCount: raidCount,
        timeUntilRaid: timeUntilRaid,
        raidUnits: raidUnits,
        raidSpotted: raidSpotted,
        raidTurn: raidTurn,
        
        tutorialStage: tutorialStage,
        tutorialTimer: tutorialTimer
    }
    
    localStorage.setItem("saveGame", JSON.stringify(saveGame));
    localStorage.setItem("saveCities", JSON.stringify(cities))
    localStorage.setItem("saveUpgradesUses",JSON.stringify(upgradesUses));
    localStorage.setItem("saveUpgradesFlags",JSON.stringify(upgradesFlags));
    localStorage.setItem("saveUpgradesActive",JSON.stringify(upgradesActive));
    localStorage.setItem("saveUsedUpgradeIDs", JSON.stringify(usedUpgradeIDs));
}

function load() {
    var loadGame = JSON.parse(localStorage.getItem("saveGame"));
    var loadCities = JSON.parse(localStorage.getItem("saveCities"));
    var loadUpgradesUses = JSON.parse(localStorage.getItem("saveUpgradesUses"));
    var loadUpgradesFlags = JSON.parse(localStorage.getItem("saveUpgradesFlags"));
    var loadUpgradesActive = JSON.parse(localStorage.getItem("saveUpgradesActive"));
    usedUpgradeIDs = JSON.parse(localStorage.getItem("saveUsedUpgradeIDs"));
    
    version = loadGame.version;
    if (version != currentVersion) reset(true);
    
    gamePaused = loadGame.gamePaused;
    stage = loadGame.stage;
    trees = loadGame.trees;
    wood = loadGame.wood;
    seeds = loadGame.seeds;
    money = loadGame.money;
    totalTrees = loadGame.totalTrees;
    totalWood = loadGame.totalWood;
    totalSeeds = loadGame.totalSeeds;
    totalMoney = loadGame.totalMoney;
    stores = loadGame.stores;
    demand = loadGame.demand;
    marketing = loadGame.marketing;
    arborists = loadGame.arborists;
    woodcutters = loadGame.woodcutters;
    seedBuyers = loadGame.seedBuyers;
    woodPrice = loadGame.woodPrice;
    seedPriceBase = loadGame.seedPriceBase;
    seedPriceMultiplier = loadGame.seedPriceMultiplier;
    seedPrice = seedPriceBase * seedPriceMultiplier;
    seedTrend = loadGame.seedTrend;
    popularityTrend = loadGame.popularityTrend;
    popularity = loadGame.popularity;
    treeProduction = loadGame.treeProduction;
    woodProduction = loadGame.woodProduction;
    seedProduction = loadGame.seedProduction;
    seedBuyersOn = loadGame.seedBuyersOn;

    autoAdjustPrice = loadGame.autoAdjustPrice;
    raidCount = loadGame.raidCount;
    timeUntilRaid = loadGame.timeUntilRaid;
    raidUnits = loadGame.raidUnits;
    raidSpotted = loadGame.raidSpotted;
    raidTurn = loadGame.raidTurn;
    
    tutorialStage = loadGame.tutorialStage;
    tutorialTimer = loadGame.tutorialTimer;
    
    for(var i=0; i < upgrades.length; i++){
        upgrades[i].uses = loadUpgradesUses[i];
        upgrades[i].flag = loadUpgradesFlags[i];
    }
    
    for(var i=0; i < upgrades.length; i++){
        if (loadUpgradesActive.indexOf(upgrades[i].id)>=0){
            displayUpgrade(upgrades[i]);
            activeUpgrades.push(upgrades[i]);
        }
    }
    
    for (var i=0; i < loadCities.length; i++) {
        cities.push(loadCities[i]);
    }
    
    arboristPrice = Math.floor(2000 * Math.pow(arboristPriceRate, arborists));
    woodcutterPrice = Math.floor(2000 * Math.pow(woodcutterPriceRate, woodcutters));
    seedBuyerPrice = Math.floor(2000 * Math.pow(seedBuyerPriceRate, seedBuyers));
    storeWoodPrice = Math.floor(150 * Math.pow(1.07, stores));
    storeMoneyPrice = Math.floor(3000 * Math.pow(1.1, stores));
    marketingPrice = Math.floor(10000 * Math.pow(1.25, marketing - 1));

    refresh();
}

function refresh() {
    set("trees", formatInt(trees));
    set("wood", formatInt(wood));
    set("seeds", formatInt(seeds));
    set("money", formatMoney(money));
    set("stores", formatInt(stores));
    set("storePrice", formatMoney(storeMoneyPrice) + ", " + formatInt(storeWoodPrice) + " wood");
    set("demand", formatInt(demand));
    set("popularity", formatInt(popularity * 100));
    set("marketing", marketing);
    set("marketingPrice", formatMoney(marketingPrice));
    set("arborists", formatInt(arborists));
    set("arboristPrice", formatMoney(arboristPrice));
    set("woodcutters", formatInt(woodcutters));
    set("woodcutterPrice", formatMoney(woodcutterPrice));
    set("seedBuyers", seedBuyers);
    set("seedBuyerPrice", formatMoney(seedBuyerPrice));
    set("woodPrice", formatMoney(woodPrice));
    set("seedPacketPrice", formatMoney(seedPrice * SEEDS_PER_PACKET))
    set("workerCount", arborists + woodcutters + seedBuyers);
    set("maxWorkers", getMaxWorkers());

    if (seedBuyersOn) set("seedBuyerToggle", "Stop Buying");
    else set("seedBuyerToggle", "Start Buying");
    
    if (gamePaused) set("pauseButton", "Resume");
    else set("pauseButton", "Pause");
    
    get("storeDiv").style.display = (getUses("storeU") <= 0) ? "block" : "none";
    get("marketingDiv").style.display = (getUses("marketingU") <= 0) ? "block" : "none";
    get("cityDiv").style.display = (getUses("buildCityU") <= 0) ? "block" : "none";
    get("seedBuyerToggle").style.display = (seedBuyers > 0) ? "block" : "none";
    
    if (stage === CITY_STAGE) refreshCities();
    updateSpeeds();
    updateButtons();
    
}

function confirmReset() {
    resetFlag = confirm("Are you sure you want to restart? You will lose all of your progress.");
    
}

function reset(hardReload=false) {
    localStorage.removeItem("saveGame");
    localStorage.removeItem("saveUpgradesUses");
    localStorage.removeItem("saveUpgradesFlags");
    localStorage.removeItem("saveUpgradesActive");
    location.reload(hardReload);
    
}

function refreshConsole() {
    set("consoleText", CONSOLE_NEW_AT_TOP ? (consoleOtherLines + consoleCurrentFirstLine) : (consoleOtherLines + consoleCurrentFirstLine));
}

function updateConsole() {
    if (consoleCurrentFirstLine != consoleFullFirstLine) {
        consoleCurrentFirstLine = consoleFullFirstLine.substring(0, consoleCurrentFirstLine.length + 1);
        refreshConsole();
    }
}

function writeToConsole(text) {
    if (consoleFullFirstLine != "") addOtherLine(consoleFullFirstLine);
    consoleFullFirstLine = "> " + text;
    consoleCurrentFirstLine = "";
}

function addOtherLine(line) {
    consoleOtherLines = CONSOLE_NEW_AT_TOP ? ("<br>" + line + consoleOtherLines) : (consoleOtherLines + line + "<br>");
    var count = (consoleOtherLines.match(/<br>/g) || []).length;
    if (count > CONSOLE_MAX_LINE_COUNT - 1) {
        if (CONSOLE_NEW_AT_TOP) {
            consoleOtherLines = consoleOtherLines.substring(0, consoleOtherLines.lastIndexOf("<br>"));
        } else {
            var secondLastBr = consoleOtherLines.substring(0, consoleOtherLines.length - 5).lastIndexOf("<br>");
            consoleOtherLines = consoleOtherLines.substring(0, secondLastBr + 4);
        }
    }
}

function cityCheat() {
    getUpgrade("buildCityU").effect();
    getUpgrade("marketingU").effect();
    getUpgrade("storeU").effect();
    setUses("marketingU", 0);
    setUses("storeU", 0);
    setUses("buildCityU", 0);
    stores = woodcutters = arborists = seedBuyers = 30;
    money = wood = seeds = trees = 1000000000;
    marketing = 15;
    refresh();
}

upgradeListStart = get("upgradeListStart");
if (localStorage.getItem("saveGame") != null) {
    load();
    manageUpgrades();
} else {
    refresh();
}

window.setInterval(function() {
    if (!gamePaused) {
        updateSpeeds();
        updateSeedPrice();
        if (seedBuyersOn) buySeeds(seedBuyers * seedProduction);
    	plantTree(arborists * treeProduction);
        cutTree(woodcutters * woodProduction);
        updateStores();
        updateDemand();
        manageUpgrades();
        updateButtons();
        updateTutorial();
        
        if (stage === CITY_STAGE) updateRaids();
        
        save();
    }
    
    if (resetFlag) reset();
}, 1000);

window.setInterval(function() {
    updateConsole();
}, 1000 / CONSOLE_SPEED);

//wood should rot says dylan