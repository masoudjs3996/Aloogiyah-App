import Button from '../atoms/Button';
export default function ErrorState({error,retry}:{error:Error;retry?:()=>void}){return <div className="error" role="alert"><strong>{error.message}</strong>{(error as any).details&&<pre>{JSON.stringify((error as any).details,null,2)}</pre>}{retry&&<Button variant="secondary" onClick={retry}>تلاش دوباره</Button>}</div>;}
