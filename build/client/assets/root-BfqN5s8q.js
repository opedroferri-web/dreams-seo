import{b as m,c as f,d as x,e as S,r as i,_ as j,f as a,j as e,M as w,L as g,O as k,S as M,g as R}from"./components-CLFESZVD.js";import{p as b,b as E}from"./styles-CeHfqj-P.js";/**
 * @remix-run/react v2.17.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let l="positions";function O({getKey:r,...c}){let{isSpaMode:u}=m(),o=f(),p=x();S({getKey:r,storageKey:l});let h=i.useMemo(()=>{if(!r)return null;let t=r(o,p);return t!==o.key?t:null},[]);if(u)return null;let d=((t,y)=>{if(!window.history.state||!window.history.state.key){let s=Math.random().toString(32).slice(2);window.history.replaceState({key:s},"")}try{let n=JSON.parse(sessionStorage.getItem(t)||"{}")[y||window.history.state.key];typeof n=="number"&&window.scrollTo(0,n)}catch(s){console.error(s),sessionStorage.removeItem(t)}}).toString();return i.createElement("script",j({},c,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${d})(${a(JSON.stringify(l))}, ${a(JSON.stringify(h))})`}}))}const _=()=>[{rel:"stylesheet",href:b}];function H(){return e.jsxs("html",{lang:"pt-BR",children:[e.jsxs("head",{children:[e.jsx("meta",{charSet:"utf-8"}),e.jsx("meta",{name:"viewport",content:"width=device-width,initial-scale=1"}),e.jsx("link",{rel:"preconnect",href:"https://cdn.shopify.com/"}),e.jsx("link",{rel:"stylesheet",href:"https://cdn.shopify.com/static/fonts/inter/v4/styles.css"}),e.jsx(w,{}),e.jsx(g,{})]}),e.jsxs("body",{children:[e.jsx(k,{}),e.jsx(O,{}),e.jsx(M,{})]})]})}function I(){return E.error(R())}export{I as ErrorBoundary,H as default,_ as links};
