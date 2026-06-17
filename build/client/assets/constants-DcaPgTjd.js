const t={meta_pixel:{name:"Meta Pixel",type:"pixel",placement:"head",content:`<!-- Meta Pixel -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '{{PIXEL_ID}}');
fbq('track', 'PageView');
<\/script>`},ga4:{name:"Google Analytics 4",type:"javascript",placement:"head",content:`<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id={{MEASUREMENT_ID}}"><\/script>
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','{{MEASUREMENT_ID}}');
<\/script>`},gtm:{name:"Google Tag Manager",type:"html",placement:"body_start",content:`<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','{{CONTAINER_ID}}');<\/script>`},tiktok:{name:"TikTok Pixel",type:"pixel",placement:"head",content:`<!-- TikTok Pixel -->
<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('{{PIXEL_ID}}');ttq.page();}(window,document,'ttq');
<\/script>`},pinterest:{name:"Pinterest Pixel",type:"pixel",placement:"head",content:`<!-- Pinterest Tag -->
<script>
!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
pintrk('load','{{TAG_ID}}');pintrk('page');
<\/script>`},clarity:{name:"Microsoft Clarity",type:"javascript",placement:"head",content:`<!-- Microsoft Clarity -->
<script type="text/javascript">
(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","{{PROJECT_ID}}");
<\/script>`},snapchat:{name:"Snapchat Pixel",type:"pixel",placement:"head",content:`<!-- Snapchat Pixel -->
<script type='text/javascript'>
(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');
snaptr('init','{{PIXEL_ID}}');snaptr('track','PAGE_VIEW');
<\/script>`}},e=["analytics","hotjar","clarity","facebook_pixel","tiktok_pixel","pinterest_pixel","custom"],a=[{label:"Dashboard",url:"/app",icon:"HomeIcon"},{label:"SEO Audit",url:"/app/seo-audit",icon:"SearchIcon"},{label:"Products SEO",url:"/app/products-seo",icon:"ProductIcon"},{label:"Collections SEO",url:"/app/collections-seo",icon:"CollectionIcon"},{label:"Pages SEO",url:"/app/pages-seo",icon:"PageIcon"},{label:"Blog SEO",url:"/app/blog-seo",icon:"BlogIcon"},{label:"Images",url:"/app/images",icon:"ImageIcon"},{label:"Performance",url:"/app/performance",icon:"GaugeIcon"},{label:"Cache",url:"/app/cache",icon:"DatabaseIcon"},{label:"Script Manager",url:"/app/scripts",icon:"CodeIcon"},{label:"Theme Audit",url:"/app/theme-audit",icon:"ThemeIcon"},{label:"Schema",url:"/app/schema",icon:"SchemaIcon"},{label:"Broken Links",url:"/app/broken-links",icon:"LinkIcon"},{label:"Redirects",url:"/app/redirects",icon:"RedirectIcon"},{label:"Settings",url:"/app/settings",icon:"SettingsIcon"}];export{e as D,a as N,t as P};
