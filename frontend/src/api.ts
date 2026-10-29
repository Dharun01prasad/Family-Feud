import{io}from'socket.io-client';
export const TOKEN=localStorage.getItem('feud-host-token')||'college-feud-host';
export const socket=io({autoConnect:true});
export async function api(path:string,options:RequestInit={},host=false){const res=await fetch('/api'+path,{...options,headers:{'Content-Type':'application/json',...(host?{Authorization:`Bearer ${TOKEN}`} :{}),...options.headers}});if(!res.ok){const e=await res.json().catch(()=>({error:res.statusText}));throw Error(e.error)}return res.status===204?null:res.json()}
export const action=(id:string,body:any)=>api(`/host/matches/${id}/actions?public=1`,{method:'POST',body:JSON.stringify(body)},true);
