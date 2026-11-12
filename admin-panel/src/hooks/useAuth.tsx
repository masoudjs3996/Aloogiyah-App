import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {clearTokens,hasToken,request,setTokens} from '../shared/api/client';
import type {Row} from '../shared/types';
const Context=createContext<{user:Row|null;loading:boolean;login:(username:string,password:string)=>Promise<void>;verify:(challengeCode:string,code:string)=>Promise<void>;logout:()=>void}>({user:null,loading:true,login:async()=>{},verify:async()=>{},logout:()=>{}});
export function AuthProvider({children}:{children:ReactNode}) {
 const [user,setUser]=useState<Row|null>(null);const [loading,setLoading]=useState(true);const client=useQueryClient();
 async function load(){const roles=await request('/User/GetRole');const names=roles.roleNames?.length?roles.roleNames:[roles.roleName];if(!names.some((r:string)=>r==='Admin'||r==='Manager')){clearTokens();throw new Error('این حساب دسترسی مدیریت ندارد.');}const profile=await request('/User/GetMyProfile');setUser({...profile.user,roles:names});}
 async function accept(data:Row){setTokens(data.token,data.refreshToken);try{await load();}catch(e){clearTokens();throw e;}}
 useEffect(()=>{let mounted=true;if(hasToken())load().catch(()=>{clearTokens();}).finally(()=>{if(mounted)setLoading(false);});else setLoading(false);const expired=()=>{setUser(null);client.clear();};window.addEventListener('auth-expired',expired);return()=>{mounted=false;window.removeEventListener('auth-expired',expired);};},[]);
 async function login(username:string,password:string){const guest=await request('/Auth/GuestToken','POST');setTokens(guest.token);try{await accept(await request('/Auth/Login','POST',{username,password}));}catch(e){clearTokens();throw e;}}
 async function verify(challengeCode:string,code:string){await accept(await request('/Auth/VerifyPhoneCode','POST',{challengeCode,code}));}
 const logout=()=>{clearTokens();setUser(null);client.clear();};
 return <Context.Provider value={{user,loading,login,verify,logout}}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
