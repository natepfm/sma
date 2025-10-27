<script lang="ts">

  import { onMount } from "svelte";
  let { link = "", title = "", ClassName = "" } = $props();

  function removeSubdomain(domain: string) {
          const parts = domain.split('.');
          if (parts.length > 2) {
              return parts.slice(-2).join('.');
          }
          return domain;
      }

      function formatBrandName(domain: string) {
          const parts = domain.split('.');
          // If we have a subdomain (like c.domain.com), get the main domain name
          // Otherwise, use the first part
          const brandName = parts.length > 2 ? parts[1] : parts[0];
          return brandName.charAt(0).toUpperCase() + brandName.slice(1);
      }

   onMount(() => {
    const currentDomain = window.location.hostname || 'example.com';
    console.log('Original hostname:', currentDomain);
    title = formatBrandName(currentDomain)
    link = removeSubdomain(currentDomain)
   })



</script>



<div class="footer-text text-center text-sm {ClassName}"><a href="../../privacy/">Privacy Policy</a> | 
  <a href="../../terms/">Terms Of Use</a> | {title} | 74 E Glenwood Ave Smyrna, DE 19977

</div>
  

