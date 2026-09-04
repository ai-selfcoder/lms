import Script from "next/script";

/**
 * Third-party analytics: VK Ads (Top.Mail.Ru) + Yandex.Metrika.
 *
 * Rendered once from the root layout, so the counters load on every route.
 * Both vendor snippets self-guard against double injection; next/script keeps
 * them off the critical path via `afterInteractive`. Gated to production so
 * local dev / preview traffic never pollutes the real stats (the web image
 * runs with NODE_ENV=production, so graphlms.ru still fires them).
 */
export function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      {/* Top.Mail.Ru counter (VK Ads) */}
      <Script id="top-mailru-counter" strategy="afterInteractive">
        {`var _tmr = window._tmr || (window._tmr = []);
_tmr.push({id: "3776270", type: "pageView", start: (new Date()).getTime()});
(function (d, w, id) {
  if (d.getElementById(id)) return;
  var ts = d.createElement("script"); ts.type = "text/javascript"; ts.async = true; ts.id = id;
  ts.src = "https://top-fwz1.mail.ru/js/code.js";
  var f = function () {var s = d.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ts, s);};
  if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); }
})(document, window, "tmr-code");`}
      </Script>

      {/* Yandex.Metrika counter */}
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=110231279', 'ym');
ym(110231279, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`}
      </Script>

      <noscript>
        <div>
          <img
            src="https://top-fwz1.mail.ru/counter?id=3776270;js=na"
            style={{ position: "absolute", left: "-9999px" }}
            alt="Top.Mail.Ru"
          />
          <img
            src="https://mc.yandex.ru/watch/110231279"
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
