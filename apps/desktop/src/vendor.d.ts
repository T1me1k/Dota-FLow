declare namespace JSX { interface IntrinsicElements { [elemName:string]: any } }
declare module 'react' { export function useState<T>(value:T):[T,(value:T)=>void]; const React:{StrictMode:any}; export default React; }
declare module 'react-dom/client' { export function createRoot(node:Element):{render(value:any):void}; }
declare module 'react/jsx-runtime' { export const jsx:any;export const jsxs:any;export const Fragment:any; }
declare module '@vitejs/plugin-react' { const plugin:()=>any; export default plugin; }
declare module 'vite' { export function defineConfig(value:any):any; }
declare module '*.css';
