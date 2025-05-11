import {
    calculateDistance,
    calculateDistanceFromGoal,
    closestDefenders,
    flattenTeam
} from './getState.mjs';

import {
    findClosestPlayerToBall,
    normalizeDistance
} from './movements.mjs';
import {
  checkInterception,
  isLineClear,
} from './decisions2.mjs';


export function outOfPossessionMovement(team, ball, opponents, goal, pressLevel, compactness, creativity, normalPlayerSpeed = 0.5) {
    // Step 1: Find the presser using the helper function
    const presser = findClosestPlayerToBall([...team.defenders, ...team.midfielders, ...team.forwards], ball);


    // Step 2: Flatten the team into position-based lists excluding the presser
    const defenders = team.defenders.filter(player => player !== presser);
    const midfielders = team.midfielders.filter(player => player !== presser);
    const attackers = team.forwards.filter(player => player !== presser);
    const goalkeeper = team.goalkeeper;

    // Step 3: Call movement functions
    const status=presserMovement(presser, ball, pressLevel, normalPlayerSpeed);
    if (status.status==="tackle"){
        return {status: "interception"};
    }
    goalkeeperOutOfPossessionMovement(goalkeeper, ball);
    defendersOutOfPossessionMovement(defenders, ball, opponents, goal, pressLevel, compactness, creativity, normalPlayerSpeed);
    midfieldersOutOfPossessionMovement(midfielders, ball, opponents, goal, pressLevel, compactness, creativity, normalPlayerSpeed);
    attackersOutOfPossessionMovement(attackers, ball, opponents, goal, pressLevel, compactness, creativity, normalPlayerSpeed);
    return {status: "defending"};
}



export function presserMovement(presser, ball, pressLevel, normalPlayerSpeed = 0.5) {
    // Step 1: Determine the pressing factor based on the press level
    let pressFactor;
    switch (pressLevel) {
        case "low":
            pressFactor = normalPlayerSpeed-0.15;
            break;
        case "balanced":
            pressFactor = normalPlayerSpeed;
            break;
        case "high":
            pressFactor = normalPlayerSpeed+0.15;
            break;
        default:
            pressFactor = normalPlayerSpeed; 
    }

    // Step 2: Calculate the direction vector to the ball
    const dx = ball.x - presser.x;
    const dy = ball.y - presser.y;
    const distanceToBall = Math.sqrt(dx ** 2 + dy ** 2);

    if (distanceToBall<=(presser.radius+ball.radius)){
        return {status: "tackle"};
    }

    // Normalize the direction vector
    const unitX = dx / distanceToBall;
    const unitY = dy / distanceToBall;

    // Step 3: Move the presser towards the ball
    presser.x += unitX * pressFactor 
    presser.y += unitY * pressFactor 
    return {status: "pressing"};
}



export function defendersOutOfPossessionMovement(defenders, ball, attackingPlayers, goal, pressLevel, compactness, creativity, normalPlayerSpeed = 0.5) {
    // Step 1: Calculate compactness and press factors
    //Adjust variables such that if all the variables suggests the same direction for a unit distance=1, the total movement speed will not exceed 0.65. 
    //0.65 is good for maximized movement speed per frame because it reflects 39 units per second per axis which whould be 6.5 meters in an actual pitch. Reasonable maximized movement speed, reflecting real life. 
    //Each variable's effect on movement and its speed is variable*normalPlayerSpeed
    //Give more weight to original position regardless because defenders would want to stay and cover their position more compared to midfielders and strikers unless the ball is even closer to the goal than their original position;
    //That case when ball is closer to the goal they are defending is handled in forEach loop as an exception. 
    let compactnessFactor;
    switch (compactness) {
        case "low":
            compactnessFactor = 0.45;
            break;
        case "balanced":
            compactnessFactor = 0.55;
            break;
        case "high":
            compactnessFactor = 0.65;
            break;
        default:
            compactnessFactor = 0.55;
    }

    let pressFactor;
    switch (pressLevel) {
        case "low":
            pressFactor = 0.45;
            break;
        case "balanced":
            pressFactor = 0.55;
            break;
        case "high":
            pressFactor = 0.65;
            break;
        default:
            pressFactor = 0.55;
    }

    let originalPositionFactor; 
    switch (creativity) {
        case "low":
            originalPositionFactor = 0.90;
            break;
        case "balanced":
            originalPositionFactor = 0.80;
            break;
        case "high":
            originalPositionFactor = 0.70;
            break;
        default:
            originalPositionFactor = 0.80;
    }

    // Step 2: Calculate average team position
    const averagePosition = calculateAverageTeamPosition(defenders);

   
    // Step 3: Loop through each defender and update position
    defenders.forEach(defender => {

         // A: Maximize the originalPositionFactor affecting movement if our defenders are in the attacking half so that they can move backwards to our half faster.
        if (
            (goal.goalDirection === "positive" && defender.x > 300) || // Past halfway line
            (goal.goalDirection === "negative" && defender.x < 300)
        ) {
            originalPositionFactor=1; //just come back to own half without thinking much about other factors
            pressFactor=0.45; 
            compactnessFactor=0.45;

        }

        // B: Move behind the ball if we are already in our half. The reason we have else if here is because if both conditions are true, defenders will be unnecessarily fast to come back on defense
        else if (
            (goal.goalDirection === "positive" && ball.x < defender.x) ||
            (goal.goalDirection === "negative" && ball.x > defender.x)
        ) {
            defender.x += goal.goalDirection === "positive" ? -normalPlayerSpeed : normalPlayerSpeed;
            originalPositionFactor=0;
            //pressFactor=0.55; 
            //compactnessFactor=0.55;
        }

        //C: Preserve original positioning with the factor related to creativity unless above conditions that would require a defender to run back to original position or run back without thinking original positioning are false.
        const dxForOriginal=defender.x_dist - defender.x;
        const dyForOriginal=defender.y_dist - defender.y;
        const distanceFromOriginal=Math.sqrt(dxForOriginal ** 2 + dyForOriginal ** 2);
        const unitXForOriginal=distanceFromOriginal>0? dxForOriginal/distanceFromOriginal:0;
        const unitYForOriginal=distanceFromOriginal>0? dyForOriginal/distanceFromOriginal:0;

        const distanceEffectOriginal=normalizeDistance(distanceFromOriginal);

        defender.x += unitXForOriginal * distanceEffectOriginal* originalPositionFactor * normalPlayerSpeed;
        defender.y += unitYForOriginal * distanceEffectOriginal* originalPositionFactor * normalPlayerSpeed;
        

        // D: Stay compact towards average position

        const dxToAverage = averagePosition.x - defender.x;
        const dyToAverage = averagePosition.y - defender.y;
        const distanceFromAverage=Math.sqrt(dxToAverage ** 2 + dyToAverage ** 2);
        const unitXForAverage=distanceFromAverage>0? dxToAverage/distanceFromAverage:0;
        const unitYForAverage=distanceFromAverage>0? dyToAverage/distanceFromAverage:0;

        const distanceEffectAverage=normalizeDistance(distanceFromAverage);

        defender.x += unitXForAverage * distanceEffectAverage* pressFactor * normalPlayerSpeed;
        defender.y += unitYForAverage * distanceEffectAverage* compactnessFactor * normalPlayerSpeed;

        // E: Marking logic
        //Marking logic using closestDefenders function to sort 10 opposing players to our current player
        const closestOpponents = closestDefenders(10, defender, attackingPlayers);

        for (const opponent of closestOpponents) {
            // Check if the opponent is already marked
            const isMarked = defenders.some(otherDefender => {
                const distanceToOtherDefender = calculateDistance(otherDefender, opponent);
                const distanceToCurrentDefender = calculateDistance(defender, opponent);
                return otherDefender !== defender && distanceToOtherDefender < distanceToCurrentDefender;
            });

            if (!isMarked) {
                // Mark this opponent
                const dxToMark = opponent.x - defender.x;
                const dyToMark = opponent.y - defender.y;
                const distanceToMark=Math.sqrt(dxToMark ** 2 + dyToMark ** 2);
                const unitXForMark=distanceToMark>0? dxToMark/distanceToMark:0;
                const unitYForMark=distanceToMark>0? dyToMark/distanceToMark:0;
                const markingFactor = pressFactor * normalPlayerSpeed;
                const distanceEffectMark=normalizeDistance(distanceToMark);

                defender.x += unitXForMark * distanceEffectMark* markingFactor;
                defender.y += unitYForMark * distanceEffectMark* markingFactor;

                break; // Stop marking once an unmarked opponent is found
            }
        }
        
    });
}

export function midfieldersOutOfPossessionMovement(midfielders, ball, attackingPlayers, goal, pressLevel, compactness, creativity, normalPlayerSpeed = 0.5) {
    // Step 1: Calculate compactness and press factors
    //Adjust variables such that if all the variables suggests the same direction for a unit distance=1, the total movement speed will not exceed 0.65. 
    //0.65 is good for maximized movement speed per frame because it reflects 39 units per second per axis which whould be 6.5 meters in an actual pitch. Reasonable maximized movement speed, reflecting real life. 
    //Each variable's effect on movement and its speed is variable*normalPlayerSpeed
    //Make the variables more balanced and same for midfielders as they are at the central position on the pitch with realtively equal adjustments to occasions on the pitch
    let compactnessFactor;
    switch (compactness) {
        case "low":
            compactnessFactor = 0.73;
            break;
        case "balanced":
            compactnessFactor = 0.63;
            break;
        case "high":
            compactnessFactor = 0.53;
            break;
        default:
            compactnessFactor = 0.63;
    }

    let pressFactor;
    switch (pressLevel) {
        case "low":
            pressFactor = 0.73;
            break;
        case "balanced":
            pressFactor = 0.63;
            break;
        case "high":
            pressFactor = 0.53;
            break;
        default:
            pressFactor = 0.63;
    }

    let originalPositionFactor;
    switch (creativity) {
        case "low":
            originalPositionFactor = 0.73;
            break;
        case "balanced":
            originalPositionFactor = 0.63;
            break;
        case "high":
            originalPositionFactor = 0.53;
            break;
        default:
            originalPositionFactor = 0.63;
    }

    // Step 2: Calculate average team position
    const averagePosition = calculateAverageTeamPosition(midfielders);

    // Step 3: Loop through each midfielder and update position
    midfielders.forEach(midfielder => {
        // A: Preserve original positioning
        const dxOriginal = midfielder.x_dist - midfielder.x;
        const dyOriginal = midfielder.y_dist - midfielder.y;
        const distanceFromOriginal=Math.sqrt(dxOriginal**2 + dyOriginal**2);
        const unitXForOriginal=distanceFromOriginal>0? dxOriginal/distanceFromOriginal:0;
        const unitYForOriginal=distanceFromOriginal>0? dyOriginal/distanceFromOriginal:0;

        const distanceEffectOriginal=normalizeDistance(distanceFromOriginal);

        midfielder.x += unitXForOriginal * distanceEffectOriginal* originalPositionFactor * normalPlayerSpeed;
        midfielder.y += unitYForOriginal * distanceEffectOriginal* originalPositionFactor * normalPlayerSpeed;

        // B: Stay compact towards average position
        const dxToAverage = averagePosition.x - midfielder.x;
        const dyToAverage = averagePosition.y - midfielder.y;
        const distanceFromAverage=Math.sqrt(dxToAverage**2+dyToAverage**2);
        const unitXForAverage=distanceFromAverage>0? dxToAverage/distanceFromAverage:0;
        const unitYForAverage=distanceFromAverage>0? dyToAverage/distanceFromAverage:0;

        const distanceEffectAverage=normalizeDistance(distanceFromAverage);

        midfielder.x += unitXForAverage * distanceEffectAverage* pressFactor * normalPlayerSpeed;
        midfielder.y += unitYForAverage * distanceEffectAverage* compactnessFactor * normalPlayerSpeed;

        // C: Marking logic
        const closestOpponents = closestDefenders(10, midfielder, attackingPlayers);

        for (const opponent of closestOpponents) {
            // Check if the opponent is already marked
            const isMarked = midfielders.some(otherMidfielder => {
                const distanceToOtherMidfielder = calculateDistance(otherMidfielder, opponent);
                const distanceToCurrentMidfielder = calculateDistance(midfielder, opponent);
                return otherMidfielder !== midfielder && distanceToOtherMidfielder < distanceToCurrentMidfielder;
            });

            if (!isMarked) {
                // Mark this opponent
                const dxToMark = opponent.x - midfielder.x;
                const dyToMark = opponent.y - midfielder.y;
                const distanceToMark=Math.sqrt(dxToMark**2+dyToMark**2);
                const unitXForMark=distanceToMark>0? dxToMark/distanceToMark:0;
                const unitYForMark=distanceToMark>0?dyToMark/distanceToMark:0;
                const markingFactor = pressFactor * normalPlayerSpeed;

                const distanceEffectMark=normalizeDistance(distanceToMark);

                midfielder.x += unitXForMark * distanceEffectMark* markingFactor;
                midfielder.y += unitYForMark * distanceEffectMark* markingFactor;

                break; // Stop marking once an unmarked opponent is found
            }
        }

    });
}

export function attackersOutOfPossessionMovement(attackers, ball, attackingPlayers, goal, pressLevel, compactness, creativity, normalPlayerSpeed = 0.5) {
    // Step 1: Calculate compactness and press factors
    // Adjust variables such that if all variables suggest the same direction for the same unit distance=1, the effect on player speed would not exceed 0.65
    //Adjust variables such that if all the variables suggests the same direction for a unit distance=1, the total movement speed will not exceed 0.65. 
    //0.65 is good for maximized movement speed per frame because it reflects 39 units per second per axis which whould be 6.5 meters in an actual pitch. Reasonable maximized movement speed, reflecting real life. 
    //Each variable's effect on movement and its speed is variable*normalPlayerSpeed
    //Give more weight to original positions because attackers would be less likely to adopt different defensive situations including compactness and press factors in real life.
    let compactnessFactor;
    switch (compactness) {
        case "low":
            compactnessFactor = 0.45;
            break;
        case "balanced":
            compactnessFactor = 0.55;
            break;
        case "high":
            compactnessFactor = 0.65;
            break;
        default:
            compactnessFactor = 0.55;
    }

    let pressFactor;
    switch (pressLevel) {
        case "low":
            pressFactor = 0.45;
            break;
        case "balanced":
            pressFactor = 0.55;
            break;
        case "high":
            pressFactor = 0.65;
            break;
        default:
            pressFactor = 0.55;
    }

    let originalPositionFactor; 
    switch (creativity) {
        case "low":
            originalPositionFactor = 0.90;
            break;
        case "balanced":
            originalPositionFactor = 0.80;
            break;
        case "high":
            originalPositionFactor = 0.70;
            break;
        default:
            originalPositionFactor = 0.80;
    }


    // Step 2: Calculate average team position
    const averagePosition = calculateAverageTeamPosition(attackers);

    // Step 3: Loop through each attacker and update position
    attackers.forEach(attacker => {
        // A: Preserve original positioning
        const dxOriginal = attacker.x_dist - attacker.x;
        const dyOriginal = attacker.y_dist - attacker.y;
        const distanceFromOriginal=Math.sqrt(dxOriginal**2+dyOriginal**2);
        const unitXForOriginal=distanceFromOriginal>0? dxOriginal/distanceFromOriginal:0;
        const unitYForOriginal=distanceFromOriginal>0? dyOriginal/distanceFromOriginal:0;

        const distanceEffectOriginal=normalizeDistance(distanceFromOriginal);

        attacker.x += unitXForOriginal * distanceEffectOriginal* originalPositionFactor * normalPlayerSpeed;
        attacker.y += unitYForOriginal * distanceEffectOriginal* originalPositionFactor * normalPlayerSpeed;

        // B: Stay compact towards average position
        const dxToAverage = averagePosition.x - attacker.x;
        const dyToAverage = averagePosition.y - attacker.y;
        const distanceFromAverage=Math.sqrt(dxToAverage**2+dyToAverage**2);
        const unitXForAverage=distanceFromAverage>0? dxToAverage/distanceFromAverage:0;
        const unitYForAverage=distanceFromAverage>0? dyToAverage/distanceFromAverage:0;

        const distanceEffectAverage=normalizeDistance(distanceFromAverage);

        attacker.x += unitXForAverage * distanceEffectAverage* pressFactor * normalPlayerSpeed;
        attacker.y += unitYForAverage * distanceEffectAverage* compactnessFactor * normalPlayerSpeed;

        // C: Marking logic
        const closestOpponents = closestDefenders(10, attacker, attackingPlayers);

        for (const opponent of closestOpponents) {
            // Check if the opponent is already marked
            const isMarked = attackers.some(otherAttacker => {
                const distanceToOtherAttacker = calculateDistance(otherAttacker, opponent);
                const distanceToCurrentAttacker = calculateDistance(attacker, opponent);
                return otherAttacker !== attacker && distanceToOtherAttacker < distanceToCurrentAttacker;
            });

            if (!isMarked) {
                // Mark this opponent
                const dxToMark = opponent.x - attacker.x;
                const dyToMark = opponent.y - attacker.y;
                const distanceToMark=Math.sqrt(dxToMark**2+dyToMark**2);
                const unitXForMark=distanceToMark>0? dxToMark/distanceToMark:0;
                const unitYForMark=distanceToMark>0? dyToMark/distanceToMark:0;
                const markingFactor = pressFactor * normalPlayerSpeed;

                const distanceEffectMark=normalizeDistance(distanceToMark);

                attacker.x += unitXForMark * distanceEffectMark* markingFactor;
                attacker.y += unitYForMark * distanceEffectMark* markingFactor;

                break; // Stop marking once an unmarked opponent is found
            }
        }

    });
}
export function goalkeeperOutOfPossessionMovement(goalkeeper, ball, goalkeeperSpeed = 0.1, goalkeeperXSpeed=0.5) {
    // Step 3: If the ball is within 60 units of the goalkeeper, move towards the ball's y value
    const distanceToBall = calculateDistance(goalkeeper, ball);

    if (distanceToBall < 60) {
        const dyToBall = ball.y - goalkeeper.y;
        const unitY = dyToBall / Math.abs(dyToBall); // Normalize to -1, 0, or 1 for y-direction

        goalkeeper.y += unitY * goalkeeperSpeed; // Factor of 0.1 for y movement
        const dxToOriginal=goalkeeper.x_dist-goalkeeper.x;
        const dyToOriginal=goalkeeper.y_dist-goalkeeper.y;
        const distanceToOriginal=Math.sqrt(dxToOriginal**2+dyToOriginal**2);
        const unitX=distanceToOriginal!=0?dxToOriginal/distanceToOriginal:0;
        goalkeeper.x+=unitX*goalkeeperXSpeed;

    }
    else{

        const dxToOriginal=goalkeeper.x_dist-goalkeeper.x;
        const dyToOriginal=goalkeeper.y_dist-goalkeeper.y;
        const distanceToOriginal=Math.sqrt(dxToOriginal**2+dyToOriginal**2);
        const unitX=distanceToOriginal!=0?dxToOriginal/distanceToOriginal:0;
        const unitY=distanceToOriginal!=0?dyToOriginal/distanceToOriginal:0;
        goalkeeper.x+=unitX*goalkeeperXSpeed;
        goalkeeper.y+=unitY*goalkeeperXSpeed;

    }


}

export function calculateAverageTeamPosition(team) {
    const totalX = team.reduce((sum, player) => sum + player.x, 0);
    const totalY = team.reduce((sum, player) => sum + player.y, 0);
    const numPlayers = team.length;
    return {
        x: totalX / numPlayers,
        y: totalY / numPlayers,
    };
}

