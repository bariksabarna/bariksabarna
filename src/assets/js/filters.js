/* filters.js — client-side filtering for Projects (by skill) & Certificates grids */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.filterbar').forEach(initFilterBar);
  });

  function initFilterBar(bar) {
    var chips = bar.querySelectorAll('.filter-chip[data-filter]');
    var grid = document.querySelector('[data-filter-grid]');
    if (!grid || !chips.length) return;

    var items = grid.querySelectorAll('.grid-item');
    var live = document.querySelector('[data-filter-live]');

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var filter = chip.getAttribute('data-filter');

        chips.forEach(function (c) {
          c.classList.remove('is-active');
          c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('is-active');
        chip.setAttribute('aria-pressed', 'true');

        var visible = 0;
        items.forEach(function (item) {
          var tags = (item.getAttribute('data-skills') || '').split(/\s+/).filter(Boolean);
          var match = filter === 'all' || tags.indexOf(filter) !== -1;
          item.style.display = match ? '' : 'none';
          if (match) visible++;
        });

        if (live) {
          var label = filter === 'all' ? 'All items' : '"' + filter + '"';
          live.textContent = visible + ' of ' + items.length + ' shown for ' + label + '.';
        }
      });
    });
  }
})();
