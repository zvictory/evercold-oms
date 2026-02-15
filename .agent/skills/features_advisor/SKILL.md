---
description: A skill to help plan and design new features efficiently and consistently.
---
# Features Advisor Skill

## Description
This skill guides the AI assistant in helping the user plan and design new features for the `evercold` project. It ensures that all new features are well-thought-out, consistent with the existing architecture, and fully planned before implementation begins.

## Instructions
1.  **Analyze the Request**:
    - Identify the core problem or value proposition of the requested feature.
    - Ask clarifying questions if the request is vague (e.g., "What specific user role is this for?", "How should this interact with existing feature X?").

2.  **Research Context**:
    - Use `list_dir` and `grep_search` to find relevant existing code.
    - Check `schema.prisma` (or equivalent) for data model implications.
    - Check `routes` or `pages` for UI/UX integration points.
    - Check `components` for reusable UI elements.

3.  **Draft Implementation Plan**:
    - Create a plan covering:
        - **Database Changes**: New tables, columns, or relationships.
        - **API/Backend Logic**: New endpoints, services, or server actions.
        - **Frontend/UI**: New pages, components, or modifications to existing ones.
        - **Dependencies**: Any new libraries or external services needed.

4.  **Review and Refine**:
    - Verify that the plan aligns with the project's tech stack (Next.js, Prisma, Tailwind, etc.).
    - Check for potential performance bottlenecks or security issues.
    - Ensure the design follows the project's coding standards and patterns.

5.  **Present to User**:
    - Present the plan clearly (using markdown lists or a structured format).
    - Ask for feedback or approval before proceeding to implementation.
