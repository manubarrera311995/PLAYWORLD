<div class="velo" aria-hidden="true"></div>

<style>
  .velo {
    position: absolute;
    inset: 0;
    z-index: 5;
    background: var(--bg-deep);
    pointer-events: none;
    animation: creacion-revelar 1.5s var(--ease-out) forwards;
  }

  @keyframes creacion-revelar {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .velo {
      animation: none;
      opacity: 0;
    }
  }

  :global(html.reduce) .velo {
    animation: none;
    opacity: 0;
  }
</style>
