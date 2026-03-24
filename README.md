# Warehouse Seva

Warehouse Seva is an Expo + React Native app for managing warehouse space visually. It combines Firebase authentication, warehouse/staff management, and a 3D rack layout so users can track stock, expiry dates, and floor usage from one screen.

## What the app does

- Sign up and log in with email or username
- Create and switch between warehouses
- Add, rename, move, resize, and delete racks
- Track stock quantity, bags per level, entry date, expiry date, and rack value
- Invite staff members with `edit` or `view` access
- See warehouse-level stats such as rack count, stock, levels used, and floor usage

## Tech stack

- Expo Router
- React Native
- TypeScript
- Firebase Authentication
- Firestore
- React Three Fiber / Three.js

## Project structure

- [app](/Users/sharadsinghania/Desktop/WarehouseSeva/Warehouse-Seva/app): route entrypoints and screens
- [src/components](/Users/sharadsinghania/Desktop/WarehouseSeva/Warehouse-Seva/src/components): app UI, panels, modals, and 3D warehouse pieces
- [src/hooks](/Users/sharadsinghania/Desktop/WarehouseSeva/Warehouse-Seva/src/hooks): Firebase-backed hooks for warehouses, racks, roles, and staff
- [src/firebase](/Users/sharadsinghania/Desktop/WarehouseSeva/Warehouse-Seva/src/firebase): Firebase configuration
- [src/types](/Users/sharadsinghania/Desktop/WarehouseSeva/Warehouse-Seva/src/types): shared app types

## Firestore collections

The current app expects these collections:

- `users`
  Stores profile information like `email`, `username`, `phone`, and `displayName`.
- `usernames`
  Maps a username to a Firebase user id and email so users can log in with usernames.
- `warehouses`
  Stores warehouse metadata such as `name`, `ownerId`, and layout settings.
- `racks`
  Stores rack documents linked by `warehouseId`.
- `warehouseMembers`
  Stores per-warehouse staff access with `edit` or `view` roles.

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Start the Expo app:

```bash
npx expo start
```

3. Open the project in:

- iOS simulator
- Android emulator
- Expo Go
- web preview

## Firebase setup

Update the Firebase config in [src/firebase/config.ts](/Users/sharadsinghania/Desktop/WarehouseSeva/Warehouse-Seva/src/firebase/config.ts) if you want to point the app at another Firebase project.

At minimum, enable:

- Firebase Authentication with Email/Password
- Cloud Firestore

## Useful commands

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
npx tsc --noEmit
```

## Current product flow

1. A user signs up and gets a `users` document plus a `usernames` mapping.
2. The user creates a warehouse and becomes its owner.
3. The warehouse owner adds racks and configures the layout.
4. The owner can invite staff to the warehouse with `edit` or `view` access.
5. Staff members can log in and access warehouses shared with them.

## Notes

- The app is optimized around one active warehouse at a time.
- Rack placement happens inside the 3D floor view.
- The UI currently uses Firestore directly from the client, so Firebase security rules should be configured carefully before production use.
