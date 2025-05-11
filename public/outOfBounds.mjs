import {
    findClosestPlayerToBall
} from './movements.mjs';

export function handleThrowIn(ball, attackingTeam, defendingTeam, horizontalWidth, verticalHeight) {
    // Step 1: Adjust ball's y value to ensure it's within bounds
    if (ball.y <0) {
        ball.y = 0;
    } else if (ball.y>verticalHeight) {
        ball.y = 400;
    }

    // Step 2: Flatten the attacking team to get all field players (excluding goalkeeper)
    const attackingPlayers = [
        ...attackingTeam.defenders,
        ...attackingTeam.midfielders,
        ...attackingTeam.forwards,
    ];

    // Step 3: Use findClosestPlayerToBall to determine the throw-in player
    const throwInPlayer = findClosestPlayerToBall(attackingPlayers, ball); // Corrected parameter order
    throwInPlayer.x = ball.x;
    if (ball.y===0){
        throwInPlayer.y = ball.y-throwInPlayer.radius-ball.radius;
    }
    else{
        throwInPlayer.y = ball.y+throwInPlayer.radius+ball.radius;
    }

    // Step 4: Define a helper function to adjust player positions
    function adjustPlayerPosition(player) {
        if ((ball.x < horizontalWidth/2 && player.x > horizontalWidth/2) || (ball.x > horizontalWidth/2 && player.x < horizontalWidth/2)) {
            // if the ball and the player are in different halves, move the player across the halfway line getting closer to the ball by the amount that is equal to ball's distance to the halfway line
            player.x += ball.x - horizontalWidth/2;
        } else {
            //if the ball and the player are in the same halves, move the player halfway towards the ball's x position
            player.x += (ball.x - player.x) / 2;
        }
        player.y = player.y_dist; // Reset y to the original position
    }

    // Step 5: Adjust positions for the rest of the attacking team (excluding the throw-in player)
    attackingPlayers
        .filter(player => player !== throwInPlayer)
        .forEach(adjustPlayerPosition);

    // Step 6: Adjust positions for the defending team (excluding goalkeeper)
    const defendingPlayers = [
        ...defendingTeam.defenders,
        ...defendingTeam.midfielders,
        ...defendingTeam.forwards,
    ];

    defendingPlayers.forEach(adjustPlayerPosition);
    console.log("throwInPlayer: ", throwInPlayer);
    console.log("attacking players: ", attackingPlayers);
    console.log("defending players: ", defendingPlayers);

    return throwInPlayer;
}


export function handleGoalKick(ball, attackingTeam, defendingTeam) {
    // Step 1: Set ball's position to the attacking team's goalkeeper's position
    const goalkeeper = attackingTeam.goalkeeper;
    if (attackingTeam.attackingGoal.goalDirection==="positive"){
        ball.x = goalkeeper.x+goalkeeper.radius+ball.radius;
    }
    else{
        ball.x = goalkeeper.x-goalkeeper.radius-ball.radius;
    }

    ball.y = goalkeeper.y+goalkeeper.radius+ball.radius;


    // Step 2: Define a helper function to reset player positions
    function resetPlayerPosition(player) {
        player.x = player.x_dist; // Original x position
        player.y = player.y_dist; // Original y position
    }

    // Step 3: Reset positions for all players in the attacking team
    [...attackingTeam.defenders, ...attackingTeam.midfielders, ...attackingTeam.forwards].forEach(resetPlayerPosition);

    // Step 4: Reset positions for all players in the defending team
    [...defendingTeam.defenders, ...defendingTeam.midfielders, ...defendingTeam.forwards].forEach(resetPlayerPosition);

    // Goalkeeper positions remain unchanged, as they don't need resetting.
    return goalkeeper;
}


export function handleKickOff(ball, attackingTeam, defendingTeam, horizontalWidth, verticalHeight) {
    // Step 1: Place the ball and the striker at the center of the pitch
    const centerX = horizontalWidth/2; // Center of the pitch in x
    const centerY = verticalHeight/2; // Center of the pitch in y

    ball.x = centerX;
    ball.y = centerY;

    // Find the striker in the attacking team (assuming it's in the attackers array)
    const striker = attackingTeam.forwards.find(player => player.pos === "st");
    if (striker) {
        striker.x = centerX;
        striker.y = centerY-striker.radius;
    }

    // Step 2: Define a helper function to adjust player positions based on goal direction
    function adjustPlayerPosition(player, goalDirection) {
        if (goalDirection === "positive") {
            player.x = player.x_dist / 2; // come back on your half by getting twice as closer to your own goal
        } else if (goalDirection === "negative") {
            player.x = centerX+player.x_dist / 2; // come back on your half by getting twice as closer to your own goal
        }
        // Keep the original y position
        player.y = player.y_dist;
    }

    // Step 3: Adjust positions for all players in the attacking team except the goalkeeper and striker
    [...attackingTeam.defenders, ...attackingTeam.midfielders, ...attackingTeam.forwards].forEach(player => {
        if (player !== striker) {
            adjustPlayerPosition(player, attackingTeam.attackingGoal.goalDirection);
        }
    });

    // Step 4: Adjust positions for all players in the defending team except the goalkeeper
    [...defendingTeam.defenders, ...defendingTeam.midfielders, ...defendingTeam.forwards].forEach(player => {
        adjustPlayerPosition(player, defendingTeam.attackingGoal.goalDirection);
    });

    // Goalkeeper positions remain unchanged

    return striker;
}


// export function handleFoul(
//   ball,
//   attackingTeam,
//   defendingTeam,
//   goal,
//   horizontalWidth = 600,
//   verticalHeight  = 400,
//   maxDistance     = 210
// ) {
//   // --- constants & helpers ---
//   const unitsPerMeter   = 6;
//   const penaltyDepth    = 16.5 * unitsPerMeter;  // 99
//   const penaltySpotDist = 11   * unitsPerMeter;  // 66
//   const wallDist        = 9.15 * unitsPerMeter;  // 54.9 ≈55
//   const wallSize        = 3;
//   const numDefInBox     = 6;
//   const numAtkInBox     = 6;
//   // offsets *inside* the box
//   const defOffsetUnits  = unitsPerMeter;      // ~6 units in
//   const atkOffsetUnits  = unitsPerMeter * 2;  // ~12 units in

//   // flatten out the two squads (including keepers)
//   const allAttackers = [
//     attackingTeam.goalkeeper,
//     ...attackingTeam.defenders,
//     ...attackingTeam.midfielders,
//     ...attackingTeam.forwards
//   ];
//   const allDefenders = [
//     defendingTeam.goalkeeper,
//     ...defendingTeam.defenders,
//     ...defendingTeam.midfielders,
//     ...defendingTeam.forwards
//   ];
//   const allPlayers = allAttackers.concat(allDefenders);

//   // put everyone back to home
//   allPlayers.forEach(p => {
//     p.x = p.x_dist;
//     p.y = p.y_dist;
//   });

//   // pick & place the foultaker
//   const foultaker = findClosestPlayerToBall(
//     [...attackingTeam.defenders, ...attackingTeam.midfielders, ...attackingTeam.forwards],
//     ball
//   );
//   foultaker.x = ball.x;
//   foultaker.y = ball.y;

//   // distance & penalty‐area test
//   const dx       = goal.xCenter - ball.x;
//   const dy       = goal.yCenter - ball.y;
//   const distGoal = Math.hypot(dx, dy);
//   const inBox    = goal.goalDirection === "positive"
//     ? ball.x >= horizontalWidth - penaltyDepth
//     : ball.x <= penaltyDepth;

//   // 1) PENALTY
//   if (inBox) {
//     // spot‐kick
//     foultaker.x = (goal.goalDirection === "positive")
//       ? goal.xCenter - penaltySpotDist
//       : goal.xCenter + penaltySpotDist;
//     foultaker.y = goal.yCenter;

//     // defender‐keeper on the goal line
//     defendingTeam.goalkeeper.x = goal.xCenter;
//     defendingTeam.goalkeeper.y = goal.yCenter;
//   }
//   // 2) FREE‐KICK (within maxDistance but outside box)
//   else if (distGoal < maxDistance) {
//     // build the 3-man wall
//     const ux = dx / distGoal, uy = dy / distGoal;
//     const px = -uy, py = ux;
//     const wallPlayers = defendingTeam.defenders
//       .slice()
//       .sort((a,b) => {
//         const da = Math.hypot(a.x_dist - ball.x, a.y_dist - ball.y);
//         const db = Math.hypot(b.x_dist - ball.x, b.y_dist - ball.y);
//         return da - db;
//       }).slice(0, wallSize);

//     wallPlayers.forEach((p,i) => {
//       const offset = (i - (wallSize - 1)/2) * (p.radius*2);
//       p.x = ball.x + ux*wallDist + px*offset;
//       p.y = ball.y + uy*wallDist + py*offset;
//     });

//     // pick 6 closest outfield defenders (excluding the wall) to drop into the box
//     const defOutfield = [...defendingTeam.defenders,
//                           ...defendingTeam.midfielders,
//                           ...defendingTeam.forwards]
//       .filter(p => !wallPlayers.includes(p))
//       .sort((a,b) => {
//         const da = Math.hypot(a.x_dist - ball.x, a.y_dist - ball.y);
//         const db = Math.hypot(b.x_dist - ball.x, b.y_dist - ball.y);
//         return da - db;
//       })
//       .slice(0, numDefInBox);

//     defOutfield.forEach((p,i) => {
//       const frac = (i + 1) / (numDefInBox + 1);
//       p.y = goal.y1 + frac*(goal.y2 - goal.y1);
//       p.x = (goal.goalDirection==="positive")
//         ? horizontalWidth - penaltyDepth + defOffsetUnits
//         : penaltyDepth - defOffsetUnits;
//     });

//     // pick 6 closest attackers (excluding the kicker) to push into the box, but further from goal than the defenders
//     const atkCandidates = [...attackingTeam.defenders,
//                            ...attackingTeam.midfielders,
//                            ...attackingTeam.forwards]
//       .filter(p => p !== foultaker)
//       .sort((a,b) => {
//         const da = Math.hypot(a.x_dist - ball.x, a.y_dist - ball.y);
//         const db = Math.hypot(b.x_dist - ball.x, b.y_dist - ball.y);
//         return da - db;
//       })
//       .slice(0, numAtkInBox);

//     atkCandidates.forEach((p,i) => {
//       const frac = (i + 1) / (numAtkInBox + 1);
//       p.y = goal.y1 + frac*(goal.y2 - goal.y1);
//       p.x = (goal.goalDirection==="positive")
//         ? horizontalWidth - penaltyDepth + atkOffsetUnits
//         : penaltyDepth - atkOffsetUnits;
//     });
//   }
//   // 3) NORMAL FOUL (“dropped ball” style)
//   else {
//     // everyone else retreats halfway toward the ball
//     function retreat(p) {
//       p.x = p.x_dist + (ball.x - p.x_dist) / 2;
//       //p.y = p.y_dist + (ball.y - p.y_dist) / 2;
//     }
//     allPlayers
//       .filter(p => p !== foultaker && p.posLarge !== "gk")
//       .forEach(retreat);
//   }

//   // --- common post-processing for *all* three cases ---
//   //  A) barrier: push every outfielder at least wallDist away from the ball
//   allPlayers
//     .filter(p => p !== foultaker && p.posLarge !== "gk")
//     .forEach(p => {
//       const dx = p.x - ball.x, dy = p.y - ball.y;
//       const d  = Math.hypot(dx, dy);
//       if (d < wallDist) {
//         const nx = d ? dx/d : 1, ny = d ? dy/d : 0;
//         p.x = ball.x + nx*wallDist;
//         p.y = ball.y + ny*wallDist;
//       }
//       // clamp inside pitch (leave  radius margin)
//       p.x = Math.max(p.radius, Math.min(horizontalWidth  - p.radius, p.x));
//       p.y = Math.max(p.radius, Math.min(verticalHeight - p.radius, p.y));
//     });

//   //  B) simple overlap resolution: nudge any two outfielders apart by whatever they overlap
//   const outfielders = allPlayers.filter(p => p.posLarge !== "gk");
//   outfielders.forEach(p => {
//     outfielders.forEach(q => {
//       if (p === q) return;
//       const dx = p.x - q.x, dy = p.y - q.y;
//       const dist = Math.hypot(dx, dy);
//       const minDist = p.radius + q.radius;
//       if (dist > 0 && dist < minDist) {
//         const overlap = minDist - dist;
//         const nx = dx/dist, ny = dy/dist;
//         p.x += nx * overlap;
//         p.y += ny * overlap;
//         // clamp again
//         p.x = Math.max(p.radius, Math.min(horizontalWidth  - p.radius, p.x));
//         p.y = Math.max(p.radius, Math.min(verticalHeight - p.radius, p.y));
//       }
//     });
//   });

//   //  C) lock both keepers at home
//   attackingTeam.goalkeeper.x = attackingTeam.goalkeeper.x_dist;
//   attackingTeam.goalkeeper.y = attackingTeam.goalkeeper.y_dist;
//   defendingTeam.goalkeeper.x = defendingTeam.goalkeeper.x_dist;
//   defendingTeam.goalkeeper.y = defendingTeam.goalkeeper.y_dist;

//   // finally, return who takes it and the restart type
//   const status = inBox
//     ? "penalty"
//     : (distGoal < maxDistance ? "freekick" : "foul");
//   return { taker: foultaker, status };
// }

export function handleFoul(
  ball,
  attackingTeam,
  defendingTeam,
  goal,
  horizontalWidth = 600,
  verticalHeight  = 400,
  maxDistance     = 210
) {
  // constants
  const unitsPerMeter   = 6;
  const penaltyDepth    = 16.5 * unitsPerMeter;  // 99
  const penaltySpotDist = 11   * unitsPerMeter;  // 66
  const wallDist        = 9.15 * unitsPerMeter;  // ≈55
  const wallSize        = 3;
  const numDefInBox     = 6;
  const numAtkInBox     = 6;
  const defOffsetUnits  = unitsPerMeter;      // ~6 units in
  const atkOffsetUnits  = unitsPerMeter * 2;  // ~12 units in

  // gather & reset
  const allAttackers = [
    attackingTeam.goalkeeper,
    ...attackingTeam.defenders,
    ...attackingTeam.midfielders,
    ...attackingTeam.forwards
  ];
  const allDefenders = [
    defendingTeam.goalkeeper,
    ...defendingTeam.defenders,
    ...defendingTeam.midfielders,
    ...defendingTeam.forwards
  ];
  const allPlayers = allAttackers.concat(allDefenders);

  allPlayers.forEach(p => {
    p.x = p.x_dist;
    p.y = p.y_dist;
  });

  // pick foultaker
  const foultaker = findClosestPlayerToBall(
    [...attackingTeam.defenders, ...attackingTeam.midfielders, ...attackingTeam.forwards],
    ball
  );
  foultaker.x = ball.x;
  foultaker.y = ball.y;

  // goal distance & box test
  const dx       = goal.xCenter - ball.x;
  const dy       = goal.yCenter - ball.y;
  const distGoal = Math.hypot(dx, dy);
  const inBox    = goal.goalDirection === "positive"
    ? ball.x >= horizontalWidth - penaltyDepth
    : ball.x <= penaltyDepth;

  // 1) PENALTY
  if (inBox) {
    foultaker.x = goal.goalDirection === "positive"
      ? goal.xCenter - penaltySpotDist
      : goal.xCenter + penaltySpotDist;
    foultaker.y = goal.yCenter;
    defendingTeam.goalkeeper.x = goal.xCenter;
    defendingTeam.goalkeeper.y = goal.yCenter;
  }
  // 2) FREE-KICK (in shooting range but outside box)
  else if (distGoal < maxDistance) {
    // 2a) build the wall
    const ux = dx / distGoal, uy = dy / distGoal;
    const px = -uy, py = ux;
    const wallPlayers = defendingTeam.defenders
      .slice()
      .sort((a,b) => Math.hypot(a.x_dist - ball.x, a.y_dist - ball.y)
                   - Math.hypot(b.x_dist - ball.x, b.y_dist - ball.y))
      .slice(0, wallSize);
    wallPlayers.forEach((p,i) => {
      const off = (i - (wallSize-1)/2) * (p.radius*2);
      p.x = ball.x + ux*wallDist + px*off;
      p.y = ball.y + uy*wallDist + py*off;
    });

    // 2b) decide which half of the box to cluster into
    const topHalf    = ball.y < goal.yCenter;  // ball above center → cluster into bottom half
    const regionY1   = topHalf ? goal.yCenter : goal.y1;
    const regionY2   = topHalf ? goal.y2        : goal.yCenter;

    // 2c) pick & place 6 defenders inside box
    const defOutfield = [...defendingTeam.defenders,
                          ...defendingTeam.midfielders,
                          ...defendingTeam.forwards]
      .filter(p => !wallPlayers.includes(p))
      .sort((a,b) => Math.hypot(a.x_dist - ball.x, a.y_dist - ball.y)
                   - Math.hypot(b.x_dist - ball.x, b.y_dist - ball.y))
      .slice(0, numDefInBox);
    defOutfield.forEach((p,i) => {
      const frac = (i+1)/(numDefInBox+1);
      p.y = regionY1 + frac*(regionY2 - regionY1);
      p.x = goal.goalDirection === "positive"
        ? horizontalWidth - penaltyDepth + defOffsetUnits
        : penaltyDepth - defOffsetUnits;
    });

    // 2d) pick & place 6 attackers inside box, further from goal
    const atkCandidates = [...attackingTeam.defenders,
                           ...attackingTeam.midfielders,
                           ...attackingTeam.forwards]
      .filter(p => p !== foultaker)
      .sort((a,b) => Math.hypot(a.x_dist - ball.x, a.y_dist - ball.y)
                   - Math.hypot(b.x_dist - ball.x, b.y_dist - ball.y))
      .slice(0, numAtkInBox);
    atkCandidates.forEach((p,i) => {
      const frac = (i+1)/(numAtkInBox+1);
      p.y = regionY1 + frac*(regionY2 - regionY1);
      p.x = goal.goalDirection === "positive"
        ? horizontalWidth - penaltyDepth + atkOffsetUnits
        : penaltyDepth - atkOffsetUnits;
    });
  }
  // 3) NORMAL FOUL (“dropped ball” style)
  else {
    allPlayers
      .filter(p => p !== foultaker && p.posLarge !== "gk")
      .forEach(p => {
        p.x = p.x_dist + (ball.x - p.x_dist)/2;
        //p.y = p.y_dist + (ball.y - p.y_dist)/2;
      });
  }

  // 4) push everyone (except foultaker & GKs) to at least 9.15 m from the ball & clamp inside pitch
  allPlayers
    .filter(p => p !== foultaker && p.posLarge !== "gk")
    .forEach(p => {
      const dx = p.x - ball.x, dy = p.y - ball.y;
      const d  = Math.hypot(dx, dy);
      if (d < wallDist) {
        const nx = d? dx/d : 1, ny = d? dy/d : 0;
        p.x = ball.x + nx*wallDist;
        p.y = ball.y + ny*wallDist;
      }
      p.x = Math.max(p.radius, Math.min(horizontalWidth - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(verticalHeight - p.radius, p.y));
    });

  // 5) simple overlap resolution among all outfielders
  const outfielders = allPlayers.filter(p => p.posLarge !== "gk");
  outfielders.forEach(p => {
    outfielders.forEach(q => {
      if (p === q) return;
      const dx = p.x - q.x, dy = p.y - q.y;
      const dist = Math.hypot(dx, dy),
            minD = p.radius + q.radius;
      if (dist > 0 && dist < minD) {
        const overlap = minD - dist,
              nx      = dx/dist, ny = dy/dist;
        p.x += nx*overlap;
        p.y += ny*overlap;
        p.x = Math.max(p.radius, Math.min(horizontalWidth - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(verticalHeight - p.radius, p.y));
      }
    });
  });

  // 6) lock both keepers at home
  attackingTeam.goalkeeper.x = attackingTeam.goalkeeper.x_dist;
  attackingTeam.goalkeeper.y = attackingTeam.goalkeeper.y_dist;
  defendingTeam.goalkeeper.x = defendingTeam.goalkeeper.x_dist;
  defendingTeam.goalkeeper.y = defendingTeam.goalkeeper.y_dist;

  // return
  const status = inBox
    ? "penalty"
    : (distGoal < maxDistance ? "freekick" : "foul");
  return { taker: foultaker, status };
}

