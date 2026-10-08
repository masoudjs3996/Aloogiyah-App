import {API_BASE} from '../api/client';
export function mediaUrl(value:string){try{const configured=import.meta.env.VITE_MEDIA_BASE_URL||new URL(API_BASE).origin;const url=new URL(value,new URL(configured).origin+'/');return ['http:','https:'].includes(url.protocol)?url.toString():null;}catch{return null;}}
