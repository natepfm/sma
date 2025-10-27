<script lang="ts">
  import { onMount } from "svelte";
  import clsx from "clsx";
  let { link = "", title = "", disclaimer = "", ClassName = "",ClassNameText="" } = $props();

  function removeSubdomain(domain: string) {
    const parts = domain.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return domain;
  }

  function formatBrandName(domain: string) {
    const brandName = domain.split('.')[0];
    return brandName.charAt(0).toUpperCase() + brandName.slice(1);
  }

  onMount(() => {
    const currentDomain = window.location.hostname || 'example.com';
    console.log('Original hostname:', currentDomain);
    title = formatBrandName(currentDomain);
    link = removeSubdomain(currentDomain);

    if (!disclaimer) {
      disclaimer = `{link} is a top savings referral service which enables consumers to quickly and easily request multiple competitive insurance quotes from optimally selected local insurance agents and companies using our proprietary consumer alignment technology. We do not provide insurance and we do not represent any specific insurance provider. Please note that lowest listed rates and potential savings may not be representative or available from all companies. {link}.com matches users to advertisers and insurance agents only after we've received certain information from you, and your actual rates and savings will vary based on your location, coverage limits, deductibles, driving records, type of vehicle, affiliations, and many other variables.`;
    }

    disclaimer = disclaimer.replace(/{link}/g, link);
  });
</script>



<div class={clsx("bottom-0 w-full py-10 ", ClassName)}>
  <div class="max-w-7xl mx-auto px-5">
      <p class="text-xs text-center text-[#191919] {ClassNameText}">Disclaimer: {disclaimer}</p>
  </div>
</div>