/**
 * rank-shield.js — CHESS OX Dynamic Ranking Shield Component
 *
 * Usage:
 *   RankShield.render(container, { iq, rank, size, showBar, showLabel })
 *   RankShield.update(container, { iq, rank })   ← smooth live update
 *   RankShield.fromUser(container, user, opts)   ← pass full user object
 *
 * Sizes: 'xs' | 'sm' | 'md' | 'lg' | 'xl'   (default: 'md')
 */

const RankShield = (() => {

  // ── Tier definitions (must match SQL thresholds exactly) ──────────────
  const TIERS = [
    { rank: 'Bronze',      min: 0,    max: 199,  img: '/assets/shields/bronze.png'      },
    { rank: 'Copil',       min: 200,  max: 299,  img: '/assets/shields/bronze.png'      },
    { rank: 'Silver',      min: 300,  max: 399,  img: '/assets/shields/silver.png'      },
    { rank: 'Gold',        min: 400,  max: 599,  img: '/assets/shields/gold.png'        },
    { rank: 'Platinum',    min: 600,  max: 799,  img: '/assets/shields/platinum.png'    },
    { rank: 'Diamond',     min: 800,  max: 999,  img: '/assets/shields/diamond.png'     },
    { rank: 'Kingdom',     min: 1000, max: 1499, img: '/assets/shields/kingdom.png'     },
    { rank: 'Grand Master',min: 1500, max: Infinity, img: '/assets/shields/grandmaster.png' },
  ];

  // ── Derive tier from IQ ───────────────────────────────────────────────
  function tierFromIQ(iq) {
    const n = Math.max(0, parseInt(iq) || 0);
    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (n >= TIERS[i].min) return TIERS[i];
    }
    return TIERS[0];
  }

  // ── Derive tier from rank string (fallback) ───────────────────────────
  function tierFromRank(rank) {
    return TIERS.find(t => t.rank === rank) || TIERS[0];
  }

  // ── Progress within current tier (0–1) ───────────────────────────────
  function tierProgress(iq, tier) {
    if (tier.max === Infinity) return 1;
    const range = tier.max - tier.min + 1;
    const pos   = Math.max(0, iq - tier.min);
    return Math.min(1, pos / range);
  }

  // ── Points label ─────────────────────────────────────────────────────
  function ptsLabel(iq, tier) {
    if (tier.max === Infinity) return `${iq} IQ`;
    return `${iq} / ${tier.max + 1} IQ`;
  }

  // ── Build DOM ─────────────────────────────────────────────────────────
  function render(container, opts = {}) {
    if (!container) return;

    const {
      iq        = 100,
      rank      = null,
      size      = 'md',
      showBar   = true,
      showLabel = true,
      animate   = false,
    } = opts;

    const tier = rank ? tierFromRank(rank) : tierFromIQ(iq);
    const prog = tierProgress(iq, tier);

    container.innerHTML = `
      <div class="rank-shield-wrap shield-${size}" data-rank="${tier.rank}" data-iq="${iq}">
        <img
          class="rank-shield-img${animate ? ' shield-swap-in' : ''}"
          src="${tier.img}"
          alt="${tier.rank} Shield"
          draggable="false"
        >
        ${showLabel ? `<div class="rank-shield-label">${tier.rank}</div>` : ''}
        ${showBar ? `
          <div class="rank-shield-bar-wrap">
            <div class="rank-shield-bar">
              <div class="rank-shield-bar-fill" style="width:${Math.round(prog * 100)}%"></div>
            </div>
            <div class="rank-shield-pts">${ptsLabel(iq, tier)}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ── Smooth live update (animates tier change if rank changed) ─────────
  function update(container, opts = {}) {
    if (!container) return;

    const wrap = container.querySelector('.rank-shield-wrap');
    if (!wrap) { render(container, opts); return; }

    const prevRank = wrap.dataset.rank;
    const prevIQ   = parseInt(wrap.dataset.iq) || 0;
    const newIQ    = Math.max(0, parseInt(opts.iq) || 0);
    const newRank  = opts.rank || null;

    const newTier  = newRank ? tierFromRank(newRank) : tierFromIQ(newIQ);
    const tierChanged = newTier.rank !== prevRank;

    // Update data attrs
    wrap.dataset.rank = newTier.rank;
    wrap.dataset.iq   = newIQ;

    const img = wrap.querySelector('.rank-shield-img');

    if (tierChanged && img) {
      // Swap animation: fade out old, swap src, fade in new
      img.classList.add('shield-swap-out');
      setTimeout(() => {
        img.src = newTier.img;
        img.alt = `${newTier.rank} Shield`;
        img.classList.remove('shield-swap-out');
        img.classList.add('shield-swap-in');
        setTimeout(() => img.classList.remove('shield-swap-in'), 350);
      }, 200);
    } else if (newIQ > prevIQ && img) {
      // Same tier, IQ went up — brief pulse
      img.classList.remove('shield-rank-up');
      void img.offsetWidth; // reflow to restart animation
      img.classList.add('shield-rank-up');
      setTimeout(() => img.classList.remove('shield-rank-up'), 700);
    }

    // Update label
    const label = wrap.querySelector('.rank-shield-label');
    if (label) label.textContent = newTier.rank;

    // Update bar
    const fill = wrap.querySelector('.rank-shield-bar-fill');
    const pts  = wrap.querySelector('.rank-shield-pts');
    const prog = tierProgress(newIQ, newTier);
    if (fill) fill.style.width = Math.round(prog * 100) + '%';
    if (pts)  pts.textContent  = ptsLabel(newIQ, newTier);
  }

  // ── Convenience: pass full user object ───────────────────────────────
  function fromUser(container, user, opts = {}) {
    render(container, {
      iq:    user?.iq_level ?? 100,
      rank:  user?.rank     ?? null,
      ...opts,
    });
  }

  // ── Convenience: update from user object ─────────────────────────────
  function updateFromUser(container, user) {
    update(container, {
      iq:   user?.iq_level ?? 100,
      rank: user?.rank     ?? null,
    });
  }

  // ── Public API ────────────────────────────────────────────────────────
  return { render, update, fromUser, updateFromUser, tierFromIQ, tierFromRank, TIERS };

})();

// Make globally available
window.RankShield = RankShield;
