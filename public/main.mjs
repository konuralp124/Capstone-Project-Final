import { //changes start
    getPlayerState,
    calculateDistance,
    closestDefenders,
    calculateShootingScore,
    calculateDribblingScore,
    calculatePassingScore,
    flattenTeam
} from './getState.mjs';

import {
    startShoot,
    updateShoot,
    startDribble,
    updateDribble,
    startPass,
    updatePass,
    calculateTargetForShooting,
    calculateDribbleDirection,
    checkInterception,
    isLineClear,
    calculateTargetPlayerLessDirect,
    calculateTargetPlayerDirect,
    calculatePassRadius,
    calculateTargetPositionToFeet,
    calculateTargetPositionToSpace
} from './decisions2.mjs';

import {
    inPossessionMovement,
    findClosestPlayerToBall,
    targetPlayerMovementInPossession,
    defendersInPossessionMovement,
    midfieldersInPossessionMovement,
    attackersInPossessionMovement
} from './movements.mjs';

import {
    outOfPossessionMovement,
    presserMovement,
    defendersOutOfPossessionMovement,
    midfieldersOutOfPossessionMovement,
    attackersOutOfPossessionMovement,
    goalkeeperOutOfPossessionMovement,
    calculateAverageTeamPosition
} from './outOfPossessionMovements.mjs';

import {
    handleThrowIn,
    handleGoalKick,
    handleKickOff,
    handleFoul
} from './outOfBounds.mjs';

import {
    initializeQTableFirstLayer,
    initializeQTableSecondLayer,
    getQTableFirstLayer,
    getQTableSecondLayer,
    updateQTableFirstLayer,
    updateQTableSecondLayer,
    makeDecisionFirstLayer,
    makeDecisionSecondLayer,
    printQTableFirstLayer,
    printQTableSecondLayer,
    printQTablesRaw,
    saveQTablesForKey
} from './QTable.mjs';


///////////////////////////////LATEST CHANGES


//////////////LATEST CHA

const canvas = document.getElementById('soccerField');
const ctx = canvas.getContext('2d');

// Set up the coordinate system
ctx.translate(10, 10); //canvas>field x=0 will be x=10 in the original canvas


const goalFirst = { x1: 0, y1: 178, x2: 0, y2: 222, xCenter: 0, yCenter: 200, goalDirection: "negative" };
const goalSecond = { x1: 600, y1: 178, x2: 600, y2: 222, xCenter: 600, yCenter: 200, goalDirection: "positive"};
const ball = {x:300, y:200, radius:5};

const reds= {

    color:"red",

    goalkeeper: { x: 15, y: 200, pos: "gk", posLarge:"gk", x_dist: 15, y_dist: 200, radius: 10 },

    defenders: [
        {x: 150, y: 80, pos:"lb", posLarge:"def", x_dist:150, y_dist:80, radius:10}, 
        {x: 100, y: 160, pos:"lcb", posLarge:"def", x_dist:100, y_dist:160, radius:10}, 
        {x: 100, y: 240, pos:"rcb", posLarge:"def", x_dist:100, y_dist:240, radius:10}, 
        {x: 150, y: 320, pos:"rb", posLarge:"def", x_dist:150, y_dist:320, radius:10}
    ],
    midfielders: [
        {x: 320, y: 150, pos:"lmid", posLarge:"mid", x_dist:320, y_dist:150, radius:10}, 
        {x: 250, y: 200, pos:"cmid", posLarge:"mid", x_dist:250, y_dist:200, radius:10}, 
        {x: 320, y: 250, pos:"rmid", posLarge:"mid",x_dist:320, y_dist:250, radius:10}
    ],
    forwards: [
        {x: 450, y: 100, pos:"lw", posLarge:"att", x_dist:450, y_dist:100, radius:10}, 
        {x: 500, y: 200, pos:"st", posLarge:"att", x_dist:500, y_dist:200, radius:10}, 
        {x: 450, y: 300, pos:"rw", posLarge:"att", x_dist:450, y_dist:300, radius:10}
    ],
    attackingGoal: goalSecond,
};
    
const blues = {

    color:"blue",

    goalkeeper: { x: 585, y: 200, pos: "gk", posLarge:"gk", x_dist: 585, y_dist: 200, radius: 10 },

    defenders: [
        { x: 450, y: 320, pos: "lb", posLarge:"def", x_dist: 450, y_dist: 320, radius:10 },
        { x: 500, y: 240, pos: "lcb", posLarge:"def", x_dist: 500, y_dist: 240, radius:10 },
        { x: 500, y: 160, pos: "rcb", posLarge:"def", x_dist: 500, y_dist: 160, radius:10 },
        { x: 450, y: 80, pos: "rb", posLarge:"def", x_dist: 450, y_dist: 80, radius:10 }
    ],
    midfielders: [
        { x: 280, y: 250, pos: "lmid", posLarge:"mid", x_dist: 280, y_dist: 250, radius:10 },
        { x: 350, y: 200, pos: "cmid", posLarge:"mid", x_dist: 350, y_dist: 200, radius:10 },
        { x: 280, y: 150, pos: "rmid", posLarge:"mid", x_dist: 280, y_dist: 150, radius:10 }
    ],
    forwards: [
        { x: 150, y: 300, pos: "lw", posLarge:"att", x_dist: 150, y_dist: 300, radius:10 },
        { x: 100, y: 200, pos: "st", posLarge:"att", x_dist: 100, y_dist: 200, radius:10 },
        { x: 150, y: 100, pos: "rw", posLarge:"att", x_dist: 150, y_dist: 100, radius:10 }
    ],
    attackingGoal: goalFirst,
};





let currentState=null;
let nextState=null;
let currentAction=null;;
let currentActionSecondLayer=null;
let horizontalWidth=600;
let verticalHeight=400;
let isTerminal=false;
let decisionTime;
let tacticalWeightShootingCategory1;
let tacticalWeightShootingCategory2;
let tacticalWeightShootingCategory3;
let tacticalWeightShootingCategory4;
let tacticalWeightShootingCategory5;
let tacticalWeightDribblingCategory1;
let tacticalWeightDribblingCategory2;
let tacticalWeightDribblingCategory3;
let tacticalWeightDribblingCategory4;
let tacticalWeightDribblingCategory5;
let tacticalWeightPassingCategory1;
let tacticalWeightPassingCategory2;
let tacticalWeightPassingCategory3;
let tacticalWeightPassingCategory4;
let tacticalWeightPassingCategory5;
let tacticalWeightPTFL;
let tacticalWeightPTSL;
let tacticalWeightPTFD;
let tacticalWeightPTSD;
const success1=2.7;
const success2=2.3;
const success3=2;
const success4=1.8;
const success5=1.2;
const failure1=-1.2;
const failure2=-1.8;
const failure3=-2;
const failure4=-2.3;
const failure5=-2.7;
const lowRewardSuccess=4;
const highRewardSuccess=6;
const lowRewardFailure=-4;
const highRewardFailure=-6;
//const highGoalRewardSuccess=30;
// const lowGoalRewardSuccess=20;
const goalreward1=12;
const goalreward2=11;
const goalreward3=10;
const goalreward4=9;
const goalreward5=8;
const learningRate=0.3;
const discountRate=0.9;
let explorationRate;
let shootingStatus="noShooting";
let passingStatus="noPassing";
let dribblingStatus="noDribbling";
let shootingState;
let passingState;
let dribblingState;
let teamInPossession;
let teamOutOfPossession;
const score= {you: 0, computer: 0};
let creativity;
let mentality;
let compactness;
let pressLevel;
let shootMore;
let dribbleMore;
let idea;

let computerCreativity="balanced";
let computerMentality="balanced";
let computerCompactness="balanced";
let computerDribbleMore="no";
let computerShootMore="no";
let computerPressLevel="balanced";
let computerIdea="balanced";
let currentTacticKey;
///////////////////////////////////////

function checkAndResolveCollisions(reds, blues, ball) {
    // Combine all objects into a single array
    const allObjects = [
        ...reds.defenders,
        ...reds.midfielders,
        ...reds.forwards,
        reds.goalkeeper,
        ...blues.defenders,
        ...blues.midfielders,
        ...blues.forwards,
        blues.goalkeeper,
        ball
    ];

    // Check for collisions between all pairs of objects
    for (let i = 0; i < allObjects.length; i++) {
        for (let j = i + 1; j < allObjects.length; j++) {
            const objA = allObjects[i];
            const objB = allObjects[j];

            // Calculate the distance between the two objects
            const dx = objB.x - objA.x;
            const dy = objB.y - objA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check if the objects are colliding
            if (distance < objA.radius + objB.radius) {
                // Objects are colliding, resolve the collision

                // Calculate the overlap
                const overlap = objA.radius + objB.radius - distance;

                // Normalize the collision vector
                const nx = dx / distance;
                const ny = dy / distance;

                // Move each object along the normalized vector to resolve the collision
                objA.x -= nx * overlap * 0.5;
                objA.y -= ny * overlap * 0.5;
                objB.x += nx * overlap * 0.5;
                objB.y += ny * overlap * 0.5;
            }
        }
    }
}


function drawObjects(object, color) {
    ctx.beginPath();
    ctx.arc(object.x, object.y, object.radius, 0, Math.PI * 2, true);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawField(){
    ctx.beginPath();
    ctx.rect(0, 0, 600, 400); // Draw rectangle in the translated coordinate system
    ctx.stroke(); // Outline the rectangle
    ctx.fillStyle = "lightgreen"; 
    ctx.fill();
    ctx.beginPath(); // Start a new path to draw midline
    ctx.moveTo(300, 0); 
    ctx.lineTo(300, 400); 
    ctx.stroke();
    ctx.beginPath(); // Start a new path to draw middle circle
    ctx.arc(300, 200, 50, 0, 2 * Math.PI); 
    ctx.stroke(); // Render the circle outline
    ctx.beginPath();
    ctx.rect(0, 78, 99, 244); // Draw rectangle in the translated coordinate system
    ctx.stroke(); // Outline the rectangle
    ctx.beginPath();
    ctx.rect(501, 78, 99, 244); // Draw rectangle in the translated coordinate system
    ctx.stroke(); // Outline the rectangle
    ctx.beginPath(); //circle next goal
    ctx.arc(99, 200, 25, 0, Math.PI/2); 
    ctx.stroke(); 
    ctx.beginPath(); //circle next goal
    ctx.arc(99, 200, 25, -Math.PI/2, Math.PI/2); 
    ctx.stroke(); 
    ctx.beginPath(); //circle next goal
    ctx.arc(501, 200, 25, Math.PI, -Math.PI/2); 
    ctx.stroke(); 
    ctx.beginPath(); //circle next goal
    ctx.arc(501, 200, 25, Math.PI/2, -Math.PI/2); 
    ctx.stroke(); 
}

function drawGoals(){
    ctx.beginPath();
    ctx.rect(-8, 178, 8, 44); // Width = 8 (x = -8 to 0), Height = 44 (y = 178 to 222)  
    ctx.stroke(); 

    // Right goal area
    ctx.beginPath();
    ctx.rect(600, 178, 8, 44); // Width = 8 (x = 600 to 608), Height = 44 (y = 178 to 222)
    ctx.stroke(); 
}


// helper: pick true/false with 50% chance
function getRandomBool() {
    return Math.random() < 0.5;
}

// helper: pick one of your three ideas
function getRandomIdea() {
    const ideas = ['possession', 'balanced', 'counter'];
    return ideas[Math.floor(Math.random() * ideas.length)];
}

function randomizeTactics() {
  // pick random values
      const shootMore_   = getRandomBool();
      const dribbleMore_ = getRandomBool();
      const idea_        = getRandomIdea();

      // update the selects in the DOM
      document.querySelector('#shootMore').value   = shootMore_   ? 'yes' : 'no';
      document.querySelector('#dribbleMore').value = dribbleMore_ ? 'yes' : 'no';
      document.querySelector('#idea').value        = idea_;
}




function checkTactics(){
    creativity = document.querySelector('#creativity').value;
    mentality = document.querySelector('#mentality').value;
    compactness = document.querySelector('#compactness').value;
    pressLevel = document.querySelector('#pressLevel').value;
    shootMore = document.querySelector('#shootMore').value;
    dribbleMore = document.querySelector('#dribbleMore').value;
    idea = document.querySelector('#idea').value;

    if (shootMore==="no"){
        tacticalWeightShootingCategory1=0;
        tacticalWeightShootingCategory2=0;
        tacticalWeightShootingCategory3=0;
        tacticalWeightShootingCategory4=0;
        tacticalWeightShootingCategory5=0;
    }
    else if (shootMore==="yes"){
        tacticalWeightShootingCategory1=1;
        tacticalWeightShootingCategory2=1.5;
        tacticalWeightShootingCategory3=2;
        tacticalWeightShootingCategory4=2.5;
        tacticalWeightShootingCategory5=3;
        if (creativity==="high"){
            tacticalWeightShootingCategory1-=0.2;
            tacticalWeightShootingCategory2-=0.2;
            tacticalWeightShootingCategory3-=0.2;
            tacticalWeightShootingCategory4-=0.2;
            tacticalWeightShootingCategory5-=0.2;
        }
        else if (creativity==="low"){
            tacticalWeightShootingCategory1+=0.2;
            tacticalWeightShootingCategory2+=0.2;
            tacticalWeightShootingCategory3+=0.2;
            tacticalWeightShootingCategory4+=0.2;
            tacticalWeightShootingCategory5+=0.2;
        }
    }


    if (dribbleMore==="no"){
        tacticalWeightDribblingCategory1=0;
        tacticalWeightDribblingCategory2=0;
        tacticalWeightDribblingCategory3=0;
        tacticalWeightDribblingCategory4=0;
        tacticalWeightDribblingCategory5=0;
    }

    else if (dribbleMore==="yes"){
        tacticalWeightDribblingCategory1=1;
        tacticalWeightDribblingCategory2=1.5;
        tacticalWeightDribblingCategory3=2;
        tacticalWeightDribblingCategory4=2.5;
        tacticalWeightDribblingCategory5=3;
        if (creativity==="high"){
            tacticalWeightDribblingCategory1-=0.2;
            tacticalWeightDribblingCategory2-=0.2;
            tacticalWeightDribblingCategory3-=0.2;
            tacticalWeightDribblingCategory4-=0.2;
            tacticalWeightDribblingCategory5-=0.2; 
        }
        else if (creativity==="low"){
            tacticalWeightDribblingCategory1+=0.2;
            tacticalWeightDribblingCategory2+=0.2;
            tacticalWeightDribblingCategory3+=0.2;
            tacticalWeightDribblingCategory4+=0.2;
            tacticalWeightDribblingCategory5+=0.2;
        }
    }

    if (idea==="possession"){
        tacticalWeightPassingCategory1=1;
        tacticalWeightPassingCategory2=1.5;
        tacticalWeightPassingCategory3=2;
        tacticalWeightPassingCategory4=2.5;
        tacticalWeightPassingCategory5=3;
        tacticalWeightPTFL=7;
        tacticalWeightPTSL=3;
        tacticalWeightPTFD=0;
        tacticalWeightPTSD=0;
        if (creativity==="high"){
            tacticalWeightPassingCategory1-=0.2;
            tacticalWeightPassingCategory2-=0.2;
            tacticalWeightPassingCategory3-=0.2;
            tacticalWeightPassingCategory4-=0.2;
            tacticalWeightPassingCategory5-=0.2;
            tacticalWeightPTFL-=1;
            tacticalWeightPTSL-=1;
        }
        else if (creativity==="low"){
            tacticalWeightPassingCategory1+=0.2;
            tacticalWeightPassingCategory2+=0.2;
            tacticalWeightPassingCategory3+=0.2;
            tacticalWeightPassingCategory4+=0.2;
            tacticalWeightPassingCategory5+=0.2;
            tacticalWeightPTFL+=1;
            tacticalWeightPTSL+=1;
        }
    }

    else if (idea==="counter"){
        tacticalWeightPassingCategory1=0;
        tacticalWeightPassingCategory2=0;
        tacticalWeightPassingCategory3=0;
        tacticalWeightPassingCategory4=0;
        tacticalWeightPassingCategory5=0;
        tacticalWeightPTFD=3;
        tacticalWeightPTSD=7;
        tacticalWeightPTFL=0;
        tacticalWeightPTSL=0;
        if (creativity==="high"){
            tacticalWeightPTFD-=1;
            tacticalWeightPTSD-=1;
        }
        else if (creativity==="low"){
            tacticalWeightPTFD+=1;
            tacticalWeightPTSD+=1;
        }

    }

    else if (idea==="balanced"){
        tacticalWeightPassingCategory1=0;
        tacticalWeightPassingCategory2=0;
        tacticalWeightPassingCategory3=0;
        tacticalWeightPassingCategory4=0;
        tacticalWeightPassingCategory5=0;
        tacticalWeightPTFD=0;
        tacticalWeightPTSD=0;
        tacticalWeightPTFL=0;
        tacticalWeightPTSL=0;
    }

    if (creativity==="balanced"){
        explorationRate=0.4;
    }

    else if (creativity==="high"){
        explorationRate=0.5;  
    }
    else if (creativity==="low"){
        explorationRate=0.3;
    }

    // return `${shootMore}_${dribbleMore}_${idea}`;
}

function getCurrentTacticKey(){
    return `${shootMore}_${dribbleMore}_${idea}`;
}


function kickoff(attackingTeam,defendingTeam){

    const striker=handleKickOff(ball, attackingTeam, defendingTeam, horizontalWidth, verticalHeight);
    //checkAndResolveCollisions(reds,blues,ball);
    drawField();
    drawGoals();
    const flattenedRed =flattenTeam(reds);
    const flattenedBlue=flattenTeam(blues);
    flattenedRed.forEach(player=> drawObjects(player,"red"));
    flattenedBlue.forEach(player=> drawObjects(player,"blue"));
    drawObjects(ball, "black");
    const teammates = [...attackingTeam.defenders, ...attackingTeam.midfielders, ...attackingTeam.forwards].filter(item=>item!=striker);
    const opponents = flattenTeam(defendingTeam);
    const choice= "passToFeetLessDirect"; //kickoffs as part of set pieces/ dead ball are out of our in-game Q-table states, so they are handled manually
    const pressLevel = document.querySelector('#pressLevel').value;

    passingState=startPass(ball, striker, teammates, opponents, attackingTeam.attackingGoal, choice, pressLevel);
    passingStatus="inProgress";

}

function goalkick(attackingTeam, defendingTeam){
    const goalkeeper=handleGoalKick(ball, attackingTeam, defendingTeam);
    //checkAndResolveCollisions(reds,blues,ball);
    drawField();
    drawGoals();
    const flattenedRed =flattenTeam(reds);
    const flattenedBlue=flattenTeam(blues);
    flattenedRed.forEach(player=> drawObjects(player,"red"));
    flattenedBlue.forEach(player=> drawObjects(player,"blue"));
    drawObjects(ball, "black");
    const teammates = [...attackingTeam.defenders, ...attackingTeam.midfielders, ...attackingTeam.forwards];
    const opponents = flattenTeam(defendingTeam);
    const choices= ["passToFeetLessDirect", "passToFeetDirect"] //goalkicks as part of set pieces/ dead ball are out of our in-game Q-table states, so they are handled manually
    const choice= choices[Math.floor(Math.random()*choices.length)];
    const pressLevel = document.querySelector('#pressLevel').value;
    const passRadius=5; //goalKick radius is smaller as there is no pressure
    passingState=startPass(ball, goalkeeper, teammates, opponents, attackingTeam.attackingGoal, choice, pressLevel, passRadius);
    passingStatus="inProgress";

}

function throwin(attackingTeam, defendingTeam){
    const throwInPlayer=handleThrowIn(ball, attackingTeam, defendingTeam, horizontalWidth, verticalHeight);
    //checkAndResolveCollisions(reds,blues,ball);
    drawField();
    drawGoals();
    const flattenedRed =flattenTeam(reds);
    const flattenedBlue=flattenTeam(blues);
    flattenedRed.forEach(player=> drawObjects(player,"red"));
    flattenedBlue.forEach(player=> drawObjects(player,"blue"));
    drawObjects(ball, "black");
    const teammates = [...attackingTeam.defenders, ...attackingTeam.midfielders, ...attackingTeam.forwards].filter(item=>item!=throwInPlayer);
    const opponents = flattenTeam(defendingTeam);
    const choice= "passToFeetLessDirect"; //throwins as part of set pieces/dead ball are out of our in-game Q-table states, so they are handled manually
    const pressLevel = document.querySelector('#pressLevel').value;
    //console.log("lolo");
    passingState=startPass(ball, throwInPlayer, teammates, opponents, attackingTeam.attackingGoal, choice, pressLevel);
    passingStatus="inProgress";
}

function foul(attackingTeam, defendingTeam){
    const goal=attackingTeam.attackingGoal;
    const returned=handleFoul(ball, attackingTeam, defendingTeam, goal);
    const taker=returned.taker;
    const status=returned.status;
    //console.log(status);
    //checkAndResolveCollisions(reds,blues,ball);
    drawField();
    drawGoals();
    const flattenedRed =flattenTeam(reds);
    const flattenedBlue=flattenTeam(blues);
    flattenedRed.forEach(player=> drawObjects(player,"red"));
    flattenedBlue.forEach(player=> drawObjects(player,"blue"));
    drawObjects(ball, "black");
    const opponents = flattenTeam(defendingTeam);
    const goalkeeper=defendingTeam.goalkeeper;
    const defenders=opponents.filter(item=>item!=goalkeeper);
    const pressLevel = document.querySelector('#pressLevel').value;
    const teammates = [...attackingTeam.defenders, ...attackingTeam.midfielders, ...attackingTeam.forwards].filter(item=>item!=taker);
    const choice= "passToFeetLessDirect"; 

    if (status=="penalty"){
        //console.log("penalty happened");
        shootingState=startShoot(ball, taker, defenders, goalkeeper, goal, pressLevel);
        shootingStatus="inProgress";     
    }
    else if (status=="freekick"){
        //console.log("freekick happened");
        const rand=Math.random();
        if (rand<=5){
            shootingState=startShoot(ball, taker, defenders, goalkeeper, goal, pressLevel);
            shootingStatus="inProgress";     
        }
        else{
            passingState=startPass(ball, taker, teammates, opponents, goal, choice, pressLevel);
            passingStatus="inProgress";
        }
    }
    else{
        //console.log("normal pass");
        passingState=startPass(ball, taker, teammates, opponents, goal, choice, pressLevel);
        passingStatus="inProgress";
    }
}



function handleTackle(playerLostBall, playerTackledBall, ball) {
    // Calculate the vector from playerLostBall to playerTackledBall
    const dx = playerTackledBall.x - playerLostBall.x;
    const dy = playerTackledBall.y - playerLostBall.y;

    // Calculate the magnitude of the vector
    const magnitude = Math.sqrt(dx ** 2 + dy ** 2);

    // Check for zero magnitude (both players are at the same position)
    if (magnitude === 0) {
        console.warn("Both players are at the same position. Ball cannot be moved in a specific direction.");
        return; // No movement is made
    }

    // Normalize the vector
    const unitX = dx / magnitude;
    const unitY = dy / magnitude;

    // Calculate the offset distance
    const offset = playerLostBall.radius + playerTackledBall.radius * 2;

    // Update ball's position
    ball.x = playerLostBall.x + unitX * offset;
    ball.y = playerLostBall.y + unitY * offset;

}



async function updateSimulation(){
    // console.log(redsQTableFirstLayer);
    // console.log(bluesQTableSecondLayer);
    // console.log(redsQTableSecondLayer);
    // console.log(bluesQTableSecondLayer);
    document.getElementById("yourScore").textContent = `Your(reds) Score: ${score.you}`;
    document.getElementById("computerScore").textContent = `Computer(blues) Score: ${score.computer}`;

    ctx.clearRect(-10, -10, canvas.width, canvas.height);
    checkTactics();
    const potentialNewKey=getCurrentTacticKey()
    if (currentTacticKey!=potentialNewKey){
        // while (saving){
        //     console.log("still saving");
        // }
        currentTacticKey=potentialNewKey;
        console.log(currentTacticKey);
        await safeLoad();
        // redsQTableFirstLayer= await getQTableFirstLayer(currentTacticKey);
        // redsQTableSecondLayer= await getQTableSecondLayer(currentTacticKey);
    }
    
    else if (kickoffCondition==true){
        kickoff(teamInPossession, teamOutOfPossession);
        kickoffCondition=false;
        
    }
    else if (goalkickCondition==true){
        goalkick(teamInPossession,teamOutOfPossession);
        goalkickCondition=false;
        
    }

    else if (throwinCondition==true){
        throwin(teamInPossession,teamOutOfPossession);
        throwinCondition=false;
        
    }

    else if (shootingStatus==="inProgress"){
        const shootingOutcome=updateShoot(shootingState);
        shootingStatus=shootingOutcome.status;
        shootingState=shootingOutcome.state;
    }
    else if (shootingStatus==="intercepted"){
        if (teamInPossession==reds){ //if reds had the ball but now it is intercepted
            teamInPossession=blues; //change the team who has the ball for later
            teamOutOfPossession=reds;
            //find the next state. For the interception, we do not need next state
            //to update our current state because interception makes the current state terminal
            //meaning that the team lost the ball, so we do not have a next state for that team
            //however, we still need to get the next state for the team who just intercepted the ball
            //to make it current state after updating the actual current state
            //for successfull actions, next state would also affect updated Q-value for the current state
            //because our Q-learning formula takes further potential successfull and unsuccessfull actions
            //into account as well to reflect a real life football where actions would lead other actions
            //as long the team still has the ball. You can refer to the updateQTableFirstLayer function
            //for further details.
            const interceptingPlayer=findClosestPlayerToBall([...blues.defenders, ...blues.midfielders, ...blues.forwards],ball);
            const teammates=flattenTeam(blues).filter(player=>player!=interceptingPlayer);
            const opponents=flattenTeam(reds);
            nextState=getPlayerState(interceptingPlayer,blues.attackingGoal, teammates,opponents);
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            
            if (currentState!=null){
                //current state is still the state whose decision was to shoot before this interception; 
                //we need to update this state's values before moving on as interception means failure of the action
                const category=currentState.shootingScore; //get the current state's shooting category based on shooting score
                let tacticalWeight;
                let rewardWeight;
                if (category==1){ //if the category was 1, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightShootingCategory1;
                    rewardWeight=failure1; //because failure was already more expected from category 1, do not over punish.
                }
                else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightShootingCategory2;
                    rewardWeight=failure2; //because failure was already more expected from category 1, do not over punish.
                }
                else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightShootingCategory3;
                    rewardWeight=failure3; //because failure was already more expected from category 1, do not over punish.
                }
                else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightShootingCategory4;
                    rewardWeight=failure4; //because failure was already more expected from category 1, do not over punish.
                }
                else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightShootingCategory5;
                    rewardWeight=failure5; //because failure was already more expected from category 1, do not over punish.
                }
                // else{ //if the category was 2, get the correct tactical and failure weights
                //     tacticalWeight=tacticalWeightShootingCategory2;
                //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
                // }
                const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
                updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);              
            }
            else{

            }

        }
        else{
            teamInPossession=reds;
            teamOutOfPossession=blues;
            const interceptingPlayer=findClosestPlayerToBall([...reds.defenders, ...reds.midfielders, ...reds.forwards],ball);
            const teammates=flattenTeam(reds).filter(player=>player!=interceptingPlayer);
            const opponents=flattenTeam(blues);
            nextState=getPlayerState(interceptingPlayer, reds.attackingGoal, teammates,opponents);
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            if (currentState!=null){

                const category=currentState.shootingScore;
                let tacticalWeight=0; //computer tactics are balanced
                let rewardWeight;
                if (category==1){
                    rewardWeight=failure1; //because failure was already more expected from category 1, punish less
                }
                else if (category==2){
                    rewardWeight=failure2; //because failure was already more expected from category 2, punish less
                }
                else if (category==3){
                    rewardWeight=failure3; //because failure was average expected from category 3, punish average
                }
                else if (category==4){
                    rewardWeight=failure4; //because failure was less expected from category 4, punish more
                }
                else if (category==5){
                    rewardWeight=failure5; //because failure was less expected from category 5, punish more
                }
                // else{
                //     tacticalWeight=0; //computer tactics are balanced
                //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
                // }
                const reward= tacticalWeight+rewardWeight;
                updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);        
            }

        }
        currentState=nextState;
        shootingStatus="noShooting";
    }

    else if (shootingStatus==="saved"){
        if (teamInPossession==reds){         
            teamInPossession=blues; //change the team who has the ball for later
            teamOutOfPossession=reds;
            //find the next state. For the saves, we do not need next state
            //to update our current state because a save makes the current state terminal
            //meaning that the team lost the ball, so we do not have a next state for that team
            //however, we still need to get the next state for the team who just intercepted the ball
            //to make it current state after updating the actual current state
            //for successfull actions, however, next state would also affect updated Q-value for the current state
            //because our Q-learning formula takes further potential successfull and unsuccessfull actions
            //into account as well to reflect a real life football where actions would lead other actions
            //as long the team still has the ball. You can refer to the updateQTableFirstLayer function
            //for further details.
            const goalkeeper=blues.goalkeeper;
            const teammates=flattenTeam(blues).filter(player=>player!=goalkeeper);
            const opponents=flattenTeam(reds);
            nextState=getPlayerState(goalkeeper,blues.attackingGoal, teammates,opponents);
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore.      
            if (currentState!=null){
                //current state is still the state whose decision was to shoot before this interception; 
                //we need to update this state's values before moving on as save means partial success of the action because at least your shot reachedon target
                const category=currentState.shootingScore; //get the current state's shooting category based on shooting score
                let tacticalWeight;
                let rewardWeight;
                if (category==1){ //if the category was 1, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightShootingCategory1;
                    rewardWeight=success1; //because success was less expected from category 1, reward more
                }
                else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightShootingCategory2;
                    rewardWeight=success2; //because success was less expected from category 2, reward more
                }
                else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightShootingCategory3;
                    rewardWeight=success3; //because success was average expected from category 3, reward average
                }
                else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightShootingCategory4;
                    rewardWeight=success4; //because success was more expected from category 4, reward less
                }
                else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightShootingCategory5;
                    rewardWeight=success5; //because success was more expected from category 5, reward less
                }
                // else{ //if the category was 2, get the correct tactical and failure weights
                //     tacticalWeight=tacticalWeightShootingCategory2;
                //     rewardWeight=lowRewardSuccess; //because success was already more expected from category 2, reward less
                // }
                const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value

                updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate); 
            }
            else{

            }
        }
        else{
            teamInPossession=reds;
            teamOutOfPossession=blues;
            const goalkeeper=reds.goalkeeper;
            const teammates=flattenTeam(reds).filter(player=>player!=goalkeeper);
            const opponents=flattenTeam(blues);
            nextState=getPlayerState(goalkeeper,reds.attackingGoal, teammates,opponents);
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 

            if (currentState!=null){

                //current state is still the state whose decision was to shoot before this interception; 
                //we need to update this state's values before moving on as save means partial success of the action because at least your shot reachedon target
                const category=currentState.shootingScore; //get the current state's shooting category based on shooting score
                let tacticalWeight=0; //computer tactics are balanced
                let rewardWeight;
                if (category==1){ //if the category was 1, get the correct tactical and failure weights
                    //tacticalWeight=0; //computer tactics are balanced
                    rewardWeight=success1; //because success was less expected from category 1, reward more
                }
                else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                    //tacticalWeight=0; //computer tactics are balanced
                    rewardWeight=success2; //because success was less expected from category 2, reward more
                }
                else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                    //tacticalWeight=0; //computer tactics are balanced
                    rewardWeight=success3; //because success was average expected from category 3, reward average
                }
                else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                    //tacticalWeight=0; //computer tactics are balanced
                    rewardWeight=success4; //because success was less expected from category 4, reward less
                }
                else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                    //tacticalWeight=0; //computer tactics are balanced
                    rewardWeight=success5; //because success was more expected from category 5, reward less
                }
                // else{ //if the category was 2, get the correct tactical and failure weights
                //     //tacticalWeight=0; //computer tactics are balanced
                //     rewardWeight=lowRewardSuccess; //because success was already more expected from category 2, reward less
                // }
                const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
                //update the Q-table for blues who just completed their action and lost the ball
                updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate); 

            }

            
        }
        currentState=nextState; //get the new state for reds who now has the ball to make a decision based on their own Q-Table
        
        shootingStatus="noShooting"; //update shooting status to know that there is no more shooting going on.
    }
    else if (shootingStatus==="goal"){
        if (teamInPossession==reds){
            teamInPossession=blues;
            teamOutOfPossession=reds;
            //current state is still the state whose decision was to shoot before this interception; 
            //we need to update this state's values before moving on as goal means success of the action
            const category=currentState.shootingScore; //get the current state's shooting category based on shooting score
            let tacticalWeight;
            let rewardWeight;
            if (category==1){ //if the category was 1, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightShootingCategory1;
                rewardWeight=goalreward1; //because success was less expected from category 1, reward more
            }
            else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightShootingCategory2;
                rewardWeight=goalreward2; //because success was less expected from category 2, reward more
            }
            else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightShootingCategory3;
                rewardWeight=goalreward3; //because success was average expected from category 3, reward average
            }
            else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightShootingCategory4;
                rewardWeight=goalreward4; //because success was more expected from category 4, reward less
            }
            else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightShootingCategory5;
                rewardWeight=goalreward5; //because success was more expected from category 5, reward less
            }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     tacticalWeight=tacticalWeightShootingCategory2;
            //     rewardWeight=lowGoalRewardSuccess; //because success was already more expected from category 2, reward less
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            //this time, we do not even need to find next state, because next state is kickoff, a deadball
            //deadballs are not handled within the scope of Q-Table states
            nextState=null;
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            //update the Q-table for reds who just completed their action and scored the goal
            updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate); 
            score.you+=1;
            currentState=null; //deadball, later to be updated based on the passing of the ball after deadball
        }
        else{
            teamInPossession=reds;
            teamOutOfPossession=blues;
            //current state is still the state whose decision was to shoot before this interception; 
            //we need to update this state's values before moving on as goal means success of the action
            const category=currentState.shootingScore; //get the current state's shooting category based on shooting score
            let tacticalWeight=0; //computer tactics are balanced
            let rewardWeight;
            if (category==1){ //if the category was 1, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=goalreward1; //because success was less expected from category 1, reward more
            }
            else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=goalreward2; //because success was less expected from category 2, reward more
            }
            else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=goalreward3; //because success was average expected from category 3, reward average
            }
            else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=goalreward4; //because success was more expected from category 4, reward less
            }
            else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=goalreward5; //because success was more expected from category 5, reward less
            }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     //tacticalWeight=0; //computer tactics are balanced
            //     rewardWeight=lowGoalRewardSuccess; //because success was already more expected from category 2, reward less
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            //this time, we do not even need to find next state, because next state is kickoff, a deadball
            //deadballs are not handled within the scope of Q-Table states
            nextState=null;
            const isTerminal=true; //the currentState we will be updating the action that ended up as a goal which results in change in possession of the ball; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            //update the Q-table for blues who just completed their action and scored the goal
            updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate); 
            score.computer+=1;
            currentState=null; //deadball, later to be updated based on the passing of the ball after deadball
        }
        kickoffCondition=true;
        shootingStatus="noShooting";
    }
    else if (shootingStatus==="outOfBounds"){
        
        if (teamInPossession==reds){
            teamInPossession=blues; //change the possession as it will be a goalkick
            teamOutOfPossession=reds;
            //current state is still the state whose decision was to shoot before this interception; 
            //we need to update this state's values before moving on as outOfBounds means failure of the action
            const category=currentState.shootingScore; //get the current state's shooting category based on shooting score
            let tacticalWeight;
            let rewardWeight;
            if (category==1){ //if the category was 1, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightShootingCategory1;
                rewardWeight=failure1; //because failure was already more expected from category 1, punish less
            }
            else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightShootingCategory2;
                rewardWeight=failure2; //because failure was already more expected from category 2, punish less
            }
            else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightShootingCategory3;
                rewardWeight=failure3; //because failure was average expected from category 3, punish average
            }
            else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightShootingCategory4;
                rewardWeight=failure4; //because failure was less expected from category 4, punish more
            }
            else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightShootingCategory5;
                rewardWeight=failure5; //because failure was less expected from category 5, punish more
            }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     tacticalWeight=tacticalWeightShootingCategory2;
            //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            //this time, we do not even need to find next state, because next state is goalkick, a deadball
            //deadballs are not handled within the scope of Q-Table states
            nextState=null;
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            //update the Q-table for reds who just completed their action and could not find the goal
            updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate); 
            currentState=null; //deadball, later to be updated based on the passing of the ball after deadball
        }
        else{

            teamInPossession=reds; //change the possession as it will be a goalkick
            teamOutOfPossession=blues;
            //current state is still the state whose decision was to shoot before this interception; 
            //we need to update this state's values before moving on as outOfBounds means failure of the action
            const category=currentState.shootingScore; //get the current state's shooting category based on shooting score
            let tacticalWeight=0; //computer tactics are balanced
            let rewardWeight;
            if (category==1){ //if the category was 1, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=failure1; //because failure was already more expected from category 1, punish less
            }
            else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=failure2; //because failure was already more expected from category 2, punish less
            }
            else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=failure3; //because failure was average expected from category 3, punish average
            }
            else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=failure4; //because failure was less expected from category 4, punish more
            }
            else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=failure5; //because failure was already less expected from category 5, punish more
            }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     //tacticalWeight=0; //computer tactics are balanced
            //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            //this time, we do not even need to find next state, because next state is goalkick, a deadball
            //deadballs are not handled within the scope of Q-Table states
            nextState=null;
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            //update the Q-table for blues who just completed their action and could not find the goal
            updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate); 
            currentState=null; //deadball, later to be updated based on the passing of the ball after deadball
        }
        goalkickCondition=true;
        
        shootingStatus="noShooting";
    }
    else if (dribblingStatus==="inProgress"){
        
        const dribblingOutcome=updateDribble(dribblingState, horizontalWidth, verticalHeight);
        dribblingStatus=dribblingOutcome.status;
        dribblingState=dribblingOutcome.state;
    }

    else if (dribblingStatus==="foul"){
        foul(teamInPossession,teamOutOfPossession);
        dribblingStatus="noDribbling";
    }


    else if (dribblingStatus==="ball lost"){
        
        if (teamInPossession==reds){
            teamInPossession=blues;
            teamOutOfPossession=reds;
            const interceptingPlayer=findClosestPlayerToBall([...blues.defenders, ...blues.midfielders, ...blues.forwards],ball);
            const playerWhoLostBall=findClosestPlayerToBall([...reds.defenders, ...reds.midfielders, ...reds.forwards],ball);
            handleTackle(playerWhoLostBall,interceptingPlayer,ball);
            //current state is still the state whose decision was to shoot before this interception; 
            //we need to update this current state's values before moving on as "ball lost" means failure of the action
            const category=currentState.dribblingScore; //get the current state's dribbling category based on dribbling score
            let tacticalWeight;
            let rewardWeight;
            if (category==1){ //if the category was 1, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightDribblingCategory1;
                rewardWeight=failure1; //because failure was already more expected from category 1, punish less.
            }
            else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightDribblingCategory2;
                rewardWeight=failure2; //because failure was already more expected from category 2, punish less.
            }
            else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightDribblingCategory3;
                rewardWeight=failure3; //because failure was average expected from category 3, punish average.
            }
            else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightDribblingCategory4;
                rewardWeight=failure4; //because failure was already less expected from category 4, punish more.
            }
            else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightDribblingCategory5;
                rewardWeight=failure5; //because failure was less expected from category 5, punish more.
            }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     tacticalWeight=tacticalWeightDribblingCategory2;
            //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            //find the next state. For the "ball lost", we do not need next state
            //to update our current state because "ball lost" makes the current state terminal
            //meaning that the team lost the ball, so we do not have a next state for that team
            //however, we still need to get the next state for the team who just intercepted the ball
            //to make it current state after updating the actual current state
            //for successfull actions, however, next state would also affect updated Q-value for the current state
            //because our Q-learning formula takes further potential successfull and unsuccessfull actions
            //into account as well to reflect a real life football where actions would lead other actions
            //as long the team still has the ball. You can refer to the updateQTableFirstLayer function
            //for further details.
            const teammates=flattenTeam(blues).filter(player=>player!=interceptingPlayer);
            const opponents=flattenTeam(reds);
            nextState=getPlayerState(interceptingPlayer,blues.attackingGoal, teammates,opponents);
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);
            currentState=nextState;
        }
        else{
            teamInPossession=reds;
            teamOutOfPossession=blues;
            const interceptingPlayer=findClosestPlayerToBall([...reds.defenders, ...reds.midfielders, ...reds.forwards],ball);
            const playerWhoLostBall=findClosestPlayerToBall([...blues.defenders, ...blues.midfielders, ...blues.forwards],ball);
            handleTackle(playerWhoLostBall,interceptingPlayer,ball);
            //current state is still the state whose decision was to shoot before this interception; 
            //we need to update this current state's values before moving on as "ball lost" means failure of the action
            const category=currentState.dribblingScore; //get the current state's dribbling category based on dribbling score
            let tacticalWeight=0; //computer tactics are balanced
            let rewardWeight;
            if (category==1){ //if the category was 1, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=failure1; //because failure was already more expected from category 1, punish less.
            }
            else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=failure2; //because failure was already more expected from category 2, punish less.
            }
            else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=failure3; //because failure was average expected from category 3, punish average.
            }
            else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=failure4; //because failure was less expected from category 4, punish more.
            }
            else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                //tacticalWeight=0; //computer tactics are balanced
                rewardWeight=failure5; //because failure was less expected from category 5, punish more.
            }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     //tacticalWeight=0; //computer tactics are balanced
            //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            //find the next state. For the "ball lost", we do not need next state
            //to update our current state because "ball lost" makes the current state terminal
            //meaning that the team lost the ball, so we do not have a next state for that team
            //however, we still need to get the next state for the team who just intercepted the ball
            //to make it current state after updating the actual current state
            //for successfull actions, however, next state would also affect updated Q-value for the current state
            //because our Q-learning formula takes further potential successfull and unsuccessfull actions
            //into account as well to reflect a real life football where actions would lead other actions
            //as long the team still has the ball. You can refer to the updateQTableFirstLayer function
            //for further details.
            const teammates=flattenTeam(reds).filter(player=>player!=interceptingPlayer);
            const opponents=flattenTeam(blues);
            nextState=getPlayerState(interceptingPlayer,reds.attackingGoal, teammates,opponents);
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);
            currentState=nextState;
        }
        dribblingStatus="noDribbling";
    }
    else if (dribblingStatus==="goal"){ //edge case when dribbling decision ended up as a goal, so the player scored by dribbling
        if (teamInPossession==reds){
            teamInPossession=blues;
            teamOutOfPossession=reds;
            //current state is still the state whose decision was to dribble before this goal; 
            //we need to update this state's values before moving on as goal means success of the action
            const category=currentState.dribblingScore; //get the current state's shooting category based on shooting score
            let tacticalWeight;
            let rewardWeight=goalreward5; //edge case
            if (category==1){ //if the category was 1, get the correct tactical and success/failure weights
                tacticalWeight=tacticalWeightDribblingCategory1;
                //rewardWeight=goalreward1; //because success was less expected from category 1, reward more
            }
            else if (category==2){ //if the category was 2, get the correct tactical and success/failure weights
                tacticalWeight=tacticalWeightDribblingCategory2;
                //rewardWeight=goalreward2; //because success was less expected from category 2, reward more
            }
            else if (category==3){ //if the category was 3, get the correct tactical and success/failure weights
                tacticalWeight=tacticalWeightDribblingCategory3;
                //rewardWeight=goalreward3; //because success was average expected from category 3, reward average
            }
            else if (category==4){ //if the category was 4, get the correct tactical and success/failure weights
                tacticalWeight=tacticalWeightDribblingCategory4;
                //rewardWeight=goalreward4; //because success was more expected from category 4, reward less
            }
            else if (category==5){ //if the category was 5, get the correct tactical and success/failure weights
                tacticalWeight=tacticalWeightDribblingCategory5;
                //rewardWeight=goalreward5; //because success was more expected from category 5, reward less
            }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     tacticalWeight=tacticalWeightDribblingCategory2;
            //     rewardWeight=lowGoalRewardSuccess; //because success was already more expected from category 2, reward less
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            //this time, we do not even need to find next state, because next state is kickoff, a deadball
            //deadballs are not handled within the scope of Q-Table states
            nextState=null;
            const isTerminal=true; //the currentState we will be updating ended up as possession loss as the other team will start the game; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            //update the Q-table for reds who just completed their action and scored the goal
            updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate); 
            currentState=null; //deadball, later to be updated based on the passing of the ball after deadball
            score.you+=1;
        }
        else{
            teamInPossession=reds;
            teamOutOfPossession=blues;
            //current state is still the state whose decision was to dribble before this goal; 
            //we need to update this state's values before moving on as goal means success of the action
            const category=currentState.dribblingScore; //get the current state's shooting category based on shooting score
            let tacticalWeight=0; //computer tactics are balanced
            let rewardWeight=goalreward5; //edge case
            // if (category==1){ //if the category was 1, get the correct tactical and success/failure weights
            //     //tacticalWeight=0; //computer tactics are balanced
            //     rewardWeight=goalreward1; //because success was less expected from category 1, reward more
            // }
            // else if (category==2){ //if the category was 2, get the correct tactical and success/failure weights
            //     //tacticalWeight=0; //computer tactics are balanced
            //     rewardWeight=goalreward2; //because success was less expected from category 2, reward more
            // }
            // else if (category==3){ //if the category was 3, get the correct tactical and success/failure weights
            //     //tacticalWeight=0; //computer tactics are balanced
            //     rewardWeight=goalreward3; //because success was average expected from category 3, reward average
            // }
            // else if (category==4){ //if the category was 4, get the correct tactical and success/failure weights
            //     //tacticalWeight=0; //computer tactics are balanced
            //     rewardWeight=goalreward4; //because success was more expected from category 4, reward less
            // }
            // else if (category==5){ //if the category was 5, get the correct tactical and success/failure weights
            //     //tacticalWeight=0; //computer tactics are balanced
            //     rewardWeight=goalreward5; //because success was more expected from category 5, reward less
            // }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     //tacticalWeight=0; //computer tactics are balanced
            //     rewardWeight=lowGoalRewardSuccess; //because success was already more expected from category 2, reward less
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            //this time, we do not even need to find next state, because next state is kickoff, a deadball
            //deadballs are not handled within the scope of Q-Table states
            nextState=null;
            const isTerminal=true; //the currentState we will be updating ended up as possession loss as the other team will start the game; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            //update the Q-table for blues who just completed their action and scored the goal
            updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate); 
            currentState=null; //deadball, later to be updated based on the passing of the ball after deadball
            score.computer+=1;
        }
        kickoffCondition=true;
        dribblingStatus="noDribbling";
    }
    else if (dribblingStatus==="outOfBounds"){
        //console.log("outofbounds");
        if (teamInPossession==reds){
            teamInPossession=blues;
            teamOutOfPossession=reds;
            const category=currentState.dribblingScore; //get the current state's shooting category based on shooting score
            let tacticalWeight;
            let rewardWeight;
            if (category==1){ //if the category was 1, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightDribblingCategory1;
                rewardWeight=failure1; //because failure was already more expected from category 1, punish less
            }
            else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightDribblingCategory2;
                rewardWeight=failure2; //because failure was already more expected from category 2, punish less
            }
            else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightDribblingCategory3;
                rewardWeight=failure3; //because failure was average expected from category 3, punish average
            }
            else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightDribblingCategory4;
                rewardWeight=failure4; //because failure was less expected from category 4, punish more
            }
            else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightDribblingCategory5;
                rewardWeight=failure5; //because failure was less expected from category 5, punish more
            }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     tacticalWeight=tacticalWeightDribblingCategory2;
            //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            //this time, we do not even need to find next state, because next state is goalkick or throwin, so a deadball
            //deadballs are not handled within the scope of Q-Table states
            nextState=null;
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            //update the Q-table for reds who just completed their action and could not find the goal
            updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate); 
            currentState=null; //deadball, later to be updated based on the passing of the ball after deadball
        }
        else{
            teamInPossession=reds;
            teamOutOfPossession=blues;
            const category=currentState.dribblingScore; //get the current state's shooting category based on shooting score
            let tacticalWeight=0; //comp tactics are balanced
            let rewardWeight;
            if (category==1){ //if the category was 1, get the correct tactical and failure weights
                //tacticalWeight=0; //comp tactics are balanced
                rewardWeight=failure1; //because failure was already more expected from category 1, punish less
            }
            else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                //tacticalWeight=0; //comp tactics are balanced
                rewardWeight=failure2; //because failure was already more expected from category 2, punish less
            }
            else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                //tacticalWeight=0; //comp tactics are balanced
                rewardWeight=failure3; //because failure was average expected from category 3, punish average
            }
            else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                //tacticalWeight=0; //comp tactics are balanced
                rewardWeight=failure4; //because failure was less expected from category 4, punish more
            }
            else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                //tacticalWeight=0; //comp tactics are balanced
                rewardWeight=failure5; //because failure was less expected from category 5, punish more
            }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     //tacticalWeight=0;
            //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            //this time, we do not even need to find next state, because next state is goalkick or throwin, so a deadball
            //deadballs are not handled within the scope of Q-Table states
            nextState=null;
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            //update the Q-table for blues who just completed their action and could not find the goal
            updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate); 
            currentState=null; //deadball, later to be updated based on the passing of the ball after deadball
        }
        if (ball.x<=0 || ball.x>=horizontalWidth){ //if dribbling ended up as a goalkick for the other team
            goalkickCondition=true;
        }
        else{ //else throwin
            //console.log("throwin");
            throwinCondition=true;
        }
        dribblingStatus="noDribbling";

    }
    else if (dribblingStatus==="successful dribbling"){ //if we ended up reaching the intended position
        const category=currentState.dribblingScore; //get the current state's dribbling category based on dribbling score
        let tacticalWeight;
        let rewardWeight;
        let tweightcomputer=0;
        if (category==1){ //if the category was 1, get the correct tactical and failure/success weights
            //tweightcomputer=0;
            tacticalWeight=tacticalWeightDribblingCategory1;
            rewardWeight=success1; //because success was less expected from category 1, reward more
        }
        else if (category==2){ //if the category was 2, get the correct tactical and failure/success weights
            //tweightcomputer=0;
            tacticalWeight=tacticalWeightDribblingCategory2;
            rewardWeight=success2; //because success was less expected from category 2, reward more
        }
        else if (category==3){ //if the category was 3, get the correct tactical and failure/success weights
            //tweightcomputer=0;
            tacticalWeight=tacticalWeightDribblingCategory3;
            rewardWeight=success3; //because success was average expected from category 3, reward average
        }
        else if (category==4){ //if the category was 4, get the correct tactical and failure/success weights
            //tweightcomputer=0;
            tacticalWeight=tacticalWeightDribblingCategory4;
            rewardWeight=success4; //because success was more expected from category 4, reward less
        }
        else if (category==5){ //if the category was 5, get the correct tactical and failure/success weights
            //tweightcomputer=0;
            tacticalWeight=tacticalWeightDribblingCategory5;
            rewardWeight=success5; //because success was more expected from category 5, reward less
        }
        // else{ //if the category was 2, get the correct tactical and failure weights
        //     //tweightcomputer=0;
        //     tacticalWeight=tacticalWeightDribblingCategory2;
        //     rewardWeight=lowRewardSuccess; //because success was already more expected from category 2, reward less
        // }
        const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
        const rewardComputer= tweightcomputer+rewardWeight;
        //find the next state. This time, next state is also important for us to update the current state
        //because the team did not lose the ball, meaning that the current state ended up in a way
        //that can affect future success and failure. We want to consider the possible Q-values in the next state
        //and their weighted average while calculating the update on current state and action so that
        //we can account for chain reaction
        const currentTeam=flattenTeam(teamInPossession);
        const dribbler=findClosestPlayerToBall(currentTeam,ball);
        const teammates=currentTeam.filter(player=>player!=dribbler);
        const opponents=flattenTeam(teamOutOfPossession);

        nextState=getPlayerState(dribbler, teamInPossession.attackingGoal, teammates,opponents);
        const isTerminal=false; //we still have the ball, so we are still in the same Q-Table, meaning that next state's action values will affect current state's success to account for chain reaction
        if (teamInPossession==reds){
            updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);
        }
        else{
            updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, rewardComputer, nextState, isTerminal, learningRate, discountRate, explorationRate);
        }
        currentState=nextState;
        dribblingStatus="noDribbling";
    }


    else if (passingStatus==="inProgress"){
        // console.log("passing bro");
        const passingOutcome=updatePass(passingState, horizontalWidth, verticalHeight);
        passingStatus=passingOutcome.status;
        passingState=passingOutcome.state;

    }
    else if (passingStatus==="intercepted"){
         // console.log("intercepted passing bro");
        if (teamInPossession==reds){ //if reds had the ball but now it is intercepted
            teamInPossession=blues; //change the team who has the ball for later
            teamOutOfPossession=reds;
            const interceptingPlayer=findClosestPlayerToBall([...blues.defenders, ...blues.midfielders, ...blues.forwards],ball);
            const teammates=flattenTeam(blues).filter(player=>player!=interceptingPlayer);
            const opponents=flattenTeam(reds);
            nextState=getPlayerState(interceptingPlayer,blues.attackingGoal, teammates,opponents);
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            if (currentState!=null){

                const category=currentState.passingScore; //get the current state's passing category based on passing score for the first layer
                let tacticalWeight;
                let rewardWeight;
                let tacticalWeightSecondLayer;
                let rewardWeightSecondLayer;
                if (category==1){ //if the category was 1, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightPassingCategory1;
                    rewardWeight=failure1; //because failure was already more expected from category 1, do not over punish.
                }
                else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightPassingCategory2;
                    rewardWeight=failure2; //because failure was already more expected from category 2, do not over punish.
                }
                else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightPassingCategory3;
                    rewardWeight=failure3; //because failure was average expected from category 3, do not over punish.
                }
                else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightPassingCategory4;
                    rewardWeight=failure4; //because failure was less expected from category 4, punish more.
                }
                else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightPassingCategory5;
                    rewardWeight=failure5; //because failure was less expected from category 5, punish more
                }

                // else{ //if the category was 2, get the correct tactical and failure weights
                //     tacticalWeight=tacticalWeightPassingCategory2;
                //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
                // }
                const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
                //find the next state. interception makes the current state terminal, so next state
                //will only be used as a next state; it will not affect updating current state in this case.
                //update q-table of reds who initiated the pass
                updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);
                //update second layer of q-table, the one that is about how to pass:
                if (currentActionSecondLayer==="passToFeetLessDirect"){
                    tacticalWeightSecondLayer=tacticalWeightPTFL;
                    rewardWeightSecondLayer=highRewardFailure; //punish more if less direct pass was unsuccessful;
                }
                else if(currentActionSecondLayer==="passToSpaceLessDirect"){
                    tacticalWeightSecondLayer=tacticalWeightPTSL;
                    rewardWeightSecondLayer=highRewardFailure; //punish more if less direct pass was unsuccessful;
                }
                else if (currentActionSecondLayer==="passToFeetDirect"){
                    tacticalWeightSecondLayer=tacticalWeightPTFD;
                    rewardWeightSecondLayer=lowRewardFailure; //punish less if more direct pass was unsuccessful;
                }
                else if (currentActionSecondLayer==="passToSpaceDirect"){     
                    tacticalWeightSecondLayer=tacticalWeightPTSD;
                    rewardWeightSecondLayer=lowRewardFailure; //punish less if more direct pass was unsuccessful;
                }
                const rewardSecondLayer=tacticalWeightSecondLayer+rewardWeightSecondLayer;
                updateQTableSecondLayer(redsQTableSecondLayer, currentState, currentActionSecondLayer, rewardSecondLayer, learningRate, discountRate, explorationRate);

            }

            else{

            }

        }
        else{
            teamInPossession=reds;
            teamOutOfPossession=blues;
            const interceptingPlayer=findClosestPlayerToBall([...reds.defenders, ...reds.midfielders, ...reds.forwards],ball);
            const teammates=flattenTeam(reds).filter(player=>player!=interceptingPlayer);
            const opponents=flattenTeam(blues);
            nextState=getPlayerState(interceptingPlayer, reds.attackingGoal, teammates,opponents);
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
         
            if (currentState!=null){

                const category=currentState.passingScore; //get the current state's passing category based on passing score for the first layer
                let tacticalWeight=0; //computer
                let rewardWeight;
                let tacticalWeightSecondLayer=0; //computer
                let rewardWeightSecondLayer;
                if (category==1){ //if the category was 1, get the correct tactical and failure weights
                    //tacticalWeight=0;
                    rewardWeight=failure1; //because failure was already more expected from category 1, do not over punish.
                }
                else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                    //tacticalWeight=0;
                    rewardWeight=failure2; //because failure was already more expected from category 2, do not over punish.
                }
                else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                    //tacticalWeight=0;
                    rewardWeight=failure3; //because failure was average expected from category 3, do not over punish.
                }
                else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                    //tacticalWeight=0;
                    rewardWeight=failure4; //because failure was less expected from category 4, punish more.
                }
                else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                    //tacticalWeight=0;
                    rewardWeight=failure5; //because failure was less expected from category 5, punish more
                }
                // else{ //if the category was 2, get the correct tactical and failure weights
                //     tacticalWeight=0;
                //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
                // }
                const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
                //find the next state. interception makes the current state terminal, so next state
                //will only be used as a next state; it will not affect updating current state in this case.

                //update q-table of reds who initiated the pass
                updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);
                //update second layer of q-table, the one that is about how to pass:
                if (currentActionSecondLayer==="passToFeetLessDirect"){
                    //tacticalWeightSecondLayer=0;
                    rewardWeightSecondLayer=highRewardFailure; //punish more if less direct pass was unsuccessful;
                }
                else if(currentActionSecondLayer==="passToSpaceLessDirect"){
                    //tacticalWeightSecondLayer=0;
                    rewardWeightSecondLayer=highRewardFailure; //punish more if less direct pass was unsuccessful;
                }
                else if (currentActionSecondLayer==="passToFeetDirect"){
                    //tacticalWeightSecondLayer=0;
                    rewardWeightSecondLayer=lowRewardFailure; //punish less if more direct pass was unsuccessful;
                }
                else if (currentActionSecondLayer==="passToSpaceDirect"){     
                    //tacticalWeightSecondLayer=0;
                    rewardWeightSecondLayer=lowRewardFailure; //punish less if more direct pass was unsuccessful;
                }
                const rewardSecondLayer=tacticalWeightSecondLayer+rewardWeightSecondLayer;
                updateQTableSecondLayer(bluesQTableSecondLayer, currentState, currentActionSecondLayer, rewardSecondLayer, learningRate, discountRate, explorationRate);

            }
            else{

            }


        }
        currentState=nextState;

        passingStatus="noPassing";
    }
    else if (passingStatus==="goal"){ //edge case: pass was made but the ball went in goal
        if (teamInPossession==reds){ //if reds had the ball but now it is intercepted
            teamInPossession=blues; //change the team who has the ball for later
            teamOutOfPossession=reds;
            const category=currentState.passingScore; //get the current state's passing category based on passing score for the first layer
            let tacticalWeight;
            let rewardWeight=goalreward5; //edge case 
            let tacticalWeightSecondLayer;
            let rewardWeightSecondLayer=goalreward5; //edge case
            if (category==1){ //if the category was 1, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightPassingCategory1;
                //rewardWeight=goalreward1; //because success was less expected
            }
            else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightPassingCategory2;
                //rewardWeight=goalreward2; //because success was less expected
            }
            else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightPassingCategory3;
                //rewardWeight=goalreward3; //because success was average expected
            }
            else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightPassingCategory4;
                //rewardWeight=goalreward4; //because success was more expected
            }
            else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                tacticalWeight=tacticalWeightPassingCategory5;
                //rewardWeight=goalreward5; //because success was more expected
            }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     tacticalWeight=tacticalWeightPassingCategory2;
            //     rewardWeight=lowGoalRewardSuccess; //because success was already more expected
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            //no need to find next state as it will be kickoff; handled outside the scope of q-table
            nextState=null;
            const isTerminal=true; //the currentState we will be updating ended up as possession loss as the other team will start with a kickoff; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            //update q-table of reds who initiated the pass
            updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);
            //update second layer of q-table, the one that is about how to pass:
            if (currentActionSecondLayer==="passToFeetLessDirect"){
                tacticalWeightSecondLayer=tacticalWeightPTFL;
                //rewardWeightSecondLayer=lowGoalRewardSuccess; //reward less as it was more expected
            }
            else if(currentActionSecondLayer==="passToSpaceLessDirect"){
                tacticalWeightSecondLayer=tacticalWeightPTSL;
                //rewardWeightSecondLayer=lowGoalRewardSuccess; 
            }
            else if (currentActionSecondLayer==="passToFeetDirect"){
                tacticalWeightSecondLayer=tacticalWeightPTFD;
                //rewardWeightSecondLayer=highGoalRewardSuccess; //reward more as it was less expected
            }
            else if (currentActionSecondLayer==="passToSpaceDirect"){     
                tacticalWeightSecondLayer=tacticalWeightPTSD;
                //rewardWeightSecondLayer=highGoalRewardSuccess; 
            }
            const rewardSecondLayer=tacticalWeightSecondLayer+rewardWeightSecondLayer;
            updateQTableSecondLayer(redsQTableSecondLayer, currentState, currentActionSecondLayer, rewardSecondLayer, learningRate, discountRate, explorationRate);
            currentState=null;
            score.you+=1;
        }
        else{
            teamInPossession=reds;
            teamOutOfPossession=blues;
            const category=currentState.passingScore; //get the current state's passing category based on passing score for the first layer
            let tacticalWeight=0; //computer
            let rewardWeight=goalreward5; //edge case
            let tacticalWeightSecondLayer=0; //computer
            let rewardWeightSecondLayer=goalreward5; //edge case
            // if (category==1){ //if the category was 1, get the correct tactical and failure weights
            //     tacticalWeight=0;
            //     rewardWeight=highGoalRewardSuccess; //reward more for less expected
            // }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     tacticalWeight=0;
            //     rewardWeight=lowGoalRewardSuccess; //rewards less for more expected
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            nextState=null //kickoff
            const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
            //update q-table of reds who initiated the pass
            updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);
            //update second layer of q-table, the one that is about how to pass:
            // if (currentActionSecondLayer==="passToFeetLessDirect"){
            //     tacticalWeightSecondLayer=0;
            //     rewardWeightSecondLayer=lowGoalRewardSuccess; // reward less for more expected
            // }
            // if(currentActionSecondLayer==="passToSpaceLessDirect"){
            //     tacticalWeightSecondLayer=0;
            //     rewardWeightSecondLayer=lowGoalRewardSuccess; 
            // }
            // if (currentActionSecondLayer==="passToFeetDirect"){
            //     tacticalWeightSecondLayer=0;
            //     rewardWeightSecondLayer=highGoalRewardSuccess; 
            // }
            // if (currentActionSecondLayer==="passToSpaceDirect"){     
            //     tacticalWeightSecondLayer=0;
            //     rewardWeightSecondLayer=highGoalRewardSuccess; //reward more for less expected
            // }
            const rewardSecondLayer=tacticalWeightSecondLayer+rewardWeightSecondLayer;
            updateQTableSecondLayer(bluesQTableSecondLayer, currentState, currentActionSecondLayer, rewardSecondLayer, learningRate, discountRate, explorationRate);
            currentState=null;
            score.computer+=1;
        }
        passingStatus="noPassing";
        kickoffCondition=true;
    }
    else if (passingStatus==="outOfBounds"){
        if (teamInPossession==reds){ //if reds had the ball but now it is intercepted
            teamInPossession=blues; //change the team who has the ball for later
            teamOutOfPossession=reds;
            if (currentState!=null){

                const category=currentState.passingScore; //get the current state's passing category based on passing score for the first layer
                let tacticalWeight;
                let rewardWeight;
                let tacticalWeightSecondLayer;
                let rewardWeightSecondLayer;
                if (category==1){ //if the category was 1, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightPassingCategory1;
                    rewardWeight=failure1; //because failure was already more expected 
                }
                else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightPassingCategory2;
                    rewardWeight=failure2; //because failure was already more expected 
                }
                else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightPassingCategory3;
                    rewardWeight=failure3; //because failure was average expected 
                }
                else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightPassingCategory4;
                    rewardWeight=failure4; //because failure was less expected 
                }
                else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                    tacticalWeight=tacticalWeightPassingCategory5;
                    rewardWeight=failure5; //because failure was less expected 
                }
                // else{ //if the category was 2, get the correct tactical and failure weights
                //     tacticalWeight=tacticalWeightPassingCategory2;
                //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
                // }
                const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
                //find the next state. interception makes the current state terminal, so next state
                //will only be used as a next state; it will not affect updating current state in this case.
                nextState=null //goalkick
                const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
                //update q-table of reds who initiated the pass
                updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);
                //update second layer of q-table, the one that is about how to pass:
                if (currentActionSecondLayer==="passToFeetLessDirect"){
                    tacticalWeightSecondLayer=tacticalWeightPTFL;
                    rewardWeightSecondLayer=highRewardFailure; //punish more if less direct pass was unsuccessful;
                }
                else if(currentActionSecondLayer==="passToSpaceLessDirect"){
                    tacticalWeightSecondLayer=tacticalWeightPTSL;
                    rewardWeightSecondLayer=highRewardFailure; //punish more if less direct pass was unsuccessful;
                }
                else if (currentActionSecondLayer==="passToFeetDirect"){
                    tacticalWeightSecondLayer=tacticalWeightPTFD;
                    rewardWeightSecondLayer=lowRewardFailure; //punish less if more direct pass was unsuccessful;
                }
                else if (currentActionSecondLayer==="passToSpaceDirect"){     
                    tacticalWeightSecondLayer=tacticalWeightPTSD;
                    rewardWeightSecondLayer=lowRewardFailure; //punish less if more direct pass was unsuccessful;
                }
                const rewardSecondLayer=tacticalWeightSecondLayer+rewardWeightSecondLayer;
                updateQTableSecondLayer(redsQTableSecondLayer, currentState, currentActionSecondLayer, rewardSecondLayer, learningRate, discountRate, explorationRate);
            }
            else{

            }

        }
        else{
            teamInPossession=reds;
            teamOutOfPossession=blues;
            if (currentState!=null){
                const category=currentState.passingScore; //get the current state's passing category based on passing score for the first layer
                let tacticalWeight=0; //computer
                let rewardWeight;
                let tacticalWeightSecondLayer=0; //computer
                let rewardWeightSecondLayer;
                if (category==1){ //if the category was 1, get the correct tactical and failure weights
                    //tacticalWeight=0;
                    rewardWeight=failure1; //because failure was already more expected 
                }
                else if (category==2){ //if the category was 2, get the correct tactical and failure weights
                    //tacticalWeight=0;
                    rewardWeight=failure2; //because failure was already more expected 
                }
                else if (category==3){ //if the category was 3, get the correct tactical and failure weights
                    //tacticalWeight=0;
                    rewardWeight=failure3; //because failure was average expected 
                }
                else if (category==4){ //if the category was 4, get the correct tactical and failure weights
                    //tacticalWeight=0;
                    rewardWeight=failure4; //because failure was less expected 
                }
                else if (category==5){ //if the category was 5, get the correct tactical and failure weights
                    //tacticalWeight=0;
                    rewardWeight=failure5; //because failure was less expected 
                }
                // else{ //if the category was 2, get the correct tactical and failure weights
                //     tacticalWeight=0;
                //     rewardWeight=highRewardFailure; //because failure was less expected from category 2, punish more
                // }
                const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
                //find the next state. interception makes the current state terminal, so next state
                //will only be used as a next state; it will not affect updating current state in this case.
                nextState=null; //goalkick
                const isTerminal=true; //the currentState we will be updating ended up as possession loss; therefore, we do not need to consider potential future success and failure of the next state because we do not have the ball anymore. 
                //update q-table of reds who initiated the pass
                updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);
                //update second layer of q-table, the one that is about how to pass:
                if (currentActionSecondLayer==="passToFeetLessDirect"){
                    //tacticalWeightSecondLayer=0;
                    rewardWeightSecondLayer=highRewardFailure; //punish more if less direct pass was unsuccessful;
                }
                else if(currentActionSecondLayer==="passToSpaceLessDirect"){
                    //tacticalWeightSecondLayer=0;
                    rewardWeightSecondLayer=highRewardFailure; //punish more if less direct pass was unsuccessful;
                }
                else if (currentActionSecondLayer==="passToFeetDirect"){
                    //tacticalWeightSecondLayer=0;
                    rewardWeightSecondLayer=lowRewardFailure; //punish less if more direct pass was unsuccessful;
                }
                else if (currentActionSecondLayer==="passToSpaceDirect"){     
                    //tacticalWeightSecondLayer=0;
                    rewardWeightSecondLayer=lowRewardFailure; //punish less if more direct pass was unsuccessful;
                }
                const rewardSecondLayer=tacticalWeightSecondLayer+rewardWeightSecondLayer;
                updateQTableSecondLayer(bluesQTableSecondLayer, currentState, currentActionSecondLayer, rewardSecondLayer, learningRate, discountRate, explorationRate);
            }

        }
        currentState=null;
        passingStatus="noPassing";
        if (ball.x<=0 || ball.x>=horizontalWidth){ //if dribbling ended up as a goalkick for the other team
            goalkickCondition=true;
        }
        else{ //else throwin
            throwinCondition=true;
        }
    }
    else if (passingStatus==="completed"){
        const currentTeam=flattenTeam(teamInPossession);
        const newPlayer=findClosestPlayerToBall(currentTeam,ball);
        const teammates=currentTeam.filter(player=>player!=newPlayer);
        const opponents=flattenTeam(teamOutOfPossession);

        nextState=getPlayerState(newPlayer, teamInPossession.attackingGoal, teammates,opponents);
        const isTerminal=false; //we still have the ball, so we are still in the same Q-Table, meaning that next state's action values will affect current state's success to account for chain reaction
            
        if (currentState!=null){

            const category=currentState.passingScore; //get the current state's dribbling category based on dribbling score
            let tacticalWeight;
            let rewardWeight;
            let tweightcomputer=0; //computer
            let tacticalWeightSecondLayer;
            let rewardWeightSecondLayer;
            if (category==1){ //if the category was 1, get the correct tactical and failure/success weights
                //tweightcomputer=0;
                tacticalWeight=tacticalWeightPassingCategory1;
                rewardWeight=success1; //because success was less expected 
            }
            else if (category==2){ //if the category was 2, get the correct tactical and failure/success weights
                //tweightcomputer=0;
                tacticalWeight=tacticalWeightPassingCategory2;
                rewardWeight=success2; //because success was less expected 
            }
            else if (category==3){ //if the category was 3, get the correct tactical and failure/success weights
                //tweightcomputer=0;
                tacticalWeight=tacticalWeightPassingCategory3;
                rewardWeight=success3; //because success was average expected 
            }
            else if (category==4){ //if the category was 4, get the correct tactical and failure/success weights
                //tweightcomputer=0;
                tacticalWeight=tacticalWeightPassingCategory4;
                rewardWeight=success4; //because success was more expected 
            }
            else if (category==5){ //if the category was 5, get the correct tactical and failure/success weights
                //tweightcomputer=0;
                tacticalWeight=tacticalWeightPassingCategory5;
                rewardWeight=success5; //because success was more expected 
            }
            // else{ //if the category was 2, get the correct tactical and failure weights
            //     //tweightcomputer=0
            //     tacticalWeight=tacticalWeightPassingCategory2;
            //     rewardWeight=lowRewardSuccess; //because success was already more expected from category 2, reward less
            // }
            const reward= tacticalWeight+rewardWeight; //total reward to be used in updating Q-value
            const rewardComputer=rewardWeight;
            //find the next state. This time, next state is also important for us to update the current state
            //because the team did not lose the ball, meaning that the current state ended up in a way
            //that can affect future success and failure. We want to consider the possible Q-values in the next state
            //and their weighted average while calculating the update on current state and action so that
            //we can account for chain reaction

            if (currentActionSecondLayer==="passToFeetLessDirect"){ 
                tacticalWeightSecondLayer=tacticalWeightPTFL;
                rewardWeightSecondLayer=lowRewardSuccess; //reward less for more expected
            }
            else if(currentActionSecondLayer==="passToSpaceLessDirect"){
                tacticalWeightSecondLayer=tacticalWeightPTSL;
                rewardWeightSecondLayer=lowRewardSuccess; 
            }
            else if (currentActionSecondLayer==="passToFeetDirect"){
                tacticalWeightSecondLayer=tacticalWeightPTFD;
                rewardWeightSecondLayer=highRewardSuccess; //reward more for less expected
            }
            else if (currentActionSecondLayer==="passToSpaceDirect"){     
                tacticalWeightSecondLayer=tacticalWeightPTSD;
                rewardWeightSecondLayer=highRewardSuccess; 
            }
            const rewardSecondLayer=tacticalWeightSecondLayer+rewardWeightSecondLayer;
            const rewardSecondLayerComputer=rewardWeightSecondLayer;
            if (teamInPossession==reds){
                updateQTableFirstLayer(redsQTableFirstLayer, currentState, currentAction, reward, nextState, isTerminal, learningRate, discountRate, explorationRate);
                updateQTableSecondLayer(redsQTableSecondLayer, currentState, currentActionSecondLayer, rewardSecondLayer, learningRate, discountRate, explorationRate);
            }
            else{
                updateQTableFirstLayer(bluesQTableFirstLayer, currentState, currentAction, rewardComputer, nextState, isTerminal, learningRate, discountRate, explorationRate);
                updateQTableSecondLayer(bluesQTableSecondLayer, currentState, currentActionSecondLayer, rewardSecondLayerComputer, learningRate, discountRate, explorationRate);
            }
            
        }
        currentState=nextState;
        passingStatus="noPassing";

    }
    else if (passingStatus==="noPassing" && shootingStatus==="noShooting" && dribblingStatus==="noDribbling" && decisionTime==true){

        if (teamInPossession==reds){
            const currentTeam=flattenTeam(reds);
            const player=findClosestPlayerToBall(currentTeam,ball);
            const teammates=currentTeam.filter(item=>item!=player);
            const opponents=flattenTeam(blues);
            const opponentsGoalkeeper=blues.goalkeeper;
            const opponentsWithoutGoalkeeper=opponents.filter(item=>item!=opponentsGoalkeeper);
            const attackingDirection=reds.attackingGoal.goalDirection==="positive"? 1:-1;

            currentAction=makeDecisionFirstLayer(currentState, redsQTableFirstLayer, explorationRate);
 
       
            if (currentAction==="pass"){
                currentActionSecondLayer=makeDecisionSecondLayer(currentState, redsQTableSecondLayer, explorationRate);
                passingState=startPass(ball, player, teammates, opponents, reds.attackingGoal, currentActionSecondLayer, pressLevel);
                passingStatus="inProgress";
      
            }
            else if (currentAction==="shoot"){
                shootingState=startShoot(ball, player, opponentsWithoutGoalkeeper, opponentsGoalkeeper, reds.attackingGoal, pressLevel);
                shootingStatus="inProgress";
            }
            else if (currentAction==="dribble"){
                dribblingState=startDribble(player,ball,opponents,reds.attackingGoal, attackingDirection, pressLevel);
                dribblingStatus="inProgress";
            }
            else{

            } 
    

        }
        else{
            //console.log("currentState: " ,currentState);
            const currentTeam=flattenTeam(blues);
            const player=findClosestPlayerToBall(currentTeam,ball);
            const teammates=currentTeam.filter(item=>item!=player);
            const opponents=flattenTeam(reds);
            const opponentsGoalkeeper=reds.goalkeeper;
            const opponentsWithoutGoalkeeper=opponents.filter(item=>item!=opponentsGoalkeeper);
            const attackingDirection=blues.attackingGoal.goalDirection==="positive"? 1:-1;
            currentAction=makeDecisionFirstLayer(currentState, bluesQTableFirstLayer, explorationRate);
            if (currentAction==="pass"){
                currentActionSecondLayer=makeDecisionSecondLayer(currentState, bluesQTableSecondLayer, explorationRate);
                passingState=startPass(ball, player, teammates, opponents, blues.attackingGoal, currentActionSecondLayer, pressLevel);
                passingStatus="inProgress";
            }
            else if (currentAction==="shoot"){
                shootingState=startShoot(ball, player, opponentsWithoutGoalkeeper, opponentsGoalkeeper, blues.attackingGoal, pressLevel);
                shootingStatus="inProgress";
            }
            else if (currentAction==="dribble"){
                dribblingState=startDribble(player,ball,opponents, blues.attackingGoal, attackingDirection, pressLevel);
                dribblingStatus="inProgress";
            }
            else{

            }

        }
        
    }

    const decStatus=inPossessionMovement(teamInPossession, ball, teamInPossession.attackingGoal, mentality, creativity, flattenTeam(teamOutOfPossession));
    decisionTime=decStatus==="decisionTime"?true:false;
    outOfPossessionMovement(teamOutOfPossession, ball, flattenTeam(teamInPossession), teamOutOfPossession.attackingGoal, pressLevel, compactness, creativity);
    //checkAndResolveCollisions(reds,blues,ball);

    drawField();
    drawGoals();
    const flattenedRed =flattenTeam(reds);
    const flattenedBlue=flattenTeam(blues);
    flattenedRed.forEach(player=> drawObjects(player,"red"));
    flattenedBlue.forEach(player=> drawObjects(player,"blue"));
    drawObjects(ball, "black");


    requestAnimationFrame(updateSimulation);
    // const simulation = setInterval(() => {
    //     updateSimulation(); 
    // }, 1000/60);
}

const TrainingInterval = 120000;
const TacticTraining=60000;
// let initialredsQTableFirstLayer=initializeQTableFirstLayer(); //for training purposes
// let initialredsQTableSecondLayer=initializeQTableSecondLayer(); //for training purposes
// let redsQTableFirstLayer=deepClone(initialredsQTableFirstLayer); //for training purposes
// let redsQTableSecondLayer=deepClone(initialredsQTableSecondLayer); //for training purposes



// let redsQTableFirstLayer=initializeQTableFirstLayer(); //for training purposes
// let redsQTableSecondLayer=initializeQTableSecondLayer(); //for training purposes
// let bluesQTableFirstLayer=initializeQTableFirstLayer();
// let bluesQTableSecondLayer=initializeQTableSecondLayer();

let redsQTableFirstLayer;
let redsQTableSecondLayer;
let bluesQTableFirstLayer;
let bluesQTableSecondLayer;
let kickoffCondition;
let goalkickCondition;
let throwinCondition;
const simulationStart = Date.now();


async function startSimulation(){

    checkTactics();
    currentTacticKey=getCurrentTacticKey();
    redsQTableFirstLayer= await getQTableFirstLayer(currentTacticKey);
    redsQTableSecondLayer= await getQTableSecondLayer(currentTacticKey);
    bluesQTableFirstLayer=await getQTableFirstLayer("no_no_balanced");
    bluesQTableSecondLayer=await getQTableSecondLayer("no_no_balanced");
    kickoff(reds,blues);
    teamInPossession=reds;
    teamOutOfPossession=blues;
    kickoffCondition=false;
    goalkickCondition=false;
    throwinCondition=false;
    updateSimulation();
}


let saveInProgress=Promise.resolve();

async function saveQTables() {
    saveInProgress = saveInProgress
        .catch(()=>{})   // swallow errors so the chain continues
        .then(() => saveQTablesForKey(currentTacticKey, redsQTableFirstLayer, redsQTableSecondLayer));
    return saveInProgress;

}

async function safeLoad(){
    await saveInProgress;
    redsQTableFirstLayer= await getQTableFirstLayer(currentTacticKey);
    redsQTableSecondLayer= await getQTableSecondLayer(currentTacticKey);
}

function InfoQTables() {

    const elapsedMs = Date.now() - simulationStart;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    const mins       = Math.floor(elapsedSec / 60);
    const secs       = elapsedSec % 60;
    console.log(`🔄 Q-tables saved at ${new Date().toLocaleTimeString()}`);
    console.log(`⏱️ Time since start: ${mins}m ${secs}s`);

}


const allKeys = [
  'yes_yes_possession',
  'yes_yes_balanced',
  'yes_yes_counter',
  'yes_no_possession',
  'yes_no_balanced',
  'yes_no_counter',
  'no_yes_possession',
  'no_yes_balanced',
  'no_yes_counter',
  'no_no_possession',
  'no_no_balanced',
  'no_no_counter'
];


async function detailedTacticEvaluationWithAdvancedAnalysis() {
  // 1) Load every tactic’s tables into memory
  const map = {};
  for (const key of allKeys) {
    map[key] = {
      first:  await getQTableFirstLayer(key),
      second: await getQTableSecondLayer(key),
    };
  }

  // 2) Initialize accumulators
  const bestCount = allKeys.reduce((o,k)=>(o[k]=0,o),{});
  const byPosition = allKeys.reduce((o,k)=>{
    o[k] = { gk:0, def:0, mid:0, att:0, cgk:0, cdef:0, cmid:0, catt:0 };
    return o;
  },{});
  const byShootCat = allKeys.reduce((o,k)=>{
    o[k] = {
      '0':0,'1':0,'2':0,'3':0,'4':0,'5':0,
      c: { '0':0,'1':0,'2':0,'3':0,'4':0,'5':0 }
    };
    return o;
  },{});
  const byDribbleCat = allKeys.reduce((o,k)=>{
    o[k] = {
      '1':0,'2':0,'3':0,'4':0,'5':0,
      c: { '1':0,'2':0,'3':0,'4':0,'5':0 }
    };
    return o;
  },{});
  const byPassCat = allKeys.reduce((o,k)=>{
    o[k] = {
      '1':0,'2':0,'3':0,'4':0,'5':0,
      c: { '1':0,'2':0,'3':0,'4':0,'5':0 }
    };
    return o;
  },{});

  // 3) Gather states and count total comparisons
  const exampleFirst     = map[allKeys[0]].first;
  const states           = Object.keys(exampleFirst);
  const totalComparisons = states.reduce(
    (sum,s) => sum + Object.keys(exampleFirst[s]).length,
    0
  );

  // 4) Per-state/action loop
  for (const state of states) {
    const [pos, shootCat, dribbleCat, passCat] = state.split('_');
    const actions = Object.keys(exampleFirst[state]);

    for (const action of actions) {
      // 4.a) Denominators only
      for (const t of allKeys) {
        byPosition[t][`c${pos}`]       += 1;
        byShootCat[t].c[shootCat]       += 1;
        byDribbleCat[t].c[dribbleCat]   += 1;
        byPassCat[t].c[passCat]         += 1;
      }

      // 4.b) Find best tactic
      let bestKey = allKeys[0], bestQ = -Infinity;
      for (const t of allKeys) {
        const q = map[t].first[state][action] || 0;
        if (q > bestQ) {
          bestQ   = q;
          bestKey = t;
        }
      }

      // 4.c) Increment numerators (wins)
      bestCount[bestKey]                 += 1;
      byPosition[bestKey][pos]           += 1;
      byShootCat[bestKey][shootCat]      += 1;
      byDribbleCat[bestKey][dribbleCat]  += 1;
      byPassCat[bestKey][passCat]        += 1;
    }
  }

  // 5) Overall win‐rates & best tactic
  const overallWinRates = {};
  for (const t of allKeys) {
    overallWinRates[t] = bestCount[t] / totalComparisons;
  }
  const bestTacticOverall = allKeys.reduce(
    (a,b)=> overallWinRates[a] > overallWinRates[b] ? a : b
  );

  // 6) Win‐rates by position & best
  const positionWinRates = {}, bestByPosition = {};
  for (const posKey of ['gk','def','mid','att']) {
    const rates = {};
    for (const t of allKeys) {
      const denom = byPosition[t][`c${posKey}`] || 1;
      rates[t] = byPosition[t][posKey] / denom;
    }
    positionWinRates[posKey] = rates;
    bestByPosition[posKey]   = allKeys.reduce(
      (a,b)=> rates[a] > rates[b] ? a : b
    );
  }

  // 7) Win‐rates by shooting category & best
  const shootWinRates = {}, bestByShootCat = {};
  for (let sc=0; sc<=5; sc++) {
    const scStr = String(sc), rates = {};
    for (const t of allKeys) {
      const denom = byShootCat[t].c[scStr] || 1;
      rates[t] = byShootCat[t][scStr] / denom;
    }
    shootWinRates[scStr]   = rates;
    bestByShootCat[scStr]  = allKeys.reduce(
      (a,b)=> rates[a] > rates[b] ? a : b
    );
  }

  // 8) By dribbling category
  const dribbleWinRates = {}, bestByDribbleCat = {};
  for (let dc=1; dc<=5; dc++) {
    const dcStr = String(dc), rates = {};
    for (const t of allKeys) {
      const denom = byDribbleCat[t].c[dcStr] || 1;
      rates[t] = byDribbleCat[t][dcStr] / denom;
    }
    dribbleWinRates[dcStr]      = rates;
    bestByDribbleCat[dcStr]     = allKeys.reduce(
      (a,b)=> rates[a] > rates[b] ? a : b
    );
  }

  // 9) By passing category
  const passWinRates = {}, bestByPassCat = {};
  for (let pc=1; pc<=5; pc++) {
    const pcStr = String(pc), rates = {};
    for (const t of allKeys) {
      const denom = byPassCat[t].c[pcStr] || 1;
      rates[t] = byPassCat[t][pcStr] / denom;
    }
    passWinRates[pcStr]      = rates;
    bestByPassCat[pcStr]     = allKeys.reduce(
      (a,b)=> rates[a] > rates[b] ? a : b
    );
  }

  // 10) Return full report
  return {
    totalComparisons,
    bestCount,
    overallWinRates,
    bestTacticOverall,
    byPosition,
    positionWinRates,
    bestByPosition,
    byShootCat,
    shootWinRates,
    bestByShootCat,
    byDribbleCat,
    dribbleWinRates,
    bestByDribbleCat,
    byPassCat,
    passWinRates,
    bestByPassCat
  };
}


async function runTacticEvaluation() {
  try {
    const report = await detailedTacticEvaluationWithAdvancedAnalysis();

    console.log('Overall win‐rates:');
    console.table(report.overallWinRates);
    console.log('Best tactic overall:', report.bestTacticOverall);

    console.log('Win‐rates by position:');
    console.table(report.positionWinRates);
    console.log('Best by position:', report.bestByPosition);

    console.log('Win‐rates by shooting category:');
    console.table(report.shootWinRates);
    console.log('Best by shooting category:', report.bestByShootCat);

    console.log('Win‐rates by dribbling category:');
    console.table(report.dribbleWinRates);
    console.log('Best by dribbling category:', report.bestByDribbleCat);

    console.log('Win‐rates by passing category:');
    console.table(report.passWinRates);
    console.log('Best by passing category:', report.bestByPassCat);
  } catch (err) {
    console.error('Tactic evaluation failed:', err);
  }
}

export async function actionPreferenceEvaluation() {
  const report = {};

  for (const key of allKeys) {
    // 1) Load both layers for this tactic
    const first  = await getQTableFirstLayer(key);
    const second = await getQTableSecondLayer(key);

    // 2) Compute averages in the first layer
    const actionSums1   = {};
    const actionCounts1 = {};
    for (const [state, actions] of Object.entries(first)) {
      for (const [action, q] of Object.entries(actions)) {
        actionSums1[action]   = (actionSums1[action]   || 0) + q;
        actionCounts1[action] = (actionCounts1[action] || 0) + 1;
      }
    }
    const averages1 = {};
    for (const action of Object.keys(actionSums1)) {
      averages1[action] = actionSums1[action] / actionCounts1[action];
    }
    const bestAction1 = Object.entries(averages1)
      .reduce((best, [act, avg]) =>
        avg > best[1] ? [act, avg] : best,
        [null, -Infinity]
      )[0];

    // 3) Compute averages in the second layer
    const actionSums2   = {};
    const actionCounts2 = {};
    for (const [state, actions] of Object.entries(second)) {
      for (const [action, q] of Object.entries(actions)) {
        actionSums2[action]   = (actionSums2[action]   || 0) + q;
        actionCounts2[action] = (actionCounts2[action] || 0) + 1;
      }
    }
    const averages2 = {};
    for (const action of Object.keys(actionSums2)) {
      averages2[action] = actionSums2[action] / actionCounts2[action];
    }
    const bestAction2 = Object.entries(averages2)
      .reduce((best, [act, avg]) =>
        avg > best[1] ? [act, avg] : best,
        [null, -Infinity]
      )[0];

    // 4) Assemble into report
    report[key] = {
      firstLayer: {
        averages:  averages1,
        bestAction: bestAction1
      },
      secondLayer: {
        averages:  averages2,
        bestAction: bestAction2
      }
    };
  }

  return report;
}



async function runActionPreferenceReport() {
  try {
    const prefReport = await actionPreferenceEvaluation();

    console.log('=== Action Preference by Tactic ===');
    Object.entries(prefReport).forEach(function(entry) {
      const key  = entry[0];
      const data = entry[1];

      console.log('\nTactic: ' + key);
      console.log(' First Layer averages:');
      console.table(data.firstLayer.averages);
      console.log('  → Best: ' + data.firstLayer.bestAction);

      console.log(' Second Layer averages:');
      console.table(data.secondLayer.averages);
      console.log('  → Best: ' + data.secondLayer.bestAction);
    });
  } catch (err) {
    console.error('Action preference evaluation failed:', err);
  }
}

startSimulation();

// await runTacticEvaluation();

// await runActionPreferenceReport();


setInterval(() => {

    saveQTables()
        .then(()=>console.log('💾 Saved'))
        .catch(err=>console.error('Save failed',err));;
    InfoQTables();

}, TrainingInterval); 


// setInterval(() => {

//     randomizeTactics();

// }, TacticTraining); 








