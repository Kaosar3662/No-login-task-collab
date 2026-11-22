# No-Login Task Collab

![No-Login Task Collab](docs/social-preview.png)

A real-time Kanban board your whole team can use instantly: open the link and start working. No sign-up, no accounts. By default anyone with the link can edit; the first visitor can optionally put the board behind a single shared password.

**Live demo:** https://no-login-task-collab.vercel.app/

## Features

- **Real-time collaboration:** everyone on the board sees changes the moment they happen, powered by [Liveblocks](https://liveblocks.io).
- **Optional password:** the first visitor chooses to keep the board open or protect it. Every new browser asks for the password once.
- **Live cursors:** see where your teammates are pointing.
- **Drag and drop:** reorder lists and move cards between lists ([dnd-kit](https://dndkit.com)).
- **Categories:** group lists into categories, and move lists or cards between them.
- **Card details:** title, description, priority (None, Low, Medium, High, Critical) and a done toggle.
- **Images on cards (optional):** upload a picture or paste one from the clipboard (hosted on [Cloudinary](https://cloudinary.com)).
- **Backup and move:** export or import the board as JSON, or move it to a new Liveblocks account.
- **Undo and redo:** `Ctrl+Z` and `Ctrl+Shift+Z`, shared with the live board.
- **Light and dark mode.**

## Tech stack

React 18, Vite, Liveblocks (`@liveblocks/client`, `@liveblocks/react`), dnd-kit, Cloudinary (unsigned uploads, optional). There is no backend of your own: it is a static site.

## Set up your own

You need a free [Liveblocks](https://liveblocks.io/dashboard) project and its **public key** (starts with `pk_`). Cloudinary is optional. Video: [how to get your Liveblocks public key](https://youtu.be/Ib5fhISTeYs).

Deploy the built site anywhere that serves static files (build command `npm run build`, output directory `dist`), then give the app the key in whichever way suits your host:

1. **Environment variables (any host that builds with Vite).** Set them in your host's settings and redeploy. Nobody needs an invite link this way.

   | Variable | What it does |
   | --- | --- |
   | `VITE_LIVEBLOCKS_PUBLIC_KEY` | Your Liveblocks public key. |
   | `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` | Turn on image uploads (cloud name and an **unsigned** upload preset). |
   | `VITE_ROOM_ID` | Board name. Change it to start a fresh board. |

   Vercel: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKaosar3662%2FNo-login-task-collab&env=VITE_LIVEBLOCKS_PUBLIC_KEY&envDescription=Your%20Liveblocks%20public%20key%20(starts%20with%20pk_)&envLink=https%3A%2F%2Fliveblocks.io%2Fdashboard)
   Netlify, Cloudflare Pages, Render and others: connect the repo and add the variables above in the site settings.

2. **No variables at all.** Deploy as is. The first time the site opens it shows a setup screen that asks for the Liveblocks public key and stores it in that browser. Open **Board settings** (the lock icon) and choose **Copy invite link** to get `https://your-site/#k=pk_...`. Teammates open that link once per browser. Public keys are meant to be public, so sharing the link is fine.

Image uploads can also be set up later in Board settings. Those values are stored in the board's lobby room, so every browser gets them. Environment variables win if both are set.

`.env.example` lists the variables. For local development: `cp .env.example .env`, fill it in, `npm install`, `npm run dev`.

## Password protection

On first visit the first person chooses:

- **Keep it open.** Anyone with the link can edit. You get a one-time **setup code**, which is needed later to add a password. Keep it safe.
- **Protect it with a password.** You also get a one-time **recovery code**. Each new browser must enter the password once.

Board settings (the lock icon) is open to everyone, but the admin tools in it (password, image settings, import, moving accounts) need the **setup code** on an open board or the **recovery code** on a protected one. The unlock is remembered per browser and resets when the password changes. This stops teammates changing shared settings by accident, it is not hard security. Admins can add a password, change it, or remove it, and forget the Liveblocks key saved in the browser. Changing it asks everyone else for the new password and issues a new recovery code.

How it works, and its limits (there is no backend, so please read this):

- A small public "lobby" room says whether the board is open or protected. A protected board lives in a room whose name comes from a random secret. That secret is stored in the lobby encrypted twice, once with the password and once with the recovery code (PBKDF2 and AES-GCM in your browser). Without the password nobody can find the board room.
- A weak password can be guessed offline by someone who copies the lobby data, so use a long one (at least 8 characters, a passphrase is better).
- Liveblocks public keys cannot stop someone from *overwriting* the lobby, so a determined vandal could lock people out. Export a backup now and then (Board settings, Export JSON).
- **There is no password reset.** If the password and the recovery code are both lost, the board cannot be opened.
- Card text is not end-to-end encrypted, it is protected only by the board room being unguessable. Cloudinary image links are public to anyone who has the link.
- The password popup needs `https` or `localhost` (browsers disable the crypto features otherwise).

## Backup, and Liveblocks free-plan limits

Free Liveblocks projects have usage limits. To move to a fresh project:

- **In the app:** Board settings, then **Move to a new account**. Paste the new project's public key; the board and its settings are copied, and you get a new invite link. If the old account is already blocked, use **Export JSON** (while it still works) and **Import JSON** on the new account instead.
- **From the command line:** `scripts/move-board.mjs` copies every room between accounts using secret keys:

  ```bash
  OLD_SECRET_KEY=sk_... NEW_SECRET_KEY=sk_... node scripts/move-board.mjs
  ```

  Secret keys are never stored in the repo. Do not paste them into a file.

After moving, update `VITE_LIVEBLOCKS_PUBLIC_KEY` on your host (or share the new invite link).

## Run it locally

Requires Node.js 18 or newer.

```bash
git clone https://github.com/Kaosar3662/No-login-task-collab.git
cd No-login-task-collab
cp .env.example .env   # optional, add your Liveblocks key
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Other scripts: `npm run build` and `npm run preview`.

## Project structure

```
src/
  App.jsx                 Theme, lobby flow, board room
  config.js               Liveblocks key, room names, env variables
  liveblocks.config.js    Liveblocks client and hooks
  lobby.js                Lobby room: open or protected, password actions
  crypto.js               Password and code helpers (WebCrypto)
  boardCopy.js            Copy, export and import whole boards
  cloudinary.js           Optional image upload helper
  constants.js            Default lists, priorities, helpers
  theme.js                Light and dark themes
  components/
    Screens.jsx           Setup, welcome and password screens
    SecurityMenu.jsx      Board settings: access, images, backup, account
    Board.jsx             Board, categories, live cursors, drag and drop
    Column.jsx            A list
    Card.jsx              A card
    ...
scripts/
  move-board.mjs          Copy rooms between Liveblocks accounts
```
