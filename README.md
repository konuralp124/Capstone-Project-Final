# Modifiable and Realistic Football Simulation with Q-Learning

A 2D soccer simulation that uses Q-learning with action-defined states and normalized categories for realistic gameplay and tactical decision-making.


## 📺 Demo

Watch the simulation in action: [Simulation Video](https://youtu.be/3-cW3O9PSsQ?si=CO3ER8HLQ_yoAHEs)


## 📄 Full Report

For a comprehensive academic treatment of this project, including detailed methodology, mathematical formulations, and evaluation results, please refer to the [full research paper](KonuralpSarisozenCapstonePaper.pdf).


## Reference Format

Konuralp Sarisozen. 2025. A Modifiable and Realistic Football Simulation: Using Action-defined States with Normalized Categories in Q-learning. In NYUAD Capstone Seminar Reports, Spring 2025, Abu Dhabi, UAE. 16 pages.


## 🌟 Overview

This project implements a computationally efficient and realistic 2D soccer simulation that reflects real-life football tactics and decision-making processes. The simulation uses a novel Q-learning approach where states are defined based on the predetermined rationality of actions, enabling better integration of user-defined tactics while maintaining player autonomy.

Key features include:
- Q-learning-based decision making for ball possession
- Action-defined states with normalized rationality scores
- Tactical differentiation across 12 distinct Q-table pairs
- Realistic player movements and interactions
- Continuous training and improvement of AI behavior

## 🎯 Core Innovation

The simulation defines agent states based on the predetermined rationality of taking each action (shooting, dribbling, passing) rather than Q-values. These rationality scores:
- Are normalized between 0 and 1
- Inform the state representation without dictating agent actions
- Enable smooth categorization and modification of states
- Allow for harmonious integration of tactics and rewards

## 🏗️ Architecture

### Q-Learning Implementation

1. **First Layer Q-table**: Decides between shoot, dribble, or pass (451 states)
2. **Second Layer Q-table**: Determines how to pass if passing is chosen

Each state consists of four components:
- Player position (goalkeeper, defender, midfielder, attacker)
- Shooting rationality category
- Dribbling rationality category
- Passing rationality category

### State Design

States are defined using normalized rationality scores calculated from:
- **Shooting**: Goal angle, distance, defender position
- **Dribbling**: Opponent proximity, teammate availability, goal alignment
- **Passing**: Teammate availability, distance to teammates

## 🎮 Tactics System

The simulation supports seven tactical parameters:
- **Creativity**: low, balanced, high
- **Mentality**: very defensive, defensive, balanced, attack, all out attack
- **Compactness**: low, balanced, high  
- **Press Level**: low, balanced, high
- **Shoot More**: yes, no
- **Dribble More**: yes, no
- **Idea**: counter, balanced, possession

These tactics influence:
- Q-learning reward calculations
- Player movement patterns
- Decision-making priorities

## 💻 Implementation

### Technologies Used
- Node.js for simulation and animations
- JavaScript for core logic
- Q-learning algorithms with modified reward functions

### Decision Making Process

The agent selects actions based on:
- Highest Q-value (with rate 1 - exploration rate)
- Random exploration (with exploration rate)
- Tactical weights applied to state-action pairs
- Success/failure feedback

### Movement System For Players Who Do Not Possess The Ball

- **In possession team**: Rule-based AI with factors for:
  - Movement toward/away from goal
  - Unmarking from defenders
  - Original position maintenance
  
- **Out of possession team**: Rule-based pressing and defensive positioning

## 📊 Training and Evaluation

### Training Methodology
- Continuous simulation training
- 12 separate Q-table pairs for different tactical combinations
- Periodic saving/loading of Q-values
- File-based persistence with error handling

### Evaluation Results
- Successful differentiation of tactical impacts
- Proper encouragement of intended actions per tactic
- Balanced decision-making between success/failure and tactical alignment

## 🚀 How to Test the Simulation

1. Clone the repository
2. Go to project directory
3. Run npm install to install dependencies 
4. Run server.js to start express server to handle I/O operations error-free
5. Go to your browser and type http://localhost:8000
6. Start testing the simulation by changing tactics and trying to win against computer 

## Author

Konuralp Sarisozen
Computer Science, NYUAD
Email: ks6299@nyu.edu


## Reference Format

Konuralp Sarisozen. 2025. A Modifiable and Realistic Football Simulation: Using Action-defined States with Normalized Categories in Q-learning. In NYUAD Capstone Seminar Reports, Spring 2025, Abu Dhabi, UAE. 16 pages.

This project and its written report are submitted to NYUAD’s capstone repository in fulfillment of NYUAD’s Computer Science major graduation requirements.
