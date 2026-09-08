# DCComicsdle

A full-stack Wordle-style guessing game built around the DC Comics universe.

**Live Demo:** https://dccomicsdle.onrender.com
**Repository:** https://github.com/StevenNBrown/DCComicsdle

> The live application may take up to a minute to load while the Render service wakes up.

## Overview

DCComicsdle is a full-stack web application where players identify a DC Comics character using progressively revealed information such as their **species, powers, affiliations, appearances, aliases, and debut year**.

The project combines a **React frontend, Node.js backend, Python services, and PostgreSQL database** to deliver an interactive guessing experience with dynamic character search, attribute comparisons, progressive hints, and persistent game state.

Rather than hard-coding character information into the application, I designed and populated a relational database containing **400+ DC Comics characters** and their associated attributes. The application communicates between its frontend and backend through REST APIs and is deployed as a production web application.

## Technical Stack

| Layer | Technologies |
| ----------------- | --------------------- |
| **Frontend** | React, JavaScript, HTML, CSS |
| **Backend** | Python |
| **Database** | PostgreSQL, Neon |
| **API** | REST, JSON |
| **Hosting** | Render |
| **Development** | Git, GitHub, VS Code |

## Key Features

### Daily Puzzle System

Each day, players receive the same character regardless of when or where they access the game.

The backend maintains puzzle information in PostgreSQL and uses a deterministic puzzle-selection system to ensure that the daily puzzle remains consistent across users and sessions.

### Character Search & Autocomplete

Players can search for characters through a dynamic autocomplete interface.

The React frontend communicates with the backend to retrieve matching characters from the database without requiring a full page reload.

The search interface supports keyboard navigation and dynamically updates results as the user types.

### Progressive Hints

Hints are progressively unlocked as players use more guesses.

The game includes multiple hint levels, allowing players to reveal additional information while still maintaining the challenge of identifying the character.

### Guess Comparison

Each guess is compared against the correct character across multiple attributes.

Depending on the attribute, the game can identify:

- Exact matches
- Partial matches
- List overlaps
- Year relationships
- Category differences

This allows the game to provide meaningful feedback after every guess rather than simply indicating whether the character is correct.

### Persistent Game State

The frontend tracks player progress using browser storage and session identifiers, allowing the application to preserve relevant game state between page interactions.

The application also tracks completed puzzles so players can navigate between available games without losing previous progress.

### Relational Character Database

Character information is stored in a normalized PostgreSQL database rather than being hard-coded into the application.

The database contains related information for:

- Characters
- Species
- Powers
- Affiliations
- Appearance types
- Aliases
- Puzzle numbers

This structure makes it possible to continuously expand the character database without changing the game's core logic.

## Architecture

```text
                         ┌─────────────────────┐
                         │       Player        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       React         │
                         │      Frontend       │
                         │                     │
                         │ • Game Interface    │
                         │ • Search            │
                         │ • Game State        │
                         │ • Guess Display     │
                         └──────────┬──────────┘
                                    │
                               REST / JSON
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Python Backend    │
                         │                     │
                         │ • API Logic         │
                         │ • Game Logic        │
                         │ • Character Search  │
                         │ • Guess Processing  │
                         └──────────┬──────────┘
                                    │
                               SQL Queries
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     PostgreSQL      │
                         │       (Neon)        │
                         │                     │
                         │ • Characters        │
                         │ • Powers            │
                         │ • Affiliations      │
                         │ • Species           │
                         │ • Aliases           │
                         │ • Puzzles           │
                         └─────────────────────┘
```

## Engineering Challenges

### Designing the Database

One of the main challenges was designing a relational structure that could represent the large amount of information associated with DC characters.

Many attributes are inherently one-to-many or many-to-many relationships. Instead of storing everything in a single character table, related data was separated into dedicated tables and connected through relationships.

This made the database easier to maintain and allowed new characters and attributes to be added without restructuring the application.

### Maintaining a Consistent Daily Puzzle

The daily puzzle needed to be consistent for every player while still changing automatically each day.

I implemented puzzle tracking through the database and backend rather than relying solely on client-side logic. This prevents different users from receiving different answers for the same daily puzzle.

### Building a Dynamic Search System

The character search required communication between the React frontend and backend while the user was typing.

The frontend sends search requests to the backend, which queries PostgreSQL and returns matching characters as JSON. The results are then dynamically rendered in the React interface.

### Handling Complex Guess Logic

Character attributes are not always simple exact-value comparisons.

For example, characters can have multiple powers, affiliations, aliases, or appearances. The game therefore needs to compare collections of values and determine whether a guess contains matching or partially matching information.

Implementing these comparisons required careful handling of different data types and edge cases.

### Migrating to a Modern Frontend Architecture

The frontend was reconfigured from a traditional JavaScript-based implementation into a **React application**, allowing the interface to be broken into reusable components and making application state easier to manage.

## API

The application uses REST APIs to communicate between the frontend and backend.

Examples of application functionality include:

```text
GET  /start
GET  /search?q=<character>
POST /guess
```

The APIs return JSON data that the frontend uses to update the game without requiring full page reloads.

## Project Structure

```text
DCComicsdle/
│
├── frontend/
│   ├── React components
│   ├── styles
│   └── game interface
│
├── backend/
│   └── Python
│
├── character_images/
├── database/
├── README.md
└── ...
```

## Why I Built It

I built DCComicsdle as a way to combine my interest in DC Comics with my interest in software development.

The project was also inspired by existing character-guessing games such as Marveldle and DCdle. While researching those projects, I saw an opportunity to build a larger and more structured character database and use the project to explore full-stack development, REST APIs, relational databases, frontend frameworks, and deployment.

Rather than treating the project as a static website, I wanted to build something that required a complete frontend, backend, database, and deployment pipeline.

## What I Learned

Through this project, I gained practical experience with:

- Building component-based interfaces with React
- Developing backend services using Python
- Designing and querying relational PostgreSQL databases
- Building and consuming REST APIs
- Managing frontend application state
- Implementing search and autocomplete functionality
- Implementing game logic and comparison algorithms
- Working with JSON data
- Deploying a multi-component web application
- Debugging production issues
- Managing environment-based configuration
- Using Git and GitHub throughout development

## Future Development

I am continuing to develop DCComicsdle, with planned improvements including:

- **User accounts** and cross-device game progress
- Improved **mobile and responsive design**
- Additional characters and expanded character information
- Additional game modes and statistics
- Improved performance and database optimization
- Automated testing and additional deployment infrastructure

## Try It

Play DCComicsdle here:

**https://dccomicsdle.onrender.com**

If you're interested in the implementation, the complete source code is available on GitHub.

**Built with React, Python, PostgreSQL, and a lot of DC Comics.**
