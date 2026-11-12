import {useEffect,useRef,useId} from 'react';import {X} from 'lucide-react';
export default function Modal({title,children,onClose,busy=false}:{title:string;children:React.ReactNode;onClose:()=>void;busy?:boolean}){
 const dialog=useRef<HTMLDialogElement>(null),titleId=useId();useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 return <dialog ref={dialog} aria-labelledby={titleId} className="modal" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}><div className="modal-head"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" aria-label="بستن" disabled={busy} onClick={onClose}><X size={20}/></button></div><div className="modal-body">{children}</div></dialog>;
}
