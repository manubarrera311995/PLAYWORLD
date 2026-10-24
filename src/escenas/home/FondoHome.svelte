<!--
  Cáscara de `.home__fondo`. La onda, el ecualizador y el halo ya no se pintan:
  el cielo y el grano bastan. El nodo sigue porque `montarFondoHome` lo usa como
  puerta de la cascada de ecos, del parallax y de la disolución hacia el hook.
-->
<div class="home__fondo" aria-hidden="true"></div>

<style>
  /*
   * Sin `isolation`, sin `filter`, sin `backdrop-filter` y sin `opacity` en
   * reposo, para que `.grano` siga resolviendo su mezcla contra el cielo.
   */
  .home__fondo {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 0;
    height: 100dvh;
    overflow: hidden;
    pointer-events: none;
  }
</style>
