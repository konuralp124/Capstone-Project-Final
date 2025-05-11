export function getPlayerState(  //changes start
    player,
    goal,
    teammates,
    opponents,
    R_shoot = 210,
    R_dribble_opponent = 30,
    R_dribble_teammates = 60,
    R_pass = 60,
    R_player = 214,
    w_shoot_angle = 0.4,
    w_shoot_distance = 0.3,
    w_shoot_defangle = 0.3,
    w_dribble_opponent = 0.4,
    w_dribble_teammates = 0.3,
    w_dribble_angle = 0.3,
    w_pass_availability = 0.7,
    w_pass_player = 0.3,
    allowedDistance=210,
) {
    // Find the closest defender to the player with the ball
    const closestDefender = closestDefenders(1, player, opponents)[0];

    // Calculate ShootingScore
    const shootingScore = calculateShootingScore(
        player,
        goal,
        closestDefender,
        R_shoot,
        w_shoot_angle,
        w_shoot_distance,
        w_shoot_defangle,
        allowedDistance
    );

    // Calculate DribblingScore
    const dribblingScore = calculateDribblingScore(
        player,
        goal,
        closestDefender,
        teammates,
        opponents,
        R_dribble_opponent,
        R_dribble_teammates,
        w_dribble_opponent,
        w_dribble_teammates,
        w_dribble_angle
    );

    // Calculate PassingScore
    const passingScore = calculatePassingScore(
        player,
        teammates,
        opponents,
        R_pass,
        R_player,
        w_pass_availability,
        w_pass_player
    );

    // Use the player's existing position (e.g., "def", "mid", "att") from player.pos
    const position = player.posLarge;

    // // Categorize scores into ranges (e.g., low, high)
    // let shootingCategory = shootingScore > 0.5 ? 2 : 1; // 2 = high, 1 = low
    // shootingCategory=shootingScore===0 ? 0 : shootingCategory;
    // let dribblingCategory = dribblingScore > 0.5 ? 2 : 1; // 2 = high, 1 = low
    // let passingCategory = passingScore > 0.5 ? 2 : 1; // 2 = high, 1 = low
   

    let shootingCategory;
    let dribblingCategory;
    let passingCategory;

    if (position==="gk"){
        dribblingCategory=0;
        shootingCategory=0;
        passingCategory=5;
    }

    else{

        if (shootingScore>0 && shootingScore<0.2){
            shootingCategory=1;
        }
        else if (shootingScore>=0.2 && shootingScore<0.4){
            shootingCategory=2;
        }
        else if (shootingScore>=0.4 && shootingScore<0.6){
            shootingCategory=3;
        }
        else if (shootingScore>=0.6 && shootingScore<0.8){
            shootingCategory=4;
        }
        else if (shootingScore>=0.8 && shootingScore<=1){
            shootingCategory=5;
        }
        else if(shootingScore===0){
            
            shootingCategory=0;
        }
       

        if (dribblingScore>=0 && dribblingScore<0.2){
            dribblingCategory=1;
        }
        else if (dribblingScore>=0.2 && dribblingScore<0.4){
            dribblingCategory=2;
        }
        else if (dribblingScore>=0.4 && dribblingScore<0.6){
            dribblingCategory=3;
        }
        else if (dribblingScore>=0.6 && dribblingScore<0.8){
            dribblingCategory=4;
        }
        else if (dribblingScore>=0.8 && dribblingScore<=1){
            dribblingCategory=5;
        }


        if (passingScore>=0 && passingScore<0.2){
            passingCategory=1;
        }
        else if (passingScore>=0.2 && passingScore<0.4){
            passingCategory=2;
        }
        else if (passingScore>=0.4 && passingScore<0.6){
            passingCategory=3;
        }
        else if (passingScore>=0.6 && passingScore<0.8){
            passingCategory=4;
        }
        else if (passingScore>=0.8 && passingScore<=1){
            passingCategory=5;
        } 
    }

    // Combine to create the state
    const state = {
        position: position, // This directly uses `player.posLarge`
        shootingScore: shootingCategory,
        dribblingScore: dribblingCategory,
        passingScore: passingCategory,
    };


    return state;
}

export function calculateShootingScore(player, goal, closestDefender, R = 214, W_angle = 0.4, W_distance = 0.3, W_defangle = 0.3, allowedDistance=210) {
    // Step 1: Define the vectors
    let allowedShootingDistance=false;
    const H = { x: goal.x1 - goal.xCenter, y: goal.y1 - goal.yCenter }; // Goal line vector from the center of the goal to one endpoints
    const G = { x: goal.xCenter - player.x, y: goal.yCenter - player.y }; // Player-to-goal vector
    const inverseG = { x: player.x - goal.xCenter, y: player.y - goal.yCenter }; // Goal-to-player vector
    const O = { x: closestDefender.x - player.x, y: closestDefender.y - player.y }; // Player-to-closest-defender vector

    // Step 2: Calculate the cosine of the angle θ for goal to player vector with respect to goal line
    const dotProductInverseG = H.x * inverseG.x + H.y * inverseG.y;
    const magnitudeH = Math.sqrt(H.x ** 2 + H.y ** 2);
    const magnitudeInverseG = Math.sqrt(inverseG.x ** 2 + inverseG.y ** 2);
    if (magnitudeInverseG<allowedDistance){
    	allowedShootingDistance=true;
    }
    const cosThetaG = dotProductInverseG / (magnitudeH * magnitudeInverseG);
    const S_angle = 1 - Math.abs(cosThetaG); // Score for deviation from 90 degrees

    // Step 3: Calculate the distance score
    const magnitudeG = Math.sqrt(G.x ** 2 + G.y ** 2);; // Distance to the goal
    const S_distance = Math.max(0, 1 - magnitudeG / R);

    // Step 4: Calculate the defender angle score
    const dotProductO = G.x * O.x + G.y * O.y;
    const magnitudeO = Math.sqrt(O.x ** 2 + O.y ** 2);
    const cosThetaO = dotProductO / (magnitudeG * magnitudeO);
    const S_defangle = Math.acos(cosThetaO) / Math.PI; // Normalize angle deviation (closer to π is better)

    // Step 5: Combine the scores
    const S_score = allowedShootingDistance * (W_angle * S_angle + W_distance * S_distance + W_defangle * S_defangle);

    return S_score;
}


export function calculateDribblingScore(player, goal, closestDefender, teammates, opponents, R_opponent = 30, R_teammates = 60, w_opponent = 0.4, w_teammates = 0.3, w_angle = 0.3) {
    // Step 1: Proximity to the Closest Opponent
    const O = { x: closestDefender.x - player.x, y: closestDefender.y - player.y }; // Player-to-closest-opponent vector
    const O_distance = Math.sqrt(O.x ** 2 + O.y ** 2); // Magnitude of O⃗
    const D_opponent = Math.min(1, O_distance / R_opponent); // Normalized proximity to the closest opponent

    // Step 2: Teammate Availability Affecting Dribbling Decision (closest 5 teammates that the player would like to see more)
    // Step 2A: Sort teammates by distance to the player
	const sortedTeammates = teammates.sort((a, b) => {
	    const distanceA = calculateDistance(player, a);
	    const distanceB = calculateDistance(player, b);
	    return distanceA - distanceB; // Sort in ascending order of distance
	});

	// Step 2B: Teammate Availability
	const closestTeammates = sortedTeammates.slice(0, 5); // Take the closest 5 teammates
	const teammateDistancesFromOpponent = closestTeammates.map(teammate => {
	    // Use closestDefenders function to find the closest opponent for each teammate
	    const closestOpponent = closestDefenders(1, teammate, opponents)[0]; // Get the closest opponent
	    return calculateDistance(teammate, closestOpponent); // Distance to the closest opponent
	});

	const D_avgTeammates = teammateDistancesFromOpponent.reduce((sum, d) => sum + d, 0) / closestTeammates.length; // Average distance of closest 5 teammates to their opponents
	const D_teammates = Math.max(0, 1 - D_avgTeammates / R_teammates); // Normalized teammate availability score
	//the higher D_avgTeammates, the lower score for dribbling as the player would have more choices to do, 
	//and if teammates are not avaliable, the player would be more likely to dribble


    // Step 3: Effect of Angle Between Player-to-Goal and Player-to-Closest-Defender Vectors
    const G = { x: goal.xCenter - player.x, y: goal.yCenter - player.y }; // Player-to-goal vector
    const dotProduct = G.x * O.x + G.y * O.y; // Dot product of G⃗ and O⃗
    const magnitudeG = Math.sqrt(G.x ** 2 + G.y ** 2);
    const cosTheta = dotProduct / (magnitudeG * O_distance); // Cosine of the angle θ
    const D_angle = Math.acos(cosTheta) / Math.PI; // Normalize angle deviation (closer to π is better)

    // Step 4: Combine the Scores
    const DribbleScore = w_opponent * D_opponent + w_teammates * D_teammates + w_angle * D_angle;

    return DribbleScore;
}


export function calculatePassingScore(player, teammates, opponents, Rpass = 60, Rplayer = 220, w_availability = 0.7, w_player = 0.3) {
    // Step 1: Teammate Availability
    const teammateDistances = teammates.map(teammate => {
        // Use closestDefenders function to find the closest opponent to each teammate
        const closestOpponent = closestDefenders(1, teammate, opponents)[0]; // Closest opponent
        return calculateDistance(teammate, closestOpponent); // Distance between teammate and closest opponent
    });

    const D_avg = teammateDistances.reduce((sum, d) => sum + d, 0) / teammates.length; // Average distance of teammates to their closest opponents
    const P_availability = Math.min(1, D_avg / Rpass); // Normalize availability score

    // Step 2: Player-to-Teammate Distance
    const playerToTeammateDistances = teammates.map(teammate => calculateDistance(player, teammate)); // Distances from player to all teammates
    const avgPlayerToTeammates = playerToTeammateDistances.reduce((sum, d) => sum + d, 0) / teammates.length;
    const P_player = Math.max(0, 1 - avgPlayerToTeammates / Rplayer); // Normalize player-to-teammate distance

    // Step 3: Combine the Scores
    const PassingScore = w_availability * P_availability + w_player * P_player;

    return PassingScore;
}


export function closestDefenders(n, player, defendingTeam) {
 	 // Calculate distances to all defenders
    const distances = defendingTeam.map(defender => ({
        defender,
        distance: calculateDistance(player, defender),
    }));

    // Sort by distance (ascending)
    distances.sort((a, b) => a.distance - b.distance);

    // Return the closest `n` defenders
    return distances.slice(0, n).map(entry => entry.defender);
}

export function calculateDistance(obj1, obj2) {
    return Math.sqrt(
        Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2)
    );
}


export function calculateDistanceFromGoal(obj1, obj2) {
    return Math.sqrt(
        Math.pow(obj1.x - obj2.xCenter, 2) + Math.pow(obj1.y - obj2.yCenter, 2)
    );
}

// Flatten a team's structure into a single list of players
export function flattenTeam(team) {
    return [
    	team.goalkeeper,
        ...team.defenders,
        ...team.midfielders,
        ...team.forwards,
    ];
}

