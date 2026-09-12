<script lang="ts">
  import copy from "./home.copy.json";
  import Marca from "../../ui/Marca.svelte";
  import Asterisco from "../../ui/Asterisco.svelte";
  import Boton from "../../ui/Boton.svelte";
  import Collage from "./Collage.svelte";
  import { navigate } from "../director/router";
  import type { RutaParsed } from "../director/router";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();
</script>

<section class="home">
  <div class="home__hero">
    <header class="home__top">
      <Marca texto={copy.brand} />
      <Asterisco />
    </header>
    <div class="home__center">
      <h1 class="tipo-hero">{copy.title[0]}</h1>
      <p class="tipo-cuerpo">{copy.tagline}</p>
      <Boton onclick={() => navigate("/hook")}>{copy.cta}</Boton>
    </div>
  </div>
  <div class="home__mas">
    <Collage cards={copy.cards} />
    <p class="tipo-pie">{copy.footer}</p>
  </div>
</section>

<style>
  .home {
    min-height: 100%;
  }
  .home__hero {
    min-height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr;
    padding: var(--pad-y) var(--pad-x);
    gap: 16px;
  }
  .home__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .home__center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: clamp(14px, 2.2vh, 22px);
  }
  .home__mas {
    padding: 8px var(--pad-x) var(--pad-y);
    display: grid;
    gap: 16px;
  }
  @media (max-width: 767px) {
    .tipo-hero {
      font-size: clamp(48px, 18vw, 92px);
    }
  }
</style>
