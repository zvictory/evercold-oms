---
description: A skill to refine and enhance user prompts for better AI performance.
---
# Prompt Enhancer Skill

## Description
This skill helps the user (or the AI itself) to rewrite and improve prompts to get the best possible results from the AI assistant. It focuses on clarity, context, and specificity.

## Instructions
1.  **Analyze the Draft Prompt**:
    - Identify the core intent (e.g., "Fix a bug", "Create a feature", "Explain a concept").
    - Identify missing information (e.g., "Which file?", "What error message?", "Which technology?").

2.  **Add Context**:
    - Explicitly mention relevant file paths or directory structures.
    - Mention the project's tech stack (e.g., "Next.js 14", "Prisma", "Tailwind CSS").
    - Include relevant code snippets or error logs if available.

3.  **Structure the Prompt**:
    - **Role**: Define the AI's persona (e.g., "Senior React Developer").
    - **Task**: State the objective clearly (e.g., "Refactor the `UserCard` component...").
    - **Constraints**: List any limitations (e.g., "Do not use external libraries", "Must be mobile-responsive").
    - **Output Format**: Specify how the output should look (e.g., "Return the full file content", "Provide a diff").

4.  **Refine Language**:
    - Remove ambiguity (e.g., change "Fix it" to "Fix the `TypeError` in `utils.ts`").
    - Use precise terminology.

5.  **Example**:
    - *Original*: "Make the button blue."
    - *Enhanced*: "Update the `SubmitButton` component in `src/components/buttons.tsx` to use the primary blue color from the Tailwind config (`bg-blue-600`). Ensure it has a hover state of `bg-blue-700`."
