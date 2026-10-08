import {useEffect,useRef} from 'react';import {X} from 'lucide-react';
export default function Modal({title,children,onClose,busy=false}:{title:string;children:React.ReactNode;onClose:()=>void;busy?:boolean}){
 const dialog=useRef<HTMLDialogElement>(null);useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 return <dialog ref={dialog} className="modal" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}><div className="modal-head"><h2>{title}</h2><button aria-label="بستن" disabled={busy} onClick={onClose}><X size={20}/></button></div><div className="modal-body">{children}</div></dialog>;
}
