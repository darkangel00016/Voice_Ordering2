# Product Requirements Document: AI Voice Ordering Agent

## Summary
An AI-powered voice ordering system for restaurants that guides customers through menu selection, validates items/modifiers, confirms orders, and submits them to an external kitchen/POS system. The experience targets kiosk and mobile browsers and must remain accessible and reliable in noisy environments.

## Goals
- Enable customers to place complete orders using voice with minimal touch input.
- Validate items and modifiers against the current menu before submission.
- Provide a clear confirmation step with totals and errors before final submission.
- Integrate with external menu and order submission services.

## Non-Goals
- In-restaurant staff management or inventory tracking.
- Payments or checkout processing.
- Multilocation menu management UI.

## Personas
- Customer placing a quick order at a kiosk.
- Restaurant operator monitoring order submissions from a POS/kitchen system.

## Core User Flows
1. Customer initiates voice ordering on the main screen.
2. System listens, transcribes speech, and updates the conversation state.
3. AI assistant asks clarifying questions when modifiers are required or items are ambiguous.
4. Customer reviews the order summary, with validation errors highlighted if present.
5. Customer confirms the order; system submits to external backend and returns a success/failure result.

## Functional Requirements
- Menu retrieval
  - Fetch the current menu from an external API and expose it to the UI.
  - Cache or reuse menu data per session to reduce latency.
- Conversation orchestration
  - Maintain conversation state between turns.
  - Enforce ordering-only guardrails and handle prompt injection attempts.
  - Request clarifications for missing modifiers or invalid items.
- Validation
  - Validate order items against the menu and required modifiers.
  - Compute item totals and overall order totals.
  - Return structured validation errors.
- Order submission
  - Submit a confirmed order to an external order submission endpoint.
  - Handle transient failures with retry logic and provide error details.
- UI
  - Provide push-to-talk controls and clear listening/processing states.
  - Show live transcript history for both user and assistant.
  - Display order summary with modifiers, totals, and validation errors.
  - Provide confirm and edit actions before final submission.
- APIs
  - GET /api/menu for menu retrieval.
  - POST /api/conversation for advancing the conversation.
  - POST /api/order for order submission.

## Non-Functional Requirements
- Latency: Voice interaction feedback should feel immediate (< 1s perceived delay for state changes).
- Reliability: Gracefully handle network failures and external API errors.
- Accessibility: Support large text, high contrast, and keyboard navigation.
- Security: Do not expose API keys to the client; validate all inputs server-side.

## Out of Scope (Phase 1)
- Payment processing.
- Loyalty or user accounts.
- Admin dashboards and analytics.
