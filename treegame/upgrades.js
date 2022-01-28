var activeUpgrades = [];
var usedUpgradeIDs = [];

function canAffordUpgrade(cost) {
    if (cost.hasOwnProperty('money') && cost.money > money) return false;
    if (cost.hasOwnProperty('wood') && cost.wood > wood) return false;
    if (cost.hasOwnProperty('trees') && cost.trees > trees) return false;
    if (cost.hasOwnProperty('seeds') && cost.seeds > seeds) return false;
    return true;
}

function payForUpgrade(cost) {
    if (cost.hasOwnProperty('money')) subMoney(cost.money);
    if (cost.hasOwnProperty('wood')) subWood(cost.wood);
    if (cost.hasOwnProperty('trees')) subTrees(cost.trees);
    if (cost.hasOwnProperty('seeds')) subSeeds(cost.seeds);
}

function createPriceTag(cost) {
    var tag = "(";
    if (cost.hasOwnProperty('money')) tag += formatMoney(cost.money) + ", ";
    if (cost.hasOwnProperty('wood')) tag += formatInt(cost.wood) + " wood, ";
    if (cost.hasOwnProperty('trees')) tag += formatInt(cost.trees) + " trees, ";
    if (cost.hasOwnProperty('seeds')) tag += formatInt(cost.seeds) + " seeds, ";
    tag = tag.substring(0, tag.length - 2);
    return tag + ")";
    
}

function displayUpgrade(upgrade) {
    
    upgrade.element = document.createElement("button");
    upgrade.element.setAttribute("id", upgrade.id);
    
    upgrade.element.onclick = function(){
        payForUpgrade(upgrade.cost);
        upgrade.uses--;
        upgrade.effect();
        if (upgrade.uses <= 0) {
            upgrade.element.parentNode.removeChild(upgrade.element);
            var index = activeUpgrades.indexOf(upgrade);
            activeUpgrades.splice(upgrade, 1);
        }
    };
    
    upgrade.element.setAttribute("class", "upgradeButton");
    upgradeListStart.appendChild(upgrade.element, upgradeListStart.firstChild);
    
    var span = document.createElement("span");
    span.style.fontWeight = "bold";
    upgrade.element.appendChild(span);
    
    var title = document.createTextNode(upgrade.title + " ");
    span.appendChild(title);
    
    var cost = document.createTextNode(createPriceTag(upgrade.cost));
    upgrade.element.appendChild(cost);
    
    var div = document.createElement("div");
    upgrade.element.appendChild(div);
    
    var description = document.createTextNode(upgrade.description);
    upgrade.element.appendChild(description);
    
    upgrade.element.style.visible = "visible";

}

function manageUpgrades(){
    for(var i = 0; i < upgrades.length; i++){
        if (upgrades[i].trigger() && (upgrades[i].uses > 0) && !usedUpgradeIDs.includes(upgrades[i].id)) {
            displayUpgrade(upgrades[i]);
            activeUpgrades.push(upgrades[i]);
            usedUpgradeIDs.push(upgrades[i].id);
        }
    }
        
    for(var i = 0; i < activeUpgrades.length; i++) {
        if (canAffordUpgrade(activeUpgrades[i].cost)){
            activeUpgrades[i].element.disabled = false;
        } else {
            activeUpgrades[i].element.disabled = true;
        }
    }
}

function getUpgrade(id) {
    for(var i = 0; i < upgrades.length; i++){
        if (upgrades[i].id == id) {
            return upgrades[i];
        }
    }
    return null;
}

function getUses(id) {
    return getUpgrade(id).uses;
}

function setUses(id, val) {
    for(var i = 0; i < upgrades.length; i++){
        if (upgrades[i].id == id) {
            upgrades[i].uses = val;
        }
    }
}

var upgrades = [
    {
        id: "storeU",
        title: "Build a Store",
        description: "Getting tired of selling logs yourself? Open a store to do it automatically!",
        trigger: function() { return totalWood - wood >= 100 },
        uses: 1,
        cost: {money: 3000, wood: 150},
        flag: 0,
        element: null,
        effect: function(){
            get("storeDiv").style.display = "block";
            stores = 1;
            refresh();
        }
    },
    
    {
        id: "marketingU",
        title: "Marketing",
        description: "Hire a marketing team to start increasing demand",
        trigger: function() { return stores >= 3 },
        uses: 1,
        cost: {money: 5000},
        flag: 0,
        element: null,
        effect: function(){
            get("marketingDiv").style.display = "block";
        }
    },
    
    {
        id: "sawmillU",
        title: "Sawmill",
        description: "Increases wood production speed 50%",
        trigger: function() { return woodcutters >= 10 },
        uses: 1,
        cost: {money: 15000, wood: 300},
        flag: 0,
        element: null,
        effect: function(){
            woodProduction += 0.5;
        }
    },
    
    {
        id: "treeMachineryU",
        title: "Tree-Planting Machinery",
        description: "Increases tree planting speed 50%",
        trigger: function() { return arborists >= 15 },
        uses: 1,
        cost: {money: 75000, wood: 500},
        flag: 0,
        element: null,
        effect: function(){
            treeProduction += 0.5;
        }
    },
    
    {
        id: "treeGrowSpeedU",
        title: "Let it Grow",
        description: "Increases tree planting speed 50%",
        trigger: function() { return arborists >= 30 },
        uses: 1,
        cost: {money: 250000},
        flag: 0,
        element: null,
        effect: function(){
            treeProduction += 0.5;
        }
    },
    
    {
        id: "seedConvoysU",
        title: "Seed Convoys",
        description: "Increases seed buying speed 50%",
        trigger: function() { return seedBuyers >= 20 },
        uses: 1,
        cost: {money: 100000, wood: 750},
        flag: 0,
        element: null,
        effect: function(){
            seedProduction += 0.5;
        }
    },
    
    {
        id: "seedPriceU",
        title: "+1 Charisma",
        description: "The seed price lowers 50%",
        trigger: function() { return totalSeeds >= 5000 },
        uses: 1,
        cost: {money: 150000},
        flag: 0,
        element: null,
        effect: function(){
            seedPriceMultiplier *= 0.5;
        }
    },
    
    {
        id: "buildCityU",
        title: "Build a City",
        description: "OOOOOOOO",
        trigger: function() { return arborists + woodcutters + seedBuyers >= 50 },
        uses: 1,
        cost: {money: 2500000, wood: 5000},
        flag: 0,
        element: null,
        effect: function(){
            stage = CITY_STAGE;
            get("cityDiv").style.display = "block";
            cities.push(new City());
        }
    },
    
    {
        id: "financialAdvisorU",
        title: "Financial Advisor",
        description: "Hire a fiancial expert to control log prices",
        trigger: function() { return stores >= 15 && stage === CITY_STAGE},
        uses: 1,
        cost: {money: 200000},
        flag: 0,
        element: null,
        effect: function(){
            autoAdjustPrice = true;
        }
    },
    
    {
        id: "scoutU",
        title: "Scout",
        description: "Gives you warning before your city is attacked",
        trigger: function() { return stage === CITY_STAGE},
        uses: 1,
        cost: {money: 100000},
        flag: 0,
        element: null,
        effect: function(){
            cities[0].scouts++;
        }
    },
    
    {
        id: "buildWallU",
        title: "Defensive Wall",
        description: "WE NEED TO BUILD A WALL!",
        trigger: function() { return stage === CITY_STAGE},
        uses: 1,
        cost: {wood: 1000},
        flag: 0,
        element: null,
        effect: function(){
            cities[0].woodWalls++;
            refreshCities();
        }
    }
]

