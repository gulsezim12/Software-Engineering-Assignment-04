
# Smart Campus Room Availability Checker

## Software Engineering — Assignment #04

Student: Bilimzhankyzy Gulsezim

## Project Description

This project checks the availability of fictional
study rooms in a Smart Campus application.

The original application supported one room.
The extended version supports four rooms.

## Features

- Four fictional study rooms
- Capacity filtering
- Equipment filtering
- Blocked room handling
- Room-specific availability checks
- Maximum booking duration of 120 minutes
- Overlap detection
- Responsive user interface

## Technology

- React
- TypeScript
- Vite
- Vitest

## Installation

Open the project folder in VS Code.

Run:

npm install

## Run the Application

npm run dev

Open the local address displayed in the terminal.

## Run Automated Tests

npm test

## Additional Checks

npm run build

npm run lint

npm run typecheck

## Project Structure

src/lib/availability.ts
Booking availability validation.

src/lib/bookingValidation.ts
Input validation and parsing.

src/lib/roomFilter.ts
Capacity and equipment filtering.

src/lib/rooms.ts
Fictional room data.

src/components/
User interface components.

src/smartCampus.test.ts
Automated regression and feature tests.

## Limitations

The application uses fictional data and a fixed
current time.

It does not include a real database, login,
payments, or live external APIs.

## AI Assistance

ChatGPT (GPT-6) and Bolt.new were used during
planning, code development, refactoring, and review.

AI-generated suggestions were checked against
the project requirements and test results.
