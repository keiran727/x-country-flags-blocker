<img width="437" height="116" alt="Untitled" src="https://github.com/user-attachments/assets/60fd5a70-a38c-497f-8aac-08adf105066e" />

# X Country Flags & Blocker

Because scrolling past the same spam from *those* countries got old.

Note: uses X’s own “About this account” data only. Nothing leaves your browser.

# Install


1. Install a userscript manager:
   - Chrome / Edge / Brave — [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)
   - Firefox > same ones, just grab them from the Firefox add-ons site
2. On Chrome/Edge you will probably need to turn on **Allow User Scripts** (or Developer mode) for the extension, otherwise it does nothing. Go to `chrome://extensions` / `edge://extensions` and enable it
3. [Download the script](./x-country-flags-blocker.user.js) to install. If you already have a userscript manager, just click the link and it should offer to install

After installing, refresh X. The first time it might ask you to open any profile > click “Joined …” > open “About this account” once so it can grab the current query ID.

# Features

**Flags**
- Country flag next to usernames
- Warning icon if X thinks the location might be masked (VPN/proxy)
- Hover for country name + extra info
- Shift-click a flag to quickly block or unblock that country

**Blocking / Hiding**
- Hide posts from specific countries or regions
- Option to also hide accounts that look like they’re using a VPN/proxy
- Verified-only mode (only hide verified accounts from blocked countries)
- Bypass accounts you already follow
- Hide those “this post is unavailable” tombstones

**Other**
- Local cache so it doesn’t hammer X’s API
- Diagnostics menu if something breaks
- Top countries seen this session

<img width="365" height="320" alt="image" src="https://github.com/user-attachments/assets/c64b9c48-bcd6-4d58-9d1b-dc7da1d65503" />

That's it. Enjoy a slightly cleaner timeline.
