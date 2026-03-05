# Architecture

## System Overview

Mobile App → Convex Backend → Database
Web Admin → Convex Backend → Database

## Mobile

Responsibilities:
- Map UI
- Search chargers
- Bookmark stations
- Submit reports

## Backend

Convex handles:
- queries
- mutations
- authentication
- analytics

## Data Tables

- stations
- bookmarks
- suggestions
- reports
- sponsorships
- analyticsEvents

## Deployment

Mobile → App Store / Play Store
Web → Vercel
Backend → Convex