var tutorialStage = 0;
var tutorialTimer = 0;

var TUTORIAL_WAIT_LENGTH = 10;

function updateTutorial() {
    switch (tutorialStage) {
        case 0: // Intro
            writeToConsole("You find yourself in a land of dirt, alone with an axe and a small bag of seeds.");
            tutorialStage++;
            tutorialTimer = TUTORIAL_WAIT_LENGTH;
            break;
        case 1: // Wait until they plant a tree
            tutorialTimer--;
            if (tutorialTimer === 0) {
                writeToConsole("Alone in this vast landscape, you realize you have only one option: plant a tree.");
            }
            if (trees > 0) tutorialStage++;
            break;
        case 2: // Tree planted
            writeToConsole("As soon as the seed is planted, it somehow instantly grows into a full tree. It seems you now have a choice: plant more seeds, or chop down your tree.");
            tutorialStage++;
            tutorialTimer = TUTORIAL_WAIT_LENGTH;
            break;
        case 3: // Waiting to cut
            tutorialTimer--;
            if (tutorialTimer === 0 && trees === 1) {
                writeToConsole("After contemplating this tree for a long time, you find yourself... bored. You decide to take action.");
            }
            if (trees > 1) tutorialStage++;
            else if (wood > 0) tutorialStage = 6;
            break;
        case 4: // Planted, waiting to cut
            writeToConsole("You take another seed out of your bag and plant it. Just like the first, it immediately grows into a full sized tree.");
            if (seeds === 0) {
                tutorialStage++;
            } else if (wood > 0) tutorialStage = 6;
            break;
        case 5:
            writeToConsole("You plant your last seed and admire your work. You have created a small forest. But what now? You consider, and realize that chopping them down is the only option you have.");
            if (wood > 0) {
                tutorialStage++;
            }
            break;
        case 6: // Tree cut
            writeToConsole("After the tree falls, you chop it into a few smaller logs. But... what can you do with them? It doesn't seem like there is anyone else around to use them. Maybe if you walked far enough, you might run into civilization.");
            tutorialStage++;
            tutorialTimer = TUTORIAL_WAIT_LENGTH;
            break;
        case 7: // Waiting to sell
            tutorialTimer--;
            if (tutorialTimer === 0) {
                writeToConsole("Waiting on this vast dirt plain, you feel more alone then ever. Perhaps, you could explore in search of other life on this world, and maybe you could find someone who would buy these logs.");
            }
            if (money > 0) {
                tutorialStage++;
            }
            break;
        case 8:
            writeToConsole("After walking for hours, you come across a small village. One villager is eager to receive one of your logs, and in return he gives you $0.25 of some strange currency. Perhaps if you make enough money, you would be able to purchase something of value.");
            tutorialStage++;
            break;
        case 9:
            if (totalSeeds > SEEDS_PER_PACKET) {
                tutorialStage++;
                tutorialTimer = totalTrees; // Use the variable to temporarily count the number of trees, so we know when the player plants a new seed.
            }
            break;
        case 10:
            if (totalTrees > tutorialTimer) {
                writeToConsole("Trees to wood to money to seeds then back to trees! It all seems... pointless, in a way. But you certainly don't have anything better to do...");
                tutorialStage++;
            }
            break;
    }
}