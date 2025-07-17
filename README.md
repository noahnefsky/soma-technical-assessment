## Demo

https://github.com/your-username/soma-technical-assessment-master/assets/your-user-id/Soma-technical-demo.mov

## Soma Capital Technical Assessment

This is a technical assessment as part of the interview process for Soma Capital.

> [!IMPORTANT]  
> You will need a Pexels API key to complete the technical assessment portion of the application. You can sign up for a free API key at https://www.pexels.com/api/  

To begin, clone this repository to your local machine.

## Development

This is a [NextJS](https://nextjs.org) app, with a SQLite based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

## Task:

Modify the code to add support for due dates, image previews, and task dependencies.

### Part 1: Due Dates 

When a new task is created, users should be able to set a due date.

When showing the task list is shown, it must display the due date, and if the date is past the current time, the due date should be in red.

### Part 2: Image Generation 

When a todo is created, search for and display a relevant image to visualize the task to be done. 

To do this, make a request to the [Pexels API](https://www.pexels.com/api/) using the task description as a search query. Display the returned image to the user within the appropriate todo item. While the image is being loaded, indicate a loading state.

You will need to sign up for a free Pexels API key to make the fetch request. 

### Part 3: Task Dependencies

Implement a task dependency system that allows tasks to depend on other tasks. The system must:
1llow tasks to have multiple dependencies
2. Prevent circular dependencies
3. Show the critical path
4. Calculate the earliest possible start date for each task based on its dependencies
5. Visualize the dependency graph

## Solution

### Overview
This implementation provides a comprehensive task management system with advanced project planning features. The application allows users to create tasks with due dates, automatically generates relevant images for task visualization, and implements a sophisticated dependency management system with critical path analysis.

### Part 1: Due Dates Implementation
- **Database Schema**: Updated Prisma schema to include `dueDate` field and ran migration script to add the column
- **API Integration**: Updated the API to accept and store due dates, returning them in responses
- **Frontend Display**: Implemented frontend changes to display due dates with overdue highlighting in red

### Part 2: Image Generation Implementation
- **Database Schema**: Updated Prisma schema to store image URLs
- **Pexels API Integration**: Implemented calls to Pexels search endpoint using task description as query
- **Image Storage**: Store returned image URLs in the database
- **Loading States**: Show loading spinner while images are being fetched, display images once loaded

### Part 3: Task Dependencies Implementation

#### a. Multiple Dependencies
- **Dependency Selection**: Added option to select multiple dependencies when creating each todo
- **Data Storage**: Schema stores dependency IDs as JSON array ("id1, id2,...")

#### b. Circular Dependency Prevention
- **UI Constraints**: Since dependencies can only be added to existing todos, circular dependencies are prevented at the UI level

#### c. Critical Path Analysis
- **Algorithm**: Implemented using topological sort algorithm to find the longest path through the dependency graph
- **Duration Integration**: Critical path calculation uses task durations for accurate path determination
- **Visualization**: Critical path is displayed in the dependency graph with red highlighting

#### d. Earliest Start Date Calculation
- **Recursive Algorithm**: Implemented recursive calculation that considers all dependency chains
- **Dependency Completion**: Each task's earliest start date is calculated based on when all its dependencies complete
- **Duration Consideration**: Takes into account the duration of each dependency task
- **Display**: Results are shown in the task list indicating when each task can begin

#### e. Dependency Graph Visualization
- **Interactive Graph**: Built using React Flow library for interactive dependency visualization in the DependencyGraph component
- **Layered Layout**: Tasks are positioned by dependency levels (layers) for clear relationship display
- **Critical Path Highlighting**: Critical path is highlighted with red nodes and animated edges
- **Rich Information**: Shows task durations, due dates, and dependency relationships
- **Navigation**: Includes minimap for easy navigation and legend for understanding the visualization

## Submission:

1. Add a new "Solution" section to this README with a description and screenshot or recording of your solution. 
2. Push your changes to a public GitHub repository.
3. Submit a link to your repository in the application form.

Thanks for your time and effort. We'll be in touch soon!
