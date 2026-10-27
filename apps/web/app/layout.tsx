import type { ReactNode } from 'react';
import './style.css';
export const metadata={title:'LaFix — Profesioniști locali, fără bătăi de cap',description:'Cere oferte de la profesioniști locali verificați.'};
export default function Layout({children}:{children:ReactNode}){return <html lang="ro"><body>{children}</body></html>}
