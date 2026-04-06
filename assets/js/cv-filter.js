/* =============================================================
   cv-filter.js — drop into assets/js/ and link from _layouts/default.html
   Tag-based filtering for Jekyll CV with sticky dropdown UI.
   ============================================================= */

(function () {
  const ALWAYS_TAG  = 'always';
  const DEFAULT_TAG = 'default';

  /* ── Collect all tagged elements ────────────────────────────── */
  function getTaggedElements() {
    return Array.from(document.querySelectorAll('[data-tags]'));
  }

  /* ── Parse tags from an element ─────────────────────────────── */
  function elementTags(el) {
    return el.dataset.tags.trim().split(/\s+/);
  }

  /* ── Gather every unique tag in the document ─────────────────── */
  function collectAllTags() {
    const tagSet = new Set();
    getTaggedElements().forEach(el => {
      elementTags(el).forEach(t => {
        if (t !== ALWAYS_TAG && t !== DEFAULT_TAG) tagSet.add(t);
      });
    });
    return Array.from(tagSet).sort();
  }

  /* ── Read active tags from URL query param ───────────────────── */
  function getActiveTags() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('tags');
    if (!raw) return null; // null = no param = use defaults
    return new Set(raw.split(',').map(t => t.trim()).filter(Boolean));
  }

  /* ── Write active tags back to URL (no reload) ───────────────── */
  function setActiveTags(tagSet) {
    const params = new URLSearchParams(window.location.search);
    if (tagSet.size === 0) {
      params.delete('tags');
    } else {
      params.set('tags', Array.from(tagSet).join(','));
    }
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    history.replaceState(null, '', newUrl);
  }

  /* ── Apply visibility to all tagged elements ─────────────────── */
  function applyFilter(activeTags) {
    // activeTags === null means "no param" → show defaults
    getTaggedElements().forEach(el => {
      const tags = elementTags(el);

      if (tags.includes(ALWAYS_TAG)) {
        el.style.display = '';
        return;
      }

      if (activeTags === null) {
        // default mode: show items tagged 'default' (or 'always' handled above)
        el.style.display = tags.includes(DEFAULT_TAG) ? '' : 'none';
        return;
      }

      // filter mode: show if any tag matches (OR logic), always show 'default' items too
      const visible = tags.includes(DEFAULT_TAG) ||
                      tags.some(t => activeTags.has(t));
      el.style.display = visible ? '' : 'none';
    });
  }

  /* ── Build the sticky dropdown widget ───────────────────────── */
  function buildWidget(allTags, activeTags) {
    const widget = document.createElement('div');
    widget.id = 'cv-filter-widget';

    const label = document.createElement('span');
    label.textContent = 'Filter: ';
    label.className = 'cv-filter-label';
    widget.appendChild(label);

    allTags.forEach(tag => {
      const isChecked = activeTags === null
        ? false  // no pre-checks when in default mode; defaults shown automatically
        : activeTags.has(tag);

      const wrapper = document.createElement('label');
      wrapper.className = 'cv-filter-tag';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = tag;
      checkbox.checked = isChecked;

      checkbox.addEventListener('change', () => {
        const current = getActiveTags() || new Set();
        if (checkbox.checked) {
          current.add(tag);
        } else {
          current.delete(tag);
        }
        setActiveTags(current);
        applyFilter(current.size === 0 ? null : current);
        // sync all checkboxes in case of external URL changes
        syncCheckboxes();
      });

      wrapper.appendChild(checkbox);
      wrapper.appendChild(document.createTextNode(' ' + tag));
      widget.appendChild(wrapper);
    });


    const btnGroup = document.createElement('div');
    btnGroup.style.marginLeft = 'auto';
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = '6px';
    widget.appendChild(btnGroup);

    // All button → Adds all the tags tp query param
    const all = document.createElement('button');
    all.textContent = 'All';
    all.className = 'cv-filter-reset';
    all.addEventListener('click', () => {
      const allTagSet = new Set(allTags);
      setActiveTags(allTagSet);
      applyFilter(allTagSet);
      syncCheckboxes();
    });
    btnGroup.appendChild(all);

    // Reset button → clears query param, back to default mode
    const reset = document.createElement('button');
    reset.textContent = 'Reset';
    reset.className = 'cv-filter-reset';
    reset.addEventListener('click', () => {
      setActiveTags(new Set());
      applyFilter(null);
      syncCheckboxes();
    });
    btnGroup.appendChild(reset);

    return widget;
  }

  /* ── Sync checkbox states to current URL ─────────────────────── */
  function syncCheckboxes() {
    const activeTags = getActiveTags();
    document.querySelectorAll('#cv-filter-widget input[type=checkbox]').forEach(cb => {
      cb.checked = activeTags !== null && activeTags.has(cb.value);
    });
  }

  /* ── Init ────────────────────────────────────────────────────── */
  function init() {
    const allTags    = collectAllTags();
    const activeTags = getActiveTags();

    applyFilter(activeTags);

    const widget = buildWidget(allTags, activeTags);
    document.body.insertBefore(widget, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
