/**
 * Admin app for the Interaction Library.
 *
 * Single-admin GitHub-as-CMS:
 *   - Fine-grained PAT in localStorage
 *   - In-browser first-frame poster extraction (JPEG)
 *   - Atomic commit via the Git Data API:
 *       - Assets/<Folder>/<slug>.mp4
 *       - Assets/<Folder>/<slug>.jpg  (poster from first frame)
 *       - script.js                    (file path inserted into the right category)
 *       - script.js                    (titleOverrides entry, only if custom title)
 *
 * Token scope required: Contents Read & Write on this repo only.
 */

(function () {
    'use strict';

    // -------- Config --------
    const REPO_OWNER = 'johnyvino';
    const REPO_NAME  = 'turtle';
    const BRANCH     = 'main';
    const SITE_URL   = 'https://interactions.johnyvino.com/';

    const TOKEN_KEY    = 'turtle.adminToken';
    const MAX_FILE_MB  = 50;
    const POSTER_QUALITY = 0.82;

    // category id -> asset folder. Mirrors the layout already on disk.
    const CATEGORY_FOLDERS = {
        featured:     'Assets/Featured',
        business:     'Assets/Business',
        finance:      'Assets/Finance',
        food:         'Assets/Food',
        health:       'Assets/Health_fitness',
        travel:       'Assets/Transportation',
        media:        'Assets/Photos_videos',
        shopping:     'Assets/Lifestyle',
        social:       'Assets/Social-Networking',
        productivity: 'Assets/MISCELLANEOUS',
    };

    // category id -> display name + accent color, used for the live card preview.
    // Kept in sync with `categories` in script.js.
    const CATEGORY_META = {
        featured:     { name: 'Featured',     color: '#F59E0B' },
        business:     { name: 'Business',     color: '#3B82F6' },
        finance:      { name: 'Finance',      color: '#14B8A6' },
        food:         { name: 'Food',         color: '#F97316' },
        health:       { name: 'Health',       color: '#EC4899' },
        travel:       { name: 'Travel',       color: '#06B6D4' },
        media:        { name: 'Media',        color: '#8B5CF6' },
        shopping:     { name: 'Shopping',     color: '#FB7185' },
        social:       { name: 'Social',       color: '#6366F1' },
        productivity: { name: 'Productivity', color: '#84CC16' },
    };

    // -------- DOM --------
    const $ = (id) => document.getElementById(id);

    const authGate    = $('authGate');
    const authForm    = $('authForm');
    const tokenInput  = $('tokenInput');
    const authError   = $('authError');
    const signOutBtn  = $('signOutBtn');

    const stage         = $('stage');
    const fileInput     = $('fileInput');
    const dropEmpty     = $('dropEmpty');
    const previewCard   = $('previewCard');
    const replaceBtn    = $('replaceBtn');
    const stageHint     = $('stageHint');
    const encodedInfo   = $('encodedInfo');
    const srcInfo       = $('srcInfo');
    const durInfo       = $('durInfo');
    const posterInfo    = $('posterInfo');

    const itemForm       = $('itemForm');
    const titleInput     = $('titleInput');
    const slugInput      = $('slugInput');
    const categoryInput  = $('categoryInput');
    const pathPreview    = $('pathPreview');
    const publishBtn     = $('publishBtn');
    const statusEl       = $('status');

    const tabAdd        = $('tabAdd');
    const tabManage     = $('tabManage');
    const manageList    = $('manageList');
    const manageSearch  = $('manageSearch');
    const manageCount   = $('manageCount');
    const manageStatus  = $('manageStatus');

    // -------- State --------
    let token         = localStorage.getItem(TOKEN_KEY) || '';
    let pickedFile    = null;
    let previewURL    = null;       // blob URL for the preview <video>; revoked on replace
    let posterBlob    = null;       // first-frame JPEG, generated client-side
    let videoMeta     = { w: 0, h: 0, duration: 0 };
    let existingPaths = new Set();  // every Assets/.../*.mp4 already in script.js

    // Parsed snapshot of script.js, used by the Manage view.
    /** @type {{ id:string, name:string, color:string, files:Array<{path:string,slug:string,key1:string,key2:string,title:string,isOverride:boolean}> }[]} */
    let parsedCategories = [];
    /** @type {Record<string,string>} */
    let parsedOverrides = {};
    let manageBuilt = false;

    // -------- Helpers --------
    const fmtKB = (n) => `${Math.max(1, Math.round(n / 1024))} kB`;
    const fmtDur = (s) => {
        if (!isFinite(s)) return '—';
        const m = Math.floor(s / 60), sec = Math.round(s % 60);
        return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`;
    };

    // HTML-escape helper. Named distinctly so it never falls through to the
    // deprecated global `escape()` which URL-encodes instead of HTML-escaping.
    const esc = (s) => String(s)
        .replaceAll('&',  '&amp;')
        .replaceAll('<',  '&lt;')
        .replaceAll('>',  '&gt;')
        .replaceAll('"',  '&quot;')
        .replaceAll("'",  '&#39;');

    function escapeRegExp(s) {
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function slugify(text) {
        return String(text)
            .toLowerCase()
            .normalize('NFKD').replace(/[̀-ͯ]/g, '')
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function deriveSlug() {
        // Priority: explicit slug input > title > original filename stem.
        const explicit = slugify(slugInput.value);
        if (explicit) return ensureUnique(explicit);
        const title = slugify(titleInput.value);
        if (title) return ensureUnique(title);
        if (pickedFile) {
            const stem = pickedFile.name.replace(/\.[^.]+$/, '');
            const fromName = slugify(stem);
            if (fromName) return ensureUnique(fromName);
        }
        return ensureUnique('interaction');
    }

    function ensureUnique(base) {
        const folder = CATEGORY_FOLDERS[categoryInput.value] || 'Assets';
        const candidate = `${folder}/${base}.mp4`;
        if (!existingPaths.has(candidate)) return base;
        let i = 2;
        while (existingPaths.has(`${folder}/${base}-${i}.mp4`)) i++;
        return `${base}-${i}`;
    }

    // Mirrors titleFromPath() in script.js so the preview matches the real site.
    function deriveTitleFromSlug(slug) {
        const explicit = titleInput.value.trim();
        if (explicit) return explicit;
        let name = slug.replace(/^[a-f0-9]{6,}_/, '');
        name = name.replace(/^\d+-/, '');
        if (/^[a-f0-9]{16,}$/.test(name)) return '';
        return name.replace(/[-_.]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
    }

    function setStatus(text, kind) {
        statusEl.textContent = text || '';
        statusEl.classList.remove('is-success', 'is-error');
        if (kind) statusEl.classList.add(`is-${kind}`);
    }

    // -------- Auth --------
    function showGate(message) {
        document.documentElement.classList.remove('is-authed');
        if (message) {
            authError.textContent = message;
            authError.hidden = false;
        } else {
            authError.hidden = true;
        }
    }

    function showApp() {
        document.documentElement.classList.add('is-authed');
        loadExistingScript().catch(err => {
            if (err.isAuth) {
                // Saved token is bad/expired — wipe it, kick back to gate.
                localStorage.removeItem(TOKEN_KEY);
                token = '';
                showGate('Saved token was rejected by GitHub. Paste a fresh one.');
            } else {
                setStatus(`Could not load script.js: ${err.message}`, 'error');
            }
        });
    }

    if (token) showApp(); else showGate();

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const value = tokenInput.value.trim();
        if (!value) return;

        const submitBtn = authForm.querySelector('button[type="submit"]');
        const submitLabel = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying…';
        authError.hidden = true;

        // Try the token before persisting so we don't store something broken.
        const previousToken = token;
        token = value;
        try {
            await gh(repoPath(''));
            localStorage.setItem(TOKEN_KEY, token);
            tokenInput.value = '';
            showApp();
        } catch (err) {
            token = previousToken;
            authError.hidden = false;
            authError.textContent = err.isAuth
                ? 'GitHub rejected this token. Confirm it’s a fine-grained PAT for johnyvino/turtle with Contents: Read and write, and that it hasn’t expired.'
                : `Verification failed: ${err.message}`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
        }
    });

    signOutBtn.addEventListener('click', () => {
        localStorage.removeItem(TOKEN_KEY);
        token = '';
        existingPaths = new Set();
        showGate();
    });

    // -------- GitHub API --------
    async function gh(path, opts = {}) {
        const r = await fetch(`https://api.github.com${path}`, {
            ...opts,
            headers: {
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Authorization': `Bearer ${token}`,
                ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
                ...(opts.headers || {}),
            },
        });
        if (r.status === 401 || r.status === 403) {
            const body = await r.text().catch(() => '');
            const err = new Error(`auth failed (${r.status}): ${body.slice(0, 200)}`);
            err.isAuth = true;
            throw err;
        }
        if (!r.ok) {
            const body = await r.text().catch(() => '');
            throw new Error(`GitHub ${r.status}: ${body.slice(0, 300)}`);
        }
        return r.json();
    }

    function repoPath(suffix) {
        return `/repos/${REPO_OWNER}/${REPO_NAME}${suffix}`;
    }

    // -------- script.js loader --------
    function decodeBase64Utf8(b64) {
        // GitHub returns base64 with line wraps.
        const clean = b64.replace(/\s+/g, '');
        const bin = atob(clean);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes);
    }

    function encodeUtf8Base64(text) {
        const bytes = new TextEncoder().encode(text);
        let bin = '';
        const CHUNK = 0x8000;
        for (let i = 0; i < bytes.length; i += CHUNK) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
        }
        return btoa(bin);
    }

    async function loadExistingScript() {
        const res = await gh(repoPath(`/contents/script.js?ref=${BRANCH}`));
        const text = decodeBase64Utf8(res.content);
        const parsed = parseScript(text);
        parsedCategories = parsed.categories;
        parsedOverrides  = parsed.overrides;
        // Pull every quoted Assets/... path so we can dedupe on slug collisions.
        existingPaths = new Set();
        for (const cat of parsedCategories) {
            for (const f of cat.files) existingPaths.add(f.path);
        }
        updatePathPreview();
        if (manageBuilt) renderManageList();
        return { text, sha: res.sha };
    }

    /**
     * Parse script.js into the same structure the public site uses, plus the
     * titleOverrides map. The Manage view renders from this; mutations
     * re-fetch script.js to make sure we patch the latest content.
     */
    function parseScript(text) {
        const overrides = {};
        const block = /const titleOverrides\s*=\s*\{([\s\S]*?)\n\s*\};/.exec(text);
        if (block) {
            const re = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]*)['"]/g;
            let m;
            while ((m = re.exec(block[1])) !== null) overrides[m[1]] = m[2];
        }

        const categories = [];
        const catRe = /\{\s*id:\s*['"](\w+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*,\s*color:\s*['"]([^'"]+)['"]\s*,\s*files:\s*\[([\s\S]*?)\]\s*\}/g;
        let m;
        while ((m = catRe.exec(text)) !== null) {
            const [, id, name, color, filesBlock] = m;
            const files = [];
            const fileRe = /['"]([^'"]+\.mp4)['"]/g;
            let fm;
            while ((fm = fileRe.exec(filesBlock)) !== null) {
                const path = fm[1];
                const slug = path.split('/').pop().replace(/\.mp4$/i, '');
                const key1 = slug.replace(/^[a-f0-9]{6,}_/, '').replace(/~mv2$/, '');
                const key2 = key1.replace(/^\d+-/, '');
                let title, isOverride = false;
                if (overrides[key1] !== undefined)      { title = overrides[key1]; isOverride = true; }
                else if (overrides[key2] !== undefined) { title = overrides[key2]; isOverride = true; }
                else if (/^[a-f0-9]{16,}$/.test(key1))  { title = ''; }
                else { title = key2.replace(/[-_.]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase()); }
                files.push({ path, slug, key1, key2, title, isOverride });
            }
            categories.push({ id, name, color, files });
        }
        return { categories, overrides };
    }

    // -------- script.js editing --------

    /**
     * Insert a new file path inside the matching category's `files: [...]` array.
     * Throws if the category block can't be found.
     */
    function insertFileIntoCategory(text, catId, relPath, position) {
        const lit = `'${relPath}'`;
        // Find category block by id, then locate its files: [ opening or closing.
        // categories: [ { id: 'foo', ..., files: [ ... ] }, ... ]
        const idRe = new RegExp(
            `id:\\s*['"]${escapeRegExp(catId)}['"][\\s\\S]*?files:\\s*\\[`,
            'm'
        );
        const idMatch = idRe.exec(text);
        if (!idMatch) {
            throw new Error(`Could not find category '${catId}' in script.js`);
        }
        const filesOpenIdx = idMatch.index + idMatch[0].length;
        // Walk forward to find the matching ']'. Strings inside are simple
        // single-quoted file paths with no nested brackets, so a plain scan
        // for the next ']' is safe.
        let inString = false;
        let quote = '';
        let closeIdx = -1;
        for (let i = filesOpenIdx; i < text.length; i++) {
            const ch = text[i];
            if (inString) {
                if (ch === '\\') { i++; continue; }
                if (ch === quote) inString = false;
            } else {
                if (ch === "'" || ch === '"') { inString = true; quote = ch; }
                else if (ch === ']') { closeIdx = i; break; }
            }
        }
        if (closeIdx === -1) {
            throw new Error(`Could not find end of files array for '${catId}'`);
        }

        if (position === 'top') {
            // Insert as the first array item, on its own line, indented to match.
            const before = text.slice(0, filesOpenIdx);
            const after  = text.slice(filesOpenIdx);
            return `${before}\n        ${lit},${after}`;
        }
        // 'bottom' — insert just before the closing ']', preserving existing
        // trailing-comma style.
        const before = text.slice(0, closeIdx);
        const after  = text.slice(closeIdx);
        // The body before ']' typically ends with `,\n      ` — make sure we
        // emit a clean line with the same 8-space indent existing entries use.
        const trimmed = before.replace(/[\s\n]+$/, '');
        const needsComma = !trimmed.endsWith(',');
        return `${trimmed}${needsComma ? ',' : ''}\n        ${lit},\n      ${after}`;
    }

    /**
     * If the user typed a custom title that differs from the auto-derived one,
     * add a titleOverrides entry keyed on the filename stem. No-op otherwise.
     */
    function maybeAddTitleOverride(text, slug, customTitle) {
        if (!customTitle) return text;
        // Compare against what titleFromPath would produce for this slug.
        const auto = slug
            .replace(/^[a-f0-9]{6,}_/, '')
            .replace(/^\d+-/, '')
            .replace(/[-_.]+/g, ' ')
            .trim()
            .replace(/\b\w/g, c => c.toUpperCase());
        if (customTitle === auto) return text;

        const marker = /(const titleOverrides = \{\s*\n)/;
        if (!marker.test(text)) return text; // not fatal — preview still works
        const key = `'${slug.replace(/'/g, "\\'")}'`;
        const val = `'${customTitle.replace(/'/g, "\\'")}'`;
        const line = `    ${key}: ${val},\n`;
        return text.replace(marker, `$1${line}`);
    }

    /**
     * Remove a `'<path>',` line from any category's files array.
     * Returns the new text, or throws if the path isn't found.
     */
    function removeFilePath(text, path) {
        const lit = `'${path.replace(/'/g, "\\'")}'`;
        // Match the whole indented line with optional trailing comma.
        const lineRe = new RegExp(`[ \\t]*${escapeRegExp(lit)}\\s*,?[ \\t]*\\n`);
        if (!lineRe.test(text)) {
            throw new Error(`Path not found in script.js: ${path}`);
        }
        return text.replace(lineRe, '');
    }

    /**
     * Remove any titleOverrides entry whose key matches one of `keys`.
     * Silently no-ops when no entry matches — useful for both delete-flow
     * cleanup and "title reverted to auto" edits.
     */
    function removeTitleOverrides(text, keys) {
        let out = text;
        for (const k of keys) {
            if (!k) continue;
            const lineRe = new RegExp(
                `[ \\t]*['"]${escapeRegExp(k)}['"]\\s*:\\s*['"][^'"]*['"]\\s*,?[ \\t]*\\n`
            );
            out = out.replace(lineRe, '');
        }
        return out;
    }

    /**
     * Set or replace a titleOverrides entry. If an entry already exists
     * for `key1` or `key2`, its value is replaced in place; otherwise a
     * new entry keyed on `preferredKey` is inserted near the top.
     */
    function setTitleOverride(text, preferredKey, key1, key2, title) {
        const escTitle = title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const newVal = `'${escTitle}'`;
        for (const k of [key1, key2]) {
            if (!k) continue;
            const inPlace = new RegExp(
                `(['"]${escapeRegExp(k)}['"]\\s*:\\s*)['"][^'"]*['"]`
            );
            if (inPlace.test(text)) return text.replace(inPlace, `$1${newVal}`);
        }
        // No existing entry — insert near top of the block.
        const marker = /(const titleOverrides = \{\s*\n)/;
        if (!marker.test(text)) return text;
        const escKey = preferredKey.replace(/'/g, "\\'");
        const line = `    '${escKey}': ${newVal},\n`;
        return text.replace(marker, `$1${line}`);
    }

    // -------- Video / poster pipeline --------
    function loadVideo(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.src = url;
            const cleanup = () => {
                video.removeEventListener('loadeddata', onLoad);
                video.removeEventListener('error', onError);
            };
            const onLoad = () => {
                cleanup();
                resolve({ video, url });
            };
            const onError = () => {
                cleanup();
                URL.revokeObjectURL(url);
                reject(new Error('Could not decode video — is it a valid MP4?'));
            };
            video.addEventListener('loadeddata', onLoad);
            video.addEventListener('error', onError);
        });
    }

    async function extractPoster(video) {
        // Seek a tiny bit past 0 so we get a real frame, not a black slate.
        await new Promise((resolve) => {
            const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve(); };
            video.addEventListener('seeked', onSeeked);
            try { video.currentTime = Math.min(0.1, (video.duration || 1) / 2); }
            catch (e) { resolve(); }
        });
        const canvas = document.createElement('canvas');
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => blob ? resolve(blob) : reject(new Error('Could not encode poster JPEG')),
                'image/jpeg',
                POSTER_QUALITY,
            );
        });
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload  = () => {
                const s = r.result;
                const i = s.indexOf(',');
                resolve(s.slice(i + 1));
            };
            r.onerror = () => reject(new Error('Could not read blob'));
            r.readAsDataURL(blob);
        });
    }

    // -------- Drop / file picker --------
    stage.addEventListener('click', () => {
        // Only open the file picker when in empty state. Once a card is shown,
        // the user uses the Replace button to change videos.
        if (!pickedFile) fileInput.click();
    });
    stage.addEventListener('keydown', (e) => {
        if (!pickedFile && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            fileInput.click();
        }
    });
    stage.addEventListener('dragover', (e) => {
        e.preventDefault();
        stage.classList.add('is-hover');
    });
    stage.addEventListener('dragleave', () => stage.classList.remove('is-hover'));
    stage.addEventListener('drop', (e) => {
        e.preventDefault();
        stage.classList.remove('is-hover');
        const f = e.dataTransfer?.files?.[0];
        if (f) handleFile(f);
    });

    fileInput.addEventListener('change', () => {
        const f = fileInput.files?.[0];
        if (f) handleFile(f);
    });

    replaceBtn.addEventListener('click', () => fileInput.click());

    async function handleFile(file) {
        const isMp4 = file.type === 'video/mp4' || /\.mp4$/i.test(file.name);
        if (!isMp4) {
            setStatus('Only MP4 files are supported', 'error');
            return;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            setStatus(`File too large (max ${MAX_FILE_MB} MB)`, 'error');
            return;
        }
        pickedFile = file;
        if (previewURL) URL.revokeObjectURL(previewURL);
        previewURL = null;
        posterBlob = null;
        videoMeta = { w: 0, h: 0, duration: 0 };

        stage.classList.add('is-loaded');
        dropEmpty.hidden    = true;
        previewCard.hidden  = false;
        replaceBtn.hidden   = false;
        stageHint.textContent = 'Live preview — what publishes is what you see.';

        setStatus('Decoding…');
        try {
            const { video, url } = await loadVideo(file);
            previewURL = url;
            videoMeta.w = video.videoWidth;
            videoMeta.h = video.videoHeight;
            videoMeta.duration = video.duration;
            renderPreviewCard();

            setStatus('Extracting poster frame…');
            posterBlob = await extractPoster(video);

            srcInfo.textContent    = `${videoMeta.w}×${videoMeta.h} · ${fmtKB(file.size)}`;
            durInfo.textContent    = fmtDur(videoMeta.duration);
            posterInfo.textContent = fmtKB(posterBlob.size);
            encodedInfo.hidden = false;
            setStatus('Ready to publish.');
        } catch (err) {
            setStatus(err.message, 'error');
            pickedFile = null;
            posterBlob = null;
            stage.classList.remove('is-loaded');
            dropEmpty.hidden    = false;
            previewCard.hidden  = true;
            replaceBtn.hidden   = true;
            encodedInfo.hidden  = true;
        }
    }

    // -------- Live preview --------
    // Builds the same .card structure the public site uses, so style.css does
    // all the rendering. The video src is the picked file's blob URL, so no
    // upload is needed to see what publishes.
    function renderPreviewCard() {
        if (!pickedFile || !previewURL) return;
        const slug   = deriveSlug();
        const title  = deriveTitleFromSlug(slug);

        previewCard.innerHTML = `
            <div class="card">
                <div class="card-thumb loaded">
                    <video loop muted playsinline autoplay>
                        <source src="${previewURL}" type="video/mp4">
                    </video>
                </div>
                ${title ? `<p class="card-title">${esc(title)}</p>` : ''}
            </div>
        `;
        // Kick playback (autoplay attr alone can be flaky for blob URLs).
        const v = previewCard.querySelector('video');
        v?.play?.().catch(() => {});
    }

    // -------- Path preview --------
    function updatePathPreview() {
        const folder = CATEGORY_FOLDERS[categoryInput.value] || 'Assets/—';
        const slug = deriveSlug();
        pathPreview.textContent = `${folder}/${slug || '—'}.mp4`;
    }

    // Any field change should refresh the live card preview + path.
    function onFormChange() {
        if (pickedFile) renderPreviewCard();
        updatePathPreview();
    }
    itemForm.addEventListener('input',  onFormChange);
    itemForm.addEventListener('change', onFormChange);

    // -------- Publish --------
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!token) { showGate(); return; }
        if (!pickedFile || !posterBlob) {
            setStatus('Pick a video first.', 'error');
            return;
        }
        const data = new FormData(itemForm);
        const catId = String(data.get('category') || 'featured');
        const folder = CATEGORY_FOLDERS[catId];
        if (!folder) {
            setStatus(`Unknown category: ${catId}`, 'error');
            return;
        }
        const slug = deriveSlug();
        const relMp4    = `${folder}/${slug}.mp4`;
        const relPoster = `${folder}/${slug}.jpg`;
        const customTitle = titleInput.value.trim();
        const position = data.get('position') === 'bottom' ? 'bottom' : 'top';

        publishBtn.disabled = true;
        try {
            const result = await publish({
                catId, folder, slug, relMp4, relPoster, customTitle, position,
            });
            statusEl.innerHTML =
                `Published. ` +
                `<a href="${esc(result.commit)}" target="_blank" rel="noopener">View commit ↗</a>` +
                ` · Live at ` +
                `<a href="${esc(result.site)}" target="_blank" rel="noopener">${esc(result.site)}</a>` +
                ` in ~1 min.`;
            statusEl.classList.remove('is-error');
            statusEl.classList.add('is-success');
            existingPaths.add(relMp4);
            resetForm();
        } catch (err) {
            if (err.isAuth) {
                localStorage.removeItem(TOKEN_KEY);
                token = '';
                showGate('Token rejected. Paste a fresh one — your draft is preserved.');
            } else {
                setStatus(err.message, 'error');
            }
        } finally {
            publishBtn.disabled = false;
        }
    });

    function resetForm() {
        itemForm.reset();
        pickedFile = null;
        posterBlob = null;
        if (previewURL) { URL.revokeObjectURL(previewURL); previewURL = null; }
        previewCard.innerHTML = '';
        previewCard.hidden = true;
        replaceBtn.hidden  = true;
        dropEmpty.hidden   = false;
        stage.classList.remove('is-loaded');
        encodedInfo.hidden = true;
        updatePathPreview();
    }

    /**
     * Atomic publish via the Git Data API.
     * Steps: ref -> commit -> 3 blobs -> tree -> commit -> ref.
     */
    async function publish({ catId, folder, slug, relMp4, relPoster, customTitle, position }) {
        setStatus('Reading branch…');
        const ref = await gh(repoPath(`/git/refs/heads/${BRANCH}`));
        const parentSha = ref.object.sha;
        const parentCommit = await gh(repoPath(`/git/commits/${parentSha}`));
        const baseTreeSha = parentCommit.tree.sha;

        setStatus('Reading script.js…');
        const scriptRes = await gh(repoPath(`/contents/script.js?ref=${BRANCH}`));
        let scriptText = decodeBase64Utf8(scriptRes.content);
        scriptText = insertFileIntoCategory(scriptText, catId, relMp4, position);
        scriptText = maybeAddTitleOverride(scriptText, slug, customTitle);

        setStatus('Uploading video…');
        const mp4Sha = await uploadBlob(await blobToBase64(pickedFile));

        setStatus('Uploading poster…');
        const posterSha = await uploadBlob(await blobToBase64(posterBlob));

        setStatus('Updating script.js…');
        const scriptSha = await uploadBlob(encodeUtf8Base64(scriptText));

        setStatus('Building tree…');
        const tree = await gh(repoPath('/git/trees'), {
            method: 'POST',
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: [
                    { path: relMp4,    mode: '100644', type: 'blob', sha: mp4Sha },
                    { path: relPoster, mode: '100644', type: 'blob', sha: posterSha },
                    { path: 'script.js', mode: '100644', type: 'blob', sha: scriptSha },
                ],
            }),
        });

        setStatus('Committing…');
        const meta = CATEGORY_META[catId] || { name: catId };
        const titleForMsg = customTitle || deriveTitleFromSlug(slug) || slug;
        const commitMsg = `Add ${meta.name} interaction: ${titleForMsg}`;
        const commit = await gh(repoPath('/git/commits'), {
            method: 'POST',
            body: JSON.stringify({
                message: commitMsg,
                tree:    tree.sha,
                parents: [parentSha],
            }),
        });

        setStatus('Advancing branch…');
        await gh(repoPath(`/git/refs/heads/${BRANCH}`), {
            method: 'PATCH',
            body: JSON.stringify({ sha: commit.sha, force: false }),
        });

        return {
            commit: commit.html_url || `https://github.com/${REPO_OWNER}/${REPO_NAME}/commit/${commit.sha}`,
            site:   `${SITE_URL}#${catId}`,
        };
    }

    async function uploadBlob(base64Content) {
        const res = await gh(repoPath('/git/blobs'), {
            method: 'POST',
            body: JSON.stringify({ content: base64Content, encoding: 'base64' }),
        });
        return res.sha;
    }

    // -------- Tabs --------
    function setActiveTab(view) {
        for (const btn of [tabAdd, tabManage]) {
            btn.classList.toggle('is-active', btn.dataset.view === view);
            btn.setAttribute('aria-selected', btn.dataset.view === view ? 'true' : 'false');
        }
        for (const sec of document.querySelectorAll('.admin-view')) {
            sec.classList.toggle('is-active', sec.dataset.view === view);
        }
        if (view === 'manage' && !manageBuilt) {
            manageBuilt = true;
            renderManageList();
        }
    }
    tabAdd.addEventListener('click',    () => setActiveTab('add'));
    tabManage.addEventListener('click', () => setActiveTab('manage'));

    // -------- Manage view: render --------
    function setManageStatus(text, kind) {
        manageStatus.textContent = text || '';
        manageStatus.classList.remove('is-success', 'is-error');
        if (kind) manageStatus.classList.add(`is-${kind}`);
    }

    function renderManageList() {
        if (!parsedCategories.length) {
            manageList.innerHTML = '<p class="admin-manage-empty">No categories parsed from script.js — refresh and try again.</p>';
            manageCount.textContent = '0 items';
            return;
        }
        const total = parsedCategories.reduce((n, c) => n + c.files.length, 0);
        manageCount.textContent = `${total} item${total === 1 ? '' : 's'}`;

        const html = parsedCategories.map((cat) => {
            const items = cat.files.map((f, idx) => itemHTML(cat, f, idx)).join('');
            return `
                <section class="admin-cat-block" data-cat="${esc(cat.id)}">
                    <header class="admin-cat-header">
                        <h3 class="admin-cat-name">${esc(cat.name)}</h3>
                        <span class="admin-cat-tally">${cat.files.length}</span>
                    </header>
                    <div class="admin-cat-grid">${items}</div>
                </section>
            `;
        }).join('');
        manageList.innerHTML = html;
        applyManageFilter();
    }

    function itemHTML(cat, f, idx) {
        const posterPath = f.path.replace(/\.mp4$/i, '.jpg');
        const titleHTML = f.title
            ? esc(f.title)
            : `<em>(untitled)</em>`;
        const haystack = `${f.title} ${f.slug} ${cat.name} ${cat.id}`.toLowerCase();
        return `
            <div class="admin-item" data-cat="${esc(cat.id)}" data-idx="${idx}" data-haystack="${esc(haystack)}">
                <div class="admin-item-thumb">
                    <img src="${esc(posterPath)}" alt="" loading="lazy"
                         onerror="this.style.display='none'">
                </div>
                <div class="admin-item-body">
                    <div class="admin-item-title-block">
                        <div class="admin-item-title">${titleHTML}</div>
                        <div class="admin-item-slug">${esc(f.slug)}</div>
                        ${f.isOverride ? '<span class="admin-item-override">Override</span>' : ''}
                    </div>
                </div>
                <div class="admin-item-actions">
                    <button type="button" class="admin-item-btn admin-item-btn--edit"
                            data-action="edit" data-cat="${esc(cat.id)}" data-idx="${idx}">Edit</button>
                    <button type="button" class="admin-item-btn admin-item-btn--danger"
                            data-action="delete" data-cat="${esc(cat.id)}" data-idx="${idx}">Delete</button>
                </div>
            </div>
        `;
    }

    function applyManageFilter() {
        const q = manageSearch.value.trim().toLowerCase();
        let visible = 0;
        for (const block of manageList.querySelectorAll('.admin-cat-block')) {
            let blockVisible = 0;
            for (const item of block.querySelectorAll('.admin-item')) {
                const match = !q || item.dataset.haystack.includes(q);
                item.style.display = match ? '' : 'none';
                if (match) { blockVisible++; visible++; }
            }
            block.style.display = blockVisible ? '' : 'none';
        }
        if (q) manageCount.textContent = `${visible} match${visible === 1 ? '' : 'es'}`;
        else {
            const total = parsedCategories.reduce((n, c) => n + c.files.length, 0);
            manageCount.textContent = `${total} item${total === 1 ? '' : 's'}`;
        }
    }
    manageSearch.addEventListener('input', applyManageFilter);

    // -------- Manage view: actions --------
    function findItem(catId, idx) {
        const cat = parsedCategories.find(c => c.id === catId);
        if (!cat) return null;
        const file = cat.files[idx];
        if (!file) return null;
        return { cat, file, idx };
    }

    manageList.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const itemEl = btn.closest('.admin-item');
        const ref = findItem(btn.dataset.cat, parseInt(btn.dataset.idx, 10));
        if (!ref) return;
        if (action === 'edit')   beginEditTitle(itemEl, ref);
        if (action === 'delete') confirmDelete(itemEl, ref);
    });

    function beginEditTitle(itemEl, ref) {
        if (itemEl.querySelector('.admin-item-edit')) return; // already editing
        const titleBlock = itemEl.querySelector('.admin-item-title-block');
        const current = ref.file.title || '';
        titleBlock.innerHTML = `
            <div class="admin-item-edit">
                <input type="text" value="${esc(current)}" placeholder="Title (leave blank to revert)" autocomplete="off">
                <div class="admin-item-edit-row">
                    <button type="button" class="admin-item-btn admin-item-btn--save">Save</button>
                    <button type="button" class="admin-item-btn admin-item-btn--cancel">Cancel</button>
                </div>
            </div>
        `;
        const input = titleBlock.querySelector('input');
        input.focus();
        input.select();
        const cancel = () => renderManageList();
        titleBlock.querySelector('.admin-item-btn--cancel').addEventListener('click', cancel);
        titleBlock.querySelector('.admin-item-btn--save').addEventListener('click', () => {
            const newTitle = input.value.trim();
            saveEditTitle(itemEl, ref, newTitle);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') cancel();
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEditTitle(itemEl, ref, input.value.trim());
            }
        });
    }

    async function saveEditTitle(itemEl, ref, newTitle) {
        // Auto-derived title for this slug, ignoring any current override.
        const auto = ref.file.key2
            .replace(/[-_.]+/g, ' ')
            .trim()
            .replace(/\b\w/g, c => c.toUpperCase());
        // No-op if the user didn't actually change anything visible.
        if (newTitle === ref.file.title) {
            renderManageList();
            return;
        }
        itemEl.classList.add('is-busy');
        setManageStatus('Saving…');
        try {
            await commitScriptEdit(`Update title: ${ref.cat.name} · ${newTitle || auto || ref.file.slug}`, (text) => {
                if (!newTitle || newTitle === auto) {
                    return removeTitleOverrides(text, [ref.file.key1, ref.file.key2]);
                }
                return setTitleOverride(text, ref.file.key2 || ref.file.key1, ref.file.key1, ref.file.key2, newTitle);
            });
            await loadExistingScript();
            setManageStatus('Title saved.', 'success');
        } catch (err) {
            handleManageError(err);
        } finally {
            itemEl.classList.remove('is-busy');
        }
    }

    function confirmDelete(itemEl, ref) {
        const label = ref.file.title || ref.file.slug;
        if (!window.confirm(`Delete "${label}" from ${ref.cat.name}?\n\nThis removes the .mp4 and poster .jpg from the repo and the entry from script.js.`)) {
            return;
        }
        deleteItem(itemEl, ref);
    }

    async function deleteItem(itemEl, ref) {
        itemEl.classList.add('is-busy');
        setManageStatus('Deleting…');
        try {
            const posterPath = ref.file.path.replace(/\.mp4$/i, '.jpg');
            await commitDelete(
                `Remove ${ref.cat.name} interaction: ${ref.file.title || ref.file.slug}`,
                ref.file.path,
                posterPath,
                ref.file
            );
            await loadExistingScript();
            setManageStatus('Deleted.', 'success');
        } catch (err) {
            handleManageError(err);
        } finally {
            itemEl.classList.remove('is-busy');
        }
    }

    function handleManageError(err) {
        if (err.isAuth) {
            localStorage.removeItem(TOKEN_KEY);
            token = '';
            showGate('Token rejected. Paste a fresh one.');
            return;
        }
        setManageStatus(err.message, 'error');
    }

    /**
     * Atomic commit that only changes script.js. The mutate() callback
     * receives the latest text and returns the new text.
     */
    async function commitScriptEdit(message, mutate) {
        const ref = await gh(repoPath(`/git/refs/heads/${BRANCH}`));
        const parentSha = ref.object.sha;
        const parentCommit = await gh(repoPath(`/git/commits/${parentSha}`));
        const baseTreeSha = parentCommit.tree.sha;

        const scriptRes = await gh(repoPath(`/contents/script.js?ref=${BRANCH}`));
        const oldText = decodeBase64Utf8(scriptRes.content);
        const newText = mutate(oldText);
        if (newText === oldText) return; // nothing to do

        const scriptSha = await uploadBlob(encodeUtf8Base64(newText));
        const tree = await gh(repoPath('/git/trees'), {
            method: 'POST',
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: [{ path: 'script.js', mode: '100644', type: 'blob', sha: scriptSha }],
            }),
        });
        const commit = await gh(repoPath('/git/commits'), {
            method: 'POST',
            body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }),
        });
        await gh(repoPath(`/git/refs/heads/${BRANCH}`), {
            method: 'PATCH',
            body: JSON.stringify({ sha: commit.sha, force: false }),
        });
    }

    /**
     * Atomic commit that removes a video + poster from the tree and patches
     * script.js to drop the file path and any matching titleOverrides entry.
     */
    async function commitDelete(message, mp4Path, posterPath, fileRef) {
        const ref = await gh(repoPath(`/git/refs/heads/${BRANCH}`));
        const parentSha = ref.object.sha;
        const parentCommit = await gh(repoPath(`/git/commits/${parentSha}`));
        const baseTreeSha = parentCommit.tree.sha;

        const scriptRes = await gh(repoPath(`/contents/script.js?ref=${BRANCH}`));
        let scriptText = decodeBase64Utf8(scriptRes.content);
        scriptText = removeFilePath(scriptText, mp4Path);
        scriptText = removeTitleOverrides(scriptText, [fileRef.key1, fileRef.key2]);

        // Check whether the poster file actually exists in the tree before
        // including a delete entry — passing sha:null for a missing path
        // makes the tree call fail.
        const posterExists = await fileExists(posterPath);

        const scriptSha = await uploadBlob(encodeUtf8Base64(scriptText));
        const treeEntries = [
            { path: mp4Path,    mode: '100644', type: 'blob', sha: null },
            { path: 'script.js', mode: '100644', type: 'blob', sha: scriptSha },
        ];
        if (posterExists) {
            treeEntries.push({ path: posterPath, mode: '100644', type: 'blob', sha: null });
        }
        const tree = await gh(repoPath('/git/trees'), {
            method: 'POST',
            body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
        });
        const commit = await gh(repoPath('/git/commits'), {
            method: 'POST',
            body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }),
        });
        await gh(repoPath(`/git/refs/heads/${BRANCH}`), {
            method: 'PATCH',
            body: JSON.stringify({ sha: commit.sha, force: false }),
        });
    }

    async function fileExists(path) {
        try {
            await gh(repoPath(`/contents/${encodeURI(path)}?ref=${BRANCH}`));
            return true;
        } catch (err) {
            if (err.isAuth) throw err;
            return false;
        }
    }
})();
