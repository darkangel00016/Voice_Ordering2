# Voice Ordering

AI-powered voice ordering system for restaurants that guides customers through menu selection, validates items and modifiers, and submits confirmed orders.

## Prerequisites
- Node.js 20+
- npm 10+

## Installation
```bash
npm install
```

## Running Locally
```bash
npm run dev
```

## Architecture Overview
- Next.js App Router frontend for kiosk/web UI
- API routes for menu retrieval, conversation progression, and order submission
- Shared TypeScript types and modular clients for external integrations
- Conversation orchestration enforces ordering-only flow and validation
