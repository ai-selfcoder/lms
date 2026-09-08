"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { ANALYTICS_OPT_OUT_KEY } from "@/lib/privacy";

export { ANALYTICS_OPT_OUT_KEY } from "@/lib/privacy";

/** Third-party counters are production-only and gated by the local opt-out. */
export function Analytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) !== "1");
  }, []);

  if (process.env.NODE_ENV !== "production" || !enabled) return null;

  return (
    <>
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
          <img src="https://top-fwz1.mail.ru/counter?id=3776270;js=na" style={{ position: "absolute", left: "-9999px" }} alt="Top.Mail.Ru" />
          <img src="https://mc.yandex.ru/watch/110231279" style={{ position: "absolute", left: "-9999px" }} alt="" />
        </div>
      </noscript>
    </>
  );
}

export function AnalyticsPreferences() {
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => {
    setOptedOut(window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1");
  }, []);

  function toggle() {
    const next = !optedOut;
    window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, next ? "1" : "0");
    setOptedOut(next);
    window.location.reload();
  }

  return (
    <button type="button" className="analytics-preferences" onClick={toggle}>
      {optedOut ? "Включить аналитику" : "Отключить аналитику"}
    </button>
  );
}
