WOOD_WALL_HEALTH = 3;
STONE_WALL_HEALTH = 6;

var WALLBREAKER = 0, ARSONIST = 1, SOLDIER = 2, RAIDER = 3;

var cities = [];
var raidCount = 0;
var timeUntilRaid = null;
var raidUnits = null;
var raidSpotted = false;
var raidTurn = 0;

// TODO:
// raids/cities
// defenses like seed catapult, log trebuchet, walls (wood), seed spreader, seed bombs, hiroseedma
// raid other cities (tanks maybe?)
// each city allows another 100 workers
// soldiers (raid other cities)
// max wall count (probably around 5)


function getMaxWorkers() {
    return Math.max(cities.length, 100);
}

function refreshCities() {
    set("cityDefense", getDefense(cities[0]));
    set("cityWalls", cities[0].woodWalls);
    set("standingWalls", cities[0].woodWalls - cities[0].destroyedWalls);
    get("rebuildWallButton").style.display = (cities[0].destroyedWalls > 0) ? "block" : "none";
    set("timeUntilRaid", raidSpotted ? timeUntilRaid + "s" : "???")
}

function City() {
    this.woodWalls = 0;
    this.destroyedWalls = 0;
    this.currentWallDamage = 0;
    this.scouts = 0;
}

function Soldier() {
    this.type = SOLDIER;
    this.damage = 3;
    this.health = 3;
    this.woodWallDamage = 1;
    this.stoneWallDamage = 1;
    this.capacity = 50;
    this.active = true;
}

function Raider() {
    this.type = RAIDER;
    this.damage = 1;
    this.health = 1;
    this.woodWallDamage = 1;
    this.stoneWallDamage = 1;
    this.capacity = 200;
    this.active = true;
}

function Arsonist() {
    this.type = ARSONIST;
    this.damage = 1;
    this.health = 2;
    this.woodWallDamage = 3;
    this.stoneWallDamage = 1;
    this.capacity = 100; // arsonists destroy this many trees
    this.active = true;
}

function Wallbreaker() {
    this.type = WALLBREAKER;
    this.damage = 2;
    this.health = 2;
    this.woodWallDamage = 1;
    this.stoneWallDamage = 3;
    this.capacity = 50;
    this.active = true;
}

function getDefense(city) {
    return city.woodWalls * WOOD_WALL_HEALTH;
}

function generateRaid() {
    timeUntilRaid = getRandomInt(120, 240);
    raidSpotted = false;
    raidTurn = 0;

    var strength = raidCount * 1 + 1;
    strength *= getRandomFloat(0.75, 1.25);
    units = [0, 0, 0, 0]; // soldiers, raiders, arsonists, wall-breaker
    for (i = 0; i < Math.round(strength); i++) {
        units[strength > 5 ? getRandomInt(0, 3) : getRandomInt(2, 3)]++; // 0: wallbreakers, 1: arsonists, 2: soldiers, 3: raiders
    }
    
    raidUnits = Array();
    
    for (i = 0; i < units[0]; i++) raidUnits.push(new Wallbreaker());
    for (i = 0; i < units[1]; i++) raidUnits.push(new Arsonist());
    for (i = 0; i < units[2]; i++) raidUnits.push(new Soldier());
    for (i = 0; i < units[3]; i++) raidUnits.push(new Raider());
}

function getRaidUnitCount() {
    return raidUnits.length;
}

function getRaidDefenseCount() {
    return 0;
}

function hasStandingWalls(city) {
    return city.woodWalls > city.destroyedWalls; // TODO: update to include stone walls
}

function attackWall(cityIndex, unit) {
    // TODO: incorporate stone wall
    cities[cityIndex].currentWallDamage += unit.woodWallDamage;
    if (cities[cityIndex].currentWallDamage >= WOOD_WALL_HEALTH) {
        cities[cityIndex].destroyedWalls++;
        cities[cityIndex].currentWallDamage = 0;
    }
}

function stealResources(cityIndex, unit, stolenThisTurn) {
    
    var choice = getRandomInt(0, 2);

    if (unit.type === ARSONIST) {
        subTrees(unit.capacity);
        stolenThisTurn.trees += unit.capacity;
    } else if (choice === 0) {
        subMoney(unit.capacity * 25);
        stolenThisTurn.money += unit.capacity * 25;
    } else if (choice === 1) {
        subWood(unit.capacity);
        stolenThisTurn.wood += unit.capacity;
    } else {
        subSeeds(unit.capacity);
        stolenThisTurn.seeds += unit.capacity;
    }
    
    return stolenThisTurn;
}

function doRaidTurn(cityIndex) {
    raidTurn++;
    
    // for turn order, create a shuffled list of 1s and 0s (1s for attacking troops, 0s for defense)
    var unitTypes = Array(getRaidDefenseCount() + getRaidUnitCount()).fill(0);
    if (getRaidUnitCount() > 0) unitTypes.fill(1, getRaidDefenseCount());
    unitTypes = shuffle(unitTypes);
    console.log(unitTypes);
    
    var stolenThisTurn = {money: 0, trees: 0, seeds: 0, wood: 0} // for the console
    
    var unitIndex = 0;
    var defenseIndex = 0;
    for (i = 0; i < unitTypes.length; i++) {
        if (unitTypes[i] === 1) { // do a turn for an attacking unit
            if (hasStandingWalls(cities[cityIndex])) {
                attackWall(cityIndex, raidUnits[unitIndex]);
                if (!hasStandingWalls(cities[cityIndex])) {
                    writeToConsole("The enemies have broken through your walls!");
                }
            } else {
                // TODO: attack defenses
                
                // no defenses left - steal and go
                stolenThisTurn = stealResources(cityIndex, raidUnits[unitIndex], stolenThisTurn);
                raidUnits[unitIndex].active = false;
            }
            unitIndex++;
        } else { // do a turn for a defensive unit
            // attack random or front attacking troop
            defenseIndex++;
        }
    }
    
    if (stolenThisTurn !== {money: 0, trees: 0, seeds: 0, wood: 0}) {
        var stolenStrings = [];
        if (stolenThisTurn.money > 0) stolenStrings.push(formatMoney(stolenThisTurn.money));
        if (stolenThisTurn.wood > 0) stolenStrings.push(formatInt(stolenThisTurn.wood) + " wood");
        if (stolenThisTurn.trees > 0) stolenStrings.push(formatInt(stolenThisTurn.trees) + " trees");
        if (stolenThisTurn.seeds > 0) stolenStrings.push(formatInt(stolenThisTurn.seeds) + " seeds");
        
        var stolenMessage;
        switch (stolenStrings.length) {
            case 1: stolenMessage = stolenStrings[0]; break;
            case 2: stolenMessage = stolenStrings[0] + " and " + stolenStrings[1]; break;
            case 3: stolenMessage = stolenStrings.slice(0, 2).join(", ") + ", and " + stolenStrings[2]; break;
            default: stolenMessage = stolenStrings.slice(0, 3).join(", ") + ", and " + stolenStrings[3]; break;
        }
        
        writeToConsole("Enemies have stolen " + stolenMessage + "!");
    }
    
    // clean up inactive units (either dead or have escaped with resources)
    for (i = 0; i < raidUnits.length; i++) {
        if (!raidUnits[i].active) {
            raidUnits.splice(i, 1);
            i--; // hope that works, cancel out the next i++ to check the same index again
        }
    }
    
    if (raidUnits.length == 0) {
        writeToConsole("The raid is over!"); // TODO: give more details, if they won or lost, etc.
        raidCount++;
        generateRaid();
    }
    
}

function updateRaids() {
    if (timeUntilRaid === null) generateRaid();
    
    timeUntilRaid--;
    if (!raidSpotted) {
        if (cities[0].scouts > 0 && timeUntilRaid <= 45) {
            raidSpotted = true;
            approximateUnitCount = Math.round(getRaidUnitCount() * getRandomFloat(0.75, 1.25));
            writeToConsole("Your scout has spotted enemies approaching in the distance! There appears to be about " + approximateUnitCount + " units.");
        } else if (timeUntilRaid <= 15) {
            raidSpotted = true;
            approximateUnitCount = Math.round(getRaidUnitCount() * getRandomFloat(0.75, 1.25));
            writeToConsole("Enemies are approaching your city! There appears to be about " + approximateUnitCount + " units.");
        }
    } else {
        if (timeUntilRaid < 0) {
            if (raidTurn * -RAID_TURN_LENGTH >= timeUntilRaid) {
                doRaidTurn(0);
            }
        }
    }
    
    refreshCities();
}