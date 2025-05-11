// import { readFile, writeFile } from 'fs/promises';
// import path from 'path';
// const Q_PATH = path.resolve('./qTables.json');
const ENDPOINT = '/qtable';


export function initializeQTableFirstLayer() {
    const QTableFirstLayer = {};

    // Define all possible states
    const positions = ["gk","def", "mid", "att"]; // Player positions
    const shootingCategories = [0, 1, 2, 3, 4, 5];    // Shooting categories (0: 0, 1: 0-0.2, 2: 0.2-0.4, ...... 5.0.8-1)
    const dribblingCategories = [1, 2,3,4,5];      // Dribbling categories (1: 0-0.2, 2: 0.2-0.4, ...... 5.0.8-1)
    const passingCategories = [1, 2,3,4,5];        // Passing categories 1: 0-0.2, 2: 0.2-0.4, ...... 5.0.8-1)

    // Iterate over all combinations of states
    positions.forEach(position => {
        if (position==="gk"){
            const stateKey = `${position}_0_0_5`;
            QTableFirstLayer[stateKey] = {
                pass: 0,   // Initial Q-value 
            };
        }
        else{
            shootingCategories.forEach(shootingScore => {
                if(shootingScore==0){
                    dribblingCategories.forEach(dribblingScore => {
                        passingCategories.forEach(passingScore => {
                            const stateKey = `${position}_${shootingScore}_${dribblingScore}_${passingScore}`;
                            QTableFirstLayer[stateKey] = {
                                dribble: 0, // Initial Q-value for dribbling
                                pass: 0,    // Initial Q-value for passing
                            };
                        });
                    });                  
                }
                else{
                    dribblingCategories.forEach(dribblingScore => {
                        passingCategories.forEach(passingScore => {
                            const stateKey = `${position}_${shootingScore}_${dribblingScore}_${passingScore}`;
                            QTableFirstLayer[stateKey] = {
                                shoot: 0,   // Initial Q-value for shooting
                                dribble: 0, // Initial Q-value for dribbling
                                pass: 0,    // Initial Q-value for passing
                            };
                        });
                    });                   
                }

            });
        }

    });

    return QTableFirstLayer;
}


export function initializeQTableSecondLayer() {
    const QTableSecondLayer = {};

    // Define all possible states
    const positions = ["gk", "def", "mid", "att"]; // Player positions
    const shootingCategories = [0, 1, 2,3,4,5];    // Shooting categories 
    const dribblingCategories = [1, 2,3,4,5];      // Dribbling categories 
    const passingCategories = [1, 2,3,4,5];        // Passing categories 

    // Iterate over all combinations of states
    positions.forEach(position => {
        if (position==="gk"){
            const stateKey = `${position}_0_0_5`;
            QTableSecondLayer[stateKey] = {
                passToFeetLessDirect: 0,   //Q-Values for different type of passes
                //passToSpaceLessDirect: 0, 
                passToFeetDirect: 0,
                //passToSpaceDirect: 0,   
            };
        }

        else{
           shootingCategories.forEach(shootingScore => {
                dribblingCategories.forEach(dribblingScore => {
                    passingCategories.forEach(passingScore => {
                        const stateKey = `${position}_${shootingScore}_${dribblingScore}_${passingScore}`;
                        QTableSecondLayer[stateKey] = {
                            passToFeetLessDirect: 0,   //Q-Values for different type of passes
                            passToSpaceLessDirect: 0, 
                            passToFeetDirect: 0,
                            passToSpaceDirect: 0,   
                        };
                    });
                });
            });            
       }
 
    });

    return QTableSecondLayer;
}


let lastGoodMap = null;

async function loadMap() {
  try {
    const res  = await fetch('/qtable');
    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    if (!text.trim()) throw new Error('empty');
    const m = JSON.parse(text);
    lastGoodMap = m;
    return m;
  } catch (err) {
    console.warn('loadMap failed, using lastGoodMap', err);
    return lastGoodMap || {};
  }
}


// async function loadMap() {
//   const res = await fetch(ENDPOINT, { method: 'GET' });
//   if (!res.ok) {
//     // 404 or 500, etc.
//     console.log("res not ok");
//     return {};
//   }

//   const text = await res.text();
//   if (!text.trim()) {
//     // empty body → treat as empty map
//     console.log("empty");
//     return {};
//   }

//   try {
//     return JSON.parse(text);
//   } catch (err) {
//     console.warn('loadMap: invalid JSON, returning empty map', text);
//     return {};
//   }
// }



async function saveMap(map) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:   JSON.stringify(map),
  });
  if (!res.ok) throw new Error('Failed to save Q-tables');
  return await res.json();
}


export async function getQTableFirstLayer(key) {
  const map = await loadMap();
  if (!map[key]?.firstLayer) {
    map[key] = map[key] || {};
    map[key].firstLayer = initializeQTableFirstLayer();  // your zero-init
    await saveMap(map);
  }
  return map[key].firstLayer;
}

export async function getQTableSecondLayer(key) {
  const map = await loadMap();
  if (!map[key]?.secondLayer) {
    map[key] = map[key] || {};
    map[key].secondLayer = initializeQTableSecondLayer();
    await saveMap(map);
  }
  return map[key].secondLayer;
}

export async function saveQTablesForKey(key, firstLayer, secondLayer) {
  const map = await loadMap();
  map[key] = { firstLayer, secondLayer };
  await saveMap(map);
}



export function updateQTableFirstLayer(qTable, currentState, action, reward, nextState, isTerminal, alpha, gamma, explorationRate) {
    
    if (currentState==null){ //after deadball: deadballs are not part of our qTables, so state =null if a pass is made from goalkick,kickoff,throwin)
        return;
    }
    // Generate the state key
    const stateKey = `${currentState.position}_${currentState.shootingScore}_${currentState.dribblingScore}_${currentState.passingScore}`;

    // Access the current Q-value
    const currentQ = qTable[stateKey][action];

    let newQ;
    if (isTerminal) {
        // Terminal state update
        newQ = currentQ + alpha * (reward - currentQ);
    } else {
        // Non-terminal state update
        const nextStateKey = `${nextState.position}_${nextState.shootingScore}_${nextState.dribblingScore}_${nextState.passingScore}`;

        const nextQValues = Object.values(qTable[nextStateKey]);

        // Find the maximum Q-value and the indices of other Q-values
        const QMaxNext = Math.max(...nextQValues);
        const QOtherValues = nextQValues.filter(q => q !== QMaxNext); // Remaining Q-values

        const sumOthers = QOtherValues.reduce((sum, q) => sum + q, 0);

        const QNextAvg = ((1 - explorationRate) * QMaxNext + (explorationRate / 2) * sumOthers) / 3;

        // Update Q-value for non-terminal states
        newQ = currentQ + alpha * (reward + gamma * QNextAvg - currentQ);
    }

    // Update the Q-value in the Q-table
    qTable[stateKey][action] = newQ;
}


export function updateQTableSecondLayer(qTable, currentState, action, reward, alpha, gamma, explorationRate) {
        // Generate the state key
    if (currentState==null){ //after deadball: deadballs are not part of our qTables, so state =null if a pass is made from goalkick,kickoff,throwin)
        return;
    }
    const stateKey = `${currentState.position}_${currentState.shootingScore}_${currentState.dribblingScore}_${currentState.passingScore}`;

    // Access the current Q-value
    const currentQ = qTable[stateKey][action];

    const newQ = currentQ + alpha * (reward - currentQ);
    qTable[stateKey][action]=newQ;
}

export function makeDecisionFirstLayer(currentState, QTable, explorationRate) {
    // Get the Q-values for the current state
    const stateKey = `${currentState.position}_${currentState.shootingScore}_${currentState.dribblingScore}_${currentState.passingScore}`;
    const QValues = QTable[stateKey];

    // if (currentState.position==="gk"){
    //     return "pass";
    // }

    // if (currentState.shootingScore===0){
    //     delete QValues.shoot;
    // }


    if (!QValues) {
        throw new Error("State not found in QTable");
    }

    // Extract the Q-values for each action
    const actions = Object.keys(QValues);
    const actionValues = Object.values(QValues);

    // Find the action with the maximum Q-value
    const maxQ = Math.max(...actionValues);
    const maxAction = actions[actionValues.indexOf(maxQ)];

    // If exploring, choose an action that is not the one with the maximum Q-value
    if (Math.random() < explorationRate) {
        // Filter out the max action and pick a random one among the others
        const otherActions = actions.filter(action => action !== maxAction);
        return otherActions.length>0?otherActions[Math.floor(Math.random() * otherActions.length)]:maxAction;
    }

    // If not exploring, choose the action with the maximum Q-value
    return maxAction;
}


export function makeDecisionSecondLayer(currentState, QTable, explorationRate) {
    // Get the Q-values for the current state
    const stateKey = `${currentState.position}_${currentState.shootingScore}_${currentState.dribblingScore}_${currentState.passingScore}`;
    const QValues = QTable[stateKey];
    if (!QValues) {
        throw new Error("State not found in QTable");
    }

    // Extract the Q-values for each action
    const actions = Object.keys(QValues);
    const actionValues = Object.values(QValues);

    // Find the action with the maximum Q-value
    const maxQ = Math.max(...actionValues);
    const maxAction = actions[actionValues.indexOf(maxQ)];

    // If exploring, choose an action that is not the one with the maximum Q-value
    if (Math.random() < explorationRate) {
        // Filter out the max action and pick a random one among the others
        const otherActions = actions.filter(action => action !== maxAction);
        return otherActions.length>0?otherActions[Math.floor(Math.random() * otherActions.length)]:maxAction;
    }

    // If not exploring, choose the action with the maximum Q-value
    return maxAction;
}



export function printQTableFirstLayer(qTable) {
    console.log("=== First Layer Q-Table ===");

    for (const stateKey in qTable) {
        console.log(`State: ${stateKey}`);
        const actions = qTable[stateKey];
        for (const [action, qValue] of Object.entries(actions)) {
            console.log(`   Action: ${action.padEnd(10)} | Q-Value: ${qValue.toFixed(4)}`);
        }
        console.log("-----------------------------------------");
    }
}

export function printQTableSecondLayer(qTable) {
    console.log("=== Second Layer Q-Table ===");

    for (const stateKey in qTable) {
        console.log(`State: ${stateKey}`);
        const actions = qTable[stateKey];
        for (const [action, qValue] of Object.entries(actions)) {
            console.log(`   Action: ${action.padEnd(20)} | Q-Value: ${qValue.toFixed(4)}`);
        }
        console.log("-----------------------------------------");
    }
}

export function printQTablesRaw(qtable1, qtable2) {
    const rowCount = Object.keys(qtable1).length;
    //console.log(rowCount);
    console.log("First Layer: ");
    console.table(qtable1);
    console.log("Second Layer: ");
    console.table(qtable2);
}







