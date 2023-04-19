<script lang="ts">
  import "../app.css";
  import Footer from "../components/Footer.svelte";
  import Navbar from "../components/Navbar.svelte";

  const pageDescription = "";
</script>

<svelte:head>
  <title>SDP Compact Example</title>
  <meta name="description" content={pageDescription} />
  <meta name="theme-color" content="#fff" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="SDP Compact Example" />
  <meta property="og:description" content={pageDescription} />
</svelte:head>

<div class="flex flex-col h-screen">
  <Navbar />
  <div class="flex-grow container mx-auto justify-items-center">
    <slot />
  </div>
  <Footer />
</div>
