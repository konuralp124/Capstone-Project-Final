import {
    calculateDistance,
    calculateDistanceFromGoal,
    closestDefenders,
    flattenTeam
} from './getState.mjs';
// Import specific functions from the current file
import {
  checkInterception,
  isLineClear,
} from './decisions2.mjs';



export function inPossessionMovement(team, ball, goal, mentality, creativity, opponents, targetPlayer = null, normalPlayerSpeed = 0.5) {
    const {goalkeeper,defenders, midfielders, forwards } = team;

    // Step 1: Determine the target player
    if (!targetPlayer) {
        targetPlayer = findClosestPlayerToBall([goalkeeper,...defenders, ...midfielders, ...forwards], ball);
    }
    

    // Step 2: Exclude the target player from position lists
    const otherDefenders = defenders.filter(player => player !== targetPlayer);
    const otherMidfielders = midfielders.filter(player => player !== targetPlayer);
    const otherAttackers = forwards.filter(player => player !== targetPlayer);



    // Step 3: Call target player's movement function
    const status=targetPlayerMovementInPossession(targetPlayer, ball, normalPlayerSpeed);

    // Step 4: Call defenders' movement function
    defendersInPossessionMovement(otherDefenders, ball, goal, mentality, creativity, opponents, normalPlayerSpeed);

    // Step 5: Call midfielders' movement function
    midfieldersInPossessionMovement(otherMidfielders, ball, goal, mentality, creativity, opponents, normalPlayerSpeed);

    // Step 6: Call attackers' movement function
    attackersInPossessionMovement(otherAttackers, ball, goal, mentality, creativity, opponents, normalPlayerSpeed);
    return status;
}

export function findClosestPlayerToBall(players, ball) {
    return players.reduce((closest, player) => {
        const distance = calculateDistance(player, ball);
        return distance < calculateDistance(closest, ball) ? player : closest;
    });
}

export function normalizeDistance(distance, maxNormalize = 400) {
    if (distance <= maxNormalize) {
        return distance / maxNormalize; // Normalizes to a scale of 0 to 1 within 400 units
    } else {
        return 1; // Set to 1 if distance exceeds 400 units
    }
}


export function targetPlayerMovementInPossession(targetPlayer, targetPosition, normalPlayerSpeed=0.5) {
    // Calculate the distance to the target position
    const dx = targetPosition.x - targetPlayer.x;
    const dy = targetPosition.y - targetPlayer.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);


    // Check if the target player is already at the target position
    if (distance <= targetPlayer.radius+targetPosition.radius && targetPosition.y>0 && targetPosition.y<400 && targetPosition.x>0 && targetPosition.x<600) {

        return "decisionTime";
        
    }

    // Normalize the movement vector
    const unitX = dx / distance;
    const unitY = dy / distance;



    // Update the target player's position
    targetPlayer.x += unitX * normalPlayerSpeed;
    targetPlayer.y += unitY * normalPlayerSpeed;
    return "stillNotPossessing";
}

export function defendersInPossessionMovement(defenders, ball, goal, mentality, creativity, opponents, normalPlayerSpeed = 0.5) {

    // Determine attacking direction
    const attackingDirection = goal.goalDirection === "positive" ? 1 : -1;

    // Define movement factors based on mentality
    let moveUpFactor;
    switch (mentality) {
        case "park the bus":
            moveUpFactor = 0.45;
            break;
        case "defense":
            moveUpFactor = 0.55;
            break;
        case "balanced":
            moveUpFactor = 0.65;
            break;
        case "attack":
            moveUpFactor = 0.75;
            break;
        case "all out attack":
            moveUpFactor = 0.85;
            break;
        default:
            moveUpFactor = 0.65; // Default balanced
    }

    const moveDownFactor = 1.25 - moveUpFactor;

    // Define unmarking factor for defenders (low by design)
    const unmarkingFactor = 0.05;

    const opponentsWithoutGoalie=opponents.filter(player=>player.pos!="gk");

    // Identify the x-position of the last defender on the opposing team
    const lastDefender = attackingDirection === 1
        ? Math.max(...opponentsWithoutGoalie.map(player => player.x)) // Farthest in positive x direction
        : Math.min(...opponentsWithoutGoalie.map(player => player.x)); // Farthest in negative x direction

    // Determine the limit attackers cannot pass
    const limit = attackingDirection === 1
        ? Math.max(Math.max(lastDefender, ball.x), 300) // Ensure limit is at least halfway line
        : Math.min(Math.min(lastDefender, ball.x), 300); // Ensure limit is at least halfway line

    defenders.forEach(defender => {

        const ballDistance=calculateDistance(defender,ball);
        const distanceEffectBall=normalizeDistance(ballDistance);
        // Step 1: Move up or down the pitch based on ball's position
        if (attackingDirection === 1 && ball.x > defender.x) {
            defender.x = Math.min(defender.x + distanceEffectBall* moveUpFactor * normalPlayerSpeed, limit); // Move upwards, but not past the limit
        } else if (attackingDirection === -1 && ball.x < defender.x) {
            defender.x = Math.max(defender.x - distanceEffectBall* moveUpFactor * normalPlayerSpeed, limit); // Move upwards, but not past the limit
        } else if (attackingDirection === 1 && ball.x < defender.x) {
            defender.x -= distanceEffectBall* moveDownFactor * normalPlayerSpeed; // Move downwards
        } else if (attackingDirection === -1 && ball.x > defender.x) {
            defender.x += distanceEffectBall* moveDownFactor * normalPlayerSpeed; // Move downwards
        }


        // Step 2: Factor in original position
        const originalPositionFactor = creativity === "high" ? 0.50 : 0.80;

        const dxForOriginal=defender.x_dist - defender.x;
        const dyForOriginal=defender.y_dist - defender.y;
        const distanceFromOriginal=Math.sqrt(dxForOriginal ** 2 + dyForOriginal ** 2);
        const unitXForOriginal=distanceFromOriginal>0 ? dxForOriginal/distanceFromOriginal:0;
        const unitYForOriginal=distanceFromOriginal>0 ? dyForOriginal/distanceFromOriginal:0;

        

        const distanceEffectOriginal=normalizeDistance(distanceFromOriginal);

        defender.x += unitXForOriginal * distanceEffectOriginal*originalPositionFactor * normalPlayerSpeed;
        defender.y += unitYForOriginal * distanceEffectOriginal*originalPositionFactor * normalPlayerSpeed;

        // Step 3: Adjust positioning to avoid marking player
        const closestOpponent = closestDefenders(1, defender, opponents)[0];
    
        const dx = defender.x - closestOpponent.x;
        const dy = defender.y - closestOpponent.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);

        const distanceEffectUnmark=1-normalizeDistance(distance);     
    
        const unitX = dx / distance;
        const unitY = dy / distance;

        defender.x += unitX * distanceEffectUnmark*unmarkingFactor*normalPlayerSpeed;
        defender.y += unitY * distanceEffectUnmark*unmarkingFactor*normalPlayerSpeed;
        
            
        //final check for off-side
        if (attackingDirection === 1) {
            defender.x = Math.min(defender.x, limit); 
        } else {
            defender.x = Math.max(defender.x, limit); 
        }
        
    });
}

export function midfieldersInPossessionMovement(midfielders, ball, goal, mentality, creativity, opponents, normalPlayerSpeed = 0.5) {

    // Determine attacking direction
    const attackingDirection = goal.goalDirection === "positive" ? 1 : -1;

    // Define movement factors based on mentality    
    let moveUpFactor;
    switch (mentality) {
        case "park the bus":
            moveUpFactor = 0.45;
            break;
        case "defense":
            moveUpFactor = 0.55;
            break;
        case "balanced":
            moveUpFactor = 0.65;
            break;
        case "attack":
            moveUpFactor = 0.75;
            break;
        case "all out attack":
            moveUpFactor = 0.85;
            break;
        default:
            moveUpFactor = 0.65; // Default balanced
    }

    const moveDownFactor = 1.25 - moveUpFactor;

    // Define unmarking factor based on creativity
    let unmarkingFactor;
    switch (creativity) {
        case "high":
            unmarkingFactor = 0.50;
            break;
        case "balanced":
            unmarkingFactor = 0.35;
            break;
        case "low":
            unmarkingFactor = 0.25;
            break;
        default:
            unmarkingFactor = 0.35; // Default balanced creativity
    }
    // Identify the x-position of the last defender on the opposing team
    const opponentsWithoutGoalie=opponents.filter(player=>player.pos!="gk");

    // Identify the x-position of the last defender on the opposing team
    const lastDefender = attackingDirection === 1
        ? Math.max(...opponentsWithoutGoalie.map(player => player.x)) // Farthest in positive x direction
        : Math.min(...opponentsWithoutGoalie.map(player => player.x)); // Farthest in negative x direction

    // Determine the limit attackers cannot pass
    const limit = attackingDirection === 1
        ? Math.max(Math.max(lastDefender, ball.x), 300) // Ensure limit is at least halfway line
        : Math.min(Math.min(lastDefender, ball.x), 300); // Ensure limit is at least halfway line


    midfielders.forEach(midfielder => {
        const ballDistance=calculateDistance(midfielder,ball);
        const distanceEffectBall=normalizeDistance(ballDistance);
        // Step 1: Move up or down the pitch based on ball's position
        if (attackingDirection === 1 && ball.x > midfielder.x) {
            midfielder.x = Math.min(midfielder.x + distanceEffectBall* moveUpFactor * normalPlayerSpeed, limit); // Move upwards, but not past the limit
        } else if (attackingDirection === -1 && ball.x < midfielder.x) {
            midfielder.x = Math.max(midfielder.x - distanceEffectBall* moveUpFactor * normalPlayerSpeed, limit); // Move upwards, but not past the limit
        } else if (attackingDirection === 1 && ball.x < midfielder.x) {
            midfielder.x -= distanceEffectBall* moveDownFactor * normalPlayerSpeed; // Move downwards
        } else if (attackingDirection === -1 && ball.x > midfielder.x) {
            midfielder.x += distanceEffectBall* moveDownFactor * normalPlayerSpeed; // Move downwards
        }

        const originalPositionFactor = creativity === "high" ? 0.50 : 0.65;

        const dxForOriginal=midfielder.x_dist - midfielder.x;
        const dyForOriginal=midfielder.y_dist - midfielder.y;
        const distanceFromOriginal=Math.sqrt(dxForOriginal ** 2 + dyForOriginal ** 2);
        const unitXForOriginal=distanceFromOriginal>0? dxForOriginal/distanceFromOriginal:0;
        const unitYForOriginal=distanceFromOriginal>0? dyForOriginal/distanceFromOriginal:0;

        const distanceEffectOriginal=normalizeDistance(distanceFromOriginal);

        midfielder.x += unitXForOriginal * distanceEffectOriginal* originalPositionFactor * normalPlayerSpeed;
        midfielder.y += unitYForOriginal * distanceEffectOriginal* originalPositionFactor * normalPlayerSpeed;

        // Step 3: Adjust positioning to avoid marking player
        const closestOpponent = closestDefenders(1, midfielder, opponents)[0];
   
        const dx = midfielder.x - closestOpponent.x;
        const dy = midfielder.y - closestOpponent.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);

        
        const distanceEffectUnmark=1-normalizeDistance(distance);

        const unitX = dx / distance;
        const unitY = dy / distance;

        midfielder.x += unitX * distanceEffectUnmark* unmarkingFactor * normalPlayerSpeed;
        midfielder.y += unitY * distanceEffectUnmark* unmarkingFactor * normalPlayerSpeed;
        
            
        
        //last check of off-side
        if (attackingDirection === 1) {
            midfielder.x = Math.min(midfielder.x, limit); 
        } else {
            midfielder.x = Math.max(midfielder.x, limit); 
        }
        
    });
}

export function attackersInPossessionMovement(attackers, ball, goal, mentality, creativity, opponents, normalPlayerSpeed = 0.5) {
    
    // Determine attacking direction
    const attackingDirection = goal.goalDirection === "positive" ? 1 : -1;


    let moveUpFactor;
    switch (mentality) {
        case "park the bus":
            moveUpFactor = 0.45;
            break;
        case "defense":
            moveUpFactor = 0.55;
            break;
        case "balanced":
            moveUpFactor = 0.65;
            break;
        case "attack":
            moveUpFactor = 0.75;
            break;
        case "all out attack":
            moveUpFactor = 0.85;
            break;
        default:
            moveUpFactor = 0.65; // Default balanced
    }

    const moveDownFactor = 1.25 - moveUpFactor;

    // Define unmarking factor based on creativity
    let unmarkingFactor;
    switch (creativity) {
        case "high":
            unmarkingFactor = 0.60;
            break;
        case "balanced":
            unmarkingFactor = 0.45;
            break;
        case "low":
            unmarkingFactor = 0.35;
            break;
        default:
            unmarkingFactor = 0.45; // Default balanced creativity
    }

    // Identify the x-position of the last defender on the opposing team

    const opponentsWithoutGoalie=opponents.filter(player=>player.pos!="gk");

    const lastDefender = attackingDirection === 1
        ? Math.max(...opponentsWithoutGoalie.map(player => player.x)) // Farthest in positive x direction
        : Math.min(...opponentsWithoutGoalie.map(player => player.x)); // Farthest in negative x direction

    // Determine the limit attackers cannot pass
    const limit = attackingDirection === 1
        ? Math.max(Math.max(lastDefender, ball.x), 300) // Ensure limit is at least halfway line
        : Math.min(Math.min(lastDefender, ball.x), 300); // Ensure limit is at least halfway line


    attackers.forEach(attacker => {
        const ballDistance=calculateDistance(attacker,ball);
        const limitDistance=calculateDistance(attacker,limit);
        const distanceEffectLimit=normalizeDistance(limitDistance);
        const distanceEffectBall=normalizeDistance(ballDistance);
        // Step 1: Move up the pitch towards the limit
        if (attackingDirection === 1) {
            attacker.x = Math.min(attacker.x + distanceEffectLimit* moveUpFactor * normalPlayerSpeed, limit);
        } else {
            attacker.x = Math.max(attacker.x - distanceEffectLimit* moveUpFactor * normalPlayerSpeed, limit);
        }

        // Step 2: Move down the pitch if the ball is downward compared to the attacker
        if (attackingDirection === 1 && ball.x < attacker.x) {
            attacker.x -= distanceEffectBall* moveDownFactor * normalPlayerSpeed; // Move downwards
        } else if (attackingDirection === -1 && ball.x > attacker.x) {
            attacker.x += distanceEffectBall* moveDownFactor * normalPlayerSpeed; // Move downwards
        }

        const originalPositionFactor = creativity === "high" ? 0.50 : 0.65;

        const dxForOriginal=attacker.x_dist - attacker.x;
        const dyForOriginal=attacker.y_dist - attacker.y;
        const distanceFromOriginal=Math.sqrt(dxForOriginal ** 2 + dyForOriginal ** 2);
        const unitXForOriginal=distanceFromOriginal>0? dxForOriginal/distanceFromOriginal:0;
        const unitYForOriginal=distanceFromOriginal>0? dyForOriginal/distanceFromOriginal:0;

        const distanceEffectOriginal=normalizeDistance(distanceFromOriginal);

        attacker.x += unitXForOriginal * distanceEffectOriginal* originalPositionFactor * normalPlayerSpeed;
        attacker.y += unitYForOriginal * distanceEffectOriginal* originalPositionFactor * normalPlayerSpeed;

        // Step 4: Adjust positioning to avoid marking player
        const closestOpponent = closestDefenders(1, attacker, opponents)[0];
        
        const dx = attacker.x - closestOpponent.x;
        const dy = attacker.y - closestOpponent.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);

        const distanceEffectUnmark=1-normalizeDistance(distance);

        const unitX = dx / distance;
        const unitY = dy / distance;

        attacker.x += unitX * distanceEffectUnmark* unmarkingFactor * normalPlayerSpeed;
        attacker.y += unitY * distanceEffectUnmark* unmarkingFactor * normalPlayerSpeed;
    
            
        //final check for offside
        if (attackingDirection === 1) {
            attacker.x = Math.min(attacker.x, limit); 
        } else {
            attacker.x = Math.max(attacker.x, limit); 
        }
        
    });
}







 
      

