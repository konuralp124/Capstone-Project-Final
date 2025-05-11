import {
    calculateDistance,
    calculateDistanceFromGoal,
    closestDefenders,
    flattenTeam
} from './getState.mjs';




export function startShoot(ball, player, defenders, goalkeeper, goal, pressLevel, initialSpeedVariable=1, initialSpeedVariableForHighPress=0.7, accelerationRateParameter=0.055, accelerationRateParameterHighPress=0.040, baseDecelerationParameter=0.016, allowedDistance=210) {
    const target = calculateTargetForShooting(goal, player);

    // Randomize the initial speed 
    let initialSpeed = Math.random() + initialSpeedVariable; //inital speed between 1-2

    if (pressLevel==="high"){
        initialSpeed=Math.random() + initialSpeedVariableForHighPress; // less shot power if the team is tired owing to high defensive work.
    }

    // Calculate the shooting distance
    const shootingDistance = calculateDistance(ball, target);

    // Pre-compute unit vector for the direction

    const dx = target.x - ball.x;
    const dy = target.y - ball.y;
    const unitX = dx / shootingDistance;
    const unitY = dy / shootingDistance;
 
    // Calculate acceleration and deceleration rates

    let accelerationRate = accelerationRateParameter; // Speed increase rate
    if (pressLevel==="high"){
        accelerationRate=accelerationRateParameterHighPress;   //decrease shot power if the team is getting more tired defensively owing to high press
    }
    const baseDeceleration = baseDecelerationParameter; // Minimum deceleration for short-range shots
    const maxDeceleration = accelerationRate; // Maximum deceleration rate for long-range shots
    const decelerationRate = baseDeceleration + (maxDeceleration - baseDeceleration) * (shootingDistance / allowedDistance);

    const halfDistance = shootingDistance / 2; // Halfway point for speed adjustments

    // State object to track the progress of the shot
    const state = {
        currentSpeed: initialSpeed,
        traveledDistance: 0,
        ball, 
        target,
        halfDistance,
        accelerationRate,
        decelerationRate,
        defenders,
        goalkeeper,
        goal,
        shootingDistance,
        unitX,
        unitY,
    };

    return state;
}

export function updateShoot(state) {
    // Check if the shot is intercepted, scored, or went to out of bounds

    if (checkInterceptionPassingShooting(state.ball, state.defenders)) {
        //console.log("shoot intercepted");
        return { status: "intercepted", newPosition: { ...state.ball } };
    }

    if (checkSave(state.ball, state.goalkeeper)) {
        return { status: "saved", newPosition: { ...state.ball }};
    }

    if (state.goal.goalDirection==="positive" && state.ball.x >state.goal.xCenter && state.ball.y > state.goal.y1 && state.ball.y < state.goal.y2) {
        return { status: "goal", newPosition: { ...state.ball } };
    } 
    if (state.goal.goalDirection==="negative" && state.ball.x < state.goal.xCenter && state.ball.y > state.goal.y1 && state.ball.y < state.goal.y2) {
        return { status: "goal", newPosition: { ...state.ball } };
    } 

    if (state.traveledDistance >= state.shootingDistance || state.currentSpeed <= 0) { 
        return { status: "outOfBounds", newPosition: { ...state.ball } };    
    }




    // Update ball position
    state.ball.x += state.unitX * state.currentSpeed;
    state.ball.y += state.unitY * state.currentSpeed;

    // Update traveled distance
    state.traveledDistance += state.currentSpeed;

    // Adjust speed
    if (state.traveledDistance < state.halfDistance) {
        state.currentSpeed += state.accelerationRate; // Increase speed before halfway
    } else {
        state.currentSpeed -= state.decelerationRate; // Decrease speed after halfway
    }

    // Prevent speed from going negative
    state.currentSpeed = Math.max(state.currentSpeed, 0);

    // Check for interception

    // Indicate that the shot is still in progress
    return { status: "inProgress", state };
}


export function startDribble(player,ball,opponents,goal, attackingDirection, pressLevel, dribbleSpeedParameter=0.4,dribbleSpeedParameterHighPress=0.3){
    const closestDefender = closestDefenders(1, player, opponents)[0];
    const dribbleDirection = calculateDribbleDirection(player, closestDefender, attackingDirection);
    //const dribbleDirection= {x:0, y:1};
    const dribbleDistance = Math.random() * 18 + 12; // Range: [12, 30]
    let currentDistance=0;
    let dribbleSpeed = dribbleSpeedParameter;
    if (pressLevel==="high"){
        dribbleSpeed=dribbleSpeedParameterHighPress;  //decrease dribble speed if the team is getting more tired defensively
    }
    const state={
        player,
        ball,
        goal,
        opponents,
        dribbleDirection,
        dribbleDistance,
        dribbleSpeed,
        currentDistance,
    };
    return state;
}

export function updateDribble(state, horizontalWidth, verticalHeight){
    if (checkInterception(state.ball, state.opponents)) {
        console.log("dribble intercepted");
        const closestDefender = closestDefenders(1, state.player, state.opponents)[0];
        const foulWeight=getFoulWeight(closestDefender, state.player, state.dribbleDirection)/2;
        const rand1=Math.random();
        const rand2=Math.random();
        //const rand3=Math.random();
        // const rand4=Math.random();
        // const rand5=Math.random();
        if (rand1<=foulWeight && rand2<=foulWeight){
            console.log("foul happened");
            return { status: "foul", newPosition: { ...state.ball } };
        }
        return { status: "ball lost", newPosition: { ...state.ball } };
    }


    if (state.goal.goalDirection==="positive" && state.ball.x > state.goal.xCenter && state.ball.y > state.goal.y1 && state.ball.y < state.goal.y2) {
            return { status: "goal", newPosition: { ...state.ball } };
    } 
    if (state.goal.goalDirection==="negative" && state.ball.x < state.goal.xCenter && state.ball.y > state.goal.y1 && state.ball.y < state.goal.y2) {
            return { status: "goal", newPosition: { ...state.ball } };
    } 

    if (state.ball.x < 0 || state.ball.x > horizontalWidth || state.ball.y < 0 || state.ball.y > verticalHeight) {
        console.log("maybe throwin, ball position:", state.ball.x);
        return { status: "outOfBounds", newPosition: { ...state.ball } };
    }

    if (state.currentDistance>=state.dribbleDistance){
        return { status: "successful dribbling", newPosition: { ...state.ball }};
    }


    state.player.x+= state.dribbleSpeed * state.dribbleDirection.x;
    state.player.y+= state.dribbleSpeed * state.dribbleDirection.y;
    state.ball.x= state.player.x + state.dribbleSpeed * state.dribbleDirection.x
    state.ball.y= state.player.y + state.dribbleSpeed * state.dribbleDirection.y
    state.currentDistance += state.dribbleSpeed;

    return { status: "inProgress", state };
}

export function startPass(ball, passingPlayer, teammates, opponents, goal, choice, pressLevel, passRadius=18, passAccParameter=0.033, passAccParameterHighPress=0.020) {
    let targetPlayer = null;

    // Determine the target player based on the choice
    if (choice === "passToFeetLessDirect" || choice === "passToSpaceLessDirect") {
        targetPlayer = calculateTargetPlayerLessDirect(passingPlayer, teammates, opponents);
    } else if (choice === "passToFeetDirect" || choice === "passToSpaceDirect") {
        targetPlayer = calculateTargetPlayerDirect(passingPlayer, teammates, opponents, goal);
    }

    if (!targetPlayer) {

        return { status: "noTarget", newPosition: { ...ball } };

    }



    // Determine the exact target position based on the choice
    let targetPosition = null;
    if (choice === "passToFeetLessDirect" || choice === "passToFeetDirect") {
        targetPosition = calculateTargetPositionToFeet(passingPlayer, targetPlayer, passRadius);
    } else if (choice === "passToSpaceLessDirect" || choice === "passToSpaceDirect") {
        targetPosition = calculateTargetPositionToSpace(passingPlayer, targetPlayer, goal, passRadius);
    }


    // Randomize acceleration and deceleration constants
    let accelerationRate = Math.random()/20 + passAccParameter; // Randomized between 0.033 and 0.088

    if (pressLevel==="high"){
        accelerationRate= Math.random()/20 + passAccParameterHighPress; //decrease passing speed if the team is getting more tired defensively
    }


    // Calculate the passing distance
    const passingDistance = calculateDistance(ball, targetPosition);

    // Pre-compute unit vector for the direction

    const dx = targetPosition.x - ball.x;
    const dy = targetPosition.y - ball.y;
    const unitX = dx / passingDistance;
    const unitY = dy / passingDistance;

    const halfDistance=passingDistance/2;
    // Initialize the state object
    const state = {
        passingPlayer,
        ball,
        targetPosition,
        accelerationRate,
        decelerationRate: accelerationRate, // Use the same constant for deceleration
        currentSpeed: 0.0000001,
        traveledDistance: 0,
        passingDistance,
        opponents,
        goal,
        halfDistance,
        unitX,
        unitY,
    };

    return state;
}

export function updatePass(state, horizontalWidth, verticalHeight) {
    // Step 1: Check for interception

    if (state.passingPlayer.pos=="gk" && checkInterceptionGoalie(state.ball, state.opponents)){

        return { status: "intercepted", newPosition: { ...state.ball } };

    }

    if (state.passingPlayer.pos!="gk" && checkInterceptionPassingShooting(state.ball, state.opponents)) {
        console.log("pass intercepted");
        return { status: "intercepted", newPosition: { ...state.ball } };
    }


    //Step 2: Check for goal or completed pass
    if (state.goal.goalDirection==="positive" && state.ball.x > state.goal.xCenter && state.ball.y > state.goal.y1 && state.ball.y < state.goal.y2) {
        return { status: "goal", newPosition: { ...state.ball } };
    }

    
    if (state.goal.goalDirection==="negative" && state.ball.x < state.goal.xCenter && state.ball.y > state.goal.y1 && state.ball.y < state.goal.y2) {
        return { status: "goal", newPosition: { ...state.ball } };
    }

    if (state.ball.x < 0 || state.ball.x > horizontalWidth || state.ball.y < 0 || state.ball.y > verticalHeight) {
        return { status: "outOfBounds", newPosition: { ...state.ball } };
    }

    if (state.traveledDistance>=state.passingDistance || state.currentSpeed===0 ){
        return { status: "completed", newPosition: { ...state.ball }};
    }





    // Step 3: Update ball position
    state.ball.x += state.unitX * state.currentSpeed;
    state.ball.y += state.unitY * state.currentSpeed;

    // Step 4: Update traveled distance
    state.traveledDistance += state.currentSpeed;

    if (state.traveledDistance <= state.halfDistance) {
        state.currentSpeed += state.accelerationRate; // Increase speed before halfway
    } else {
        state.currentSpeed -= state.decelerationRate; // Decrease speed after halfway
    }

    // Prevent speed from going negative
    state.currentSpeed = Math.max(state.currentSpeed, 0);

    // Step 6: Indicate that the pass is still in progress
    return { status: "inProgress", state };

}



export function calculateTargetForShooting(goal, shooter, allowedDistance=210){
    const goalRange = { min: 178, max: 222 }; // Goal y-range
    const targetRange = { min: 125, max: 275 }; // Extended target y-range

    const distance = calculateDistanceFromGoal(shooter, goal);

    // Dynamically calculate favorGoal based on distance
    const favorGoal = 1 - (distance / allowedDistance); // Linearly decrease favorGoal as distance increases


    // Ensure favorGoal is clamped between 0 and 1
    const adjustedFavorGoal = Math.max(0, Math.min(favorGoal, 1));

    // Generate random y-coordinate based on favorGoal probability
    const randomFactor = Math.random();
    const targetY = randomFactor < adjustedFavorGoal
        ? Math.random() * (goalRange.max - goalRange.min) + goalRange.min // Goal range
        : Math.random() * (targetRange.max - targetRange.min) + targetRange.min; // Wider range

    return { x: goal.xCenter, y: targetY }; 
}

export function calculateDribbleDirection(player, closestDefender, attackingDirection, numSamples = 360) {
    // Step 1: Generate all possible directions (in radians)
    const directions = Array.from({ length: numSamples }, (_, i) => (i * 2 * Math.PI) / numSamples);

    // Step 2: Calculate weights for each direction
    const weights = directions.map(direction => {
        // Calculate the unit vector for this direction
        const dirVector = { x: Math.cos(direction), y: Math.sin(direction) };

        // Weight 1: Alignment with attacking direction
        const attackingVector = { x: attackingDirection, y: 0 }; // Dynamic attacking direction
        const dotAttacking = dirVector.x * attackingVector.x + dirVector.y * attackingVector.y;
        const alignmentWithAttack = Math.max(0, dotAttacking); // Favor directions in the attacking direction

        // Weight 2: Avoidance of the closest defender
        const defenderVector = {
            x: closestDefender.x - player.x,
            y: closestDefender.y - player.y,
        };
        const defenderDistance = Math.sqrt(defenderVector.x ** 2 + defenderVector.y ** 2);
        const normalizedDefender = {
            x: defenderVector.x / defenderDistance,
            y: defenderVector.y / defenderDistance,
        };
        const dotAwayFromDefender = -(dirVector.x * normalizedDefender.x + dirVector.y * normalizedDefender.y); // Negative to favor away
        const alignmentWithDefender = Math.max(0, dotAwayFromDefender); // Favor directions away from the defender

        // Combine the weights
        const weight = 0.6 * alignmentWithAttack + 0.4 * alignmentWithDefender; // Adjust weights as needed
        return weight;
    });

    // Step 3: Normalize weights to make them probabilistic
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const probabilities = weights.map(w => w / totalWeight);

    // Step 4: Sample a direction based on the probabilities
    //First, make an array of cumulative probablities so that we can reach 1.0 in the end, 
    //and we can have ranges between 0 and 1, corresponding to probablity weights we calculated before
    //we can use these ranges with Math.random to give higher probility to heigher probility weights.
    //Let's say out probilities are [0.1,0.2,0.4,0.3]
    //cumulativeProbilities would be [0,1,0.3,0.7,1.0]
    //if we use Math.random and find the first index where the value is <= the value in the index,
    //then that means we are in the correct range. For instance, math.Random have 0.4 probility to return something between 0.3 and 0.7,
    //this 0.4 probility is the exact probility we add when we calculated 0.7 as a cumulative prob up to that index, reflecting a correct approach to use Math.Random
    //to give correct probility to the normalized probility weights based on the corrsponding range of cumulative values
    const cumulativeProbabilities = probabilities.reduce((acc, prob, i) => {
        acc.push((acc[i - 1] || 0) + prob);
        return acc;
    }, []);

    const randomValue = Math.random();
    const chosenIndex = cumulativeProbabilities.findIndex(cumProb => randomValue <= cumProb);
    const chosenDirection = directions[chosenIndex];

    // Step 5: Return the chosen direction as a vector
    return { x: Math.cos(chosenDirection), y: Math.sin(chosenDirection) };
}



export function checkInterception(ball,defenders){
    return defenders.some(defender => calculateDistance(ball, defender) <= (defender.radius+ball.radius));
}

export function checkInterceptionPassingShooting(ball,defenders){
    return defenders.some(defender => calculateDistance(ball, defender) <= (defender.radius+ball.radius)/2);
}


export function checkInterceptionGoalie(ball,defenders){
    return defenders.some(defender => calculateDistance(ball, defender) <= (defender.radius+ball.radius)/4);
}

export function checkSave(ball,goalkeeper){
    return calculateDistance(ball, goalkeeper) <= goalkeeper.radius+ball.radius;
}


export function isLineClear(passingPlayer, targetPlayer, opponents, threshold = 20) {
    const dx = targetPlayer.x - passingPlayer.x;
    const dy = targetPlayer.y - passingPlayer.y;

    // Handle edge case where the passingPlayer and targetPlayer are the same point
    if (dx === 0 && dy === 0) {
        console.warn("Passing player and target player are at the same position.");
        return true; // Line is trivially clear as it's a single point
    }

    // Function to calculate the distance of a point to the line segment
    function pointDistanceToLineSegment(opponent) {
        const px = opponent.x;
        const py = opponent.y;

        // Parametric line equation: t determines the point on the segment
        let t = ((px - passingPlayer.x) * dx + (py - passingPlayer.y) * dy) / (dx * dx + dy * dy);

        // Clamp t to stay within the segment [0, 1]
        t = Math.max(0, Math.min(1, t));

        // Calculate the closest point on the line segment
        const closestX = passingPlayer.x + t * dx;
        const closestY = passingPlayer.y + t * dy;

        // Return the distance from the opponent to the closest point on the line segment
        return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
    }

    // Check if any opponent is closer to the line segment than the threshold
    return !opponents.some(opponent => pointDistanceToLineSegment(opponent) < threshold);
}


export function calculateTargetPlayerLessDirect(passingPlayer, teammates, opponents, threshold = 20) {
    // Step 1: Find the 4 most available teammates
    
    const teammates_2=teammates.filter(player=>player.pos!="gk");

    const availabilityScores = teammates_2.map(teammate => {
        const closestDefender = closestDefenders(1, teammate, opponents)[0];
        const distanceFromDefender = calculateDistance(teammate, closestDefender);
        const isClear = isLineClear(passingPlayer, teammate, opponents, threshold);
        return { teammate, score: isClear ? distanceFromDefender : distanceFromDefender/2 }; // punish if less avaliable owing to !clear line
    });


    // Filter out unavailable teammates and sort by availability (distance from closest defender)
    const sortedAvailability = availabilityScores
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score) // Higher scores first
        .slice(0, 4); // Get the top 4

    // Step 2: Assign weights based on proximity to the passing player: pass more with a higher probability to the close players from the most avaliable 4 players
    const totalProximity = sortedAvailability.reduce((sum, entry) => sum + calculateDistance(passingPlayer, entry.teammate), 0);
    const probabilities = sortedAvailability.map(entry => {
        const distanceToPassingPlayer = calculateDistance(passingPlayer, entry.teammate);
        const weight = totalProximity ? (1 - distanceToPassingPlayer / totalProximity) : 0; // Normalize weight
        return { teammate: entry.teammate, weight };
    });

    // Step 3: Normalize weights to probabilities
    const weightSum = probabilities.reduce((sum, entry) => sum + entry.weight, 0);
    const normalizedProbabilities = probabilities.map(entry => ({
        ...entry,
        weight: weightSum ? entry.weight / weightSum : 0,
    }));

    // Step 4: Randomly select a target player based on probabilities
    const cumulativeProbabilities = normalizedProbabilities.reduce((acc, entry, i) => {
        acc.push((acc[i - 1] || 0) + entry.weight);
        return acc;
    }, []);


    const randomValue = Math.random();
    const chosenIndex = cumulativeProbabilities.findIndex(cumProb => randomValue <= cumProb);

    return normalizedProbabilities[chosenIndex]?.teammate || null; // Return the chosen teammate
}

export function calculateTargetPlayerDirect(passingPlayer, teammates, opponents, attackingGoal, threshold = 20) {
    // Step 1: Find the 4 closest teammates to the attacking goal
    const goalDistances = teammates.map(teammate => ({
        teammate,
        distance: calculateDistanceFromGoal(teammate, attackingGoal),
    }));
    const sortedByGoalDistance = goalDistances.sort((a, b) => a.distance - b.distance).slice(0, 4);

    // Step 2: Assign weights based on availability
    const groupWeights = sortedByGoalDistance.map(entry => {
        const closestDefender = closestDefenders(1, entry.teammate, opponents)[0];
        const defenderDistance = calculateDistance(entry.teammate, closestDefender);
        const isClear = isLineClear(passingPlayer, entry.teammate, opponents, threshold);

        return {
            teammate: entry.teammate,
            weight: isClear
                ? defenderDistance // If clear, weight is defender distance
                : defenderDistance * 0.5, // If not clear, penalize the weight
            clear: isClear, // Track whether the path is clear
        };
    });

    // Step 3: Adjust weights so that any "clear path" player always has a higher weight
    const maxBlockedWeight = Math.max(...groupWeights.filter(entry => !entry.clear).map(entry => entry.weight), 0);
    const adjustedWeights = groupWeights.map(entry => ({
        ...entry,
        weight: entry.clear ? entry.weight + maxBlockedWeight + 1 : entry.weight, // Boost clear path weights
    }));

    // Step 4: Normalize weights to probabilities
    const totalWeight = adjustedWeights.reduce((sum, entry) => sum + entry.weight, 0);
    const probabilities = adjustedWeights.map(entry => ({
        ...entry,
        weight: totalWeight ? entry.weight / totalWeight : 0,
    }));

    // Step 5: Randomly select a target player based on probabilities
    const cumulativeProbabilities = probabilities.reduce((acc, entry, i) => {
        acc.push((acc[i - 1] || 0) + entry.weight);
        return acc;
    }, []);

    const randomValue = Math.random();
    const chosenIndex = cumulativeProbabilities.findIndex(cumProb => randomValue <= cumProb);
    return probabilities[chosenIndex]?.teammate || null; // Return the chosen teammate
}

export function calculatePassRadius(distance, maxRadius = 18) {
    // Linearly increase the radius with distance, capped at `maxRadius`
    return Math.min(distance / 10, maxRadius); // Adjust the divisor (10) for a fine-tuned increase
}

export function calculateTargetPositionToFeet(passingPlayer, targetPlayer, passRadius=18) {
    // Calculate the distance between the passer and the target player
    const distance = calculateDistance(passingPlayer, targetPlayer);

    // Get the radius for the pass
    const radius = calculatePassRadius(distance,passRadius);

    // Randomly select a point within the radius around the target player
    const angle = Math.random() * 2 * Math.PI; // Random angle
    const randomRadius = Math.random() * radius; // Random distance within the radius

    const targetPosition = {
        x: targetPlayer.x + randomRadius * Math.cos(angle),
        y: targetPlayer.y + randomRadius * Math.sin(angle),
    };

    return targetPosition;
}


export function calculateTargetPositionToSpace(passingPlayer, targetPlayer, goal, passRadius=18) {
    // Calculate the distance between the passer and the target player
    const distance = calculateDistance(passingPlayer, targetPlayer);

    // Get the radius for the pass (scaled up for passing into space)
    const radius = calculatePassRadius(distance, passRadius) * 2;

    // Define the attacking direction
    const goalDirection = { x: goal.xCenter - targetPlayer.x, y: goal.yCenter - targetPlayer.y };

    // Normalize the goal direction vector
    const magnitude = Math.sqrt(goalDirection.x ** 2 + goalDirection.y ** 2);
    const normalizedGoalDirection = {
        x: goalDirection.x / magnitude,
        y: goalDirection.y / magnitude,
    };

    // Randomly select a point in the semicircle towards the attacking goal
    const angleOffset = Math.random() * Math.PI - Math.PI / 2; // Semi-circle angle (±π/2)
    const angle = Math.atan2(normalizedGoalDirection.y, normalizedGoalDirection.x) + angleOffset;
    const randomRadius = Math.random() * radius;


    const targetPosition = {
        x: targetPlayer.x + randomRadius * Math.cos(angle),
        y: targetPlayer.y + randomRadius * Math.sin(angle),
    };

    return targetPosition;
}


export function getFoulWeight(defender, attacker, dribbleDirection){
    const relX = defender.x - attacker.x;
    const relY = defender.y - attacker.y;
    const dist = Math.hypot(relX, relY);
    if (dist === 0) return 0;  // perfect overlap → treat as “in front”

  // 2) Compute the cosine of the angle between rel‐vector and dribbleDirection
  //    dot = |u||v|cosθ; here |dribbleDirection| = 1
    let cosTheta = (dribbleDirection.x * relX + dribbleDirection.y * relY) / dist;
  // Clamp for safety against tiny FP errors:
    cosTheta = Math.min(1, Math.max(-1, cosTheta));

  // 3) Recover θ ∈ [0, π]
     const theta = Math.acos(cosTheta);

     return theta / Math.PI;
}

