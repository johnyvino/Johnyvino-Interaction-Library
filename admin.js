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

    // -------- State --------
    let token         = localStorage.getItem(TOKEN_KEY) || '';
    let pickedFile    = null;
    let previewURL    = null;       // blob URL for the preview <video>; revoked on replace
    let posterBlob    = null;       // first-frame JPEG, generated client-side
    let videoMeta     = { w: 0, h: 0, duration: 0 };
    let existingPaths = new Set();  // every Assets/.../*.mp4 already in script.js

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
        // Pull every quoted Assets/... path so we can dedupe on slug collisions.
        existingPaths = new Set();
        const re = /['"](Assets\/[^'"]+\.mp4)['"]/g;
        let m;
        while ((m = re.exec(text)) !== null) existingPaths.add(m[1]);
        updatePathPreview();
        return { text, sha: res.sha };
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
})();
